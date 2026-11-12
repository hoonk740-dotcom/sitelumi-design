/*!
 * 사이트루미 업종 시그니처 씬 v4.0 — 첫 화면을 한 편의 짧은 광고처럼
 * 씬 = 드러내는 방식(reveal) × 모티프(motif, 배경에 흐르는 업종 소재) × 목록 움직임(list, 홈 서비스 목록)
 * 변주 36 = 구도 4 × 리듬 3 × 모티프 변형 3 · 사이트 고유 번호(시드)로 입자 배치·흐름 방향이 또 달라짐
 * 실제 글자·사진은 그대로 두고 위에 연출만 얹음 · 움직임 줄이기면 아무것도 안 함 · 화면 밖이면 멈춤
 * 사용: 페이지 .sl-page[data-fx-scene="cafe-1"][data-fx-sv="0~35"] → SLSCENE.init(page)
 */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.SLSCENE) return;
  var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  /* 씬 목록: 업종마다 3개, 업종 사이에 같은 조합 없음 [이름, reveal, motif, list] */
  var S = {
    cafe: [['스팀 레터 Steam Letter', 'steam', 'steam', 'marquee'], ['라테 아트 Latte Pour', 'iris', 'cream', 'fan'], ['원두 로스트 Bean Roast', 'sunrise', 'ember', 'timeline']],
    bakery: [['프루프 앤 베이크 Proof & Bake', 'proof', 'flour', 'timeline'], ['오븐 글로우 Oven Glow', 'daynight', 'rays', 'stack'], ['바스켓 Basket', 'curtain', 'dots', 'arc']],
    restaurant: [['시즐 Sizzle', 'sizzle', 'ember', 'tilt'], ['한 상 차림 Table Set', 'split', 'steam', 'grid'], ['칼질 리듬 Knife Rhythm', 'bands', 'lines', 'slide']],
    pub: [['네온 사인 Neon Sign', 'spotlight', 'sparkle', 'marquee'], ['잔 부딪힘 Cheers', 'ripple', 'bubbles', 'fan'], ['골목 밤 Alley Night', 'daynight', 'stars', 'stack']],
    hair: [['미러 리빌 Mirror Reveal', 'mirror', 'glint', 'tilt'], ['컷 라인 Cut Line', 'split', 'lines', 'slide'], ['드라이 바람 Blow Dry', 'wipe', 'waves', 'fan']],
    nail: [['글로스 코트 Gloss Coat', 'brush', 'chips', 'fan'], ['컬러 드롭 Color Drop', 'ripple', 'confetti', 'grid'], ['큐티클 라인 Fine Line', 'stitch', 'sparkle', 'timeline']],
    lash: [['눈뜨기 Open Eye', 'iris', 'glint', 'slide'], ['한 올 Single Strand', 'chalk', 'lines', 'stack'], ['깃털 Feather', 'curtain', 'petals', 'arc']],
    skin: [['듀드롭 Dewdrop', 'dew', 'drops', 'stack'], ['수분 결 Hydra Wave', 'ripple', 'waves', 'timeline'], ['맑은 빛 Clear Light', 'sunrise', 'bubbles', 'grid']],
    clinic: [['캄 클리닉 Calm Clinic', 'bands', 'aurora', 'timeline'], ['맥박 선 Pulse Line', 'pulse', 'pulseline', 'stack'], ['진료 창 Clear Window', 'curtain', 'lines', 'grid']],
    dental: [['클리어 라인 Clear Line', 'smile', 'smilecurve', 'arc'], ['반짝 미소 Bright Smile', 'iris', 'sparkle', 'grid'], ['정돈 Aligned', 'split', 'dots', 'timeline']],
    oriental: [['허브 스크롤 Herb Scroll', 'scroll', 'leaves', 'unroll'], ['먹 번짐 Ink Bloom', 'ink', 'hanji', 'timeline'], ['약탕 김 Herbal Steam', 'dew', 'steam', 'stack']],
    pilates: [['코어 라인 Core Line', 'stitch', 'lines', 'slide'], ['호흡 Breath', 'ripple', 'aurora', 'stack'], ['리포머 Reformer', 'split', 'waves', 'timeline']],
    yoga: [['해맞이 Sun Salute', 'sunrise', 'rays', 'arc'], ['고요 Stillness', 'dew', 'petals', 'timeline'], ['균형 Balance', 'mirror', 'aurora', 'fan']],
    gym: [['펄스 Pulse', 'pulse', 'ember', 'tilt'], ['리프트 Lift', 'bands', 'sparkle', 'stack'], ['스프린트 Sprint', 'wipe', 'lines', 'marquee']],
    academy: [['칠판 Chalkboard', 'chalk', 'chalkdust', 'timeline'], ['펼친 노트 Open Notebook', 'scroll', 'grid', 'stack'], ['형광펜 Highlighter', 'brush', 'dots', 'slide']],
    study: [['연필 선 Pencil Line', 'chalk', 'lines', 'arc'], ['스티커 Sticker', 'stamp', 'confetti', 'grid'], ['책장 Bookshelf', 'curtain', 'chalkdust', 'fan']],
    music: [['음표 Note Flow', 'typewriter', 'pulseline', 'marquee'], ['건반 Keys', 'bands', 'sparkle', 'slide'], ['공명 Resonance', 'ripple', 'waves', 'arc']],
    art: [['붓터치 Brushstroke', 'brush', 'confetti', 'tilt'], ['스케치 Sketch', 'chalk', 'grid', 'grid'], ['물감 번짐 Paint Bloom', 'ink', 'drops', 'fan']],
    interior: [['도면에서 현실로 Blueprint to Real', 'blueprint', 'grid', 'compare'], ['자재 레이어 Material Layers', 'bands', 'dots', 'stack'], ['빛 드는 집 Daylight Home', 'sunrise', 'rays', 'slide']],
    cleaning: [['와이프 클린 Wipe Clean', 'wipe', 'sparkle', 'compare'], ['버블 Bubble Fresh', 'ripple', 'bubbles', 'grid'], ['반짝 구역 Zone Shine', 'curtain', 'glint', 'timeline']],
    moving: [['출발 Departure', 'mapfly', 'mapdots', 'timeline'], ['박스 쌓기 Box Stack', 'stamp', 'dots', 'stack'], ['길 따라 Route', 'stitch', 'lines', 'marquee']],
    laundry: [['헹굼 Rinse', 'ripple', 'bubbles', 'marquee'], ['다림 Press', 'wipe', 'steam', 'stack'], ['개켜 두기 Folded', 'curtain', 'stitches', 'fan']],
    carrepair: [['토크 Torque', 'torque', 'gears', 'tilt'], ['리프트업 Lift Up', 'bands', 'sparkle', 'timeline'], ['계기판 Dashboard', 'pulse', 'lines', 'grid']],
    law: [['인감 Ink & Seal', 'ink', 'hanji', 'stack'], ['서명 Signature', 'chalk', 'lines', 'compare'], ['법전 Codex', 'scroll', 'dots', 'unroll']],
    tax: [['장부 Ledger', 'typewriter', 'grid', 'timeline'], ['정산 Balance Sheet', 'bands', 'dots', 'compare'], ['도장 Stamp', 'stamp', 'lines', 'grid']],
    realestate: [['맵 플라이인 Map Fly-in', 'mapfly', 'mapdots', 'grid'], ['창밖 풍경 Window View', 'curtain', 'rays', 'slide'], ['키 건네기 Key Handover', 'iris', 'glint', 'arc']],
    cargo: [['고속도로 Highway', 'wipe', 'lines', 'slide'], ['물류 지도 Freight Map', 'mapfly', 'dots', 'timeline'], ['번호판 Plate', 'stamp', 'gears', 'stack']],
    loan: [['차분한 그래프 Steady Graph', 'pulse', 'grid', 'timeline'], ['상환 계단 Repay Steps', 'bands', 'lines', 'stack'], ['안심 Shield', 'iris', 'aurora', 'grid']],
    insurance: [['우산 Umbrella', 'curtain', 'drops', 'arc'], ['보장 지도 Cover Map', 'mapfly', 'aurora', 'stack'], ['가족 사진 Family Frame', 'split', 'petals', 'fan']],
    pension: [['낮에서 밤으로 Day to Night', 'daynight', 'stars', 'slide'], ['숲길 Forest Path', 'scroll', 'leaves', 'timeline'], ['모닥불 Campfire', 'sunrise', 'ember', 'arc']],
    craft: [['스티치 앤 페이퍼 Stitch & Paper', 'stitch', 'stitches', 'fan'], ['물레 Wheel', 'torque', 'dots', 'arc'], ['한지 Hanji Craft', 'ink', 'hanji', 'grid']],
    photo: [['셔터 Shutter', 'iris', 'glint', 'tilt'], ['현상 Darkroom', 'daynight', 'dots', 'stack'], ['필름 띠 Film Strip', 'bands', 'lines', 'marquee']],
    florist: [['꽃잎 Petal Fall', 'curtain', 'petals', 'fan'], ['봉오리 Bloom', 'iris', 'leaves', 'arc'], ['꽃다발 Bouquet', 'split', 'confetti', 'grid']],
    petgroom: [['발자국 Paw Steps', 'stamp', 'bubbles', 'slide'], ['보송 Fluffy', 'dew', 'dots', 'fan'], ['산책 Walk', 'mapfly', 'leaves', 'timeline']]
  };
  /* 씬이 없는 업종: 브랜드 씬 (업종 씬과 겹치지 않는 조합) */
  var GENERIC = [['브랜드 스포트라이트 Brand Spotlight', 'spotlight', 'rays', 'grid'], ['브랜드 리본 Brand Ribbon', 'bands', 'confetti', 'marquee'], ['브랜드 프레임 Brand Frame', 'split', 'aurora', 'slide']];

  /* ───── 공용 ───── */
  function css() {
    if (D.getElementById('slsc-css')) return;
    var s = D.createElement('style'); s.id = 'slsc-css';
    s.textContent = [
      '.sc-hero{position:relative;isolation:isolate;overflow:hidden}.sc-hero>*:not(.sc-layer):not(.sc-motif){position:relative;z-index:2}',
      '.sc-layer{position:absolute;inset:0;z-index:5;pointer-events:none}.sc-motif{position:absolute;inset:0;z-index:1;pointer-events:none;width:100%;height:100%}',
      '.sc-cover{position:absolute;inset:0;background:var(--sl-key,#111)}',
      '.sc-txt{opacity:0;transform:translateY(16px);transition:opacity .9s ease var(--sc-d,.6s),transform .9s ' + EASE + ' var(--sc-d,.6s)}.sc-go .sc-txt{opacity:1;transform:none}',
      /* 구도 4 */
      '.sc-c1 .sl-hero-text,.sc-c1 .sl-hero-over .sl-wrap{text-align:center;margin-left:auto;margin-right:auto}.sc-c1 .sl-hero-btns{justify-content:center}',
      '.sc-c2 .sl-hero-photo img{object-position:70% 50%}.sc-c2 .sl-hero-title{letter-spacing:-.03em}',
      '.sc-c3 .sl-hero-title{font-size:clamp(40px,9vw,112px)!important;line-height:1.02}.sc-c3 .sl-hero-text,.sc-c3 .sl-hero-over .sl-wrap{align-self:flex-end}',
      /* 목록 움직임 */
      '.sc-l-fan .sc-it{transition:transform .9s ' + EASE + ' calc(var(--i)*.08s),opacity .6s ease calc(var(--i)*.08s);transform-origin:50% 120%;opacity:0;transform:rotate(calc((var(--i) - var(--n)/2)*6deg)) translateY(30px)}.sc-l-fan.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-tilt .sc-it{opacity:0;transform:perspective(700px) rotateX(18deg) translateY(30px);transition:transform .9s ' + EASE + ' calc(var(--i)*.1s),opacity .6s ease calc(var(--i)*.1s)}.sc-l-tilt.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-timeline .sc-it{opacity:0;transform:translateX(-24px);transition:transform .8s ' + EASE + ' calc(var(--i)*.14s),opacity .6s ease calc(var(--i)*.14s);border-left:2px solid var(--sl-key);padding-left:14px}.sc-l-timeline.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-stack .sc-it{opacity:0;transform:translateY(40px) scale(.96);transition:transform .9s ' + EASE + ' calc(var(--i)*.12s),opacity .6s ease calc(var(--i)*.12s)}.sc-l-stack.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-arc .sc-it{opacity:0;transform:translateY(calc(40px + var(--arc,0px))) rotate(calc((var(--i) - var(--n)/2)*-3deg));transition:transform 1s ' + EASE + ' calc(var(--i)*.09s),opacity .6s ease calc(var(--i)*.09s)}.sc-l-arc.sc-in .sc-it{opacity:1;transform:translateY(var(--arc,0px))}',
      '.sc-l-grid .sc-it{opacity:0;transform:scale(.85);transition:transform .7s cubic-bezier(.34,1.56,.64,1) calc(var(--i)*.07s),opacity .5s ease calc(var(--i)*.07s)}.sc-l-grid.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-slide .sc-it{opacity:0;transform:translateX(calc(var(--dir,1)*60px));transition:transform .9s ' + EASE + ' calc(var(--i)*.1s),opacity .6s ease calc(var(--i)*.1s)}.sc-l-slide.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-l-unroll .sc-body-wrap{clip-path:inset(0 0 100% 0);transition:clip-path 1.6s ' + EASE + '}.sc-l-unroll.sc-in .sc-body-wrap{clip-path:inset(0 0 0 0)}',
      '.sc-l-compare .sc-it:nth-child(odd){opacity:0;transform:translateX(-30px)}.sc-l-compare .sc-it:nth-child(even){opacity:0;transform:translateX(30px)}.sc-l-compare .sc-it{transition:transform .9s ' + EASE + ' calc(var(--i)*.1s),opacity .6s ease calc(var(--i)*.1s)}.sc-l-compare.sc-in .sc-it{opacity:1;transform:none}',
      '.sc-mq{overflow:hidden}.sc-mq .sc-track{display:flex;gap:16px;width:max-content;animation:scMq 36s linear infinite}.sc-mq .sc-track>*{flex:0 0 min(320px,78vw)}.sc-mq:hover .sc-track{animation-play-state:paused}@keyframes scMq{to{transform:translateX(-50%)}}'
    ].join('\n');
    D.head.appendChild(s);
  }
  function rnd(seed) { var x = (Number(seed) || 1) % 2147483647; if (x <= 0) x += 2147483646; return function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
  function layer(hero, html) { var l = D.createElement('div'); l.className = 'sc-layer'; l.setAttribute('aria-hidden', 'true'); l.innerHTML = html || ''; hero.appendChild(l); return l; }
  function later(fn, ms) { return setTimeout(fn, ms); }
  function done(l, ms) { later(function () { if (l && l.parentNode) l.parentNode.removeChild(l); }, ms); }
  function key(page) { return getComputedStyle(page).getPropertyValue('--sl-key').trim() || '#333'; }
  function bgOf(el) { while (el && el.nodeType === 1) { var c = getComputedStyle(el).backgroundColor; if (c && !/rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(c)) return c; el = el.parentNode; } return 'rgb(255,255,255)'; }
  function lum(c) { var m = String(c).match(/\d+(\.\d+)?/g) || [255, 255, 255]; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; }
  function svgEl(w, h, inner) { return '<svg viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" width="100%" height="100%">' + inner + '</svg>'; }

  /* ───── 드러내는 방식 (첫 화면 열기) — 1~3초 뒤 연출 층은 사라지고 원래 화면만 남음 ───── */
  var REVEAL = {
    mirror: function (h, o) { var l = layer(h, '<div class="sc-cover" style="clip-path:ellipse(0% 0% at 50% 50%);background:none"></div>'), ph = h.querySelector('.sl-hero-photo'); if (ph) { ph.style.clipPath = o.mv === 1 ? 'inset(35% 30% round 999px)' : o.mv === 2 ? 'inset(30% 38% round 40% 40% 10% 10%)' : 'ellipse(16% 24% at 50% 50%)'; ph.style.transition = 'clip-path ' + 1.6 * o.r + 's ' + EASE; later(function () { ph.style.clipPath = 'inset(0 0 0 0 round 0)'; }, 80); } done(l, 100); },
    brush: function (h, o, k) { var l = layer(h, svgEl(100, 100, '<path d="M-5 ' + (40 + o.mv * 10) + ' C 30 20, 60 70, 105 40" stroke="' + k + '" stroke-width="70" fill="none" stroke-linecap="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:0;transition:stroke-dashoffset ' + 1.3 * o.r + 's ' + EASE + ' .2s"/>')); later(function () { var p = l.querySelector('path'); p.style.strokeDashoffset = o.mv === 1 ? '-1' : '1'; }, 60); done(l, 2000 * o.r); },
    dew: function (h, o) { h.style.filter = 'blur(14px) saturate(.7)'; h.style.transition = 'filter ' + 1.6 * o.r + 's ease'; later(function () { h.style.filter = ''; }, 100); later(function () { h.style.transition = ''; }, 1800 * o.r); },
    blueprint: function (h, o, k) { var lines = ''; for (var i = 0; i < 8; i++) lines += '<line x1="' + (i * 14) + '" y1="0" x2="' + (i * 14) + '" y2="100" pathLength="1"/><line x1="0" y1="' + (i * 14) + '" x2="100" y2="' + (i * 14) + '" pathLength="1"/>';
      var l = layer(h, '<div class="sc-cover" style="background:#0F2A4A;transition:opacity 1s ease ' + 1.2 * o.r + 's"></div>' + svgEl(100, 100, '<g stroke="#9cc3ff" stroke-width=".25" fill="none" style="stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset ' + 1.2 * o.r + 's ease">' + lines + '</g>'));
      l.style.zIndex = 5; later(function () { l.querySelector('g').style.strokeDashoffset = 0; l.querySelector('.sc-cover').style.opacity = 0; }, 60); later(function () { l.style.transition = 'opacity .6s'; l.style.opacity = 0; }, 2000 * o.r); done(l, 2800 * o.r); },
    wipe: function (h, o) { var l = layer(h, '<div class="sc-cover" style="background:rgba(255,255,255,.55);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px);transition:clip-path ' + 1.4 * o.r + 's ' + EASE + ';clip-path:inset(0 0 0 0)"></div>'); later(function () { l.firstChild.style.clipPath = o.mv === 1 ? 'inset(0 0 100% 0)' : 'inset(0 0 0 100%)'; }, 120); done(l, 1800 * o.r); },
    steam: function (h, o) { var t = h.querySelector('.sl-hero-title'); if (t) { t.style.filter = 'blur(12px)'; t.style.opacity = '0'; t.style.transform = 'translateY(24px)'; t.style.transition = 'filter 1.6s ease .3s,opacity 1.6s ease .3s,transform 1.6s ' + EASE + ' .3s'; later(function () { t.style.filter = ''; t.style.opacity = ''; t.style.transform = ''; }, 60); } },
    proof: function (h, o) { var t = h.querySelector('.sl-hero-title'); if (t) { t.style.clipPath = 'inset(100% 0 0 0)'; t.style.transform = 'scale(.96)'; t.style.transition = 'clip-path ' + 1.6 * o.r + 's ' + EASE + ',transform ' + 1.8 * o.r + 's cubic-bezier(.34,1.56,.64,1)'; later(function () { t.style.clipPath = 'inset(0 0 0 0)'; t.style.transform = ''; }, 60); } },
    sizzle: function (h, o) { var im = h.querySelector('.sl-hero-photo img'); if (im) { im.style.transform = 'scale(1.18)'; im.style.filter = 'brightness(1.4) saturate(1.3)'; im.style.transition = 'transform ' + 2.2 * o.r + 's ' + EASE + ',filter 1.4s ease'; later(function () { im.style.transform = ''; im.style.filter = ''; }, 60); } },
    bands: function (h, o, k) { var n = 5, html = ''; for (var i = 0; i < n; i++) html += '<div style="position:absolute;left:0;right:0;top:' + (i * 20) + '%;height:20.5%;background:' + k + ';transform-origin:' + (i % 2 ? 'right' : 'left') + ';transition:transform ' + .8 * o.r + 's ' + EASE + ' ' + (i * .09 * o.r) + 's"></div>'; var l = layer(h, html); later(function () { [].forEach.call(l.children, function (b) { b.style.transform = 'scaleX(0)'; }); }, 60); done(l, 1800 * o.r); },
    ink: function (h, o) { var l = layer(h, '<div class="sc-cover" style="background:#f4efe6;transition:clip-path ' + 1.8 * o.r + 's ' + EASE + ';clip-path:circle(150% at 50% 50%)"></div><div style="position:absolute;left:50%;top:50%;width:84px;height:84px;margin:-42px 0 0 -42px;border:4px solid #b42318;color:#b42318;border-radius:' + (o.mv === 1 ? '50%' : '8px') + ';display:grid;place-items:center;font:900 26px/1 serif;transform:scale(2.4) rotate(-12deg);opacity:0;transition:transform .45s cubic-bezier(.34,1.56,.64,1) .25s,opacity .3s ease .25s">' + (o.name || '').slice(0, 2) + '</div>'); later(function () { var s = l.children[1]; s.style.transform = 'scale(1) rotate(-12deg)'; s.style.opacity = 1; }, 60); later(function () { l.firstChild.style.clipPath = 'circle(0% at 50% 50%)'; l.children[1].style.opacity = 0; }, 900 * o.r); done(l, 2900 * o.r); },
    chalk: function (h, o) { var t = h.querySelector('.sl-hero-title'); if (t) { t.style.webkitTextStroke = '1px currentColor'; t.style.color = 'transparent'; t.style.transition = 'color 1.2s ease ' + .9 * o.r + 's'; later(function () { t.style.color = ''; }, 60); later(function () { t.style.webkitTextStroke = ''; }, 2200 * o.r); } },
    pulse: function (h, o, k) { var l = layer(h, svgEl(200, 100, '<polyline points="0,50 60,50 75,20 90,80 105,35 115,50 200,50" fill="none" stroke="' + k + '" stroke-width="1.6" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset ' + 1.3 * o.r + 's ease"/>')); l.style.opacity = .85; later(function () { l.querySelector('polyline').style.strokeDashoffset = 0; }, 60); later(function () { l.style.transition = 'opacity .8s'; l.style.opacity = 0; }, 1500 * o.r); done(l, 2400 * o.r); },
    mapfly: function (h, o, k) { var im = h.querySelector('.sl-hero-photo img'); if (im) { im.style.transform = 'scale(2.2) translate(' + (o.mv - 1) * 6 + '%,4%)'; im.style.transition = 'transform ' + 2 * o.r + 's ' + EASE; later(function () { im.style.transform = ''; }, 60); } var l = layer(h, '<div style="position:absolute;left:50%;top:-60px;width:28px;height:40px;margin-left:-14px;background:' + k + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);transition:top .8s cubic-bezier(.34,1.56,.64,1) ' + 1.2 * o.r + 's,opacity .5s ease 2.6s"></div>'); later(function () { l.firstChild.style.top = '42%'; l.firstChild.style.opacity = 0; }, 60); done(l, 3300 * o.r); },
    daynight: function (h, o) { var l = layer(h, '<div class="sc-cover" style="background:linear-gradient(180deg,#fdf1c7,#ffd9a0);opacity:.85;transition:background 2s ease,opacity 1.2s ease ' + 1.8 * o.r + 's"></div>'); later(function () { l.firstChild.style.background = 'linear-gradient(180deg,#0b1430,#2b2f5e)'; }, 300); later(function () { l.firstChild.style.opacity = 0; }, 80); done(l, 3200 * o.r); },
    stitch: function (h, o, k) { var l = layer(h, svgEl(100, 100, '<rect x="4" y="6" width="92" height="88" rx="3" fill="none" stroke="' + k + '" stroke-width=".7" stroke-dasharray="2 1.5" pathLength="100" style="stroke-dashoffset:100;transition:stroke-dashoffset ' + 1.8 * o.r + 's linear"/>')); later(function () { l.querySelector('rect').style.strokeDashoffset = 0; }, 60); later(function () { l.style.transition = 'opacity .8s'; l.style.opacity = 0; }, 2200 * o.r); done(l, 3100 * o.r); },
    torque: function (h, o, k) { var g = '<g style="transform-origin:50px 50px;transition:transform ' + 1.4 * o.r + 's ' + EASE + '"><circle cx="50" cy="50" r="22" fill="none" stroke="' + k + '" stroke-width="7" stroke-dasharray="6 4"/><circle cx="50" cy="50" r="8" fill="' + k + '"/></g>'; var l = layer(h, '<div class="sc-cover" style="transition:clip-path 1s ' + EASE + ' ' + 1.1 * o.r + 's;clip-path:circle(150% at 50% 50%)"></div>' + '<div style="position:absolute;inset:0">' + svgEl(100, 100, g) + '</div>'); later(function () { l.querySelector('g').style.transform = 'rotate(' + (o.mv === 1 ? -270 : 270) + 'deg)'; l.firstChild.style.clipPath = 'circle(0% at 50% 50%)'; l.children[1].style.transition = 'opacity .6s ease 1.2s'; l.children[1].style.opacity = 0; }, 60); done(l, 2600 * o.r); },
    smile: function (h, o, k) { var l = layer(h, svgEl(100, 100, '<path d="M20 55 Q50 ' + (78 + o.mv * 4) + ' 80 55" fill="none" stroke="' + k + '" stroke-width="1.2" stroke-linecap="round" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset ' + 1.2 * o.r + 's ' + EASE + '"/>')); later(function () { l.querySelector('path').style.strokeDashoffset = 0; }, 60); later(function () { l.style.transition = 'opacity .8s'; l.style.opacity = 0; }, 1600 * o.r); done(l, 2500 * o.r); },
    scroll: function (h, o) { h.style.clipPath = 'inset(0 50% 0 50%)'; h.style.transition = 'clip-path ' + 1.6 * o.r + 's ' + EASE; later(function () { h.style.clipPath = 'inset(0 0 0 0)'; }, 60); later(function () { h.style.clipPath = ''; h.style.transition = ''; }, 1800 * o.r); },
    ripple: function (h, o, k) { var l = layer(h, '<div style="position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid ' + k + ';transform:scale(1);opacity:.9;transition:transform ' + 1.6 * o.r + 's ' + EASE + ',opacity 1.6s ease"></div><div style="position:absolute;left:50%;top:50%;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:2px solid ' + k + ';transform:scale(1);opacity:.7;transition:transform ' + 1.9 * o.r + 's ' + EASE + ' .2s,opacity 1.9s ease .2s"></div>'); later(function () { [].forEach.call(l.children, function (c) { c.style.transform = 'scale(80)'; c.style.opacity = 0; }); }, 60); done(l, 2400 * o.r); },
    spotlight: function (h, o) { var l = layer(h, '<div class="sc-cover" style="background:radial-gradient(circle at 50% 45%,transparent 0,rgba(0,0,0,.85) 8%);transition:background-size ' + 1.6 * o.r + 's ease;background-size:100% 100%"></div>'); later(function () { l.firstChild.style.transition = 'opacity 1.4s ease .6s'; l.firstChild.style.opacity = 0; }, 80); done(l, 2400 * o.r); },
    curtain: function (h, o, k) { var l = layer(h, '<div style="position:absolute;top:0;bottom:0;left:0;width:50.5%;background:' + k + ';transition:transform ' + 1.3 * o.r + 's ' + EASE + '"></div><div style="position:absolute;top:0;bottom:0;right:0;width:50.5%;background:' + k + ';transition:transform ' + 1.3 * o.r + 's ' + EASE + '"></div>'); later(function () { l.children[0].style.transform = 'translateX(-101%)'; l.children[1].style.transform = 'translateX(101%)'; }, 120); done(l, 1700 * o.r); },
    iris: function (h, o) { h.style.clipPath = 'circle(0% at 50% ' + (40 + o.mv * 10) + '%)'; h.style.transition = 'clip-path ' + 1.5 * o.r + 's ' + EASE; later(function () { h.style.clipPath = 'circle(150% at 50% 50%)'; }, 60); later(function () { h.style.clipPath = ''; h.style.transition = ''; }, 1700 * o.r); },
    typewriter: function (h, o) { var t = h.querySelector('.sl-hero-title'); if (!t || t.children.length) { REVEAL.stamp(h, o); return; } var txt = t.textContent; t.setAttribute('aria-label', txt); var i = 0; t.textContent = ''; var iv = setInterval(function () { t.textContent = txt.slice(0, ++i); if (i >= txt.length) clearInterval(iv); }, Math.max(40, 700 * o.r / Math.max(1, txt.length))); },
    stamp: function (h, o) { var t = h.querySelector('.sl-hero-title'); if (t) { t.style.transform = 'scale(1.6)'; t.style.opacity = 0; t.style.transition = 'transform .5s cubic-bezier(.34,1.56,.64,1) .2s,opacity .3s ease .2s'; later(function () { t.style.transform = ''; t.style.opacity = ''; }, 60); } },
    split: function (h, o, k) { var l = layer(h, '<div style="position:absolute;left:0;right:0;top:0;height:50.5%;background:' + k + ';transition:transform ' + 1.2 * o.r + 's ' + EASE + '"></div><div style="position:absolute;left:0;right:0;bottom:0;height:50.5%;background:' + k + ';transition:transform ' + 1.2 * o.r + 's ' + EASE + '"></div>'); later(function () { l.children[0].style.transform = 'translateY(-101%)'; l.children[1].style.transform = 'translateY(101%)'; }, 120); done(l, 1600 * o.r); },
    sunrise: function (h, o) { var l = layer(h, '<div class="sc-cover" style="background:linear-gradient(0deg,#ffb347,transparent 70%);transform:translateY(60%);opacity:.9;transition:transform ' + 1.8 * o.r + 's ' + EASE + ',opacity 1.2s ease ' + 1.4 * o.r + 's"></div>'); later(function () { l.firstChild.style.transform = 'translateY(0)'; l.firstChild.style.opacity = 0; }, 60); done(l, 3000 * o.r); }
  };

  /* ───── 모티프: 첫 화면 배경에 은은하게 흐르는 업종 소재 (캔버스 하나, 화면 밖이면 멈춤) ───── */
  var MOTIF = {
    steam:      { n: 14, draw: 'wisp', up: 1, col: 'rgba(255,255,255,.35)' },
    cream:      { n: 10, draw: 'wave', col: 'rgba(255,248,235,.35)' },
    ember:      { n: 26, draw: 'dot', up: 1, col: 'rgba(255,140,60,.75)', r: [1, 2.6] },
    flour:      { n: 40, draw: 'dot', down: 1, col: 'rgba(255,255,255,.7)', r: [.6, 1.8] },
    rays:       { n: 7, draw: 'ray', col: 'rgba(255,230,170,.18)' },
    dots:       { n: 30, draw: 'dot', drift: 1, col: 'key', r: [1.5, 3], a: .35 },
    lines:      { n: 10, draw: 'line', col: 'key', a: .35 },
    sparkle:    { n: 22, draw: 'star', twinkle: 1, col: 'rgba(255,255,255,.9)' },
    bubbles:    { n: 18, draw: 'ring', up: 1, col: 'rgba(255,255,255,.55)', r: [3, 10] },
    stars:      { n: 40, draw: 'dot', twinkle: 1, col: 'rgba(255,255,255,.9)', r: [.5, 1.6] },
    glint:      { n: 6, draw: 'glint', col: 'rgba(255,255,255,.5)' },
    waves:      { n: 5, draw: 'wave', col: 'key', a: .25 },
    chips:      { n: 14, draw: 'chip', drift: 1, col: 'palette' },
    confetti:   { n: 26, draw: 'chip', down: 1, col: 'palette' },
    drops:      { n: 16, draw: 'drop', down: 1, col: 'rgba(200,235,255,.6)' },
    aurora:     { n: 3, draw: 'blob', col: 'palette', a: .28 },
    pulseline:  { n: 3, draw: 'pulse', col: 'key', a: .45 },
    smilecurve: { n: 4, draw: 'curve', col: 'key', a: .3 },
    leaves:     { n: 14, draw: 'leaf', down: 1, col: 'rgba(120,160,90,.7)' },
    hanji:      { n: 60, draw: 'fiber', still: 1, col: 'rgba(120,90,60,.12)' },
    grid:       { n: 1, draw: 'grid', col: 'key', a: .12 },
    chalkdust:  { n: 28, draw: 'dot', down: 1, col: 'rgba(255,255,255,.45)', r: [.6, 1.4] },
    mapdots:    { n: 24, draw: 'pin', twinkle: 1, col: 'key' },
    gears:      { n: 3, draw: 'gear', col: 'key', a: .22 },
    stitches:   { n: 6, draw: 'stitch', col: 'key', a: .35 },
    petals:     { n: 16, draw: 'leaf', down: 1, col: 'rgba(255,190,205,.8)' }
  };
  function motif(hero, page, m, o) {
    var M = MOTIF[m]; if (!M) return;
    var cv = D.createElement('canvas'); cv.className = 'sc-motif'; cv.setAttribute('aria-hidden', 'true'); hero.insertBefore(cv, hero.firstChild);
    var ctx = cv.getContext('2d'), dpr = Math.min(2, W.devicePixelRatio || 1), R = rnd(o.seed + o.mv * 97), k = key(page);
    var pal = [k, getComputedStyle(page).getPropertyValue('--sl-key2').trim() || '#ffd166', getComputedStyle(page).getPropertyValue('--sl-tint').trim() || '#9ad1ff'];
    var w = 0, h = 0, P = [], n = Math.round(M.n * (W.innerWidth < 700 ? 0.6 : 1) * (o.mv === 2 ? 1.3 : o.mv === 1 ? 0.8 : 1)), dir = R() < .5 ? -1 : 1, t0 = performance.now(), vis = true;
    function size() { var r = hero.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); W.addEventListener('resize', size);
    /* 밝은 첫 화면(사진 없는 간판·반반 등)에서는 흰 소재가 안 보이므로 대표색으로 바꿈 */
    var light = !hero.querySelector('.sl-hero-over, .sl-hero-photo img[src]') || /sl-hero-(sign|split|frame|board|menu|profile|card|port)/.test(hero.className) ? lum(bgOf(hero)) > .6 : false;
    var white = function (c) { return light && /^rgba\(255,\s*2[0-9]{2},\s*2[0-9]{2}/.test(c) ? k : c; };
    if (light && !M.a) M = Object.assign({}, M, { a: .25 });
    for (var i = 0; i < n; i++) P.push({ x: R() * w, y: R() * h, s: (M.r ? M.r[0] + R() * (M.r[1] - M.r[0]) : 1), v: .2 + R() * .6, a: R() * 6.28, c: M.col === 'palette' ? pal[i % 3] : M.col === 'key' ? k : white(M.col) });
    if ('IntersectionObserver' in W) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) frame(); }).observe(hero);
    function frame() {
      if (!vis) return;
      var t = (performance.now() - t0) / 1000; ctx.clearRect(0, 0, w, h); ctx.globalAlpha = M.a || 1;
      P.forEach(function (p, i) {
        if (!M.still) { if (M.up) p.y -= p.v * 0.6; if (M.down) p.y += p.v * 0.7; if (M.drift || M.up || M.down) p.x += Math.sin(t * .6 + p.a) * .25 * dir; if (p.y < -20) p.y = h + 20; if (p.y > h + 20) p.y = -20; if (p.x < -20) p.x = w + 20; if (p.x > w + 20) p.x = -20; }
        ctx.fillStyle = ctx.strokeStyle = p.c; var tw = M.twinkle ? .4 + .6 * Math.abs(Math.sin(t * 1.5 + p.a)) : 1; ctx.globalAlpha = (M.a || 1) * tw;
        switch (M.draw) {
          case 'dot': ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fill(); break;
          case 'ring': ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.stroke(); break;
          case 'star': ctx.beginPath(); ctx.moveTo(p.x - 3, p.y); ctx.lineTo(p.x + 3, p.y); ctx.moveTo(p.x, p.y - 3); ctx.lineTo(p.x, p.y + 3); ctx.lineWidth = 1; ctx.stroke(); break;
          case 'wisp': ctx.lineWidth = 2; ctx.beginPath(); for (var j = 0; j < 40; j++) { var yy = p.y - j * 3; ctx.lineTo(p.x + Math.sin(yy * .05 + t + p.a) * 8, yy); } ctx.stroke(); break;
          case 'wave': ctx.lineWidth = 1.5; ctx.beginPath(); var yb = h * (i + 1) / (n + 1); for (var x = 0; x <= w; x += 12) ctx.lineTo(x, yb + Math.sin(x * .012 + t * p.v * dir + p.a) * 12); ctx.stroke(); break;
          case 'line': ctx.lineWidth = 1; ctx.beginPath(); var lx = ((p.x + t * 40 * p.v * dir) % (w + 200) + w + 200) % (w + 200) - 100; ctx.moveTo(lx, p.y); ctx.lineTo(lx + 80, p.y); ctx.stroke(); break;
          case 'ray': ctx.save(); ctx.translate(w * .8, -h * .1); ctx.rotate(.6 + i * .12 + Math.sin(t * .2) * .05); ctx.fillRect(0, -6, h * 2, 12 + i * 3); ctx.restore(); break;
          case 'glint': var gx = ((t * 120 * p.v + p.x) % (w + 400)) - 200; ctx.save(); ctx.translate(gx, 0); ctx.rotate(.4); ctx.fillRect(0, -h, 18, h * 3); ctx.restore(); break;
          case 'chip': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a += .01); ctx.fillRect(-4, -6, 8, 12); ctx.restore(); break;
          case 'drop': ctx.beginPath(); ctx.ellipse(p.x, p.y, 1.6, 5, 0, 0, 6.28); ctx.fill(); break;
          case 'blob': var bx = w * (.2 + .3 * i) + Math.sin(t * .15 + i) * w * .1, by = h * (.4 + .2 * Math.cos(t * .12 + i)); var gr = ctx.createRadialGradient(bx, by, 0, bx, by, w * .4); gr.addColorStop(0, p.c); gr.addColorStop(1, 'transparent'); ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h); break;
          case 'pulse': ctx.lineWidth = 1.5; ctx.beginPath(); var py = h * (i + 1) / 4, off = (t * 160 * (i + 1)) % (w + 300) - 150; for (var x2 = 0; x2 <= w; x2 += 8) { var d = x2 - off; ctx.lineTo(x2, py + (Math.abs(d) < 30 ? Math.sin(d * .3) * 18 : 0)); } ctx.stroke(); break;
          case 'curve': ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, h * (.3 + i * .15)); ctx.quadraticCurveTo(w / 2, h * (.55 + i * .15) + Math.sin(t * .5 + i) * 12, w, h * (.3 + i * .15)); ctx.stroke(); break;
          case 'leaf': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a += .015); ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, 6.28); ctx.fill(); ctx.restore(); break;
          case 'fiber': ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(p.x + 10, p.y + 6, p.x + 22, p.y + 2); ctx.stroke(); break;
          case 'grid': ctx.lineWidth = 1; for (var gxx = (t * 8) % 40; gxx < w; gxx += 40) { ctx.beginPath(); ctx.moveTo(gxx, 0); ctx.lineTo(gxx, h); ctx.stroke(); } for (var gy = 0; gy < h; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); } break;
          case 'pin': ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 + 8 * ((t + p.a) % 1.5), 0, 6.28); ctx.globalAlpha *= .3; ctx.stroke(); break;
          case 'gear': ctx.save(); ctx.translate(w * (.2 + i * .3), h * (.3 + (i % 2) * .4)); ctx.rotate(t * .3 * (i % 2 ? -1 : 1)); ctx.lineWidth = 8; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.arc(0, 0, 40 + i * 14, 0, 6.28); ctx.stroke(); ctx.restore(); break;
          case 'stitch': ctx.lineWidth = 1.5; ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.moveTo(0, h * (i + 1) / (n + 1)); ctx.lineTo(w, h * (i + 1) / (n + 1) + 20); ctx.stroke(); ctx.setLineDash([]); break;
        }
      });
      if (!M.still) requestAnimationFrame(frame);
    }
    frame();
  }

  /* ───── 목록 움직임: 홈의 서비스·메뉴 목록 ───── */
  function listMotion(page, l, o) {
    var sec = page.querySelector('.sl-sec-services') || page.querySelector('.sl-sec-about'); if (!sec) return;
    var items = [].slice.call(sec.querySelectorAll('.sl-body > ul > li, .sl-menu-list > li, .sl-points > li')); if (!items.length) return;
    if (l === 'marquee') {
      var ul = items[0].parentNode; if (items.length < 3) { l = 'slide'; } else {
        var wrap = D.createElement('div'); wrap.className = 'sc-mq'; var tr = D.createElement('div'); tr.className = 'sc-track';
        ul.parentNode.insertBefore(wrap, ul); wrap.appendChild(tr); ul.style.display = 'contents'; tr.appendChild(ul);
        var cl = ul.cloneNode(true); cl.setAttribute('aria-hidden', 'true'); [].forEach.call(cl.querySelectorAll('a,button,input,[tabindex]'), function (x) { x.setAttribute('tabindex', '-1'); }); [].forEach.call(cl.querySelectorAll('[id]'), function (x) { x.removeAttribute('id'); }); tr.appendChild(cl); return;
      }
    }
    sec.classList.add('sc-l-' + l);
    if (l === 'unroll') { var body = sec.querySelector('.sl-body'); if (body) body.classList.add('sc-body-wrap'); }
    items.forEach(function (it, i) { it.classList.add('sc-it'); it.style.setProperty('--i', i); it.style.setProperty('--n', items.length); it.style.setProperty('--dir', o.mv === 1 ? -1 : 1); if (l === 'arc') it.style.setProperty('--arc', (Math.abs(i - (items.length - 1) / 2) * 10) + 'px'); });
    var go = function () { sec.classList.add('sc-in'); };
    if ('IntersectionObserver' in W) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { go(); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' }); io.observe(sec); } else go();
    setTimeout(go, 6000);                                   // 안전: 6초 뒤에는 무조건 보이게
  }

  function find(id) { var m = String(id || '').match(/^([a-z]+)-(\d)$/); if (!m) return null; var list = m[1] === 'brand' ? GENERIC : S[m[1]]; return list ? list[Number(m[2]) - 1] || null : null; }
  function init(scope, opt) {
    if (reduce) return;
    var again = opt && opt.again;                           // 편집기 미리보기 다시 그리기: 열기 연출은 건너뛰고 배경·목록만
    scope = scope || D;
    var pages = scope.classList && scope.classList.contains('sl-page') ? [scope] : [].slice.call(scope.querySelectorAll('.sl-page[data-fx-scene]'));
    pages.forEach(function (page) {
      if (page.getAttribute('data-sc-on')) return;
      var sc = find(page.getAttribute('data-fx-scene')), hero = page.querySelector('.sl-sec-hero'); if (!sc || !hero) return;
      page.setAttribute('data-sc-on', '1'); css();
      var v = Math.max(0, Math.min(35, Number(page.getAttribute('data-fx-sv')) || 0));
      var o = { comp: v % 4, r: [0.8, 1, 1.3][Math.floor(v / 4) % 3], mv: Math.floor(v / 12) % 3, seed: Number(page.getAttribute('data-fx-seed') || 7), name: page.getAttribute('data-fx-name') || '' };
      var heroBox = hero.querySelector('.sl-hero') || hero;
      heroBox.classList.add('sc-hero', 'sc-c' + o.comp);
      try { motif(heroBox, page, sc[2], o); } catch (e) {}
      if (!again) try { REVEAL[sc[1]](heroBox, o, key(page)); } catch (e) {}
      try { listMotion(page, sc[3], o); } catch (e) {}
    });
  }
  W.SLSCENE = { ver: '4.0.0', init: init, scenes: S, generic: GENERIC, reveals: Object.keys(REVEAL), motifs: Object.keys(MOTIF) };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { init(D); }); else init(D);
})();
