#!/usr/bin/env node
/**
 * 스틸 5컷 광고 엔진 v2 — 광고주 사진이 주인공, 광고주마다 다른 디자인, 마지막 컷은 위치
 *   node render.js <작업폴더> [--still] [--only v|h] [--seed 숫자] [--history 파일] [--dry]
 *   작업폴더: brief.json · photos/ · photos.json(analyze.py)
 *   결과: out/v_1..5.png · out/h_1..5.png · out/ad_v_15s.mp4 · out/ad_h_15s.mp4 · out/plan.json
 *
 *   · 모니터 안전 영역: 가장자리 6% 안쪽에만 글자 — 넘치면 글자 크기를 자동으로 줄이고 검사 결과를 plan.json 에 남김
 *   · 글자 움직임: 제목 줄별로 가려졌다 올라옴, [대괄호] 단어 강조, 가격 숫자 올라감, 위치 핀 떨어짐
 *   · 다른 광고와 겹치지 않게: 기록(still5-history.json)과 비교해 가장 덜 닮은 조합을 고름
 */
const fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const QR = require('qrcode');

const DIR = path.resolve(process.argv[2] || '.');
const ARG = process.argv.slice(3);
const opt = (k) => { const i = ARG.indexOf('--' + k); return i < 0 ? null : (ARG[i + 1] && !ARG[i + 1].startsWith('--') ? ARG[i + 1] : true); };
const ENG = __dirname;
const brief = JSON.parse(fs.readFileSync(path.join(DIR, 'brief.json'), 'utf8'));
const photos = fs.existsSync(path.join(DIR, 'photos.json')) ? JSON.parse(fs.readFileSync(path.join(DIR, 'photos.json'), 'utf8')) : [];
const P = Object.fromEntries(photos.map(p => [p.file, p]));
const OUT = path.join(DIR, 'out'); fs.mkdirSync(OUT, { recursive: true });
const HIST = path.resolve(opt('history') || path.join(DIR, '..', 'still5-history.json'));
const FPS = 30, FR = 100, T = 0.4;
const SAFE = 0.06;                                   // 모니터 가장자리 잘림(오버스캔) 대비 안전 여백 비율

function rngOf(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; }; }

/* ── 색 ── */
const hex2 = (h) => { h = h.replace('#', ''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255); };
const toHex = (c) => '#' + c.map(v => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
function hsl(rgb) { const [r, g, b] = rgb, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; } return [h, s, l]; }
function fromHsl([h, s, l]) { const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0), f(8), f(4)]; }
function lum(rgb) { const c = rgb.map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
const contrast = (a, b) => { const x = lum(hex2(a)), y = lum(hex2(b)); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };

/* ── 글꼴 · 톤 ── */
const FONTS = {
  sans: { css: 'node_modules/pretendard/dist/web/variable/pretendardvariable.css', fam: "'Pretendard Variable'", w: 800, track: '-0.045em', lh: 1.08 },
  sansThin: { css: 'node_modules/pretendard/dist/web/variable/pretendardvariable.css', fam: "'Pretendard Variable'", w: 300, track: '-0.04em', lh: 1.1 },
  plex: { css: 'node_modules/@fontsource/ibm-plex-sans-kr/700.css', fam: "'IBM Plex Sans KR'", w: 700, track: '-0.03em', lh: 1.15 },
  serif: { css: 'node_modules/@fontsource/noto-serif-kr/700.css', fam: "'Noto Serif KR'", w: 700, track: '-0.035em', lh: 1.15 },
  serifLight: { css: 'node_modules/@fontsource/noto-serif-kr/400.css', fam: "'Noto Serif KR'", w: 400, track: '-0.03em', lh: 1.18 },
  myeongjo: { css: 'node_modules/@fontsource/nanum-myeongjo/800.css', fam: "'Nanum Myeongjo'", w: 800, track: '-0.03em', lh: 1.15 },
  batang: { css: 'node_modules/@fontsource/gowun-batang/700.css', fam: "'Gowun Batang'", w: 700, track: '-0.03em', lh: 1.18 },
  display: { css: 'node_modules/@fontsource/black-han-sans/400.css', fam: "'Black Han Sans'", w: 400, track: '-0.01em', lh: 1.08 }
};
const KITS = {
  warm:    { head: ['sans', 'batang', 'serif', 'serifLight'], r: [20, 10, 2], align: ['left', 'center'], deco: ['rule', 'none', 'dot'], tr: ['slideleft', 'coverleft', 'smoothleft'], treat: ['natural', 'natural', 'warm'] },
  calm:    { head: ['serif', 'myeongjo', 'serifLight', 'sansThin'], r: [0, 2], align: ['left', 'center'], deco: ['rule', 'none'], tr: ['slideleft', 'revealleft', 'fadeblack'], treat: ['natural', 'mute'] },
  premium: { head: ['myeongjo', 'serifLight', 'sansThin'], r: [0], align: ['left', 'center'], deco: ['rule', 'frame'], tr: ['fadeblack', 'revealleft', 'slideleft'], treat: ['natural', 'mute', 'grain'] },
  bold:    { head: ['display', 'sans'], r: [0, 6], align: ['left'], deco: ['bar', 'none'], tr: ['coverleft', 'slideleft', 'wipeleft'], treat: ['natural', 'punch'] },
  playful: { head: ['sans', 'display', 'batang'], r: [32, 48, 20], align: ['left', 'center'], deco: ['dot', 'none'], tr: ['coverleft', 'slideleft', 'squeezeh'], treat: ['natural', 'warm'] },
  clean:   { head: ['sans', 'plex', 'sansThin'], r: [14, 6, 0], align: ['left'], deco: ['rule', 'none'], tr: ['slideleft', 'revealleft'], treat: ['natural'] },
  night:   { head: ['display', 'myeongjo', 'sansThin'], r: [0, 4], align: ['left', 'center'], deco: ['rule', 'frame'], tr: ['fadeblack', 'slideleft'], treat: ['grain', 'punch'] }
};
const kit = KITS[brief.tone] || KITS.clean;

/* ── 배치 ── */
const LAYOUTS = {
  cover:     { need: 1, roles: ['hook', 'point', 'proof', 'product'], hero: true },
  band:      { need: 1, roles: ['hook', 'point', 'product', 'offer'], hero: true },
  split:     { need: 1, roles: ['hook', 'product', 'point', 'proof', 'offer'], hero: true },
  editorial: { need: 1, roles: ['hook', 'point', 'proof', 'product'], hero: true },
  spotlight: { need: 1, roles: ['hook', 'point', 'offer', 'proof'], hero: true },
  poster:    { need: 1, roles: ['product', 'point', 'offer', 'hook'] },
  mat:       { need: 1, roles: ['product', 'point', 'proof'] },
  collage:   { need: 2, roles: ['point', 'proof', 'product', 'hook'] },
  board:     { need: 0, roles: ['product', 'offer'], items: true },
  pricehero: { need: 1, roles: ['product', 'offer'], price: true },
  statement: { need: 0, roles: ['offer', 'proof', 'point'] }
};
const PLACE = ['placeMap', 'placePhoto', 'placeType'];
function photosOf(cut) { return (Array.isArray(cut.photo) ? cut.photo : (cut.photo ? [cut.photo] : [])).filter(f => P[f] || fs.existsSync(path.join(DIR, 'photos', f))); }

/* 마지막 컷은 반드시 위치 */
const cuts = brief.cuts.slice(0, 5).map(c => ({ ...c }));
if (!cuts.length || cuts[cuts.length - 1].role !== 'place') {
  const placeCut = { role: 'place', ...(brief.place || {}) };
  if (cuts.length >= 5) cuts[4] = placeCut; else cuts.push(placeCut);
}

function makePlan(seed) {
  const rand = rngOf((brief.brand || '') + '|' + (brief.industry || '') + '|' + seed);
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const style = { head: brief.font && FONTS[brief.font] ? brief.font : pick(kit.head), r: pick(kit.r), align: pick(kit.align), deco: pick(kit.deco), tr: pick(kit.tr), treat: pick(kit.treat), scrim: pick(['grad', 'soft', 'deep']), hl: pick(['marker', 'color', 'under']) };
  const used = {}, L = [];
  cuts.forEach((cut, i) => {
    const ph = photosOf(cut);
    if (cut.role === 'place') { const c = PLACE.filter(k => k !== 'placePhoto' || ph.length); L.push(cut.layout && PLACE.includes(cut.layout) ? cut.layout : pick(c)); return; }
    if (cut.layout && LAYOUTS[cut.layout]) { L.push(cut.layout); used[cut.layout] = 1; return; }
    let c = Object.keys(LAYOUTS).filter(k => {
      const D = LAYOUTS[k];
      if (ph.length < D.need || used[k] || L[i - 1] === k) return false;
      if (D.items && !(cut.items && cut.items.length)) return false;
      if (D.price && !cut.price) return false;
      if (!D.roles.includes(cut.role)) return false;
      if (i === 0 && !D.hero) return false;
      if (ph.length && k === 'statement' && rand() < .7) return false;
      return true;
    });
    if (cut.price && c.includes('pricehero') && rand() < .6) c = ['pricehero'];
    if (ph.length >= 2 && c.includes('collage') && rand() < .9) c = ['collage'];
    if (cut.items && cut.items.length) { const x = ['board', 'split'].filter(k => !used[k] && L[i - 1] !== k && (k !== 'split' || ph.length)); c = x.length ? x : ['board']; }
    if (!c.length) c = ph.length ? ['cover', 'poster', 'mat', 'split'].filter(k => !used[k] && L[i - 1] !== k) : ['statement'];
    if (!c.length) c = ['cover'];
    const k = pick(c); L.push(k); used[k] = 1;
  });
  return { seed, style, layouts: L };
}

/* ── 색 정하기 ── */
function basePalette() {
  const pin = brief.palette || {};
  let key = pin.key;
  if (!key) {
    const cand = [];
    photos.forEach(p => (p.colors || []).forEach(c => { const [h, s, l] = hsl(hex2(c.hex)); if (s > .22 && l > .16 && l < .64) cand.push({ hex: c.hex, w: c.share * (s + .3) }); }));
    cand.sort((a, b) => b.w - a.w);
    key = cand[0] ? cand[0].hex : '#2E4A3B';
  }
  let [h, s, l] = hsl(hex2(key));
  if (l > .5) l = .42; if (l < .2) l = .24; if (s > .72) s = .66;
  return { h, s, l, key: toHex(fromHsl([h, s, l])) };
}
const C0 = basePalette();
const C = (() => {
  const pin = brief.palette || {}, { h, s, l, key } = C0;
  const dark = brief.tone === 'premium' || brief.tone === 'night';
  const bg = pin.bg || (dark ? toHex(fromHsl([h, Math.min(s, .18), .075])) : toHex(fromHsl([h, Math.min(s, .3), .95])));
  const bg2 = dark ? toHex(fromHsl([h, Math.min(s, .2), .12])) : toHex(fromHsl([h, Math.min(s, .32), .9]));
  const ink = pin.ink || (dark ? '#F3EFE7' : toHex(fromHsl([h, Math.min(s, .18), .1])));
  const deep = toHex(fromHsl([h, Math.min(s, .5), Math.max(.1, l - .22)]));
  let acc = pin.accent || (dark ? '#C9A86A' : toHex(fromHsl([(h + .07) % 1, Math.min(.65, s + .12), .5])));
  if (contrast(acc, bg) < 2.2) acc = key;
  const onKey = contrast(key, '#FFFFFF') >= 3.2 ? '#FFFFFF' : '#141414';
  return { key, deep, bg, bg2, ink, acc, onKey, dark };
})();

/* ── 다른 광고와 겹치지 않게 ── */
const history = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, 'utf8')) : [];
function sim(a, b) {
  let s = 0;
  a.layouts.forEach((k, i) => { if (b.layouts[i] === k) s += 2; else if (b.layouts.includes(k)) s += .6; });
  if (a.style.head === b.style.head) s += 2.5;
  if (a.style.tr === b.style.tr) s += 1;
  if (a.style.align === b.style.align) s += .5;
  if (a.style.deco === b.style.deco) s += .5;
  if (a.style.hl === b.style.hl) s += .4;
  if (b.hue != null && Math.abs(((C0.h - b.hue + 1.5) % 1) - .5) < .06) s += 1.5;
  return s;
}
let PLAN;
if (opt('seed') != null) PLAN = makePlan(opt('seed'));
else {
  const others = history.filter(h => h.brand !== brief.brand).slice(-30);
  let best = null;
  for (let s = 0; s < 40; s++) {
    const p = makePlan(s);
    const score = others.reduce((m, h) => Math.max(m, sim(p, h)), 0) + others.reduce((t, h) => t + sim(p, h), 0) / Math.max(1, others.length) * .3;
    if (!best || score < best.score) best = { ...p, score };
  }
  PLAN = best;
}
const S = PLAN.style, HF = FONTS[S.head];

/* ── 문구 ── */
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const rich = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<em class="hl">$1</em>');
function headHtml(s) {
  const lines = String(s || '').split('\n');
  return `<h1 class="fit">${lines.map((ln, i) => `<span class="ln"><span style="animation-delay:${(.12 + i * .11).toFixed(2)}s">${rich(ln)}</span></span>`).join('')}</h1>`;
}
const priceHtml = (v) => { const m = String(v).match(/^([^\d]*)([\d,]+)(.*)$/); if (!m) return esc(v); const n = +m[2].replace(/,/g, ''); return `${esc(m[1])}<b class="num" data-to="${n}">${m[2]}</b><small>${esc(m[3] || '원')}</small>`; };
function tx(cut, cls) {
  return `<div class="tx ${cls || ''}">${cut.kicker ? `<p class="kick a0">${esc(cut.kicker)}</p>` : ''}${headHtml(cut.head)}${cut.sub ? `<p class="sub fit a2">${rich(cut.sub)}</p>` : ''}${cut.badge ? `<p class="badge pop">${esc(cut.badge)}</p>` : ''}${cut.note ? `<p class="note a3">${esc(cut.note)}</p>` : ''}</div>`;
}
const items = (cut) => `<ul class="items fit">${(cut.items || []).slice(0, 4).map((x, j) => `<li class="a2" style="animation-delay:${(.45 + j * .1).toFixed(2)}s"><b>${esc(x.name)}</b><i></i><span>${priceHtml(x.price || '')}</span></li>`).join('')}</ul>`;
function img(f, cls) { const p = P[f] || {}; return `<div class="ph ${cls || ''}"><img src="photos/${esc(f)}" style="object-position:${Math.round((p.fx ?? .5) * 100)}% ${Math.round((p.fy ?? .5) * 100)}%" alt=""></div>`; }
const LOGO = brief.logo && fs.existsSync(path.join(DIR, 'photos', brief.logo)) ? `<img class="logo" src="photos/${esc(brief.logo)}" alt="">` : `<b class="brandname">${esc(brief.brand)}</b>`;
const foot = (txt) => `<div class="foot a3">${LOGO}<span class="fit">${esc(txt != null ? txt : (brief.contact || ''))}</span></div>`;
const pinSvg = `<svg viewBox="0 0 48 64" class="pin"><path d="M24 2C12 2 3 11 3 23c0 15 21 37 21 37s21-22 21-37C45 11 36 2 24 2z" fill="currentColor"/><circle cx="24" cy="23" r="8" fill="#fff"/></svg>`;
function mapSvg(seedStr) {
  const r = rngOf(seedStr); let roads = '';
  for (let i = 0; i < 5; i++) { const y = 8 + r() * 84; roads += `<path d="M-5 ${y.toFixed(1)} L105 ${(y + (r() - .5) * 30).toFixed(1)}" stroke-width="${(.6 + r() * 1.6).toFixed(1)}"/>`; }
  for (let i = 0; i < 5; i++) { const x = 8 + r() * 84; roads += `<path d="M${x.toFixed(1)} -5 L${(x + (r() - .5) * 26).toFixed(1)} 105" stroke-width="${(.6 + r() * 1.4).toFixed(1)}"/>`; }
  roads += `<path class="main" d="M-5 ${(30 + r() * 40).toFixed(1)} C 30 ${(r() * 100).toFixed(1)}, 70 ${(r() * 100).toFixed(1)}, 105 ${(30 + r() * 40).toFixed(1)}" stroke-width="3.2"/>`;
  return `<svg class="map" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><g fill="none" stroke-linecap="round">${roads}</g></svg>`;
}
async function qr(cut) {
  const url = cut.map || (cut.address ? 'https://map.naver.com/p/search/' + encodeURIComponent((brief.brand || '') + ' ' + cut.address) : '');
  if (!url || cut.qr === false) return '';
  const svg = await QR.toString(url, { type: 'svg', margin: 0, color: { dark: '#111111', light: '#FFFFFF' } });
  return `<div class="qr pop"><div class="qrbox">${svg}</div><span>${esc(cut.qrLabel || '휴대폰으로 지도 보기')}</span></div>`;
}
function placeInfo(cut) {
  const dir = (cut.directions || []).slice(0, 3);
  return `<p class="kick a0">${esc(cut.kicker || '오시는 길')}</p>${headHtml(cut.head || brief.brand)}
  ${cut.address ? `<p class="addr fit a2">${esc(cut.address)}</p>` : ''}
  ${dir.length ? `<ul class="dirs fit">${dir.map((d, j) => `<li class="a2" style="animation-delay:${(.5 + j * .1).toFixed(2)}s">${rich(d)}</li>`).join('')}</ul>` : ''}
  ${(cut.hours || cut.phone) ? `<p class="meta fit a3">${[cut.hours, cut.phone].filter(Boolean).map(esc).join('<i></i>')}</p>` : ''}`;
}

async function cutHtml(cut, L, o) {
  const ph = photosOf(cut), p0 = ph[0], pi = P[p0] || {};
  switch (L) {
    case 'cover': return `<section class="L-cover">${img(p0, 'full kb')}<div class="scrim ${S.scrim}"></div>${tx(cut, 'on-photo')}${foot()}</section>`;
    case 'band': return `<section class="L-band">${img(p0, 'full kb')}<div class="bandbox wipe">${tx(cut, 'on-key')}</div>${foot()}</section>`;
    case 'split': { const side = o === 'h' ? ((pi.fx ?? .5) > .55 ? 'r' : 'l') : 't'; return `<section class="L-split s-${side}">${img(p0, 'half kb')}<div class="panel">${tx(cut)}${cut.items ? items(cut) : ''}</div>${foot()}</section>`; }
    case 'editorial': return `<section class="L-editorial">${img(p0, 'ed kb')}<div class="edline draw"></div><div class="edtx">${tx(cut)}</div>${foot()}</section>`;
    case 'spotlight': return `<section class="L-spotlight">${img(p0, 'full kb duo')}<div class="tint"></div>${tx(cut, 'on-photo center')}${foot()}</section>`;
    case 'poster': return `<section class="L-poster">${tx(cut, 'top')}${img(p0, 'frame kb')}${foot()}</section>`;
    case 'mat': return `<section class="L-mat"><div class="matbox">${img(p0, 'matph kb')}</div>${tx(cut)}${foot()}</section>`;
    case 'collage': { const n = Math.min(3, ph.length); return `<section class="L-collage n${n}"><div class="grid">${ph.slice(0, n).map((f, j) => img(f, 'cell kb rv r' + j)).join('')}</div><div class="strip">${tx(cut)}</div>${foot()}</section>`; }
    case 'board': return `<section class="L-board ${p0 ? 'has-ph' : ''}">${p0 ? img(p0, 'full blur') + '<div class="scrim solid"></div>' : ''}<div class="boardbox">${tx(cut, p0 ? 'on-photo' : '')}${items(cut)}</div>${foot()}</section>`;
    case 'pricehero': return `<section class="L-pricehero">${img(p0, 'pph kb')}<div class="ptx">${tx(cut)}<p class="bigprice fit">${priceHtml(cut.price)}</p></div>${foot()}</section>`;
    case 'statement': return `<section class="L-statement">${tx(cut, 'big')}${p0 ? img(p0, 'thumb kb') : ''}${foot()}</section>`;
    case 'placeMap': return `<section class="L-placeMap"><div class="mapwrap">${mapSvg(brief.brand + 'map')}<div class="pinwrap"><span class="ring"></span><span class="ring r2"></span>${pinSvg}</div></div><div class="pinfo">${placeInfo(cut)}${await qr(cut)}</div>${foot('')}</section>`;
    case 'placePhoto': return `<section class="L-placePhoto">${img(p0, 'full kb')}<div class="scrim deep"></div><div class="pinfo on-photo">${placeInfo(cut)}</div>${await qr(cut)}${foot('')}</section>`;
    case 'placeType': return `<section class="L-placeType"><div class="pinfo">${placeInfo(cut)}</div><div class="ptside">${pinSvg}${await qr(cut)}</div>${foot('')}</section>`;
  }
}

function css(o) {
  const V = o === 'v', W = V ? 1080 : 1920, H = V ? 1920 : 1080;
  const sx = Math.round(W * SAFE), sy = Math.round(H * SAFE);
  const px = Math.max(sx + 16, V ? 84 : 132), py = Math.max(sy + 16, V ? 132 : 84);
  const f1 = V ? 34 : 30, f2 = V ? 44 : 40, fH = V ? 120 : 112;
  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
  const treat = { natural: 'none', warm: 'saturate(1.06) sepia(.06)', mute: 'saturate(.86) contrast(1.02)', punch: 'saturate(1.12) contrast(1.06)', grain: 'contrast(1.04)' }[S.treat];
  const hlBg = (a) => `linear-gradient(${C.acc}${a},${C.acc}${a})`;
  return `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:${C.bg};color:${C.ink};font-family:'Pretendard Variable',sans-serif;word-break:keep-all;-webkit-font-smoothing:antialiased}
section{position:relative;width:${W}px;height:${H}px;overflow:hidden;--px:${px}px;--py:${py}px}
${S.treat === 'grain' ? `section::after{content:"";position:absolute;inset:0;z-index:9;background:${grain};opacity:.08;mix-blend-mode:overlay;pointer-events:none}` : ''}
h1{font-family:${HF.fam},'Pretendard Variable',sans-serif;font-weight:${HF.w};font-size:${fH}px;line-height:${HF.lh};letter-spacing:${HF.track}}
h1 .ln{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
h1 .ln>span{display:inline-block;animation:lineup .9s cubic-bezier(.16,1,.3,1) both}
em.hl{font-style:normal}
${S.hl === 'color' ? `em.hl{color:${C.acc}}.on-photo em.hl,.on-key em.hl{color:inherit;border-bottom:.06em solid ${C.acc}}` : ''}
${S.hl === 'marker' ? `em.hl{background:${hlBg('55')} 0 90%/0 .34em no-repeat;animation:markM .7s .8s cubic-bezier(.6,0,.2,1) both}.on-photo em.hl,.on-key em.hl,.L-statement em.hl,.L-placeType em.hl{background-image:${hlBg('cc')}}` : ''}
${S.hl === 'under' ? `em.hl{background:linear-gradient(currentColor,currentColor) 0 100%/0 .07em no-repeat;padding-bottom:.03em;animation:markU .7s .8s cubic-bezier(.6,0,.2,1) both}` : ''}
.sub{margin-top:.8em;font-size:${f2}px;line-height:1.45;font-weight:500;opacity:.9}
.kick{font-size:${f1}px;font-weight:700;margin-bottom:1em;color:${C.acc};letter-spacing:.02em;display:flex;align-items:center;gap:.65em}
${S.deco === 'rule' ? `.kick::before{content:"";width:2em;height:2px;background:currentColor;transform-origin:left;animation:draw .7s .05s cubic-bezier(.6,0,.2,1) both}` : ''}
${S.deco === 'dot' ? `.kick::before{content:"";width:.55em;height:.55em;border-radius:50%;background:currentColor}` : ''}
${S.deco === 'bar' ? `.kick{padding:.25em .6em;background:${C.acc};color:#fff!important;display:inline-flex}` : ''}
.frameline{position:absolute;inset:${Math.round(sy * .6)}px ${Math.round(sx * .6)}px;border:1px solid currentColor;opacity:.3;z-index:8;pointer-events:none}
.tx{position:relative;z-index:3;text-align:${S.align}}
${S.align === 'center' ? '.tx .kick{justify-content:center}' : ''}
.tx.center{text-align:center}.tx.center .kick{justify-content:center}
.badge{display:inline-block;margin-top:1.1em;padding:.45em 1em;border-radius:${S.r}px;background:${C.acc};color:#fff;font-size:${f1}px;font-weight:700}
.note{margin-top:1.1em;font-size:${Math.round(f1 * .75)}px;opacity:.62}
.foot{position:absolute;z-index:6;left:var(--px);right:var(--px);bottom:var(--py);display:flex;justify-content:space-between;align-items:flex-end;gap:32px;font-size:${Math.round(f1 * .82)}px;font-weight:600;opacity:.92}
.foot span{text-align:right;max-width:62%}
.brandname{font-size:${f2}px;font-weight:800;letter-spacing:-.02em;white-space:nowrap}
.logo{height:${V ? 88 : 76}px;width:auto;max-width:360px;object-fit:contain}
.ph{overflow:hidden;background:${C.deep}}
.ph img{width:100%;height:100%;object-fit:cover;display:block;filter:${treat}}
.full{position:absolute;inset:0}
.scrim{position:absolute;inset:0;z-index:2}
.scrim.grad{background:${V ? 'linear-gradient(to top,rgba(6,7,8,.9) 0%,rgba(6,7,8,.55) 40%,rgba(6,7,8,0) 66%)' : 'linear-gradient(to right,rgba(6,7,8,.86) 0%,rgba(6,7,8,.5) 42%,rgba(6,7,8,0) 70%)'}}
.scrim.soft{background:${V ? 'linear-gradient(to top,rgba(6,7,8,.82),rgba(6,7,8,.25) 55%,rgba(6,7,8,0))' : 'linear-gradient(to right,rgba(6,7,8,.8),rgba(6,7,8,.15) 62%)'}}
.scrim.deep{background:${V ? 'linear-gradient(to top,rgba(6,7,8,.94) 0%,rgba(6,7,8,.72) 50%,rgba(6,7,8,.15) 82%)' : 'linear-gradient(to right,rgba(6,7,8,.92) 0%,rgba(6,7,8,.72) 48%,rgba(6,7,8,.1) 80%)'}}
.scrim.solid{background:rgba(8,9,10,.64)}
.on-photo{color:#fff}
section:has(.scrim) .foot,.L-spotlight .foot{color:#fff}
.on-photo .kick{color:${contrast(C.acc, '#08090A') > 4.5 ? C.acc : '#fff'}}
/* 전면 사진 */
.L-cover .tx{position:absolute;left:var(--px);right:${V ? 'var(--px)' : '44%'};bottom:calc(var(--py) + ${V ? 150 : 120}px)}
.L-cover h1{font-size:${Math.round(fH * 1.08)}px}
/* 사진 + 색 띠 */
.L-band .bandbox{position:absolute;z-index:3;background:${C.key};color:${C.onKey};${V ? `left:0;right:0;bottom:0;height:42%;padding:${Math.round(px * .9)}px var(--px) 0` : `top:0;bottom:0;right:0;width:42%;padding:var(--py) var(--px) 0 ${Math.round(px * .7)}px;display:flex;flex-direction:column;justify-content:center`};border-radius:${V ? `${S.r}px ${S.r}px 0 0` : `${S.r}px 0 0 ${S.r}px`}}
.L-band .full{${V ? 'bottom:40%' : 'right:40%'}}
.L-band h1{font-size:${Math.round(fH * .8)}px}
.L-band .kick{color:${C.onKey};opacity:.85}
.L-band .foot{color:${C.onKey};${V ? '' : `left:calc(58% + ${Math.round(px * .7)}px)`}}
.L-band .tx{${V ? '' : 'margin-bottom:90px'}}
/* 반반 */
.L-split{display:grid;${V ? 'grid-template-rows:56% 44%' : 'grid-template-columns:52% 48%'}}
${V ? '.L-split:has(.items){grid-template-rows:42% 58%}' : ''}
.L-split.s-r{grid-template-columns:48% 52%}.L-split.s-r .half{order:2}
.L-split .panel{position:relative;padding:${V ? Math.round(px * .9) + 'px var(--px) 0' : 'var(--py) var(--px) 110px'};display:flex;flex-direction:column;justify-content:${V ? 'flex-start' : 'center'};background:${C.bg};min-width:0}
.L-split h1{font-size:${Math.round(fH * .8)}px}
.L-split .items{margin-top:${V ? 36 : 40}px}
${V ? '' : `.L-split.s-l .foot{left:calc(52% + var(--px))}.L-split.s-r .foot{right:calc(52% + var(--px))}`}
/* 에디토리얼 */
.L-editorial{background:${C.bg}}
.L-editorial .ed{position:absolute;${V ? 'left:0;right:16%;top:0;height:58%' : 'right:0;top:0;bottom:0;width:57%'};border-radius:0 0 ${V ? S.r : 0}px 0}
.L-editorial .edtx{position:absolute;z-index:3;${V ? 'left:var(--px);right:var(--px);top:calc(58% + 96px)' : 'left:var(--px);width:calc(43% - var(--px) - 72px);top:50%;transform:translateY(-55%)'}}
.L-editorial h1{font-size:${Math.round(fH * (V ? .95 : .86))}px}
.L-editorial .edline{position:absolute;z-index:4;background:${C.acc};${V ? 'left:var(--px);width:160px;top:calc(58% + 52px);height:3px' : 'left:var(--px);top:calc(var(--py) + 10px);height:3px;width:200px'};transform-origin:left}
/* 스포트라이트 */
.L-spotlight .duo img{filter:grayscale(.85) contrast(1.08) brightness(1.05)}
.L-spotlight .tint{position:absolute;inset:0;z-index:2;background:radial-gradient(ellipse at center,rgba(0,0,0,.45),rgba(0,0,0,.15) 70%),${C.deep};mix-blend-mode:multiply;opacity:.62}
.L-spotlight .tx{position:absolute;left:var(--px);right:var(--px);top:50%;transform:translateY(-55%)}
.L-spotlight h1{font-size:${Math.round(fH * 1.05)}px}
/* 포스터 */
.L-poster{padding:var(--py) var(--px);display:flex;flex-direction:column;gap:48px;background:${C.bg}}
.L-poster h1{font-size:${Math.round(fH * .88)}px}
.L-poster .frame{flex:1;min-height:0;border-radius:${S.r}px;margin-bottom:${V ? 120 : 0}px;box-shadow:0 40px 80px -40px rgba(0,0,0,.4)}
${V ? '' : `.L-poster{display:grid;grid-template-columns:minmax(0,40fr) minmax(0,60fr);align-items:center;gap:${px}px}.L-poster .frame{width:100%;height:calc(100% - 120px);margin:0 0 120px}.L-poster .tx{margin-bottom:120px}`}
/* 액자 매트 */
.L-mat{background:${C.bg2};padding:var(--py) var(--px);display:flex;${V ? 'flex-direction:column' : 'flex-direction:row;align-items:center'};gap:${V ? 56 : px}px}
.L-mat .matbox{${V ? 'height:56%' : 'width:52%;height:calc(100% - 120px);margin-bottom:120px'};background:${C.dark ? '#16181B' : '#fff'};padding:${V ? 40 : 36}px;box-shadow:0 30px 60px -30px rgba(0,0,0,.35);flex:none}
.L-mat .matph{width:100%;height:100%}
.L-mat .tx{${V ? '' : 'flex:1;min-width:0;margin-bottom:120px'}}
.L-mat h1{font-size:${Math.round(fH * .82)}px}
/* 모음 */
.L-collage .grid{position:absolute;display:grid;gap:${V ? 12 : 14}px;${V ? 'left:0;right:0;top:0;height:60%' : 'left:0;top:0;bottom:0;width:58%'}}
.L-collage.n2 .grid{${V ? 'grid-template-rows:1fr 1fr' : 'grid-template-columns:1fr 1fr'}}
.L-collage.n3 .grid{${V ? 'grid-template-columns:1fr 1fr;grid-template-rows:1.3fr 1fr' : 'grid-template-columns:1.25fr 1fr;grid-template-rows:1fr 1fr'}}
.L-collage.n3 .cell:first-child{${V ? 'grid-column:1/-1' : 'grid-row:1/-1'}}
.L-collage .strip{position:absolute;${V ? 'left:var(--px);right:var(--px);top:calc(60% + 72px)' : 'right:var(--px);left:calc(58% + ' + Math.round(px * .6) + 'px);top:50%;transform:translateY(-55%)'}}
.L-collage h1{font-size:${Math.round(fH * .74)}px}
${V ? '' : `.L-collage .foot{left:calc(58% + ${Math.round(px * .6)}px)}.L-editorial .foot{right:calc(57% + 48px)}.L-pricehero .foot{right:calc(50% + 48px)}.L-placeMap .foot{right:calc(46% + 48px)}`}
/* 차림판 */
.L-board{background:${C.bg}}
.L-board .boardbox{position:absolute;z-index:3;left:var(--px);right:var(--px);${V ? 'top:22%' : 'top:50%;transform:translateY(-55%);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:' + px + 'px;align-items:center'}}
.L-board h1{font-size:${Math.round(fH * .84)}px}
.items{list-style:none;margin-top:${V ? 64 : 0}px;font-size:${Math.round(f2 * 1.06)}px}
.items li{display:flex;align-items:baseline;gap:18px;padding:${V ? 30 : 24}px 0;border-bottom:1px solid color-mix(in srgb,currentColor 26%,transparent)}
.items li b{font-weight:600}
.items li i{flex:1;min-width:20px;border-bottom:2px dotted color-mix(in srgb,currentColor 32%,transparent);transform:translateY(-.3em)}
.items li span{font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.items small,.bigprice small{font-size:.6em;font-weight:600;margin-left:.12em}
.L-board.has-ph .items{color:#fff}
/* 가격 주인공 */
.L-pricehero{background:${C.bg}}
.L-pricehero .pph{position:absolute;${V ? 'left:0;right:0;top:0;height:50%' : 'right:0;top:0;bottom:0;width:50%'}}
.L-pricehero .ptx{position:absolute;z-index:3;${V ? 'left:var(--px);right:var(--px);top:calc(50% + 80px)' : 'left:var(--px);width:calc(50% - var(--px) - 80px);top:50%;transform:translateY(-55%)'}}
.L-pricehero h1{font-size:${Math.round(fH * .7)}px}
.bigprice{margin-top:.25em;font-family:${HF.fam},'Pretendard Variable',sans-serif;font-size:${V ? 190 : 176}px;font-weight:${Math.max(HF.w, 700)};letter-spacing:-.05em;line-height:1;color:${C.dark ? C.acc : C.key};font-variant-numeric:tabular-nums;white-space:nowrap}
/* 큰 문구 */
.L-statement{background:${C.key};color:${C.onKey};padding:var(--py) var(--px) calc(var(--py) + 110px);display:flex;flex-direction:column;justify-content:center}
.L-statement h1{font-size:${Math.round(fH * 1.12)}px;line-height:1.05}
.L-statement .kick{color:${C.onKey};opacity:.8}
.L-statement .thumb{position:absolute;${V ? 'left:var(--px);right:var(--px);bottom:calc(var(--py) + 130px);height:26%' : 'right:var(--px);top:var(--py);bottom:calc(var(--py) + 120px);width:34%'};border-radius:${S.r}px}
${V ? '.L-statement:has(.thumb){justify-content:flex-start;padding-top:calc(var(--py) + 90px)}' : '.L-statement:has(.thumb) .tx{max-width:54%}'}
.L-statement .foot{color:${C.onKey}}
/* 위치 */
.pinfo .addr{margin-top:.7em;font-size:${Math.round(f2 * 1.08)}px;font-weight:700;letter-spacing:-.02em;line-height:1.35}
.dirs{list-style:none;margin-top:${V ? 40 : 30}px;font-size:${Math.round(f2 * .92)}px;line-height:1.45}
.dirs li{display:flex;gap:.6em;padding:.34em 0}
.dirs li::before{content:"";flex:none;width:.42em;height:.42em;margin-top:.52em;border-radius:50%;background:${C.acc}}
.meta{margin-top:${V ? 36 : 26}px;font-size:${f1}px;font-weight:600;opacity:.82;display:flex;flex-wrap:wrap;align-items:center;gap:.6em}
.meta i{width:1px;height:.9em;background:currentColor;opacity:.4}
.qr{display:flex;align-items:center;gap:22px;font-size:${Math.round(f1 * .85)}px;font-weight:700}
.qrbox{width:${V ? 168 : 150}px;height:${V ? 168 : 150}px;padding:12px;background:#fff;border-radius:${Math.min(S.r, 16)}px;flex:none}
.qrbox svg{width:100%;height:100%;display:block}
.pin{width:${V ? 74 : 64}px;color:${C.dark ? C.acc : C.key}}
.L-placeMap{background:${C.bg}}
.L-placeMap .mapwrap{position:absolute;${V ? 'left:0;right:0;top:0;height:44%' : 'right:0;top:0;bottom:0;width:46%'};background:${C.bg2};overflow:hidden}
.map{position:absolute;inset:0;width:100%;height:100%}
.map path{stroke:${C.dark ? 'rgba(255,255,255,.16)' : 'rgba(0,0,0,.13)'}}.map path.main{stroke:${C.key};opacity:.6}
.pinwrap{position:absolute;left:50%;top:50%;transform:translate(-50%,-90%)}
.pinwrap .pin{width:${V ? 110 : 96}px;display:block;animation:drop .8s .25s cubic-bezier(.3,1.6,.5,1) both}
.ring{position:absolute;left:50%;bottom:-6px;width:150px;height:46px;margin-left:-75px;border-radius:50%;border:2px solid ${C.key};opacity:0;animation:ring 1.8s 1s ease-out infinite}
.ring.r2{animation-delay:1.6s}
.L-placeMap .pinfo{position:absolute;z-index:3;${V ? 'left:var(--px);right:var(--px);top:calc(44% + 80px)' : 'left:var(--px);width:calc(54% - var(--px) - 80px);top:50%;transform:translateY(-55%)'}}
.L-placeMap .qr{margin-top:${V ? 48 : 34}px}
.L-placeMap h1,.L-placeType h1,.L-placePhoto h1{font-size:${Math.round(fH * .8)}px}
.L-placePhoto .pinfo{position:absolute;z-index:3;left:var(--px);${V ? 'right:var(--px);bottom:calc(var(--py) + 330px)' : 'width:48%;top:50%;transform:translateY(-55%)'}}
.L-placePhoto .qr{position:absolute;z-index:4;color:#fff;${V ? 'left:var(--px);bottom:calc(var(--py) + 110px)' : 'right:var(--px);top:var(--py)'}}
.L-placeType{background:${C.key};color:${C.onKey}}
.L-placeType .kick{color:${C.onKey};opacity:.8}
.L-placeType .dirs li::before{background:${C.onKey}}
.L-placeType .pinfo{position:absolute;left:var(--px);${V ? 'right:var(--px);top:42%;transform:translateY(-50%)' : 'width:58%;top:50%;transform:translateY(-55%)'}}
.L-placeType .ptside{position:absolute;${V ? 'left:var(--px);right:var(--px);bottom:calc(var(--py) + 120px);display:flex;justify-content:space-between;align-items:flex-end' : 'right:var(--px);top:var(--py);bottom:calc(var(--py) + 110px);display:flex;flex-direction:column;justify-content:space-between;align-items:flex-end'}}
.L-placeType .pin{color:${C.onKey};width:${V ? 120 : 110}px;animation:drop .8s .25s cubic-bezier(.3,1.6,.5,1) both}
.L-placeType .foot,.L-placeType .qr{color:${C.onKey}}
/* 움직임 */
.kb img{animation:kb 3.5s linear both}
@keyframes kb{from{transform:scale(1.08)}to{transform:scale(1.0)}}
.blur img{filter:blur(20px) saturate(1.05);transform:scale(1.15)}
.a0,.a2,.a3{animation:up .8s cubic-bezier(.16,1,.3,1) both}
.a0{animation-delay:.02s}.a2{animation-delay:.42s}.a3{animation-delay:.62s}
.pop{animation:pop .6s .7s cubic-bezier(.3,1.5,.5,1) both}
.wipe{animation:wipe .7s cubic-bezier(.7,0,.2,1) both}
.draw{animation:draw .8s .3s cubic-bezier(.6,0,.2,1) both}
.rv{animation:reveal .9s cubic-bezier(.7,0,.2,1) both}.rv.r1{animation-delay:.12s}.rv.r2{animation-delay:.24s}
.bigprice{animation:up .7s .5s cubic-bezier(.16,1,.3,1) both}
@keyframes lineup{from{transform:translateY(108%)}to{transform:none}}
@keyframes up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:none}}
@keyframes pop{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:none}}
@keyframes markM{to{background-size:100% .34em}}
@keyframes markU{to{background-size:100% .07em}}
@keyframes draw{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes wipe{from{clip-path:inset(${V ? '100% 0 0 0' : '0 0 0 100%'})}to{clip-path:inset(0)}}
@keyframes reveal{from{clip-path:inset(0 0 100% 0)}to{clip-path:inset(0)}}
@keyframes drop{from{opacity:0;transform:translateY(-120px)}to{opacity:1;transform:none}}
@keyframes ring{0%{opacity:.7;transform:scale(.3)}100%{opacity:0;transform:scale(1.3)}}
`;
}

/* 페이지 안 스크립트: 시간 맞추기(숫자 올라감) + 안전 영역 자동 맞춤 */
const PAGE_JS = `
window.__seek=function(ms){document.querySelectorAll('.num').forEach(function(e){var to=+e.dataset.to,d=550,dur=900,t=Math.max(0,Math.min(1,(ms-d)/dur)),k=1-Math.pow(1-t,3);e.textContent=Math.round(to*k).toLocaleString('ko-KR')});};
window.__fit=function(sx,sy){var W=innerWidth,H=innerHeight,log=[];
 function out(e){var r=e.getBoundingClientRect();if(!r.width)return false;return r.left<sx-1||r.right>W-sx+1||r.top<sy-1||r.bottom>H-sy+1||e.scrollWidth>e.clientWidth+2}
 function overlap(){var f=document.querySelector('.foot'),bad=[];if(!f)return bad;var fr=f.getBoundingClientRect();document.querySelectorAll('.tx,.pinfo,.items,.qr').forEach(function(e){var r=e.getBoundingClientRect();if(r.width&&r.bottom>fr.top-24&&r.top<fr.bottom&&r.right>fr.left&&r.left<fr.right)bad.push(e)});return bad}
 function bad(){var b=[];document.querySelectorAll('h1,.sub,.items,.addr,.dirs,.bigprice,.foot,.qr,.meta').forEach(function(e){if(out(e))b.push(e)});return b.concat(overlap())}
 for(var n=0;n<16;n++){var b=bad();if(!b.length)break;log.push(b.length);
  b.forEach(function(e){var t=e.matches('h1,.sub,.items,.addr,.dirs,.bigprice,.meta')?[e]:[].slice.call(e.querySelectorAll('h1,.sub,.items,.addr,.dirs,.bigprice,span'));
   if(e.matches('.qr')||(e.matches('.tx,.pinfo')&&!t.length))t=[e];
   t.forEach(function(x){var fs=parseFloat(getComputedStyle(x).fontSize),min=x.matches('h1')?56:(x.matches('.bigprice')?90:26);if(fs*0.93>=min)x.style.fontSize=(fs*0.93)+'px'})})}
 var sz=[].map.call(document.querySelectorAll('[style*="font-size"]'),function(e){return e.style.fontSize});
 return {rounds:log.length,left:bad().map(function(e){return e.tagName+'.'+e.className})};};`;

async function page(cut, L, o, still) {
  const fontsCss = [FONTS.sans.css, HF.css].filter((v, k, a) => a.indexOf(v) === k).map(h => `<link rel="stylesheet" href="file://${path.join(ENG, h)}">`).join('');
  const body = (await cutHtml(cut, L, o)).replace(/<\/section>$/, (S.deco === 'frame' ? '<div class="frameline"></div>' : '') + '</section>');
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><base href="file://${DIR}/">${fontsCss}<style>${css(o)}${still ? '*,*::before,*::after{animation-delay:-10s!important;animation-duration:.001s!important;animation-iteration-count:1!important}.ring{display:none}' : ''}</style><script>${PAGE_JS}</script></head><body>${body}</body></html>`;
}

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
    const tr = o === 'v' ? S.tr.replace('left', 'up').replace('squeezeh', 'squeezev') : S.tr;
    for (let i = 1; i < n; i++) { f += `${last}[${i}:v]xfade=transition=${tr}:duration=${T}:offset=${(i * (D - T)).toFixed(3)}[x${i}];`; last = `[x${i}]`; }
    const args = ['-y', '-loglevel', 'error', ...ins, '-f', 'lavfi', '-t', '15', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', f.replace(/;$/, ''), '-map', last, '-map', `${n}:a`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-t', '15', '-movflags', '+faststart', path.join(OUT, `ad_${o}_15s.mp4`)];
    const ff = spawn('ffmpeg', args); let err = ''; ff.stderr.on('data', d => err += d);
    ff.on('close', c => c ? rej(new Error(err)) : res());
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined });
  const orients = opt('only') ? [opt('only')] : ['v', 'h'];
  const check = {};
  for (const o of orients) {
    const [w, h] = o === 'v' ? [1080, 1920] : [1920, 1080], sx = Math.round(w * SAFE), sy = Math.round(h * SAFE);
    for (let i = 0; i < cuts.length; i++) {
      const cut = cuts[i], L = PLAN.layouts[i];
      const pg = await b.newPage({ viewport: { width: w, height: h } });
      const htmlFile = path.join(OUT, `.cut_${o}_${i + 1}.html`);
      fs.writeFileSync(htmlFile, await page(cut, L, o, true));
      await pg.goto('file://' + htmlFile); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(120);
      const fit = await pg.evaluate(([a, c]) => window.__fit(a, c), [sx, sy]);
      check[`${o}${i + 1}`] = { layout: L, ...fit };
      await pg.screenshot({ path: path.join(OUT, `${o}_${i + 1}.png`) });
      if (!opt('still')) {
        fs.writeFileSync(htmlFile, await page(cut, L, o, false));
        await pg.goto('file://' + htmlFile); await pg.evaluate(() => document.fonts.ready);
        await pg.evaluate(() => document.getAnimations().forEach(a => { a.pause(); a.currentTime = 10000; }));
        await pg.evaluate(([a, c]) => window.__fit(a, c), [sx, sy]);   // 다 나타난 상태에서 같은 맞춤
        await encode(path.join(OUT, `.c_${o}_${i + 1}.mp4`), async function* () {
          for (let k = 0; k < FR; k++) {
            const ms = k * 1000 / FPS;
            await pg.evaluate((t) => { document.getAnimations().forEach(a => { a.currentTime = t; }); window.__seek(t); }, ms);
            yield await pg.screenshot({ type: 'jpeg', quality: 92 });
          }
        });
      }
      await pg.close();
      process.stdout.write(`${o}${i + 1}:${L}${fit.left.length ? '(!)' : ''} `);
    }
    if (!opt('still')) await join(o, cuts.length);
  }
  await b.close();
  const rec = { brand: brief.brand, at: new Date().toISOString(), seed: PLAN.seed, layouts: PLAN.layouts, style: S, hue: C0.h, key: C.key };
  fs.writeFileSync(path.join(OUT, 'plan.json'), JSON.stringify({ ...rec, palette: C, font: HF.fam, safe: SAFE, check }, null, 1));
  if (!opt('dry')) { const hs = history.filter(x => x.brand !== brief.brand); hs.push(rec); fs.writeFileSync(HIST, JSON.stringify(hs, null, 1)); }
  fs.readdirSync(OUT).filter(f => f.startsWith('.c_') || f.startsWith('.cut_')).forEach(f => fs.unlinkSync(path.join(OUT, f)));
  const bad = Object.entries(check).filter(([, v]) => v.left.length);
  console.log('\n완료', JSON.stringify({ layouts: PLAN.layouts, font: S.head, tr: S.tr, treat: S.treat, hl: S.hl, key: C.key }), bad.length ? '\n안전 영역 넘침: ' + JSON.stringify(bad) : '\n안전 영역: 모두 통과');
})().catch(e => { console.error(e); process.exit(1); });
