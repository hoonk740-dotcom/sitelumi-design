#!/usr/bin/env python3
"""디씨젼 제작 레퍼런스 (dlx-ref/1)

기획서(PL…)·광고 제작 보고서(RP…)마다 「다시 만들 수 있는 정보」를 한 벌로 남긴다.
재계약·문구 수정 때 같은 사진·같은 디자인·같은 움직임을 그대로 유지하기 위함.

보관 위치 (두 곳, 같은 내용):
  1) 원본  — 저장소 sitelumi-design/ads/<번호>/ref/  (ref.json + 렌더 입력 파일, git으로 바이트 그대로 버전 관리)
  2) 사본  — 디씨젼랩 글 본문의 <script type="application/json" id="dlx-ref"> (화면·검색에 안 보임, ASCII만 사용)

명령:
  build   레퍼런스 만들기 + 입력 파일을 저장소 ref/ 폴더로 복사
          ref.py build --code RP… --kind report --brand 상호 --repo /tmp/sld [--ad 광고폴더] [--meta meta.json] [--outputs outputs.json]
  embed   글에 넣을 <script> 조각 출력:      ref.py embed ref.json
  extract 글 원문(reportGet 결과 JSON 또는 HTML)에서 꺼내 검증:  ref.py extract got.json > ref.json
  fetch   관리자 GAS에서 바로 꺼내기:         ref.py fetch RP… <관리자키> > ref.json
  restore 다시 렌더할 폴더 만들기(엔진 커밋·브리프·사진 복원):  ref.py restore ref.json <새폴더> --repo /tmp/sld
  verify  ref.json 무결성·저장소 파일 해시 확인: ref.py verify ref.json --repo /tmp/sld

관리자 키·광고주 휴대폰 번호는 어떤 경우에도 레퍼런스에 넣지 않는다.
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, urllib.request
from datetime import datetime, timezone, timedelta

SCHEMA = 'dlx-ref/1'
GAS = 'https://script.google.com/macros/s/AKfycbzcRM7Tpexe8vIsD-BTCnt72o-e69Cq4voBpXonPnlOytdi_noXjs1RqwghNKMhJSV8xA/exec'
REPO_URL = 'https://github.com/hoonk740-dotcom/sitelumi-design'
KST = timezone(timedelta(hours=9))
PHONE = re.compile(r'01[016789][-. ]?\d{3,4}[-. ]?\d{4}')


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def canon(obj):
    return json.dumps(obj, ensure_ascii=True, sort_keys=True, separators=(',', ':'))


def seal(ref):
    body = {k: v for k, v in ref.items() if k != 'integrity'}
    ref['integrity'] = 'sha256-' + hashlib.sha256(canon(body).encode()).hexdigest()
    return ref


def check(ref):
    want = ref.get('integrity', '')
    body = {k: v for k, v in ref.items() if k != 'integrity'}
    got = 'sha256-' + hashlib.sha256(canon(body).encode()).hexdigest()
    return want == got


def git(repo, *a):
    return subprocess.run(['git', '-C', repo, *a], capture_output=True, text=True).stdout.strip()


def probe(path):
    try:
        out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries',
                              'stream=codec_type,codec_name,profile,width,height,r_frame_rate,bit_rate,color_primaries',
                              '-show_entries', 'format=duration,size,bit_rate', '-of', 'json', path],
                             capture_output=True, text=True).stdout
        d = json.loads(out)
        v = next((s for s in d.get('streams', []) if s.get('codec_type') == 'video'), {})
        f = d.get('format', {})
        r = {k: v.get(k) for k in ('codec_name', 'profile', 'width', 'height', 'r_frame_rate', 'color_primaries') if v.get(k)}
        if f.get('duration'): r['duration'] = round(float(f['duration']), 3)
        if f.get('bit_rate'): r['bitrate'] = int(f['bit_rate'])
        return r
    except Exception:
        return {}


def photos_in(brief):
    """brief.json 안에서 사진 파일 경로를 모두 찾는다 (photo, img, logo 등 문자열 값 중 이미지 확장자)."""
    found = []
    def walk(x):
        if isinstance(x, dict):
            for v in x.values(): walk(v)
        elif isinstance(x, list):
            for v in x: walk(v)
        elif isinstance(x, str) and re.search(r'\.(jpe?g|png|webp)$', x, re.I):
            found.append(x)
    walk(brief)
    return sorted(set(found))


def build(a):
    code = a.code
    if not re.match(r'^(RP|PL)[\w-]{6,}$', code): sys.exit('보고서 번호 형식: RP…/PL…')
    repo = a.repo
    refdir = os.path.join(repo, 'ads', code, 'ref')
    os.makedirs(refdir, exist_ok=True)
    meta = json.load(open(a.meta, encoding='utf8')) if a.meta else {}
    ref = {'schema': SCHEMA, 'code': code, 'kind': a.kind, 'brand': a.brand,
           'updated': datetime.now(KST).isoformat(timespec='seconds'),
           'repo': {'url': REPO_URL, 'dir': f'ads/{code}/ref/'}}
    ref.update({k: v for k, v in meta.items() if k not in ('schema', 'code', 'integrity')})

    files = []
    if a.ad:
        ad = a.ad
        brief_p = os.path.join(ad, 'brief.json')
        brief = json.load(open(brief_p, encoding='utf8'))
        ref['brief'] = brief                                    # 문구·배치·효과·색·고정 스타일 전부
        shutil.copy2(brief_p, os.path.join(refdir, 'brief.json'))
        files.append(('brief.json', 'brief'))
        plan_p = os.path.join(ad, 'out', 'plan.json')
        if os.path.exists(plan_p):
            plan = json.load(open(plan_p, encoding='utf8'))
            ref['plan'] = {k: plan[k] for k in ('layouts', 'style', 'seed', 'key', 'hue') if k in plan}
            shutil.copy2(plan_p, os.path.join(refdir, 'plan.json'))
            files.append(('plan.json', 'plan'))
        os.makedirs(os.path.join(refdir, 'photos'), exist_ok=True)
        for rel in photos_in(brief):
            for base in (os.path.join(ad, 'photos'), ad):
                src = os.path.join(base, rel)
                if os.path.exists(src):
                    dst_rel = 'photos/' + os.path.basename(rel)
                    shutil.copy2(src, os.path.join(refdir, dst_rel))
                    files.append((dst_rel, 'input-photo', rel))
                    break
            else:
                print('사진 없음:', rel, file=sys.stderr)
        # 엔진: 저장소에 커밋된 render.js 와 작업본이 같은지 확인하고 커밋을 남긴다
        eng_work = a.engine
        eng_repo = os.path.join(repo, 'tools', 'still5', 'render.js')
        if os.path.exists(eng_work) and os.path.exists(eng_repo):
            same = sha(eng_work) == sha(eng_repo)
            if not same: print('주의: 작업 엔진과 저장소 엔진이 다릅니다. 엔진을 먼저 커밋하세요.', file=sys.stderr)
            ref['engine'] = {'name': 'still5', 'path': 'tools/still5/render.js', 'sha256': sha(eng_repo),
                             'commit': git(repo, 'log', '-1', '--format=%H', '--', 'tools/still5/render.js'),
                             'matchesWorking': same,
                             'render': 'node render.js <광고폴더> --history <기록파일>  (시안: --still --dry)'}
    # 추가 보관 파일 (완성 화면 PNG, 생성 스크립트 등): role=경로 형식
    for spec in (a.add or []):
        role, src = spec.split('=', 1)
        sub = 'gen' if role == 'generator' else 'frames' if role == 'reference-frame' else 'extra'
        os.makedirs(os.path.join(refdir, sub), exist_ok=True)
        rel = f'{sub}/' + os.path.basename(src)
        shutil.copy2(src, os.path.join(refdir, rel)); files.append((rel, role))
    # 산출물 (영상·시안·ZIP 등): 해시·규격·드라이브 ID
    outs = json.load(open(a.outputs, encoding='utf8')) if a.outputs else []
    ref['outputs'] = []
    for o in outs:
        rec = {k: v for k, v in o.items() if k != 'path'}
        p = o.get('path')
        if p and os.path.exists(p):
            rec['sha256'] = sha(p); rec['bytes'] = os.path.getsize(p)
            if re.search(r'\.(mp4|mov)$', p, re.I): rec['spec'] = probe(p)
        ref['outputs'].append(rec)
    # 입력 파일 목록 (저장소 ref/ 기준 상대 경로)
    ref['files'] = []
    for f in files:
        p = os.path.join(refdir, f[0])
        item = {'path': f[0], 'role': f[1], 'sha256': sha(p), 'bytes': os.path.getsize(p)}
        if len(f) > 2: item['briefPath'] = f[2]
        ref['files'].append(item)
    txt = canon(ref)
    if PHONE.search(txt): sys.exit('레퍼런스에 휴대폰 번호 형식이 들어 있습니다. 빼고 다시 만드세요.')
    seal(ref)
    with open(os.path.join(refdir, 'ref.json'), 'w', encoding='utf8') as f:
        json.dump(ref, f, ensure_ascii=False, indent=1)
    print(os.path.join(refdir, 'ref.json'))


def embed(a):
    ref = json.load(open(a.ref, encoding='utf8'))
    if not check(ref): sys.exit('무결성 값이 맞지 않습니다. build 로 다시 만드세요.')
    txt = canon(ref).replace('</', '<\\/')          # ASCII만 (\uXXXX) → 블로거가 바꾸지 않음
    sys.stdout.write(f'<script type="application/json" id="dlx-ref" data-schema="{SCHEMA}" data-code="{ref["code"]}">{txt}</script>')


def _from_html(html):
    m = re.search(r'<script[^>]*id="dlx-ref"[^>]*>(.*?)</script>', html, re.S)
    if not m: sys.exit('글에 레퍼런스(dlx-ref)가 없습니다.')
    raw = m.group(1).replace('<\\/', '</')
    for a, b in (('&quot;', '"'), ('&lt;', '<'), ('&gt;', '>'), ('&amp;', '&')):
        if a in raw and not raw.lstrip().startswith('{"'): raw = raw.replace(a, b)
    return json.loads(raw)


def extract(a):
    src = open(a.src, encoding='utf8').read()
    try:
        d = json.loads(src); html = d.get('content', '')
    except Exception:
        html = src
    ref = _from_html(html)
    print('무결성 ' + ('확인' if check(ref) else '불일치'), file=sys.stderr)
    json.dump(ref, sys.stdout, ensure_ascii=False, indent=1)


def fetch(a):
    req = urllib.request.Request(GAS, data=json.dumps({'a': 'reportGet', 'key': a.key, 'code': a.code}).encode(),
                                 headers={'Content-Type': 'text/plain'})
    d = json.loads(urllib.request.urlopen(req, timeout=60).read())
    if not d.get('ok'): sys.exit(d.get('msg', 'reportGet 실패'))
    ref = _from_html(d['content'])
    print('무결성 ' + ('확인' if check(ref) else '불일치') + ' · ' + d.get('url', ''), file=sys.stderr)
    json.dump(ref, sys.stdout, ensure_ascii=False, indent=1)


def verify(a):
    ref = json.load(open(a.ref, encoding='utf8'))
    ok = check(ref)
    print('무결성:', '확인' if ok else '불일치')
    if a.repo:
        base = os.path.join(a.repo, ref['repo']['dir'])
        for f in ref.get('files', []):
            p = os.path.join(base, f['path'])
            st = '없음' if not os.path.exists(p) else ('같음' if sha(p) == f['sha256'] else '다름')
            print(f'  {f["path"]}: {st}')
            ok = ok and st == '같음'
    sys.exit(0 if ok else 1)


def restore(a):
    ref = json.load(open(a.ref, encoding='utf8'))
    if not check(ref): sys.exit('무결성 값이 맞지 않습니다.')
    repo, out = a.repo, a.dir
    base = os.path.join(repo, ref['repo']['dir'])
    os.makedirs(os.path.join(out, 'photos'), exist_ok=True)
    for f in ref.get('files', []):
        p = os.path.join(base, f['path'])
        if not os.path.exists(p) or sha(p) != f['sha256']:
            sys.exit(f'저장소 파일이 없거나 다릅니다: {f["path"]}')
        if f['role'] == 'brief': shutil.copy2(p, os.path.join(out, 'brief.json'))
        elif f['role'] == 'input-photo':
            bp = f.get('briefPath', os.path.basename(p))
            dst = os.path.join(out, bp) if bp.startswith('photos/') else os.path.join(out, 'photos', bp)
            os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(p, dst)
        elif f['role'] == 'plan':
            os.makedirs(os.path.join(out, 'out'), exist_ok=True); shutil.copy2(p, os.path.join(out, 'out', 'plan.json'))
    eng = ref.get('engine')
    if eng and eng.get('commit'):
        code = subprocess.run(['git', '-C', repo, 'show', f'{eng["commit"]}:{eng["path"]}'], capture_output=True).stdout
        if hashlib.sha256(code).hexdigest() != eng['sha256']: sys.exit('엔진 커밋 내용이 레퍼런스와 다릅니다.')
        open(os.path.join(out, 'render.js'), 'wb').write(code)
    print(f'복원 완료: {out}  (엔진 render.js 는 이 폴더에 저장됨. 엔진 폴더에 덮어쓴 뒤 렌더)')


if __name__ == '__main__':
    P = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    S = P.add_subparsers(dest='cmd', required=True)
    b = S.add_parser('build'); b.add_argument('--code', required=True); b.add_argument('--kind', default='report', choices=['report', 'plan'])
    b.add_argument('--brand', required=True); b.add_argument('--repo', default='/tmp/sld'); b.add_argument('--ad')
    b.add_argument('--meta'); b.add_argument('--outputs'); b.add_argument('--add', action='append', help='역할=경로 (reference-frame, generator, extra)'); b.add_argument('--engine', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'render.js'))
    e = S.add_parser('embed'); e.add_argument('ref')
    x = S.add_parser('extract'); x.add_argument('src')
    f = S.add_parser('fetch'); f.add_argument('code'); f.add_argument('key')
    v = S.add_parser('verify'); v.add_argument('ref'); v.add_argument('--repo')
    r = S.add_parser('restore'); r.add_argument('ref'); r.add_argument('dir'); r.add_argument('--repo', default='/tmp/sld')
    a = P.parse_args()
    {'build': build, 'embed': embed, 'extract': extract, 'fetch': fetch, 'verify': verify, 'restore': restore}[a.cmd](a)
