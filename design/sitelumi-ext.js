(function () {
  var HP = window.HP = window.HP || {};

  function readJson(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  document.addEventListener('DOMContentLoaded', function () {

    /* ── [S1] 기능 스위치 ── */
    HP.features = readJson('hp-features') || {};
    HP.on = function (k) { return HP.features[k] !== false; };

    /* ── [S2] 이미지 로딩 효과 (로드 완료 시 부드럽게 표시) ── */
    var imgs = document.querySelectorAll('.list-thumb img, .post-body img');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        function done() { img.classList.add('is-loaded'); }
        if (!HP.on('imageFade') || img.complete) { done(); return; }
        img.addEventListener('load', done);
        img.addEventListener('error', done);
      })(imgs[i]);
    }

    /* ── [S3] 섹션 등장 효과 (.hp-reveal) — HP.reveal(범위) 로 나중에 넣은 섹션에도 적용 ── */
    var io = (HP.on('reveal') && 'IntersectionObserver' in window) ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;
    HP.reveal = function (scope) {
      var reveals = (scope || document).querySelectorAll('.hp-reveal:not(.is-in)');
      for (var r = 0; r < reveals.length; r++) { if (io) io.observe(reveals[r]); else reveals[r].classList.add('is-in'); }
    };
    HP.reveal(document);
    window.__hpReady = true;

    /* ── [S4] 사업자 정보 &#8594; LocalBusiness JSON-LD ── */
    (function buildBusiness() {
      var biz = document.getElementById('hp-business');
      if (!biz) return;
      var PH = /\{\{[^}]*\}\}/;

      /* {{ }} 가 남은 줄은 숨김 */
      var lines = biz.querySelectorAll('p');
      for (var l = 0; l < lines.length; l++) {
        var p = lines[l];
        var hrefs = '';
        p.querySelectorAll('a').forEach(function (a) { hrefs += (a.getAttribute('href') || ''); });
        if (PH.test(p.textContent) || PH.test(hrefs)) {
          if (p.classList.contains('hp-biz-links')) {
            p.querySelectorAll('a').forEach(function (a) {
              if (PH.test(a.getAttribute('href') || '')) a.style.display = 'none';
            });
          } else {
            p.style.display = 'none';
          }
        }
      }

      var data = {}, sameAs = [];
      biz.querySelectorAll('[data-k]').forEach(function (el) {
        var k = el.getAttribute('data-k');
        var v = (k === 'sameAs') ? (el.getAttribute('href') || '') : el.textContent.replace(/\s+/g, ' ').trim();
        if (!v || PH.test(v)) return;
        if (k === 'sameAs') sameAs.push(v); else data[k] = v;
      });

      if (!data.name) { biz.classList.add('is-empty'); return; }

      var home = location.protocol + '//' + location.host + '/';
      var ogImg = document.querySelector('meta[property="og:image"]');
      var ld = {
        '@context': 'https://schema.org',
        '@type': biz.getAttribute('data-type') || 'LocalBusiness',
        '@id': home + '#business',
        'name': data.name,
        'url': home,
        'parentOrganization': { '@id': home + '#organization' }
      };
      if (ogImg) ld.image = ogImg.getAttribute('content');
      if (data.telephone) ld.telephone = data.telephone;
      if (data.email) ld.email = data.email;
      if (data.address) ld.address = { '@type': 'PostalAddress', 'streetAddress': data.address, 'addressCountry': 'KR' };
      if (data.founder) ld.founder = { '@type': 'Person', 'name': data.founder };
      if (data.taxID) ld.taxID = data.taxID;
      if (data.openingHours) {
        /* schema 형식(Mo-Fr 10:00-20:00)일 때만 openingHours, 한글이면 설명으로 */
        if (/^[A-Z][a-z]/.test(data.openingHours)) ld.openingHours = data.openingHours;
        else ld.description = '영업시간: ' + data.openingHours;
      }
      if (sameAs.length) ld.sameAs = sameAs;

      var s = document.createElement('script');
      s.type = 'application/ld+json';
      s.text = JSON.stringify(ld);
      document.head.appendChild(s);
    })();

    /* ── [S5] 저작권 연도 ── */
    var y = document.getElementById('hp-year');
    if (y) y.textContent = String(new Date().getFullYear());

    /* ── [S6] 사이트 메뉴: 페이지 본문의 .sl-pagenav 를 헤더·모바일 메뉴로 옮김 ── */
    HP.useNav = function () {
      var nav = document.querySelector('.sl-pagenav');
      if (!nav) return;
      var ul = nav.querySelector('ul');
      if (!ul) return;
      ul.className = 'sl-menu';
      var pc = document.querySelector('.header-menu-pc');
      if (pc) {
        var old = pc.querySelector('.sl-menu'); if (old) old.parentNode.removeChild(old);
        var pl = pc.querySelector('.PageList'); if (pl) pl.style.display = 'none';
        pc.insertBefore(ul.cloneNode(true), pc.firstChild);
      }
      var mob = document.getElementById('mobile-menu-content');
      if (mob) mob.innerHTML = ul.outerHTML;
      nav.parentNode.removeChild(nav);
    };
    HP.useNav();

    /* ── [S8] 지금 영업 중 표시 · 영업시간 표에서 오늘 줄 강조 ── */
    HP.hours = function (scope) {
      var keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
      var now = new Date(), day = now.getDay(), mins = now.getHours() * 60 + now.getMinutes();
      function range(v) {
        var m = String(v || '').match(/(\d{1,2}):(\d{2})\s*[-~]\s*(\d{1,2}):(\d{2})/);
        return m ? { o: m[1] * 60 + +m[2], c: m[3] * 60 + +m[4], os: m[1] + ':' + m[2], cs: m[3] + ':' + m[4] } : null;
      }
      (scope || document).querySelectorAll('.sl-status[data-hours]').forEach(function (el) {
        var h; try { h = JSON.parse(el.getAttribute('data-hours')); } catch (e) { return; }
        var t = range(h[keys[day]]), txt, open = false;
        if (t && mins >= t.o && mins < t.c) { txt = '영업 중, ' + t.cs + '까지'; open = true; }
        else if (t && mins < t.o) txt = '오늘 ' + t.os + '에 열어요';
        else {
          for (var i = 1; i <= 7; i++) {
            var n = range(h[keys[(day + i) % 7]]);
            if (n) { txt = (t ? '영업 종료, ' : '오늘은 쉬어요, ') + (i === 1 ? '내일' : ['일', '월', '화', '수', '목', '금', '토'][(day + i) % 7] + '요일') + ' ' + n.os + '에 열어요'; break; }
          }
        }
        if (txt) { el.textContent = txt; el.classList.toggle('is-open', open); }
      });
      (scope || document).querySelectorAll('.sl-hours tr[data-day="' + day + '"]').forEach(function (tr) { tr.classList.add('is-today'); });
    };
    HP.hours(document);

    /* ── [S9] 사이트 바닥글 · 모바일 하단 연락 버튼: 페이지 안의 것을 제자리로 옮김 ── */
    HP.useFoot = function (scope) {
      scope = scope || document;
      var foot = scope.querySelector('.sl-sitefoot'), box = document.getElementById('site-footer');
      if (foot && box) {
        var inner = box.querySelector('.footer-inner') || box;
        inner.querySelectorAll('.sl-sitefoot').forEach(function (o) { if (o !== foot) o.parentNode.removeChild(o); });
        inner.insertBefore(foot, inner.firstChild);
        box.classList.add('has-sitefoot');
        foot.querySelectorAll('.sl-year').forEach(function (y) { y.textContent = new Date().getFullYear(); });
        if (HP.hours) HP.hours(foot);
      }
      var dock = scope.querySelector('.sl-dock');
      if (dock) {
        document.querySelectorAll('body > .sl-dock').forEach(function (o) { if (o !== dock) o.parentNode.removeChild(o); });
        document.body.appendChild(dock);
        document.body.classList.add('has-dock');
      }
      return !!foot;
    };

    /* ── [S10] 모바일 명함: 연락처 저장(vCard) · 명함/홈페이지 보내기 ── */
    HP.toast = function (msg) {
      var t = document.createElement('div'); t.className = 'sl-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
      document.body.appendChild(t); setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
    };
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-sl]');
      if (!btn) return;
      var kind = btn.getAttribute('data-sl');
      if (kind === 'vcard') {
        var cardEl = btn.closest('.sl-card'), c = {};
        try { c = JSON.parse(cardEl.getAttribute('data-vcard')); } catch (err) { return; }
        var v = function (x) { return String(x || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); };
        var text = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + v(c.fn), 'N:' + v(c.fn) + ';;;;',
          c.org ? 'ORG:' + v(c.org) : '', c.title ? 'TITLE:' + v(c.title) : '',
          c.tel ? 'TEL;TYPE=CELL,VOICE:' + c.tel : '', c.email ? 'EMAIL;TYPE=INTERNET:' + c.email : '',
          c.adr ? 'ADR;TYPE=WORK:;;' + v(c.adr) + ';;;;' : '', 'URL:' + location.origin + '/', 'END:VCARD'].filter(Boolean).join('\r\n');
        if (/iP(hone|ad|od)/.test(navigator.userAgent)) { location.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(text); return; }
        var a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/vcard;charset=utf-8' }));
        a.download = (c.org || c.fn || 'contact') + '.vcf';
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 1500);
        HP.toast('연락처 파일을 내려받았어요. 열면 연락처에 저장됩니다.');
      }
      if (kind === 'share') {
        /* 저장된 주소의 도메인 대신 지금 접속한 도메인을 씀 (개인 도메인 연결 후에도 맞게) */
        var path = '/';
        try { path = new URL(btn.getAttribute('data-url') || '/', location.href).pathname; } catch (err) {}
        var url = location.origin + path, title = btn.getAttribute('data-title') || document.title;
        if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
        var done = function () { HP.toast('주소를 복사했어요. 카카오톡이나 문자에 붙여넣어 보내세요.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(url).then(done, function () { prompt('주소를 복사하세요', url); }); }
        else { prompt('주소를 복사하세요', url); }
      }
    });

    /* ── [S13] 상담 신청 보내기 · 방문·버튼 기록 (날짜별 합계만 — 개인정보·쿠키 없음) ── */
    HP.gas = function () { var el = document.querySelector('[data-gas]'); return el ? el.getAttribute('data-gas') : ''; };
    var IS_BOT = /bot|crawl|spider|slurp|yeti|daumoa|bingpreview|lighthouse|headless|pagespeed/i.test(navigator.userAgent);
    function beacon(body) {
      var u = HP.gas(); if (!u || IS_BOT) return;
      var data = JSON.stringify(body);
      try { if (navigator.sendBeacon && navigator.sendBeacon(u, new Blob([data], { type: 'text/plain' }))) return; } catch (err) {}
      try { fetch(u, { method: 'POST', mode: 'no-cors', body: data, keepalive: true }); } catch (err) {}
    }
    /* 페이지 보기: 같은 페이지는 한 번 방문(브라우저 탭) 동안 한 번만 */
    HP.view = function () {
      var page = document.querySelector('.sl-page'); if (!page) return;
      var id = page.getAttribute('data-page') || location.pathname, k = 'slV:' + id;
      try { if (sessionStorage.getItem(k)) return; sessionStorage.setItem(k, '1'); } catch (err) {}
      var r = 'direct', ref = document.referrer;
      if (ref) {
        try {
          var h = new URL(ref).hostname;
          r = h === location.hostname ? '' : /naver/.test(h) ? 'naver' : /google/.test(h) ? 'google' : /daum/.test(h) ? 'daum' :
            /instagram/.test(h) ? 'instagram' : /kakao/.test(h) ? 'kakao' : /facebook|fb\./.test(h) ? 'facebook' : /youtube/.test(h) ? 'youtube' : 'etc';
        } catch (err) { r = 'etc'; }
      }
      beacon({ a: 'hit', k: 'view', p: id, r: r });
    };
    HP.view();
    /* 버튼 누름: 전화·문자·카톡·길찾기·예약 … 연락처 저장·보내기 */
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('a, [data-sl]');
      if (!el || !el.closest('.sl-page, .sl-sitefoot, .sl-dock')) return;
      var t = '', ds = el.getAttribute('data-sl'), href = el.getAttribute('href') || '';
      var same = el.tagName === 'A' && el.host === location.host && !/^(tel|sms|mailto):/i.test(href);   // 사이트 안 이동은 세지 않음
      if (same) { var c0 = (el.className || '').match(/sl-btn-(contact|booking)/); if (c0) beacon({ a: 'hit', k: c0[1] }); return; }
      if (ds === 'vcard') t = 'vcard';
      else if (ds === 'share') t = /\/p\/card\.html/.test(el.getAttribute('data-url') || '') ? 'shareCard' : 'shareHome';
      else if (/^tel:/i.test(href)) t = 'call';
      else if (/^sms:/i.test(href)) t = 'sms';
      else if (/^mailto:/i.test(href)) t = 'mail';
      else if (/pf\.kakao|kakao\.com\/_|open\.kakao/i.test(href)) t = 'kakao';
      else if (/map\.naver|map\.kakao|naver\.me|maps\.google|google\.[a-z.]+\/maps/i.test(href)) t = 'map';
      else if (/booking\.naver|\/booking/i.test(href)) t = 'booking';
      else if (/instagram\.com/i.test(href)) t = 'insta';
      else if (/blog\.naver|tistory|blogspot/i.test(href) && !/\/p\//.test(href)) t = 'blog';
      else if (/youtu/i.test(href)) t = 'youtube';
      else { var m = (el.className || '').match(/sl-btn-(\w+)/); if (m) t = m[1]; }
      if (t) beacon({ a: 'hit', k: t });
    }, true);
    /* 상담 신청 보내기 */
    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (!f.matches || !f.matches('form[data-sl-form="contact"]')) return;
      e.preventDefault();
      var el = function (n) { return f.elements.namedItem(n); };
      var out = f.querySelector('.sl-form-msg'), btn = f.querySelector('button[type="submit"]');
      var say = function (msg, ok) { if (out) { out.textContent = msg; out.className = 'sl-form-msg ' + (ok ? 'is-ok' : 'is-err'); } };
      var u = f.getAttribute('data-gas');
      if (!u) { say('미리보기에서는 보내지 않아요.', false); return; }
      var body = { a: 'lead', name: el('name').value, phone: el('phone').value, msg: el('msg') ? el('msg').value : '',
                   agree: !!(el('agree') && el('agree').checked), website: el('website') ? el('website').value : '', page: document.title };
      if (btn) { btn.disabled = true; btn.textContent = '보내는 중…'; }
      fetch(u, { method: 'POST', body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { f.reset(); say('보냈어요. 확인하고 곧 연락드릴게요.', true); }
          else say((d && d.error) || '보내지 못했어요. 전화로 문의해 주세요.', false);
        })
        .catch(function () { say('보내지 못했어요. 잠시 후 다시 시도하거나 전화로 문의해 주세요.', false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = '보내기'; } });
    }, true);

    /* ── [S13] 예약: 빈 시간은 예약 섹션이 화면에 보일 때만 물어봄 (방문자 대부분은 GAS 를 부르지 않음) ── */
    HP.booking = function (scope) {
      var W = ['일', '월', '화', '수', '목', '금', '토'];
      var label = function (t) { var h = Number(t.slice(0, 2)); return h >= 24 ? '다음날 ' + ('0' + (h - 24)).slice(-2) + t.slice(2) : t; };
      (scope || document).querySelectorAll('form[data-sl-form="booking"]').forEach(function (f) {
        if (f.__bk) return; f.__bk = 1;
        var u = f.getAttribute('data-gas'), daysEl = f.querySelector('.sl-bk-days'), timesEl = f.querySelector('.sl-bk-times');
        var dIn = f.elements.namedItem('date'), tIn = f.elements.namedItem('time'), data = null;
        if (!u) { daysEl.innerHTML = '<p class="sl-bk-wait">미리보기에서는 예약 시간을 불러오지 않아요.</p>'; return; }
        var pick = function (box, el, sel) { box.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-checked', b === el ? 'true' : 'false'); }); };
        var drawTimes = function (day) {
          tIn.value = '';
          timesEl.innerHTML = day && day.t.length ? day.t.map(function (t) { return '<button type="button" class="sl-bk-time" role="radio" aria-checked="false" data-t="' + t + '">' + label(t) + '</button>'; }).join('')
            : '<p class="sl-bk-wait">이 날은 예약 가능한 시간이 없어요.</p>';
        };
        var drawDays = function () {
          var any = false;
          daysEl.innerHTML = data.days.map(function (d) {
            var n = d.t.length; if (n) any = true;
            return '<button type="button" class="sl-bk-day" role="radio" aria-checked="false" data-d="' + d.d + '"' + (n ? '' : ' disabled') + '>' +
              '<b>' + Number(d.d.slice(5, 7)) + '/' + Number(d.d.slice(8, 10)) + '</b><span>' + W[d.w] + '</span></button>';
          }).join('');
          if (!any) daysEl.innerHTML = '<p class="sl-bk-wait">지금은 예약 가능한 날짜가 없어요. 전화로 문의해 주세요.</p>';
          dIn.value = ''; tIn.value = ''; timesEl.innerHTML = '<p class="sl-bk-wait">날짜를 먼저 골라 주세요.</p>';
        };
        var load = function () {
          fetch(u, { method: 'POST', body: JSON.stringify({ a: 'bookSlots' }) }).then(function (r) { return r.json(); }).then(function (d) {
            if (!d || !d.ok) { daysEl.innerHTML = '<p class="sl-bk-wait">' + ((d && d.error) || '예약 시간을 불러오지 못했어요.') + '</p>'; return; }
            data = d; drawDays();
          }).catch(function () { daysEl.innerHTML = '<p class="sl-bk-wait">예약 시간을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p>'; });
        };
        f.__bkLoad = load;
        daysEl.addEventListener('click', function (e) {
          var b = e.target.closest('.sl-bk-day'); if (!b || b.disabled || !data) return;
          pick(daysEl, b, '.sl-bk-day'); dIn.value = b.getAttribute('data-d');
          drawTimes(data.days.filter(function (x) { return x.d === dIn.value; })[0]);
        });
        timesEl.addEventListener('click', function (e) {
          var b = e.target.closest('.sl-bk-time'); if (!b) return;
          pick(timesEl, b, '.sl-bk-time'); tIn.value = b.getAttribute('data-t');
        });
        if ('IntersectionObserver' in window) {
          var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); load(); } }, { rootMargin: '400px' });
          io.observe(f);
        } else load();
      });
    };
    HP.booking(document);
    /* 예약 보내기 */
    document.addEventListener('submit', function (e) {
      var f = e.target;
      if (!f.matches || !f.matches('form[data-sl-form="booking"]')) return;
      e.preventDefault();
      var el = function (n) { return f.elements.namedItem(n); };
      var out = f.querySelector('.sl-form-msg'), btn = f.querySelector('button[type="submit"]');
      var say = function (msg, ok) { if (out) { out.textContent = msg; out.className = 'sl-form-msg ' + (ok ? 'is-ok' : 'is-err'); } };
      var u = f.getAttribute('data-gas');
      if (!u) { say('미리보기에서는 보내지 않아요.', false); return; }
      if (!el('date').value || !el('time').value) { say('예약 날짜와 시간을 골라 주세요.', false); return; }
      var body = { a: 'book', date: el('date').value, time: el('time').value, service: el('service') ? el('service').value : '',
                   name: el('name').value, phone: el('phone').value, msg: el('msg') ? el('msg').value : '',
                   agree: !!(el('agree') && el('agree').checked), website: el('website') ? el('website').value : '' };
      if (btn) { btn.disabled = true; btn.textContent = '예약하는 중…'; }
      fetch(u, { method: 'POST', body: JSON.stringify(body) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { f.reset(); say('예약됐어요 — ' + (d.when || '') + '. 확인 연락을 드릴게요.', true); }
          else say((d && d.error) || '예약하지 못했어요. 전화로 문의해 주세요.', false);
          if (f.__bkLoad) f.__bkLoad();
        })
        .catch(function () { say('예약하지 못했어요. 잠시 후 다시 시도하거나 전화로 문의해 주세요.', false); })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = '예약하기'; } });
    }, true);

    /* ── [S12] 명조(마루부리) 글꼴: 화면에 명조를 쓰는 디자인이 있을 때만 내려받음 ── */
    HP.serif = function (scope) {
      if (HP._serif) return;
      var el = (scope || document).querySelector('.sl-page, .sl-sitefoot');
      var need = (scope || document).querySelector('.sl-cf-serif, .sl-cs-polaroid, .sl-cph-word');
      if (!need && el) need = /MaruBuri/.test(getComputedStyle(el).getPropertyValue('--sl-head-font'));
      if (!need) return;
      HP._serif = true;
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://hangeul.pstatic.net/hangeul_static/css/maru-buri.css';
      document.head.appendChild(l);
    };
    HP.serif(document);

    /* ── [S11] 글상자 높이 자동 조절: 문의 내용처럼 긴 글을 쓰면 상자가 같이 늘어남 ── */
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (!t || t.tagName !== 'TEXTAREA' || !t.closest('.sl-form, .post-body, #hp-root')) return;
      t.style.height = 'auto';
      t.style.height = (t.scrollHeight + 2) + 'px';
    });

    /* ── [S17] 섹션 등장 효과: data-anim(떠오르기·스르륵·다가오기·밀려오기·초점·차례로) — 화면에 들어오면 .is-in ── */
    (function anims() {
      var KIDS = '.sl-points > li, .sl-menu-list > li, .sl-steps > li, .sl-reviews > li, .sl-faq > details, .sl-gallery > li, .sl-team > li, .sl-pagelinks > li, .sl-trust > div, .sl-cases > li, .sl-creds > li, .sl-text > p, .sl-head';
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }) : null;
      document.documentElement.classList.add('sl-anim-ready');   // 이 스크립트가 돌 때만 숨겼다가 보여 줌 (오류가 나도 내용은 보임)
      HP.anim = function (root) {
        var list = (root || document).querySelectorAll('.sl-anim:not(.is-in):not([data-anim-on])');
        Array.prototype.forEach.call(list, function (el) {
          el.setAttribute('data-anim-on', '');
          if (el.getAttribute('data-anim') === 'stagger') {
            Array.prototype.forEach.call(el.querySelectorAll(KIDS), function (k, i) { k.style.setProperty('--i', Math.min(i, 12)); });
          }
          if (io) io.observe(el); else el.classList.add('is-in');
        });
      };
      HP.anim(document);
      var t = 0;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { HP.anim(document); }, 30); })
        .observe(document.body, { childList: true, subtree: true });
    })();

    /* ── [S16] 올린 사진 불러오기: 사진은 블로그 정적 페이지(sl-img)에 보관 → 화면에 가까워지면 그 페이지에서 꺼내 넣음 ── */
    (function photos() {
      var cache = {}, io = null;
      /* 블로거 피드는 다른 주소로 넘어갈 수 있어 fetch 대신 JSONP(script 태그)로 받음 — 홈 로더와 같은 방식 */
      function feed(id) {
        return new Promise(function (ok, no) {
          var name = '__slImg' + id + '_' + Date.now(), sc = document.createElement('script'), t = setTimeout(function () { done(); no(new Error('timeout')); }, 15000);
          function done() { clearTimeout(t); try { delete window[name]; } catch (e) { window[name] = undefined; } if (sc.parentNode) sc.parentNode.removeChild(sc); }
          window[name] = function (j) { done(); ok(j); };
          sc.onerror = function () { done(); no(new Error('load')); };
          sc.src = '/feeds/pages/default/' + id + '?alt=json-in-script&callback=' + name;
          document.body.appendChild(sc);
        });
      }
      function load(id) {
        if (!cache[id]) cache[id] = feed(id)
          .then(function (j) {
            var t = (((j.entry || {}).content || {}).$t || '').replace(/\s+/g, '');
            var m = t.match(/~~SLB~~img:\d+x\d+:(data:image\/(?:webp|jpeg|png);base64,[A-Za-z0-9+\/=]+)~~SLE~~/);
            if (!m) throw new Error('no image');
            return m[1];
          });
        return cache[id];
      }
      function show(el) {
        var id = el.getAttribute('data-slimg'); if (!id) return;
        el.removeAttribute('data-slimg');
        load(id).then(function (src) { el.src = src; el.classList.add('is-loaded'); }, function () { delete cache[id]; });
      }
      HP.slimg = function (root) {
        var list = (root || document).querySelectorAll('img[data-slimg]');
        if (!list.length) return;
        if (!('IntersectionObserver' in window)) { Array.prototype.forEach.call(list, show); return; }
        io = io || new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); show(e.target); } }); }, { rootMargin: '600px 0px' });
        Array.prototype.forEach.call(list, function (el) { io.observe(el); });
      };
      HP.slimg(document);
      /* 홈은 내용이 나중에 들어오므로 들어올 때마다 다시 찾음 */
      var t = 0;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { HP.slimg(document); }, 50); })
        .observe(document.body, { childList: true, subtree: true });
    })();

    /* ── [S15] 연락처 칸 자동 하이픈: 010-1234-5678 · 02-123-4567 · 032-123-4567 · 1588-1234 (편집기와 같은 규칙) ── */
    HP.fmtTel = function (v) {
      var s = String(v == null ? '' : v).trim();
      if (!s || /^\+/.test(s)) return s;
      var d = s.replace(/\D/g, ''), n = d.length;
      if (!n) return s;
      if (/^1[568]/.test(d)) { d = d.slice(0, 8); return d.length <= 4 ? d : d.slice(0, 4) + '-' + d.slice(4); }
      if (/^02/.test(d)) {
        d = d.slice(0, 10); n = d.length;
        if (n <= 2) return d; if (n <= 5) return d.slice(0, 2) + '-' + d.slice(2);
        if (n <= 9) return d.slice(0, 2) + '-' + d.slice(2, 5) + (n > 5 ? '-' + d.slice(5) : '');
        return d.slice(0, 2) + '-' + d.slice(2, 6) + '-' + d.slice(6);
      }
      if (/^050/.test(d)) {
        d = d.slice(0, 12); n = d.length;
        if (n <= 4) return d; if (n <= 8) return d.slice(0, 4) + '-' + d.slice(4);
        return d.slice(0, 4) + '-' + d.slice(4, 8) + '-' + d.slice(8);
      }
      if (/^0/.test(d)) {
        d = d.slice(0, 11); n = d.length;
        if (n <= 3) return d; if (n <= 6) return d.slice(0, 3) + '-' + d.slice(3);
        if (n <= 10) return d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6);
        return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
      }
      return s;
    };
    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!el || el.tagName !== 'INPUT' || el.type !== 'tel' || !el.closest('.sl-form, #hp-root, .post-body')) return;
      var v0 = el.value, pos = el.selectionStart == null ? v0.length : el.selectionStart;
      var nd = v0.slice(0, pos).replace(/\D/g, '').length, v = HP.fmtTel(v0);
      if (v === v0) return;
      el.value = v;
      var i = 0, c = 0; while (i < v.length && c < nd) { if (/\d/.test(v.charAt(i))) c++; i++; }
      try { el.setSelectionRange(i, i); } catch (err) {}
    });

    /* ── [S14] 사장님 전용 관리 메뉴: 편집기에서 '이 기기에 관리 버튼 켜기'를 누른 기기에서만 보임 ──
         · 주소 ?sladmin=on (또는 편집기 주소) 로 들어오면 이 브라우저에 기억, ?sladmin=off 면 지움
         · 편집기에서 「사이트 보기」로 열면 자동으로 켜짐 (주소에 편집기 주소가 붙어 옴)
         · 편집기 주소는 사이트 설정 가젯의 gasUrl(선택) → 페이지의 data-gas → 켤 때 받은 주소 순으로 찾음
         · 메뉴: 대시보드·통계 / 홈페이지 편집 / 명함 편집 / 손님에게 보내기(홈페이지로 · 모바일 명함으로) / 끄기
         · 편집기로 가는 링크일 뿐이라 다른 사람이 봐도 로그인 없이는 들어갈 수 없음 */
    (function adminMenu() {
      var K = 'slAdminUrl', ON = 'slAdmin', RE = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/;
      var ls = { get: function (k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
                 set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
                 del: function (k) { try { localStorage.removeItem(k); } catch (e) {} } };
      try {
        var q = new URLSearchParams(location.search), v = q.get('sladmin');
        if (v !== null) {
          if (v === 'off') { ls.del(ON); ls.del(K); }
          else { ls.set(ON, '1'); if (RE.test(v)) ls.set(K, v); }
          q.delete('sladmin');
          history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q.toString() : '') + location.hash);
          HP.toast(v === 'off' ? '이 기기에서 관리 버튼을 껐어요.' : '이 기기에서만 관리 버튼이 보여요.');
        }
      } catch (err) {}
      if (!ls.get(ON)) return;

      function gasUrl() {
        var u = '';
        try { var c = JSON.parse((document.getElementById('hp-site-config') || {}).textContent || '{}'); u = c.gasUrl || ''; } catch (e) {}
        if (!RE.test(u)) u = HP.gas ? HP.gas() : '';
        if (!RE.test(u)) u = ls.get(K);
        if (RE.test(u)) ls.set(K, u);            // 다음에 글 화면처럼 주소가 없는 곳에서도 쓰도록 기억
        return RE.test(u) ? u : '';
      }
      var css = document.createElement('style');
      css.textContent =
        '.sl-adm-layer,.sl-adm-layer *{box-sizing:border-box}' +
        '.sl-adm-btn{position:fixed;left:14px;z-index:60;display:inline-flex;align-items:center;gap:6px;padding:10px 14px;border:0;border-radius:999px;background:#111418;color:#fff;font:700 14px/1 Pretendard,-apple-system,sans-serif;box-shadow:0 6px 20px rgba(16,24,40,.25);cursor:pointer}' +
        '.sl-adm-layer{position:fixed;inset:0;z-index:200;background:rgba(10,12,16,.5);display:flex;align-items:flex-end;justify-content:center}' +
        '.sl-adm-sheet{width:100%;max-width:480px;max-height:88vh;overflow:auto;background:#fff;color:#111418;border-radius:22px 22px 0 0;padding:10px 16px calc(18px + env(safe-area-inset-bottom));font:15px/1.5 Pretendard,-apple-system,sans-serif}' +
        '.sl-adm-sheet .grab{width:40px;height:5px;border-radius:5px;background:#e3e5ea;margin:0 auto 12px}' +
        '.sl-adm-sheet h3{margin:4px 4px 10px;font-size:17px;font-weight:800}' +
        '.sl-adm-sheet .lbl{margin:16px 4px 8px;font-size:13px;font-weight:800;color:#6b7280}' +
        '.sl-adm-sheet a.opt,.sl-adm-sheet button.opt{display:flex;align-items:center;gap:12px;width:100%;padding:13px 12px;border:0;border-radius:14px;background:#f5f6f8;color:inherit;font:inherit;font-weight:700;text-align:left;text-decoration:none;margin-bottom:8px;cursor:pointer}' +
        '.sl-adm-sheet .opt small{display:block;font-weight:500;color:#6b7280;font-size:13px}' +
        '.sl-adm-send{display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
        '.sl-adm-send button{padding:14px 10px;border:1px solid #e3e5ea;border-radius:14px;background:#fff;font:inherit;font-weight:800;cursor:pointer}' +
        '.sl-adm-send button.main{background:#111418;color:#fff;border-color:#111418}' +
        '.sl-adm-send small{display:block;font-weight:500;font-size:12px;opacity:.75;margin-top:2px}' +
        '.sl-adm-sheet .close{width:100%;margin-top:10px;padding:13px;border:0;border-radius:14px;background:#f5f6f8;font:inherit;font-weight:800;cursor:pointer}' +
        '.sl-adm-sheet .off{display:block;margin:12px auto 0;border:0;background:none;color:#6b7280;font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}';
      document.head.appendChild(css);

      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sl-adm-btn'; btn.setAttribute('aria-label', '홈페이지 관리 메뉴 열기');
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg><span>관리</span>';
      var place = function () { btn.style.bottom = document.body.classList.contains('has-dock') ? 'calc(88px + env(safe-area-inset-bottom))' : 'calc(16px + env(safe-area-inset-bottom))'; };
      place(); document.body.appendChild(btn);
      setTimeout(place, 1500); setTimeout(place, 4000);   // 홈은 하단 버튼(dock)이 늦게 붙음

      function send(kind) {
        var url = location.origin + (kind === 'card' ? '/p/card.html' : '/');
        var name = (document.querySelector('.sl-foot-name') || {}).textContent || document.title;
        var title = kind === 'card' ? name + ' 모바일 명함' : name;
        if (navigator.share) { navigator.share({ title: title, url: url }).catch(function () {}); return; }
        var done = function () { HP.toast((kind === 'card' ? '명함' : '홈페이지') + ' 주소를 복사했어요. 카카오톡이나 문자에 붙여넣어 보내세요.'); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, function () { prompt('주소를 복사하세요', url); });
        else prompt('주소를 복사하세요', url);
      }
      function open() {
        var g = gasUrl();
        var go = function (tab, title, sub) {
          return g ? '<a class="opt" href="' + g + '?tab=' + tab + '" target="_blank" rel="noopener"><span>' + title + '<small>' + sub + '</small></span></a>' : '';
        };
        var layer = document.createElement('div');
        layer.className = 'sl-adm-layer';
        layer.innerHTML = '<div class="sl-adm-sheet" role="dialog" aria-modal="true" aria-label="홈페이지 관리" tabindex="-1"><div class="grab"></div>' +
          '<h3>홈페이지 관리</h3>' +
          (g ? '' : '<p style="margin:0 4px 8px;color:#b42318;font-size:14px">편집기 주소를 찾지 못했어요. 편집기에서 「사이트 보기」를 눌러 홈페이지를 다시 열어 주세요.</p>') +
          '<p class="lbl">손님에게 보내기</p>' +
          '<div class="sl-adm-send"><button type="button" class="main" data-adm="home">홈페이지로<small>소개·메뉴·오시는 길</small></button>' +
          '<button type="button" data-adm="card">모바일 명함으로<small>연락처 저장·한 화면</small></button></div>' +
          '<p class="lbl">관리</p>' +
          go('dash', '대시보드 · 통계', '새 문의 · 방문 수 · 버튼 누름') +
          go('home', '홈페이지 편집', '문구 · 가격 · 사진 · 섹션 순서') +
          go('card', '모바일 명함 편집', '명함 스타일 · 사진 · 소개 글') +
          go('send', '보내기 주소 보기', '홈페이지·명함 주소 복사') +
          '<button type="button" class="close" data-adm="close">닫기</button>' +
          '<button type="button" class="off" data-adm="off">이 기기에서 관리 버튼 끄기</button></div>';
        var close = function () { if (layer.parentNode) layer.parentNode.removeChild(layer); document.removeEventListener('keydown', esc); btn.focus(); };
        var esc = function (e) { if (e.key === 'Escape') close(); };
        layer.addEventListener('click', function (e) {
          if (e.target === layer) return close();
          var b = e.target.closest('[data-adm]'); if (!b) return;
          var k = b.getAttribute('data-adm');
          if (k === 'home' || k === 'card') send(k);
          else if (k === 'off') { ls.del(ON); ls.del(K); btn.parentNode.removeChild(btn); close(); HP.toast('이 기기에서 관리 버튼을 껐어요.'); }
          else close();
        });
        document.addEventListener('keydown', esc);
        document.body.appendChild(layer);
        layer.firstChild.focus();
      }
      btn.addEventListener('click', open);
    })();

    /* ── [S7] 홈 로더: GAS 가 만든 홈(sl-home 페이지)을 읽어 #hp-root 에 넣음 ──
         글·목록 화면은 같은 홈에서 바닥글·하단 버튼만 가져옴 (30분 보관) */
    (function loadHome() {
      var root = document.getElementById('hp-root');
      var isHome = !!root && document.body.getAttribute('data-page-type') === 'homepage';
      if (!isHome) {
        if (HP.useFoot(document)) return;
        try {
          var kept = JSON.parse(sessionStorage.getItem('slFoot') || 'null');
          if (kept && Date.now() - kept.t < 1800000) { var k = document.createElement('div'); k.innerHTML = kept.h; HP.useFoot(k); return; }
        } catch (err) {}
      }
      var cfg = readJson('hp-site-config') || {};
      var base = location.protocol + '//' + location.host;
      function decode(content) {
        var s = String(content || ''), a = s.indexOf('~~SLB~~'), z = s.indexOf('~~SLE~~');
        if (a < 0 || z < a) return null;
        var p = s.slice(a + 7, z).replace(/\s+/g, '').split(':');
        if (p[0] !== 'home' || !p[2]) return null;
        var bin = atob(p[2]), bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
      }
      /* 불러오기 실패·지연 → 가젯 기본 히어로를 다시 보여 줌 */
      function showFallback() { document.documentElement.classList.remove('hp-home-loading'); }
      var CACHE_KEY = 'slHome:' + location.host, shown = '';
      function inject(html) {
        if (!html) { if (!shown) showFallback(); return; }
        if (html === shown) return;                         // 보관본과 같으면 다시 그리지 않음
        shown = html;
        try { localStorage.setItem(CACHE_KEY, html); } catch (err) {}
        document.documentElement.classList.remove('hp-home-loading');
        var cta = document.getElementById('sl-install-cta'); if (cta) cta.parentNode.removeChild(cta);
        var hero = document.querySelector('#Homepage-Content-Section .hp-hero');
        if (hero) hero.parentNode.removeChild(hero);       // 가젯의 기본 히어로 → 실제 홈으로 교체
        root.innerHTML = html;
        HP.serif(root);
        HP.view();
        HP.useNav();
        HP.useFoot(root);
        if (HP.hours) HP.hours(root);
        if (HP.reveal) HP.reveal(root);
        if (HP.booking) HP.booking(root);
        root.querySelectorAll('img').forEach(function (img) { img.classList.add('is-loaded'); });
      }
      function jsonp(url, cb) {
        var name = '__slHome' + Date.now() + '_' + (HP._jp = (HP._jp || 0) + 1);
        window[name] = function (d) { try { cb(d); } finally { delete window[name]; } };
        var s = document.createElement('script');
        s.src = url + (url.indexOf('?') < 0 ? '?' : '&') + 'alt=json-in-script&callback=' + name;
        s.onerror = function () { if (isHome && !shown) showFallback(); };
        document.body.appendChild(s);
      }
      function footOnly(html) {
        if (!html) return;
        var t = document.createElement('div'); t.innerHTML = html;
        var f = t.querySelector('.sl-sitefoot'), dk = t.querySelector('.sl-dock');
        var keep = (f ? f.outerHTML : '') + (dk ? dk.outerHTML : '');
        try { sessionStorage.setItem('slFoot', JSON.stringify({ t: Date.now(), h: keep })); } catch (err) {}
        HP.useFoot(t);
      }
      /* sl-home 페이지 번호: 사이트 설정 가젯 → 기억해 둔 번호 → 요약 피드에서 제목으로 찾기 */
      var ID_KEY = 'slHomeId:' + location.host;
      function remember(id) { try { localStorage.setItem(ID_KEY, String(id)); } catch (err) {} }
      function findHome(cb) {
        var known = cfg.homePage; if (!known) { try { known = localStorage.getItem(ID_KEY); } catch (err) {} }
        if (known) return cb(known);
        (function next(start) {      /* 사진 보관 페이지가 많아도 100개씩 넘겨 가며 (최대 1,000개) */
          jsonp(base + '/feeds/pages/summary?max-results=100&start-index=' + start, function (d) {
            var bid = String(d && d.feed && d.feed.id && d.feed.id.$t || '').match(/blog-(\d+)/); if (bid) HP.blogId = bid[1];
            var list = (d && d.feed && d.feed.entry) || [];
            for (var i = 0; i < list.length; i++) {
              var m = list[i].title && list[i].title.$t === 'sl-home' && String(list[i].id && list[i].id.$t).match(/page-(\d+)/);
              if (m) { remember(m[1]); return cb(m[1]); }
            }
            if (list.length === 100 && start < 901) return next(start + 100);
            cb(null);
          });
        })(1);
      }
      function content(d) { return decode(d && d.entry && d.entry.content && d.entry.content.$t); }
      /* 아직 사이트루미 홈이 없는 새 블로그: 「설치 시작」 카드 (설치 안내 화면으로 블로그 주소·ID를 넘김) */
      function installCta() {
        if (document.getElementById('sl-install-cta')) return;
        var GUIDE = 'https://sitelumi.blogspot.com/p/install.html';
        var href = GUIDE + '?blog=' + encodeURIComponent(base + '/') + (HP.blogId ? '&id=' + HP.blogId : '');
        var box = document.createElement('section');
        box.id = 'sl-install-cta';
        box.setAttribute('style', 'max-width:560px;margin:32px auto;padding:28px 22px;border-radius:20px;background:#fff;color:#111418;box-shadow:0 10px 40px rgba(16,24,40,.12);text-align:center;font:16px/1.6 Pretendard,-apple-system,sans-serif');
        box.innerHTML = '<p style="margin:0 0 6px;font-size:13px;font-weight:800;letter-spacing:.08em;color:#6b7280">사이트루미</p>' +
          '<h2 style="margin:0 0 10px;font-size:22px;font-weight:800">사이트를 준비하고 있어요</h2>' +
          '<p style="margin:0 0 18px;color:#4b5563">이 블로그의 주인이시면 아래 버튼으로 설치를 이어 가세요. 안내대로 따라 하면 10분쯤 걸립니다.</p>' +
          '<a href="' + href + '" target="_blank" rel="noopener" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#111418;color:#fff;font-weight:800;text-decoration:none">설치 시작</a>';
        var host = document.getElementById('Homepage-Content-Section') || root.parentNode || document.body;
        host.insertBefore(box, host.firstChild);
      }
      if (!isHome) {
        /* 글 화면: 같은 홈에서 바닥글·하단 버튼만 가져옴 */
        findHome(function (id) { if (id) jsonp(base + '/feeds/pages/default/' + encodeURIComponent(id), function (e) { footOnly(content(e)); }); });
        return;
      }
      /* 다시 방문: 지난번 홈을 바로 그리고, 새 내용은 뒤에서 받아 바뀐 경우에만 교체 */
      try { var cached = localStorage.getItem(CACHE_KEY); if (cached) inject(cached); } catch (err) {}
      setTimeout(function () { if (!shown) showFallback(); }, 6000);
      function viaFeed() {
        findHome(function (id) {
          if (!id) { if (!shown) { showFallback(); installCta(); } return; }
          jsonp(base + '/feeds/pages/default/' + encodeURIComponent(id), function (d) {
            var h = content(d);
            if (h) remember(id); else { try { localStorage.removeItem(ID_KEY); } catch (err) {} }
            inject(h);
          });
        });
      }
      /* 머리 부분에서 미리 받기 시작한 내용이 있으면 그걸 씀 (없거나 실패하면 다시 받음) */
      var E = window.__slEarly;
      var useEarly = function (d) { var h = content(d); if (h) inject(h); else viaFeed(); };
      if (E) { if (E.done) useEarly(E.d); else E.cbs.push(useEarly); } else viaFeed();
    })();
  });

  /* 안전장치: 스크립트가 4초 안에 준비되지 않으면 숨겨둔 이미지·섹션을 모두 표시 */
  setTimeout(function () {
    if (!window.__hpReady) document.documentElement.classList.add('hp-reveal-all');
  }, 4000);
})();
