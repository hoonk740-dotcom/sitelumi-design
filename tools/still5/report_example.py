import json, html
IMG = {'h1':'1o7kjzD7rVSsHFurFQ2Z6hQOFcmgLPMG5','h2':'1mqCttW2TV2q_zRRR-nGXffPCe9MUSb2b','h3':'1FIzjKJbq0bGP0Fo0MGRwcpTqCQ5Ey8CG','h4':'1X6KKPIKKdR6JuaNvakpyfwSgrvIca7Rp','h5':'1pKxpZXVDfoFPyrOqCpR8JA2rhoCJ5rpX',
       'v1':'1qnVbNrq5zaeDZV9YLNK_cXDHiZiXNOat','v2':'1lwDWJnabdDF2GkjbfgXkxYGdWdGv8to7','v3':'1xrPCXEAwfm1Gf9uuq6zID9J4e4hNdr5a','v4':'1BCL1KFE2fOKhbe8GWfQ38EVw5N-sCnZ3','v5':'1ScpXXYgs9DphGhyxJbyCk3O_GYrsZw7E'}
FOLDER = 'https://drive.google.com/drive/folders/1SXQ_TJ4-jMVgw-MVMwlnm11ONwS8vuyh'
CODE = 'RP261123-FRIENDS'
VIDEO = json.load(open('/home/claude/ads/friends/post/video.json')) if __import__('os').path.exists('/home/claude/ads/friends/post/video.json') else None
src = lambda k, w=1600: f'https://lh3.googleusercontent.com/d/{IMG[k]}=w{w}'
e = html.escape
cuts = [
 ('0:00–0:03','첫 화면 · 상호 소개','로비 (사진 원본 그대로)','송도 최초 24시간 골프연습장 / 프렌즈아카데미 송도점','제목 줄별로 올라옴, 「24시간」 강조'),
 ('0:03–0:06','넓은 타석 간격','타석 공간','36타석 / 넓은 타석 간격 · 프리미엄 연습 공간','숫자 0→36 올라감'),
 ('0:06–0:09','숏게임장','숏게임장 전경','100평 / 숏게임장 · 퍼팅·어프로치·벙커','숫자 0→100 올라감'),
 ('0:09–0:12','1:1 프라이빗 레슨룸','레슨 장면','1:1 / 프라이빗 레슨룸 · 나에게 집중하는 레슨','「1:1」 튀어나옴'),
 ('0:12–0:15','투어프로 체험레슨','프로 4명 카드','프렌즈아카데미 투어프로 레슨 / 체험레슨 25,000원 / 숏게임장·레슨룸 20분 + 연습장 60분','가격 숫자 올라감, 카드 차례로 나타남'),
]
def table(rows, head):
    th = ''.join(f'<th>{e(h)}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td>{e(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<div class="rp-table"><table><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'
css = '''<style>
.rp{--k:#24392E;--a:#B8862E;font-size:18px;line-height:1.75}
.rp .rp-meta{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:24px 0}
.rp .rp-meta div{padding:16px 18px;border:1px solid #e5e7eb;border-radius:12px}
.rp .rp-meta b{display:block;font-size:14px;color:#667085;font-weight:600;margin-bottom:4px}
.rp .rp-table{overflow-x:auto;margin:16px 0 28px}
.rp table{border-collapse:collapse;width:100%;min-width:640px;font-size:16px}
.rp th,.rp td{border-bottom:1px solid #e5e7eb;padding:12px 10px;text-align:left;vertical-align:top}
.rp th{background:#f6f7f8;font-weight:700;white-space:nowrap}
.rp .rp-grid{display:grid;gap:14px;margin:16px 0 28px}
.rp .rp-grid.h{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.rp .rp-grid.v{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}
.rp .rp-grid figure{margin:0}
.rp .rp-grid img{width:100%;height:auto;display:block;border-radius:10px;box-shadow:0 8px 24px -12px rgba(0,0,0,.35)}
.rp .rp-grid figcaption{font-size:14px;color:#667085;margin-top:6px}
.rp .rp-video{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin:16px 0 28px}
.rp .rp-video iframe{width:100%;border:0;border-radius:10px;background:#000}
.rp .rp-note{padding:18px 20px;border-left:4px solid var(--a);background:#faf7f0;border-radius:0 10px 10px 0;margin:20px 0}
.rp .rp-form{display:grid;gap:12px;padding:24px;border:1px solid #e5e7eb;border-radius:14px;margin:20px 0}
.rp .rp-form label{display:grid;gap:6px;font-weight:600;font-size:15px}
.rp .rp-form input,.rp .rp-form textarea{font:inherit;font-size:16px;padding:12px 14px;border:1px solid #d0d5dd;border-radius:10px}
.rp .rp-form textarea{min-height:140px;resize:vertical}
.rp .rp-form button{justify-self:start;font:inherit;font-weight:700;padding:14px 26px;border:0;border-radius:10px;background:var(--k);color:#fff;cursor:pointer}
.rp .rp-form .hp{position:absolute;left:-9999px}
.rp .rp-msg{font-weight:600}
@media(max-width:720px){.rp .rp-video{grid-template-columns:1fr}}
</style>'''
H = []
H.append(css + '<div class="rp">')
H.append('<p>송해온 매장 화면(로비·찜질방 모니터, 키오스크)에 내보낼 <b>프렌즈아카데미 송도점</b> 15초 광고의 조사·기획·콘티·시안을 정리한 제작 보고서입니다. 광고주 확인과 수정 요청도 이 글에서 받습니다.</p>')
H.append(f'''<div class="rp-meta"><div><b>보고서 번호</b>{CODE}</div><div><b>광고주</b>프렌즈아카데미 송도점</div><div><b>매체</b>송해온 매장 모니터(가로) · 키오스크(세로)</div><div><b>규격</b>4K · 15초 · 5컷 × 3초</div><div><b>현재 단계</b>시안 v1 · 광고주 확인 요청</div><div><b>작성</b>디씨젼 · 2026-11-23</div></div>''')
H.append('<h2>1. 업체·시장 조사</h2>')
H.append(table([
 ('위치·운영','인천 연수구 신송로170번길 10 3층 · 24시간 연중무휴 · 지하 1~2층 무료 주차'),
 ('시설','36타석, 커플·3인/4인 타석, 1:1 프라이빗 레슨룸 4개, 약 100평 숏게임장(퍼팅·어프로치·벙커), 4K 레이저 프로젝터, 9홀 코스 연습 모드'),
 ('같은 건물','4층 프렌즈스크린 스크린골프장, 숏게임장 30분 이용권'),
 ('레슨','소속 프로 전원 투어프로 라이선스 보유(광고주 제공), 체험레슨 25,000원'),
],['항목','내용']))
H.append('<p>송도 일대에는 대형 타석형 연습장과 프랜차이즈 실내 아카데미가 함께 있어, 「타석 수」만으로는 차별이 어렵습니다. 반면 <b>24시간 운영</b>, <b>숏게임 전용 공간</b>, <b>1:1 독립 레슨룸</b>은 한 곳에서 모두 갖춘 곳이 많지 않아 짧은 화면 광고에서 바로 전달되는 강점입니다.</p>')
H.append('<p>또한 지역에서 선결제 레슨권 관련 소비자 피해가 보도된 적이 있어, 처음 오는 고객은 큰 금액을 먼저 내는 것을 망설입니다. 그래서 마지막 화면은 부담이 적은 <b>체험레슨 25,000원</b>과 <b>실제 프로 얼굴</b>로 신뢰를 주는 데 집중했습니다.</p>')
H.append('<h2>2. 광고 기획</h2>')
H.append(table([
 ('누가 보나','송해온 이용객 — 휴식 중 잠깐 화면을 보는 송도·인천 거주 성인, 골프 입문자와 연습 시간을 찾는 직장인'),
 ('한 줄 메시지','「언제든 가서, 제대로 배우는 골프연습장」'),
 ('구성 원칙','한 화면에 한 가지 강점 · 큰 숫자로 3초 안에 기억 · 소리 없이도 이해'),
 ('찾아오게 하는 장치','모든 화면 같은 자리에 네이버 검색창 「프렌즈아카데미 송도점」 고정'),
 ('디자인','광고주 사진을 자르지 않고 원본 그대로 사용 · 짙은 녹색과 금색 포인트로 고급 연습장 분위기 · 굵은 고딕 글꼴'),
],['항목','내용']))
H.append('<h2>3. 콘티</h2>')
H.append(table(cuts,['시간','장면','사진','화면 문구','움직임']))
H.append('<h2>4. 시안 v1 — 가로(모니터)</h2><div class="rp-grid h">' + ''.join(f'<figure><img src="{src("h"+str(i))}" alt="프렌즈아카데미 송도점 광고 시안 가로 {i}번 컷" loading="lazy"><figcaption>{i}번 컷</figcaption></figure>' for i in range(1,6)) + '</div>')
H.append('<h2>5. 시안 v1 — 세로(키오스크)</h2><div class="rp-grid v">' + ''.join(f'<figure><img src="{src("v"+str(i),900)}" alt="프렌즈아카데미 송도점 광고 시안 세로 {i}번 컷" loading="lazy"><figcaption>{i}번 컷</figcaption></figure>' for i in range(1,6)) + '</div>')
H.append('<h2>6. 영상 미리보기</h2>')
if VIDEO:
    H.append(f'<div class="rp-video"><iframe src="https://drive.google.com/file/d/{VIDEO["h"]}/preview" style="aspect-ratio:16/9" allow="autoplay" title="가로 영상"></iframe><iframe src="https://drive.google.com/file/d/{VIDEO["v"]}/preview" style="aspect-ratio:9/16" allow="autoplay" title="세로 영상"></iframe></div>')
else:
    H.append('<p class="rp-note">15초 영상(가로·세로)은 준비되는 대로 이 자리에 올립니다. 시안 이미지를 먼저 확인해 주세요.</p>')
H.append(f'<p>시안·영상 원본 보관함: <a href="{FOLDER}" target="_blank" rel="noopener">자료 폴더 열기</a></p>')
H.append('<h2>7. 송출 규격 검수</h2>')
H.append(table([
 ('해상도','가로 3840×2160 · 세로 2160×3840','통과'),('형식','MP4 · H.264 High · 30fps · Rec.709','통과'),('길이','15.0초','통과'),
 ('안전 영역','네 변 5% 안쪽에 글자·로고','통과'),('글자 크기','짧은 변 대비 작은 글자 5%↑ · 헤드라인 9%↑','통과'),('첫·마지막 화면','검은 화면 없음 · 상호 노출','통과'),
],['항목','기준','결과']))
H.append('<h2>8. 확인 부탁드리는 내용</h2><div class="rp-note"><p><b>①</b> 「송도 최초 24시간 골프연습장」 — 광고에서 「최초」를 쓰려면 근거가 필요합니다. 근거 자료가 없으면 「24시간 운영하는 골프연습장」으로 바꾸겠습니다.</p><p><b>②</b> 보내주신 체험레슨 이미지의 문의 번호(010-59593-8295)가 자릿수가 맞지 않습니다. 광고에는 매장 번호 032-851-6767을 기준으로 했습니다.</p><p><b>③</b> 프로 4분의 원본 프로필 사진이 있으면 보내 주세요. 더 선명하게 다듬을 수 있습니다.</p></div>')
H.append(f'''<h2>9. 수정 요청</h2><p>바꾸고 싶은 컷과 내용을 적어 보내 주세요. 요청은 이 보고서 번호({CODE})로 접수되고, 반영한 시안은 이 글에 새 버전으로 올라갑니다.</p>
<form class="rp-form" id="rp-revise" data-code="{CODE}">
<label>이름 또는 상호<input name="who" required maxlength="60" autocomplete="organization"></label>
<label>연락처 (선택)<input name="phone" maxlength="40" inputmode="tel" autocomplete="tel"></label>
<label>해당 컷 (예: 2번, 세로 5번)<input name="cuts" maxlength="60"></label>
<label>수정할 내용<textarea name="msg" required maxlength="3000"></textarea></label>
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<button type="submit">수정 요청 보내기</button><p class="rp-msg" role="status" aria-live="polite"></p></form>
<script>(function(){{var f=document.getElementById('rp-revise');if(!f)return;f.addEventListener('submit',function(ev){{ev.preventDefault();var m=f.querySelector('.rp-msg'),b=f.querySelector('button');var u=(window.DLX&&window.DLX.intake)||'https://script.google.com/macros/s/AKfycbzcRM7Tpexe8vIsD-BTCnt72o-e69Cq4voBpXonPnlOytdi_noXjs1RqwghNKMhJSV8xA/exec';var d={{code:f.dataset.code}};['who','phone','cuts','msg','website'].forEach(function(k){{d[k]=f.elements[k].value}});b.disabled=true;m.textContent='보내는 중…';fetch(u,{{method:'POST',body:JSON.stringify({{a:'revise',form:d}})}}).then(function(r){{return r.json()}}).then(function(r){{if(r.ok){{m.textContent='수정 요청을 받았습니다'+(r.no?' (요청번호 '+r.no+')':'')+'. 반영 후 이 글에 새 시안을 올리겠습니다.';f.reset()}}else{{m.textContent=r.msg||'보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.'}}b.disabled=false}}).catch(function(){{m.textContent='보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.';b.disabled=false}})}})}})();</script>''')
H.append('<h2>진행 이력</h2>' + table([('2026-11-23','시안 v1 · 4K 영상 v1 제작, 광고주 확인 요청')],['날짜','내용']))
H.append('</div>')
body = '\n'.join(H)
json.dump({'a':'reportPublish','code':CODE,'brand':'프렌즈아카데미 송도점','title':'프렌즈아카데미 송도점 매장 화면 광고 제작 보고서 — 조사·기획·콘티·시안','labels':['광고 제작 보고서','송해온 광고','실내골프연습장'],'content':body}, open('/home/claude/ads/friends/post/payload.json','w'), ensure_ascii=False)
print(len(body))
