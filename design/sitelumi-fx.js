/*!
 * 사이트루미 효과 라이브러리 v4.0 — 첫 화면 · 섹션(스크롤·마우스) · 푸터 · 전체
 * 원칙: 실제 글자는 그대로(검색·화면낭독·복사 가능) · transform/opacity 위주 · 움직임 줄이기 설정이면 전부 끔
 *       스크립트가 실패해도 내용은 다 보임 · 화면 밖이면 멈춤 · 어떤 효과를 쓸지는 페이지의 data-fx-* 가 정함(등급은 엔진이 판단)
 * 사용: SLFX.init(문서 또는 요소) — 홈 화면을 다시 그린 뒤에도 다시 불러도 됨(같은 요소는 한 번만)
 */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.SLFX && W.SLFX.ver) return;
  var reduce = W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = W.matchMedia && W.matchMedia('(hover: none)').matches;
  var EASE = 'cubic-bezier(.22,1,.36,1)';

  /* ───── 공용 ───── */
  function css() {
    if (D.getElementById('slfx-css')) return;
    var s = D.createElement('style'); s.id = 'slfx-css';
    s.textContent = [
      /* 첫 화면 */
      '.fx-w{display:inline-block;overflow:hidden;vertical-align:bottom;padding-bottom:.06em;margin-bottom:-.06em}.fx-w>span{display:inline-block;transform:translateY(105%);transition:transform var(--fx-d,.9s) ' + EASE + ' var(--fx-dl,0s)}.fx-go .fx-w>span{transform:none}',
      '.fx-slices{position:absolute;inset:0;z-index:30;display:flex;pointer-events:none}.fx-slices i{flex:1;background:var(--sl-key,#111);transform-origin:top;transition:transform calc(var(--fx-d,.9s)*.9) ' + EASE + ' var(--fx-dl,0s)}.fx-slices i:nth-child(even){transform-origin:bottom}.fx-go .fx-slices i{transform:scaleY(0)}',
      '.fx-morph .sl-hero-photo{transition:clip-path calc(var(--fx-d,.9s)*1.6) ' + EASE + ' .15s}',
      '.fx-tm{position:absolute;inset:0;z-index:25;display:flex;align-items:center;justify-content:center;background:var(--sl-bg,#fff);pointer-events:none;transition:opacity .7s ease 1.3s}.fx-tm b{font:900 clamp(64px,22vw,320px)/.9 var(--sl-head-font,sans-serif);letter-spacing:-.04em;background-size:cover;background-position:center;-webkit-background-clip:text;background-clip:text;color:transparent;transform:scale(1);transition:transform 1.6s ' + EASE + ' .2s;text-align:center;padding:0 4vw}.fx-go .fx-tm{opacity:0}.fx-go .fx-tm b{transform:scale(1.6)}',
      '.fx-aurora{position:absolute;inset:-10%;z-index:0;pointer-events:none;filter:blur(60px);opacity:.55}.fx-aurora i{position:absolute;width:55%;height:55%;border-radius:50%;animation:fxAur 18s ease-in-out infinite alternate}.fx-aurora i:nth-child(1){left:-5%;top:0;background:var(--sl-key)}.fx-aurora i:nth-child(2){right:-5%;top:20%;background:var(--sl-key2,var(--sl-key));animation-duration:22s}.fx-aurora i:nth-child(3){left:25%;bottom:-10%;background:var(--sl-tint,var(--sl-key));animation-duration:26s}@keyframes fxAur{to{transform:translate(12%,-8%) scale(1.25)}}.sl-hero.fx-aur-on{position:relative;isolation:isolate}.sl-hero.fx-aur-on>*:not(.fx-aurora){position:relative;z-index:1}',
      /* 섹션 */
      '.fx-hl{background-image:linear-gradient(transparent 58%,color-mix(in srgb,var(--sl-key) 28%,transparent) 58%);background-repeat:no-repeat;background-size:0% 100%;transition:background-size 1.1s ' + EASE + '}.fx-hl.fx-in{background-size:100% 100%}',
      '[data-fx-scroll=drawline] .sl-steps{position:relative}[data-fx-scroll=drawline] .sl-steps::after{content:"";position:absolute;left:var(--fx-line-x,18px);top:0;width:2px;height:100%;background:var(--sl-key);transform:scaleY(var(--fx-p,0));transform-origin:top}',
      '.fx-mq{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}.fx-mq-track{display:flex;gap:16px;width:max-content;animation:fxMq var(--fx-mq,40s) linear infinite}.fx-mq:hover .fx-mq-track,.fx-mq.fx-hold .fx-mq-track{animation-play-state:paused}.fx-mq-track>*{flex:0 0 min(360px,80vw);margin:0!important}@keyframes fxMq{to{transform:translateX(-50%)}}',
      '.fx-hp{position:relative}.fx-hp-stick{position:sticky;top:0;height:100vh;display:flex;flex-direction:column;justify-content:center;overflow:hidden}.fx-hp-track{display:flex!important;gap:20px;width:max-content;will-change:transform}.fx-hp-track>li{flex:0 0 min(440px,72vw)}',
      '.fx-tilt{transform-style:preserve-3d;transition:transform .35s ' + EASE + ';position:relative}.fx-tilt::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(255,255,255,.35),transparent 55%);opacity:0;transition:opacity .3s}.fx-tilt:hover::after{opacity:1}',
      '.fx-spot{position:relative;isolation:isolate}.fx-spot::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:radial-gradient(260px circle at var(--mx,-100px) var(--my,-100px),var(--sl-key),transparent 60%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;z-index:2}',
      '[data-fx-hover=glass] .sl-body li,[data-fx-hover=glass] .sl-points>li{background:color-mix(in srgb,var(--sl-bg,#fff) 55%,transparent)!important;-webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);border:1px solid color-mix(in srgb,#fff 50%,transparent)}[data-fx-hover=glass]{background-image:radial-gradient(40% 60% at 15% 20%,color-mix(in srgb,var(--sl-key) 30%,transparent),transparent),radial-gradient(40% 60% at 85% 80%,color-mix(in srgb,var(--sl-key2,var(--sl-key)) 30%,transparent),transparent)}',
      '.fx-lb{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(10,12,16,.86);cursor:zoom-out;padding:4vw}.fx-lb img{max-width:100%;max-height:100%;border-radius:8px;box-shadow:0 20px 80px rgba(0,0,0,.5)}',
      /* 푸터 */
      '.fx-uncover .sl-sitefoot{position:sticky;bottom:0;z-index:0}.fx-uncover>.sl-sec,.fx-uncover>.sl-pagesum,.fx-uncover>.sl-pagenav,.fx-uncover>.sl-legal-band{position:relative;z-index:1}.fx-uncover>.sl-sec:not([class*="sl-bg-"]),.fx-uncover>.sl-pagesum,.fx-uncover>.sl-pagenav{background-color:var(--fx-cs,var(--sl-bg,#fff))}',
      '.fx-cs-on>.sl-sec:not([class*="sl-bg-"]):not(.sl-media-bg){background-color:var(--fx-cs);transition:background-color .8s ease}',
      '.fx-big{display:block;overflow:hidden;margin-top:28px;font:900 clamp(56px,17vw,260px)/.85 var(--sl-head-font,sans-serif);letter-spacing:-.05em;white-space:nowrap;color:currentColor;opacity:.92;transform:scale(var(--fx-bs,.75));transform-origin:left bottom;transition:transform .2s linear}',
      '.fx-glow .sl-sitefoot a{transition:text-shadow .3s,color .3s}.fx-glow .sl-sitefoot a:hover,.fx-glow .sl-sitefoot a:focus-visible{color:var(--sl-key);text-shadow:0 0 12px color-mix(in srgb,var(--sl-key) 70%,transparent)}',
      '.fx-top{display:inline-flex;align-items:center;gap:8px;margin-top:18px;padding:10px 16px;border:1px solid currentColor;border-radius:999px;background:none;color:inherit;font:inherit;font-size:14px;cursor:pointer;opacity:.85}.fx-top svg path{stroke-dasharray:40;stroke-dashoffset:0;transition:stroke-dashoffset .5s ease}.fx-top.fx-fly svg{animation:fxFly .7s ' + EASE + ' forwards}@keyframes fxFly{to{transform:translateY(-40px);opacity:0}}',
      '.fx-mm{overflow:hidden;margin-top:24px}.fx-mm-track{display:flex;width:max-content;animation:fxMq 26s linear infinite}.fx-mm-track span{font:900 clamp(48px,12vw,180px)/1 var(--sl-head-font,sans-serif);letter-spacing:-.04em;padding-right:.6em;transition:transform .25s ' + EASE + ';display:inline-block}',
      /* 전체 */
      '.fx-prog{position:fixed;left:0;top:0;right:0;height:3px;z-index:9500;background:var(--sl-key,#111);transform-origin:left;transform:scaleX(0);pointer-events:none}',
      '.fx-grain{position:fixed;inset:-50%;z-index:9400;pointer-events:none;opacity:.06;background-image:url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E");animation:fxGrain 1.2s steps(4) infinite}@keyframes fxGrain{50%{transform:translate(-3%,2%)}}',
      '.fx-amb{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(600px circle at var(--ax,50%) var(--ay,30%),color-mix(in srgb,var(--sl-key) 10%,transparent),transparent 70%);transition:background-position .2s}',
      '.fx-cur{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:#fff;mix-blend-mode:difference;z-index:9600;pointer-events:none;transition:width .25s,height .25s,margin .25s;will-change:transform}.fx-cur.is-big{width:88px;height:88px;margin:-44px 0 0 -44px}',
      '.fx-mag{transition:transform .35s ' + EASE + '}',
      '.fx-ripple{position:relative;overflow:hidden}.fx-ripple::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 0 color-mix(in srgb,var(--sl-key) 55%,transparent);animation:fxRip 2.4s ease-out infinite;pointer-events:none}@keyframes fxRip{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--sl-key) 45%,transparent)}70%,100%{box-shadow:0 0 0 14px transparent}}',
      '.fx-season{position:fixed;inset:0;z-index:9300;pointer-events:none}'
    ].join('\n');
    D.head.appendChild(s);
  }
  function once(el, k) { if (!el || el.getAttribute('data-fx-' + k + '-on')) return false; el.setAttribute('data-fx-' + k + '-on', '1'); return true; }
  function inView(el, cb, opt) {
    if (!('IntersectionObserver' in W)) { cb(el); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cb(e.target); if (!(opt && opt.keep)) io.unobserve(e.target); } }); }, { rootMargin: (opt && opt.margin) || '0px 0px -12% 0px' });
    io.observe(el);
  }
  var scrollFns = [];
  function onScroll(fn) { scrollFns.push(fn); fn(); }
  var ticking = false;
  W.addEventListener('scroll', function () { if (ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; scrollFns.forEach(function (f) { try { f(); } catch (e) {} }); }); }, { passive: true });
  W.addEventListener('resize', function () { scrollFns.forEach(function (f) { try { f(); } catch (e) {} }); });
  function prog(el) { var r = el.getBoundingClientRect(), h = W.innerHeight; return Math.max(0, Math.min(1, (h - r.top) / (h + r.height))); }
  function seedRand(seed) { var x = (Number(seed) || 1) % 2147483647; if (x <= 0) x += 2147483646; return function () { x = x * 16807 % 2147483647; return (x - 1) / 2147483646; }; }
  function wordsWrap(el, d) {
    if (!once(el, 'words')) return;
    var text = el.textContent; el.setAttribute('aria-label', text);
    var i = 0;
    el.innerHTML = text.split(/(\s+)/).map(function (w) {
      if (/^\s+$/.test(w)) return w;
      return '<span class="fx-w" aria-hidden="true"><span style="--fx-dl:' + (0.08 * i++ * d).toFixed(2) + 's">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span></span>';
    }).join('');
  }

  /* ───── 첫 화면 ───── */
  var HERO = {
    splitline: function (hero, o) {
      var t = hero.querySelector('.sl-hero-title, .sl-hero-statement'); if (!t) return;
      wordsWrap(t, o.speed); hero.style.setProperty('--fx-d', (0.9 * o.speed) + 's');
      var lead = hero.querySelector('.sl-hero-lead'); if (lead) { lead.style.transition = 'opacity .8s ease .5s, transform .8s ' + EASE + ' .5s'; lead.style.opacity = 0; lead.style.transform = 'translateY(12px)'; }
      requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('fx-go'); if (lead) { lead.style.opacity = 1; lead.style.transform = 'none'; } }); });
    },
    slice: function (hero, o) {
      if (!once(hero, 'slice')) return;
      var n = W.innerWidth < 700 ? 4 : 6, box = D.createElement('div'); box.className = 'fx-slices'; box.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < n; i++) { var s = D.createElement('i'); s.style.setProperty('--fx-dl', (0.07 * i * o.speed).toFixed(2) + 's'); box.appendChild(s); }
      if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
      hero.appendChild(box); hero.style.setProperty('--fx-d', (0.9 * o.speed) + 's');
      setTimeout(function () { hero.classList.add('fx-go'); }, 80);
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 2200 * o.speed);
    },
    morph: function (hero, o) {
      var ph = hero.querySelector('.sl-hero-photo'); if (!ph || !once(hero, 'morph')) return;
      var fam = o.family, start = fam === 'food' ? 'inset(30% 30% 0 30% round 50% 50% 0 0)' : fam === 'beauty' ? 'circle(14% at 50% 55%)' : fam === 'medical' ? 'inset(36% 36% 36% 36% round 18%)' : 'circle(12% at 50% 50%)';
      ph.style.clipPath = start; hero.classList.add('fx-morph');
      requestAnimationFrame(function () { requestAnimationFrame(function () { ph.style.clipPath = fam === 'food' ? 'inset(0 0 0 0 round 0 0 0 0)' : fam === 'medical' ? 'inset(0 0 0 0 round 0%)' : 'circle(150% at 50% 50%)'; }); });
      HERO.splitline(hero, o);
    },
    kinetic: function (hero, o) {
      var t = hero.querySelector('.sl-hero-title'); if (!t || !once(hero, 'kin')) return;
      t.style.fontFamily = "'Pretendard Variable', Pretendard, var(--sl-head-font)"; t.style.transition = 'font-variation-settings .2s linear, letter-spacing .2s linear';
      onScroll(function () { var p = Math.min(1, W.scrollY / (W.innerHeight * 0.8)); t.style.fontVariationSettings = "'wght' " + Math.round(800 - 500 * p * o.str); t.style.letterSpacing = (-0.04 + 0.04 * p) + 'em'; });
      HERO.splitline(hero, o);
    },
    textmask: function (hero, o) {
      var img = hero.querySelector('.sl-hero-photo img'), name = o.name; if (!img || !name || !once(hero, 'tm')) return HERO.splitline(hero, o);
      var src = img.currentSrc || img.src; if (!src || /^data:image\/svg/.test(src)) return HERO.splitline(hero, o);
      if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
      var tm = D.createElement('div'); tm.className = 'fx-tm'; tm.setAttribute('aria-hidden', 'true');
      var b = D.createElement('b'); b.textContent = name; b.style.backgroundImage = 'url("' + src.replace(/"/g, '') + '")'; tm.appendChild(b); hero.appendChild(tm);
      setTimeout(function () { hero.classList.add('fx-go'); }, 300);
      setTimeout(function () { if (tm.parentNode) tm.parentNode.removeChild(tm); }, 2600);
    },
    zoomout: function (hero, o) {
      var ph = hero.querySelector('.sl-hero-photo img') || hero.querySelector('.sl-hero-photo'); if (!ph || !once(hero, 'zoom')) return HERO.splitline(hero, o);
      ph.style.willChange = 'transform'; ph.style.transformOrigin = '50% 40%';
      onScroll(function () { var p = Math.min(1, W.scrollY / (W.innerHeight * 0.7)); ph.style.transform = 'scale(' + (1 + 0.28 * o.str * (1 - p)).toFixed(4) + ')'; });
      HERO.splitline(hero, o);
    },
    aurora: function (hero, o) {
      if (!once(hero, 'aur')) return;
      var a = D.createElement('div'); a.className = 'fx-aurora'; a.setAttribute('aria-hidden', 'true'); a.innerHTML = '<i></i><i></i><i></i>';
      hero.classList.add('fx-aur-on'); hero.insertBefore(a, hero.firstChild);
      HERO.splitline(hero, o);
    }
  };

  /* ───── 섹션: 스크롤 ───── */
  var SCROLL = {
    highlight: function (sec) {
      sec.querySelectorAll('.sl-lead, .sl-body p, .sl-text p').forEach(function (p, i) {
        if (i > 5 || !once(p, 'hl')) return;
        var span = D.createElement('span'); span.className = 'fx-hl';
        while (p.firstChild) span.appendChild(p.firstChild); p.appendChild(span);
        inView(span, function (el) { el.classList.add('fx-in'); });
      });
    },
    countup: function (sec, o) {
      sec.querySelectorAll('.sl-trust dd, .sl-count, .sl-price').forEach(function (el) {
        if (!once(el, 'cnt')) return;
        var txt = el.textContent, m = txt.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/); if (!m) return;
        var to = Number(m[2].replace(/,/g, '')), comma = /,/.test(m[2]), dec = (m[2].split('.')[1] || '').length;
        if (!(to > 0) || to > 1e9) return;
        el.setAttribute('aria-label', txt);
        inView(el, function () {
          var t0 = performance.now(), dur = 1400 * o.speed;
          (function step(t) {
            var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4), v = to * e;
            var s = dec ? v.toFixed(dec) : String(Math.round(v));
            if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            el.textContent = m[1] + s + m[3];
            if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
          })(t0);
        });
      });
    },
    drawline: function (sec) {
      var st = sec.querySelector('.sl-steps'); if (!st || !once(st, 'draw')) return;
      onScroll(function () { var r = st.getBoundingClientRect(), h = W.innerHeight; st.style.setProperty('--fx-p', Math.max(0, Math.min(1, (h * 0.75 - r.top) / r.height)).toFixed(3)); });
    },
    parallax: function (sec, o) {
      var els = sec.querySelectorAll('.sl-sec-media img, .sl-img, .sl-item-img'); if (!els.length || !once(sec, 'plx')) return;
      els.forEach(function (im) { im.style.willChange = 'transform'; im.style.transform = 'scale(1.08)'; });
      onScroll(function () { var p = prog(sec) - 0.5; els.forEach(function (im, i) { im.style.transform = 'translateY(' + (p * -40 * o.str * (i % 2 ? 0.6 : 1)).toFixed(1) + 'px) scale(1.08)'; }); });
    },
    marquee: function (sec, o) {
      var list = sec.querySelector('.sl-reviews, .sl-body > ul, .sl-points'); if (!list || list.children.length < 3 || !once(list, 'mq')) return;
      var wrap = D.createElement('div'); wrap.className = 'fx-mq'; var track = D.createElement('div'); track.className = 'fx-mq-track';
      track.style.setProperty('--fx-mq', Math.max(24, list.children.length * 8 * o.speed) + 's');
      list.parentNode.insertBefore(wrap, list); wrap.appendChild(track);
      list.style.display = 'contents'; track.appendChild(list);
      var clone = list.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); clone.querySelectorAll('a,button').forEach(function (a) { a.tabIndex = -1; }); track.appendChild(clone);
      wrap.addEventListener('touchstart', function () { wrap.classList.add('fx-hold'); }, { passive: true });
      wrap.addEventListener('touchend', function () { wrap.classList.remove('fx-hold'); });
    },
    scramble: function (sec, o) {
      var h = sec.querySelector('.sl-h2'); if (!h || !once(h, 'scr')) return;
      var text = h.textContent; h.setAttribute('aria-label', text);
      var J = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ';
      inView(h, function () {
        var t0 = performance.now(), dur = 900 * o.speed;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), n = Math.floor(text.length * p);
          h.textContent = text.slice(0, n) + text.slice(n).replace(/[^\s]/g, function (c) {
            if (/[가-힣]/.test(c)) { var code = c.charCodeAt(0) - 0xAC00; return Math.random() < .5 ? J.charAt(Math.floor(code / 588) % 14) : J.charAt(14 + Math.floor((code % 588) / 28) % 10); }
            return J.charAt(Math.floor(Math.random() * J.length));
          });
          if (p < 1) requestAnimationFrame(step); else h.textContent = text;
        })(t0);
      });
    },
    hpin: function (sec) {
      var list = sec.querySelector('.sl-gallery, .sl-body > ul'); if (!list || list.children.length < 3 || !once(sec, 'hp')) return;
      if (touch || W.innerWidth < 760) { list.style.cssText += ';display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:14px;'; [].forEach.call(list.children, function (li) { li.style.flex = '0 0 78%'; li.style.scrollSnapAlign = 'start'; }); return; }
      var stick = D.createElement('div'); stick.className = 'fx-hp-stick';
      var wrap = sec.querySelector('.sl-wrap') || sec; while (wrap.firstChild) stick.appendChild(wrap.firstChild); wrap.appendChild(stick);
      list.classList.add('fx-hp-track'); sec.classList.add('fx-hp');
      function size() { var extra = Math.max(0, list.scrollWidth - stick.clientWidth + 40); sec.style.height = (W.innerHeight + extra) + 'px'; sec.__extra = extra; }
      size(); W.addEventListener('resize', size);
      onScroll(function () { var r = sec.getBoundingClientRect(), p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - W.innerHeight))); list.style.transform = 'translateX(' + (-p * (sec.__extra || 0)).toFixed(1) + 'px)'; });
    }
  };

  /* ───── 섹션: 마우스 ───── */
  function cardsOf(sec) { return sec.querySelectorAll('.sl-body > ul > li, .sl-points > li, .sl-team > li, .sl-cases > li, .sl-menu-list > li'); }
  var HOVER = {
    tilt: function (sec, o) {
      cardsOf(sec).forEach(function (c) {
        if (!once(c, 'tilt')) return; c.classList.add('fx-tilt');
        if (touch) { c.addEventListener('touchstart', function () { c.style.transform = 'scale(.98)'; }, { passive: true }); c.addEventListener('touchend', function () { c.style.transform = ''; }); return; }
        c.addEventListener('pointermove', function (e) { var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; c.style.transform = 'perspective(800px) rotateY(' + ((x - .5) * 10 * o.str).toFixed(2) + 'deg) rotateX(' + ((.5 - y) * 10 * o.str).toFixed(2) + 'deg)'; c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%'); });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
    },
    spotlight: function (sec) {
      cardsOf(sec).forEach(function (c) { if (!once(c, 'spot')) return; c.classList.add('fx-spot'); });
      if (!once(sec, 'spotm')) return;
      var move = function (x, y) { cardsOf(sec).forEach(function (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (x - r.left) + 'px'); c.style.setProperty('--my', (y - r.top) + 'px'); }); };
      if (touch) onScroll(function () { var r = sec.getBoundingClientRect(); move(W.innerWidth / 2, W.innerHeight / 2 + (r.top < 0 ? 0 : 0)); });
      else sec.addEventListener('pointermove', function (e) { move(e.clientX, e.clientY); });
    },
    glass: function () {},
    lightbox: function (sec) {
      sec.querySelectorAll('.sl-gallery img, .sl-body img').forEach(function (im) {
        if (!once(im, 'lb')) return; im.style.cursor = 'zoom-in';
        im.addEventListener('click', function () {
          var src = im.currentSrc || im.src; if (!src || /^data:image\/svg/.test(src)) return;
          var open = function () { var lb = D.createElement('div'); lb.className = 'fx-lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', im.alt || '사진 크게 보기'); var big = D.createElement('img'); big.src = src; big.alt = im.alt || ''; big.style.viewTransitionName = 'fx-photo'; lb.appendChild(big); im.style.viewTransitionName = ''; D.body.appendChild(lb);
            var close = function () { var rm = function () { if (lb.parentNode) lb.parentNode.removeChild(lb); im.style.viewTransitionName = 'fx-photo'; }; if (D.startViewTransition) D.startViewTransition(rm).finished.then(function () { im.style.viewTransitionName = ''; }); else rm(); D.removeEventListener('keydown', esc); };
            var esc = function (e) { if (e.key === 'Escape') close(); }; lb.addEventListener('click', close); D.addEventListener('keydown', esc); };
          if (D.startViewTransition) { im.style.viewTransitionName = 'fx-photo'; D.startViewTransition(open); } else open();
        });
      });
    }
  };

  /* ───── 푸터 ───── */
  var FOOT = {
    uncover: function (page) {
      var f = page.querySelector('.sl-sitefoot'); if (!f || !once(page, 'unc')) return;
      var fit = function () { page.classList.toggle('fx-uncover', f.offsetHeight < W.innerHeight * 0.85); };   // 바닥글이 화면보다 길면 끔
      fit(); W.addEventListener('resize', fit); setTimeout(fit, 1500);
    },
    bigtype: function (page, o) {
      var f = page.querySelector('.sl-sitefoot .sl-foot-wrap'); if (!f || !once(f, 'big')) return;
      var b = D.createElement('span'); b.className = 'fx-big'; b.setAttribute('aria-hidden', 'true'); b.textContent = o.name || ''; f.appendChild(b);
      onScroll(function () { var r = b.getBoundingClientRect(), h = W.innerHeight; var p = Math.max(0, Math.min(1, (h - r.top) / (h * 0.6))); b.style.setProperty('--fx-bs', (0.75 + 0.25 * p).toFixed(3)); });
    },
    glowlinks: function (page) { page.classList.add('fx-glow'); },
    arrowtop: function (page) {
      var f = page.querySelector('.sl-sitefoot .sl-foot-wrap'); if (!f || !once(f, 'top')) return;
      var b = D.createElement('button'); b.type = 'button'; b.className = 'fx-top';
      b.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7"/></svg>맨 위로';
      b.addEventListener('click', function () { b.classList.add('fx-fly'); W.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); setTimeout(function () { b.classList.remove('fx-fly'); }, 900); });
      f.appendChild(b);
    },
    magmarquee: function (page, o) {
      var f = page.querySelector('.sl-sitefoot .sl-foot-wrap'); if (!f || !once(f, 'mm')) return;
      var w = D.createElement('div'); w.className = 'fx-mm'; w.setAttribute('aria-hidden', 'true');
      var t = D.createElement('div'); t.className = 'fx-mm-track';
      for (var i = 0; i < 8; i++) { var s = D.createElement('span'); s.textContent = o.name || ''; t.appendChild(s); }
      w.appendChild(t); f.appendChild(w);
      if (!touch) w.addEventListener('pointermove', function (e) { t.querySelectorAll('span').forEach(function (s) { var r = s.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)); s.style.transform = 'scaleY(' + (1 + Math.max(0, 1 - d / 400) * 0.35 * o.str).toFixed(3) + ')'; }); });
      w.addEventListener('pointerleave', function () { t.querySelectorAll('span').forEach(function (s) { s.style.transform = ''; }); });
    }
  };

  /* ───── 전체 ───── */
  var GLOBAL = {
    progress: function () { if (D.querySelector('.fx-prog')) return; var b = D.createElement('div'); b.className = 'fx-prog'; b.setAttribute('aria-hidden', 'true'); D.body.appendChild(b); onScroll(function () { var h = D.documentElement.scrollHeight - W.innerHeight; b.style.transform = 'scaleX(' + (h > 0 ? W.scrollY / h : 0).toFixed(4) + ')'; }); },
    magnetic: function (page, o) {
      if (touch) return;
      page.querySelectorAll('.sl-btn').forEach(function (b) {
        if (!once(b, 'mag')) return; b.classList.add('fx-mag');
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25 * o.str).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3 * o.str).toFixed(1) + 'px)'; });
        b.addEventListener('pointerleave', function () { b.style.transform = ''; });
      });
    },
    grain: function () { if (D.querySelector('.fx-grain')) return; var g = D.createElement('div'); g.className = 'fx-grain'; g.setAttribute('aria-hidden', 'true'); D.body.appendChild(g); },
    ambient: function (page) {
      if (D.querySelector('.fx-amb')) return; var a = D.createElement('div'); a.className = 'fx-amb'; a.setAttribute('aria-hidden', 'true'); D.body.insertBefore(a, D.body.firstChild);
      if (touch) onScroll(function () { a.style.setProperty('--ay', (20 + 60 * Math.min(1, W.scrollY / Math.max(1, D.documentElement.scrollHeight - W.innerHeight))) + '%'); });
      else W.addEventListener('pointermove', function (e) { a.style.setProperty('--ax', e.clientX + 'px'); a.style.setProperty('--ay', e.clientY + 'px'); }, { passive: true });
    },
    colorshift: function (page) {
      var secs = [].slice.call(page.querySelectorAll('.sl-sec')); if (!secs.length || !once(page, 'cs')) return;
      var cs = getComputedStyle(page), tints = [cs.getPropertyValue('--sl-bg'), cs.getPropertyValue('--sl-stone'), cs.getPropertyValue('--sl-tint')].map(function (x) { return String(x || '').trim(); }).filter(Boolean);
      if (tints.length < 2) return;
      page.classList.add('fx-cs-on'); page.style.setProperty('--fx-cs', tints[0]);
      secs.forEach(function (s, i) { inView(s, function () { page.style.setProperty('--fx-cs', tints[i % tints.length]); }, { keep: true, margin: '-45% 0px -45% 0px' }); });
    },
    micro: function (page) { page.querySelectorAll('.sl-btn-call.is-main, .sl-dock .sl-btn-call, a[href^="tel:"].is-main').forEach(function (b) { if (once(b, 'rip')) b.classList.add('fx-ripple'); }); },
    smooth: function () {
      if (touch || W.__fxSmooth) return; W.__fxSmooth = true;
      var target = W.scrollY, cur = W.scrollY, running = false;
      W.addEventListener('wheel', function (e) {
        if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
        var el = e.target; while (el && el !== D.body) { var oy = getComputedStyle(el).overflowY; if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight) return; el = el.parentElement; }
        e.preventDefault(); if (!running) { cur = W.scrollY; target = cur; }
        target = Math.max(0, Math.min(D.documentElement.scrollHeight - W.innerHeight, target + e.deltaY * (e.deltaMode === 1 ? 32 : 1)));
        if (!running) { running = true; requestAnimationFrame(function step() { cur += (target - cur) * 0.12; if (Math.abs(target - cur) < 0.5) { cur = target; running = false; } W.scrollTo(0, cur); if (running) requestAnimationFrame(step); }); }
      }, { passive: false });
    },
    cursor: function (page) {
      if (touch || D.querySelector('.fx-cur')) return;
      var c = D.createElement('div'); c.className = 'fx-cur'; c.setAttribute('aria-hidden', 'true'); D.body.appendChild(c);
      var x = -100, y = -100, cx = x, cy = y;
      W.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; c.classList.toggle('is-big', !!(e.target.closest && e.target.closest('a,button'))); }, { passive: true });
      (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; c.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)'; requestAnimationFrame(loop); })();
    },
    seasonal: function (page, o) {
      var kind = o.season || autoSeason(); if (!kind || D.querySelector('.fx-season')) return;
      if (o.from && o.to) { var t = new Date().toISOString().slice(0, 10); if (t < o.from || t > o.to) return; }
      var cv = D.createElement('canvas'); cv.className = 'fx-season'; cv.setAttribute('aria-hidden', 'true'); D.body.appendChild(cv);
      var ctx = cv.getContext('2d'), dpr = Math.min(2, W.devicePixelRatio || 1), P = [], rnd = seedRand(o.seed || 7), n = W.innerWidth < 700 ? 18 : 36;
      var COL = { snow: ['#ffffff'], blossom: ['#ffd1dc', '#ffb7c5', '#fbe3ea'], leaves: ['#d9661f', '#c2410c', '#e8a33d'], confetti: [getComputedStyle(page).getPropertyValue('--sl-key') || '#e5484d', '#ffd166', '#06d6a0', '#118ab2'] }[kind] || ['#fff'];
      function size() { cv.width = W.innerWidth * dpr; cv.height = W.innerHeight * dpr; cv.style.width = W.innerWidth + 'px'; cv.style.height = W.innerHeight + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
      size(); W.addEventListener('resize', size);
      for (var i = 0; i < n; i++) P.push({ x: rnd() * W.innerWidth, y: rnd() * W.innerHeight, r: 2 + rnd() * (kind === 'snow' ? 3 : 5), vy: 0.4 + rnd() * 0.9, vx: -0.3 + rnd() * 0.6, a: rnd() * 6.28, c: COL[i % COL.length] });
      var on = true; D.addEventListener('visibilitychange', function () { on = !D.hidden; if (on) loop(); });
      function loop() {
        if (!on) return; ctx.clearRect(0, 0, W.innerWidth, W.innerHeight);
        P.forEach(function (p) { p.y += p.vy; p.x += p.vx + Math.sin(p.a += 0.02) * 0.4; if (p.y > W.innerHeight + 10) { p.y = -10; p.x = Math.random() * W.innerWidth; }
          ctx.fillStyle = p.c; ctx.globalAlpha = kind === 'snow' ? 0.85 : 0.75; ctx.beginPath();
          if (kind === 'snow') ctx.arc(p.x, p.y, p.r, 0, 6.28); else ctx.ellipse(p.x, p.y, p.r, p.r * 0.55, p.a, 0, 6.28);
          ctx.fill(); });
        requestAnimationFrame(loop);
      }
      loop();
    }
  };
  function autoSeason() { var m = new Date().getMonth() + 1; return m === 12 || m <= 2 ? 'snow' : m <= 4 ? 'blossom' : m >= 10 ? 'leaves' : ''; }

  /* ───── 시작 ───── */
  /* 무거운 효과(무게 4)는 따로 불러옴: sitelumi-fx-heavy.js (같은 주소 폴더) */
  var HEAVY_SRC = (function () { var c = D.currentScript && D.currentScript.src || ''; return c ? c.replace(/sitelumi-fx(\.min)?\.js.*$/, 'sitelumi-fx-heavy' + (/\.min\.js/.test(c) ? '.min' : '') + '.js') : 'https://cdn.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/design/sitelumi-fx-heavy.min.js'; })();
  var heavyQ = null;
  function heavy(id) {
    return function (el, o) {
      var run = function () { if (W.SLFXH && W.SLFXH[id] && !el.getAttribute('data-fxh-' + id)) { el.setAttribute('data-fxh-' + id, '1'); try { W.SLFXH[id](el, o); } catch (e) {} } };
      if (W.SLFXH) return run();
      if (heavyQ) { heavyQ.push(run); return; }
      heavyQ = [run];
      var s = D.createElement('script'); s.src = HEAVY_SRC; s.async = true;
      s.onload = function () { var q = heavyQ; heavyQ = null; q.forEach(function (f) { f(); }); };
      s.onerror = function () { heavyQ = null; };
      D.head.appendChild(s);
    };
  }
  ['particles', 'liquid', 'glaurora', 'depth'].forEach(function (k) { HERO[k] = heavy(k); });
  SCROLL.sequence = heavy('sequence');

  function init(scope) {
    scope = scope || D;
    var pages = scope.classList && scope.classList.contains('sl-page') ? [scope] : [].slice.call(scope.querySelectorAll('.sl-page'));
    if (!pages.length) return;
    if (reduce) return;                                  // 움직임 줄이기: 효과 없이 내용 그대로
    css();
    pages.forEach(function (page) {
      if (page.getAttribute('data-fx-on')) return;          // 한 페이지에 두 번 걸지 않음 (자동 실행 + 테마 로더가 겹칠 때)
      page.setAttribute('data-fx-on', '1');
      var d = page.dataset || {};
      var o = { speed: d.fxSpeed === 'slow' ? 1.35 : d.fxSpeed === 'fast' ? 0.75 : 1, str: d.fxStrength === 'low' ? 0.55 : d.fxStrength === 'high' ? 1.4 : 1,
                name: d.fxName || '', family: d.fxFamily || '', seed: Number(d.fxSeed || 1), season: d.fxSeason || '', from: d.fxFrom || '', to: d.fxTo || '' };
      var hero = page.querySelector('.sl-sec-hero'), h = d.fxHero;
      if (hero && h && HERO[h]) try { HERO[h](hero, o); } catch (e) {}
      page.querySelectorAll('.sl-sec[data-fx-scroll]').forEach(function (s) { var k = s.getAttribute('data-fx-scroll'); if (SCROLL[k]) try { SCROLL[k](s, o); } catch (e) {} });
      page.querySelectorAll('.sl-sec[data-fx-hover]').forEach(function (s) { var k = s.getAttribute('data-fx-hover'); if (HOVER[k]) try { HOVER[k](s, o); } catch (e) {} });
      String(d.fxFooter || '').split(',').forEach(function (k) { if (FOOT[k]) try { FOOT[k](page, o); } catch (e) {} });
      String(d.fxGlobal || '').split(',').forEach(function (k) { if (GLOBAL[k]) try { GLOBAL[k](page, o); } catch (e) {} });
    });
  }
  W.SLFX = { ver: '4.0.0', init: init, list: { hero: Object.keys(HERO), scroll: Object.keys(SCROLL), hover: Object.keys(HOVER), footer: Object.keys(FOOT), global: Object.keys(GLOBAL) } };
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', function () { init(D); }); else init(D);
})();
