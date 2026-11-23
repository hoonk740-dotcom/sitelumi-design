#!/usr/bin/env node
/**
 * 스틸 5컷 광고 엔진 — 광고주 사진을 주인공으로, 광고주마다 다른 배치로
 *   node render.js <작업폴더>
 *   작업폴더: brief.json · photos/ (광고주 사진) · photos.json (analyze.py 결과)
 *   결과: out/v_1..5.png (1080×1920) · out/h_1..5.png (1920×1080) · out/ad_v_15s.mp4 · out/ad_h_15s.mp4 · out/plan.json
 *   옵션: --still (이미지만) · --only v|h · --seed 숫자 (배치 다시 섞기)
 */
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');

const DIR = path.resolve(process.argv[2] || '.');
const ARG = process.argv.slice(3);
const opt = (k) => { const i = ARG.indexOf('--' + k); return i < 0 ? null : (ARG[i + 1] && !ARG[i + 1].startsWith('--') ? ARG[i + 1] : true); };
const ENG = __dirname;
const brief = JSON.parse(fs.readFileSync(path.join(DIR, 'brief.json'), 'utf8'));
const photos = fs.existsSync(path.join(DIR, 'photos.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'photos.json'), 'utf8')) : [];
const P = Object.fromEntries(photos.map(p => [p.file, p]));
const OUT = path.join(DIR, 'out'); fs.mkdirSync(OUT, { recursive: true });
const FPS = 30, FR = 100, T = 0.4;                // 컷당 100프레임(3.33초), 전환 0.4초 → 15초

/* ── 결정적 난수: 광고주 이름 + seed → 광고주마다 다른 배치, 다시 돌려도 같은 결과 ── */
function rng(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }
const rand = rng((brief.brand || '') + '|' + (brief.industry || '') + '|' + (opt('seed') || brief.seed || 0));
const pick = (a) => a[Math.floor(rand() * a.length)];

/* ── 색: 지정 > 로고·사진에서 추출 ── */
const hex2 = (h) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
const toHex = (c) => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function hsl(rgb) { const [r, g, b] = rgb, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function fromHsl([h, s, l]) { const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
function lum(rgb) { const c = rgb.map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
function contrast(a, b) { const x = lum(hex2(a)), y = lum(hex2(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
function palette() {
  const pin = brief.palette || {};
  let key = pin.key;
  if (!key) {
    const cand = [];
    photos.forEach(p => (p.colors || []).forEach(c => { const [h, s, l] = hsl(hex2(c.hex)); if (s > .22 && l > .18 && l < .62) cand.push({ hex: c.hex, w: c.share * (s + .3) }); }));
    cand.sort((a, b) => b.w - a.w);
    key = cand[0] ? cand[0].hex : '#2E4A3B';
  }
  let [h, s, l] = hsl(hex2(key));
  // 대표색이 너무 밝으면 글자·띠에 쓸 수 있게 눌러 줌
  if (l > .52) l = .44; if (s > .75) s = .7;
  key = toHex(fromHsl([h, s, l]));
  const dark = brief.tone === 'premium' || brief.tone === 'night';
  const bg = pin.bg || (dark ? toHex(fromHsl([h, Math.min(s, .25), .09])) : toHex(fromHsl([h, Math.min(s, .35), .955])));
  const ink = pin.ink || (dark ? '#F4F1EA' : toHex(fromHsl([h, Math.min(s, .2), .11])));
  const deep = toHex(fromHsl([h, s, Math.max(.12, l - .2)]));
  const acc = pin.accent || toHex(fromHsl([(h + (brief.tone === 'bold' ? .5 : .08)) % 1, Math.min(.6, s + .1), dark ? .66 : .56]));
  const onKey = contrast(key, '#FFFFFF') >= 3 ? '#FFFFFF' : '#141414';
  return { key, deep, bg, ink, acc: contrast(acc, dark ? bg : '#FFFFFF') > 1.8 ? acc : key, onKey, dark };
}
const C = palette();

/* ── 스타일 묶음 (톤 → 글꼴 · 모서리 · 정렬 · 장식 · 전환) — 같은 업종이라도 광고주마다 달라짐 ── */
const FONTS = {
  sans: { css: 'node_modules/pretendard/dist/web/variable/pretendardvariable.css', fam: "'Pretendard Variable'", w: 800, track: '-0.045em' },
  plex: { css: 'node_modules/@fontsource/ibm-plex-sans-kr/700.css', fam: "'IBM Plex Sans KR'", w: 700, track: '-0.03em' },
  serif: { css: 'node_modules/@fontsource/noto-serif-kr/700.css', fam: "'Noto Serif KR'", w: 700, track: '-0.035em' },
  myeongjo: { css: 'node_modules/@fontsource/nanum-myeongjo/800.css', fam: "'Nanum Myeongjo'", w: 800, track: '-0.03em' },
  batang: { css: 'node_modules/@fontsource/gowun-batang/700.css', fam: "'Gowun Batang'", w: 700, track: '-0.03em' },
  display: { css: 'node_modules/@fontsource/black-han-sans/400.css', fam: "'Black Han Sans'", w: 400, track: '-0.01em' }
};
const KITS = {
  warm:    { head: ['sans', 'batang', 'serif'], r: [16, 24, 8], align: ['left', 'left', 'center'], rule: ['line', 'none'], tr: ['slideleft', 'coverleft'] },
  calm:    { head: ['serif', 'myeongjo', 'sans'], r: [0, 4], align: ['left', 'center'], rule: ['line', 'none'], tr: ['slideleft', 'revealleft'] },
  premium: { head: ['myeongjo', 'serif'], r: [0], align: ['left', 'center'], rule: ['line'], tr: ['slideleft', 'revealleft'] },
  bold:    { head: ['display', 'sans'], r: [0, 8], align: ['left'], rule: ['bar', 'none'], tr: ['coverleft', 'slideleft'] },
  playful: { head: ['sans', 'display'], r: [28, 40], align: ['left', 'center'], rule: ['none', 'bar'], tr: ['coverleft', 'slideleft'] },
  clean:   { head: ['sans', 'plex'], r: [12, 4, 0], align: ['left'], rule: ['line', 'none'], tr: ['slideleft'] },
  night:   { head: ['display', 'myeongjo', 'sans'], r: [0, 6], align: ['left', 'center'], rule: ['line', 'bar'], tr: ['slideleft', 'coverleft'] }
};
const kit = KITS[brief.tone] || KITS.clean;
const S = {
  head: brief.font && FONTS[brief.font] ? brief.font : pick(kit.head),
  r: pick(kit.r), align: pick(kit.align), rule: pick(kit.rule), tr: pick(kit.tr),
  scrim: pick(['grad', 'grad', 'soft'])
};
const HF = FONTS[S.head];

/* ── 배치 고르기 ── */
// 각 배치: 필요한 사진 수, 어울리는 역할, 사진 방향 선호
const LAYOUTS = {
  cover:     { need: 1, roles: ['hook', 'point', 'place', 'proof', 'product', 'cta'], hero: true },
  split:     { need: 1, roles: ['hook', 'product', 'point', 'proof', 'place', 'offer'], hero: true },
  band:      { need: 1, roles: ['hook', 'point', 'place', 'product', 'cta'], hero: true },
  poster:    { need: 1, roles: ['product', 'point', 'offer', 'hook'] },
  collage:   { need: 2, roles: ['point', 'proof', 'place', 'product', 'hook'] },
  board:     { need: 0, roles: ['product', 'offer'], items: true },
  statement: { need: 0, roles: ['offer', 'cta', 'proof', 'point'] }
};
function photosOf(cut) { return (Array.isArray(cut.photo) ? cut.photo : (cut.photo ? [cut.photo] : [])).filter(f => P[f] || fs.existsSync(path.join(DIR, 'photos', f))); }
function plan() {
  const used = {}, out = [];
  brief.cuts.slice(0, 5).forEach((cut, i) => {
    const ph = photosOf(cut);
    if (cut.layout && LAYOUTS[cut.layout]) { out.push(cut.layout); used[cut.layout] = (used[cut.layout] || 0) + 1; return; }
    let c = Object.keys(LAYOUTS).filter(k => {
      const L = LAYOUTS[k];
      if (ph.length < L.need) return false;
      if (L.items && !(cut.items && cut.items.length)) return false;
      if (!L.roles.includes(cut.role)) return false;
      if ((used[k] || 0) >= (k === 'cover' ? 2 : 1)) return false;
      if (out[i - 1] === k) return false;
      if (i === 0 && !L.hero) return false;                          // 첫 컷은 사진이 화면을 채움
      if (ph.length && (k === 'statement' || k === 'board') && i < 4 && rand() < .6) return false;   // 사진이 있으면 사진을 살림
      return true;
    });
    if (ph.length >= 2 && c.includes('collage') && rand() < .85) c = ['collage'];
    if (cut.items && cut.items.length) { c = ['board', 'split'].filter(k => out[i - 1] !== k && (k !== 'split' || ph.length) && !used[k]); if (!c.length) c = ['board']; }
    if (!c.length) c = ph.length ? ['cover', 'split', 'poster'].filter(k => out[i - 1] !== k) : ['statement'];
    const k = pick(c); out.push(k); used[k] = (used[k] || 0) + 1;
  });
  return out;
}
const PLAN = plan();

/* ── HTML ── */
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const br = (s) => esc(s).replace(/\n/g, '<br>');
function img(f, cls, extra) {
  const p = P[f] || {}; const src = 'photos/' + f;
  return `<div class="ph ${cls || ''}" ${extra || ''}><img src="${esc(src)}" style="object-position:${Math.round((p.fx ?? .5) * 100)}% ${Math.round((p.fy ?? .5) * 100)}%" alt=""></div>`;
}
const LOGO = brief.logo && fs.existsSync(path.join(DIR, 'photos', brief.logo)) ? `<img class="logo" src="photos/${esc(brief.logo)}" alt="">` : `<b class="brandname">${esc(brief.brand)}</b>`;
function foot(onDark) { return `<div class="foot a3">${LOGO}<span>${esc(brief.contact || '')}</span></div>`; }
function texts(cut, cls) {
  return `<div class="tx ${cls || ''}">${cut.kicker ? `<p class="kick a1">${esc(cut.kicker)}</p>` : ''}<h1 class="a1">${br(cut.head)}</h1>${cut.sub ? `<p class="sub a2">${br(cut.sub)}</p>` : ''}${cut.badge ? `<p class="badge a2">${esc(cut.badge)}</p>` : ''}${cut.note ? `<p class="note a3">${esc(cut.note)}</p>` : ''}</div>`;
}
function items(cut) { return `<ul class="items a2">${(cut.items || []).slice(0, 4).map(x => `<li><b>${esc(x.name)}</b><i></i><span>${esc(x.price || '')}</span></li>`).join('')}</ul>`; }

function cutHtml(cut, L, o, i) {
  const ph = photosOf(cut), p0 = ph[0], pi = P[p0] || {};
  const dark = (pi.light ?? .5) < .55;
  switch (L) {
    case 'cover': return `<section class="L-cover">${img(p0, 'full kb')}<div class="scrim ${S.scrim}"></div>${texts(cut, 'on-photo')}${foot(true)}</section>`;
    case 'band': return `<section class="L-band">${img(p0, 'full kb')}<div class="bandbox">${texts(cut, 'on-key')}${foot(true)}</div></section>`;
    case 'split': {
      const side = (o === 'h') ? ((pi.fx ?? .5) > .5 ? 'r' : 'l') : 't';
      return `<section class="L-split s-${side}">${img(p0, 'half kb')}<div class="panel">${texts(cut)}${cut.items ? items(cut) : ''}${foot()}</div></section>`;
    }
    case 'poster': return `<section class="L-poster">${texts(cut, 'top')}${img(p0, 'frame kb')}${foot()}</section>`;
    case 'collage': {
      const n = Math.min(3, ph.length);
      return `<section class="L-collage n${n}"><div class="grid">${ph.slice(0, n).map((f, j) => img(f, 'cell kb a' + (j + 1))).join('')}</div><div class="strip">${texts(cut)}${foot()}</div></section>`;
    }
    case 'board': return `<section class="L-board">${p0 ? img(p0, 'full blur') + '<div class="scrim solid"></div>' : ''}<div class="boardbox">${texts(cut, p0 ? 'on-photo' : '')}${items(cut)}</div>${foot(!!p0)}</section>`;
    case 'statement': return `<section class="L-statement">${texts(cut, 'big')}${p0 ? img(p0, 'thumb kb') : ''}${foot(true)}</section>`;
  }
}

function css(o) {
  const V = o === 'v';
  const W = V ? 1080 : 1920, H = V ? 1920 : 1080, pad = V ? 88 : 96;
  const fs1 = V ? 36 : 32, fs2 = V ? 46 : 42, fsH = V ? 124 : 116, fsBig = V ? 170 : 160;
  return `
@font-face{font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.bg};color:${C.ink};font-family:'Pretendard Variable',sans-serif;word-break:keep-all;-webkit-font-smoothing:antialiased}
section{position:relative;width:${W}px;height:${H}px;overflow:hidden}
h1{font-family:${HF.fam},'Pretendard Variable',sans-serif;font-weight:${HF.w};font-size:${fsH}px;line-height:1.1;letter-spacing:${HF.track};text-wrap:balance}
.sub{margin-top:.75em;font-size:${fs2}px;line-height:1.45;font-weight:500;opacity:.88;text-wrap:pretty}
.kick{font-size:${fs1}px;font-weight:700;margin-bottom:.9em;color:${C.acc};letter-spacing:-.01em;display:flex;align-items:center;gap:.6em}
${S.rule === 'line' ? `.kick::before{content:"";width:1.8em;height:2px;background:currentColor}` : S.rule === 'bar' ? `.kick::before{content:"";width:.5em;height:.5em;background:currentColor;border-radius:${S.r ? '50%' : '0'}}` : ''}
.badge{display:inline-block;margin-top:1.1em;padding:.45em .9em;border-radius:${Math.min(S.r, 999)}px;background:${C.acc};color:#fff;font-size:${fs1}px;font-weight:700}
.note{margin-top:1.2em;font-size:${fs1 * .72}px;opacity:.6}
.tx{position:relative;z-index:3;text-align:${S.align}}
.foot{position:absolute;z-index:4;left:${pad}px;right:${pad}px;bottom:${pad * .8}px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;font-size:${fs1 * .8}px;font-weight:600;opacity:.92}
.brandname{font-size:${fs2}px;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.logo{height:${V ? 84 : 72}px;width:auto;object-fit:contain}
.ph{overflow:hidden;background:${C.deep}}
.ph img{width:100%;height:100%;object-fit:cover;display:block}
.full{position:absolute;inset:0}
/* 사진 위 글자 */
.scrim{position:absolute;inset:0;z-index:2}
.scrim.grad{background:${V ? 'linear-gradient(to top,rgba(8,9,10,.86) 0%,rgba(8,9,10,.55) 38%,rgba(8,9,10,0) 64%)' : 'linear-gradient(to right,rgba(8,9,10,.82) 0%,rgba(8,9,10,.5) 40%,rgba(8,9,10,0) 68%)'}}
.scrim.soft{background:${V ? 'linear-gradient(to top,rgba(8,9,10,.78),rgba(8,9,10,.15) 55%,rgba(8,9,10,0))' : 'linear-gradient(to right,rgba(8,9,10,.74),rgba(8,9,10,.1) 60%)'}}
.scrim.solid{background:rgba(10,11,12,.62)}
.on-photo,.L-cover .foot,.L-board .foot,.L-band .foot{color:#fff}
.on-photo .kick{color:${contrast(C.acc, '#0A0B0C') > 4 ? C.acc : '#fff'}}
.L-cover .tx{position:absolute;left:${pad}px;right:${V ? pad : W * .45}px;bottom:${V ? pad * 2.2 : pad * 1.9}px}
.L-cover .tx h1{font-size:${fsH * 1.05}px}
/* 띠 */
.L-band .bandbox{position:absolute;z-index:3;background:${C.key};color:${C.onKey};${V ? `left:0;right:0;bottom:0;height:40%;padding:${pad}px ${pad}px 0` : `top:0;bottom:0;right:0;width:42%;padding:${pad * 1.1}px ${pad}px`};border-radius:${V ? `${S.r}px ${S.r}px 0 0` : `${S.r}px 0 0 ${S.r}px`}}
.L-band .bandbox .tx{${V ? '' : 'margin-top:8%'}}
.L-band h1{font-size:${fsH * .82}px}
.L-band .kick{color:${C.onKey};opacity:.85}
.L-band .foot{color:${C.onKey}}
.L-band .full{${V ? 'bottom:38%' : 'right:40%'}}
/* 반반 */
.L-split{display:grid;${V ? 'grid-template-rows:56% 44%' : 'grid-template-columns:52% 48%'}}
.L-split.s-r{grid-template-columns:48% 52%}.L-split.s-r .half{order:2}
.L-split .panel{position:relative;padding:${pad}px;display:flex;flex-direction:column;justify-content:${V ? 'flex-start' : 'center'};background:${C.bg}}
.L-split h1{font-size:${fsH * .82}px}
.L-split .foot{position:absolute}
/* 포스터: 색 바탕 위 큰 사진 액자 */
.L-poster{padding:${pad}px;display:flex;flex-direction:column;gap:${pad * .6}px;background:${C.bg}}
.L-poster .tx h1{font-size:${fsH * .9}px}
.L-poster .frame{flex:1;border-radius:${S.r}px;margin-bottom:${pad * 1.1}px;box-shadow:0 30px 60px -30px rgba(0,0,0,.35)}
${V ? '' : `.L-poster{display:grid;grid-template-columns:minmax(0,40fr) minmax(0,60fr);align-items:center;gap:${pad}px}.L-poster .frame{width:100%;min-width:0;height:${H - pad * 2.4}px;margin:0;align-self:start}.L-poster .tx{align-self:center;margin-top:-${pad}px}`}
/* 모음 */
.L-collage .grid{position:absolute;display:grid;gap:${V ? 14 : 16}px;${V ? `left:0;right:0;top:0;height:64%` : `left:0;top:0;bottom:0;width:62%`}}
.L-collage.n2 .grid{${V ? 'grid-template-rows:1fr 1fr' : 'grid-template-columns:1fr 1fr'}}
.L-collage.n3 .grid{${V ? 'grid-template-columns:1fr 1fr;grid-template-rows:1.3fr 1fr' : 'grid-template-columns:1.2fr 1fr;grid-template-rows:1fr 1fr'}}
.L-collage.n3 .cell:first-child{${V ? 'grid-column:1/-1' : 'grid-row:1/-1'}}
.L-collage .cell{border-radius:${Math.round(S.r / 2)}px}
.L-collage .strip{position:absolute;${V ? `left:0;right:0;bottom:0;height:36%;padding:${pad * .8}px ${pad}px` : `right:0;top:0;bottom:0;width:38%;padding:${pad * 1.4}px ${pad * .9}px`}}
.L-collage h1{font-size:${fsH * .72}px}
/* 차림판 */
.L-board .boardbox{position:absolute;z-index:3;left:${pad}px;right:${pad}px;top:${V ? '24%' : pad * 1.6 + 'px'}}
${V ? '' : `.L-board .boardbox{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:${pad}px;align-items:center;right:${pad}px}`}
.L-board h1{font-size:${fsH * .85}px}
.items{list-style:none;margin-top:${V ? pad * .8 : 0}px;font-size:${fs2 * 1.08}px}
.items li{display:flex;align-items:baseline;gap:18px;padding:${V ? 30 : 26}px 0;border-bottom:2px solid currentColor;border-color:color-mix(in srgb,currentColor 22%,transparent)}
.items li b{font-weight:700}.items li i{flex:1;border-bottom:2px dotted color-mix(in srgb,currentColor 35%,transparent);transform:translateY(-8px)}
.items li span{font-weight:800;font-variant-numeric:tabular-nums;letter-spacing:-.02em}
.L-board:not(:has(.full)) .items{color:${C.ink}}
.L-board .items{color:#fff}
.L-board:not(:has(.full)){background:${C.bg}} .L-board:not(:has(.full)) .items{color:${C.ink}}
/* 큰 글자 */
.L-statement{background:${C.key};color:${C.onKey};padding:${pad}px;display:flex;flex-direction:column;justify-content:center}
.L-statement .tx.big h1{font-size:${fsBig * .78}px;line-height:1.05}
.L-statement .kick{color:${C.onKey};opacity:.8}
.L-statement .thumb{position:absolute;${V ? `left:${pad}px;right:${pad}px;bottom:${pad * 2.2}px;height:26%` : `right:${pad}px;top:${pad}px;bottom:${pad * 2}px;width:34%`};border-radius:${S.r}px}
${V ? `.L-statement:has(.thumb){justify-content:flex-start;padding-top:${pad * 2.4}px}` : `.L-statement:has(.thumb) .tx{max-width:56%}`}
.L-statement .foot{color:${C.onKey}}
/* 움직임: 사진은 천천히, 글자는 차례로 올라옴 (프레임마다 시간을 정해 찍음) */
.kb img{animation:kb 3.4s linear both}
@keyframes kb{from{transform:scale(1.07)}to{transform:scale(1.0)}}
.blur img{filter:blur(18px) saturate(1.1);transform:scale(1.15)}
.a1,.a2,.a3{animation:up .8s cubic-bezier(.2,.8,.2,1) both}
.a1{animation-delay:.15s}.a2{animation-delay:.35s}.a3{animation-delay:.55s}
.cell.a1,.cell.a2,.cell.a3{animation-name:fadein}
@keyframes up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes fadein{from{opacity:0}to{opacity:1}}
`;
}
function page(cut, L, o, i, still) {
  const fontsCss = [FONTS.sans.css, HF.css].filter((v, k, a) => a.indexOf(v) === k).map(h => `<link rel="stylesheet" href="file://${path.join(ENG, h)}">`).join('');
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><base href="file://${DIR}/">${fontsCss}<style>${css(o)}${still ? '*{animation-delay:-10s!important;animation-duration:.001s!important}' : ''}</style></head><body>${cutHtml(cut, L, o, i)}</body></html>`;
}

/* ── 찍기 ── */
function encode(file, frames) {
  return new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', file]);
    ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res());
    (async () => { for await (const f of frames()) { if (!ff.stdin.write(f)) await new Promise(r => ff.stdin.once('drain', r)); } ff.stdin.end(); })().catch(rej);
  });
}
function join(o, n) {
  return new Promise((res, rej) => {
    const ins = [], D = FR / FPS; let f = '', last = '[0:v]';
    for (let i = 1; i <= n; i++) ins.push('-i', path.join(OUT, `.c_${o}_${i}.mp4`));
    const tr = o === 'v' ? S.tr.replace('left', 'up') : S.tr;
    for (let i = 1; i < n; i++) { f += `${last}[${i}:v]xfade=transition=${tr}:duration=${T}:offset=${(i * (D - T)).toFixed(3)}[x${i}];`; last = `[x${i}]`; }
    const args = ['-y', '-loglevel', 'error', ...ins, '-f', 'lavfi', '-t', '15', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', f.replace(/;$/, ''), '-map', last, '-map', `${n}:a`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-t', '15', '-movflags', '+faststart', path.join(OUT, `ad_${o}_15s.mp4`)];
    const ff = spawn('ffmpeg', args); let err = ''; ff.stderr.on('data', d => err += d);
    ff.on('close', c => c ? rej(new Error(err)) : res());
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
  const orients = opt('only') ? [opt('only')] : ['v', 'h'];
  for (const o of orients) {
    const [w, h] = o === 'v' ? [1080, 1920] : [1920, 1080];
    for (let i = 0; i < Math.min(5, brief.cuts.length); i++) {
      const cut = brief.cuts[i], L = PLAN[i];
      const pg = await b.newPage({ viewport: { width: w, height: h } });
      const htmlFile = path.join(OUT, `.cut_${o}_${i + 1}.html`);
      fs.writeFileSync(htmlFile, page(cut, L, o, i, true));
      await pg.goto('file://' + htmlFile); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
      await pg.screenshot({ path: path.join(OUT, `${o}_${i + 1}.png`) });
      if (!opt('still')) {
        fs.writeFileSync(htmlFile, page(cut, L, o, i, false));
        await pg.goto('file://' + htmlFile); await pg.evaluate(() => document.fonts.ready);
        await pg.evaluate(() => document.getAnimations().forEach(a => a.pause()));
        await encode(path.join(OUT, `.c_${o}_${i + 1}.mp4`), async function* () {
          for (let k = 0; k < FR; k++) {
            await pg.evaluate((t) => document.getAnimations().forEach(a => { a.currentTime = t; }), k * 1000 / FPS);
            yield await pg.screenshot({ type: 'jpeg', quality: 92 });
          }
        });
      }
      await pg.close();
      process.stdout.write(`${o}${i + 1}:${L} `);
    }
    if (!opt('still')) await join(o, Math.min(5, brief.cuts.length));
  }
  await b.close();
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify({ palette: C, style: S, font: HF.fam, layouts: PLAN }, null, 1));
  fs.readdirSync(OUT).filter(f => f.startsWith('.c_') || f.startsWith('.cut_')).forEach(f => fs.unlinkSync(path.join(OUT, f)));
  console.log('\n완료', JSON.stringify({ layouts: PLAN, font: S.head, tr: S.tr, key: C.key }));
})().catch(e => { console.error(e); process.exit(1); });
