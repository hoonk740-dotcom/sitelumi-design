/*! 디씨젼 랜딩 통계 sl-track.js v1 — 방문 1회당 1번 전송 · 개인정보 수집 없음
 *  사용: <script>window.SLT={id:'LP261115-123456-789'}</script><script src="https://cdn.jsdelivr.net/gh/hoonk740-dotcom/sitelumi-design@main/track/sl-track.js" defer></script>
 *  자동 측정: 방문 · 새 방문자 · 50%/90% 스크롤 · 머문 시간 · 전화(tel:) · 카톡 링크 · 신청 버튼(data-slt="cta" 또는 class에 cta) · 폼 입력 시작 · 폼 제출(신청)
 *  수동: SLT.lead() (폼을 직접 처리할 때 신청 완료 시점에 호출) · SLT.track('cta')
 *  폼에 hidden 칸 name="utm_source|utm_medium|utm_campaign|utm_content|utm_term|slt_ref|slt_landing|slt_device" 가 있으면 유입 정보를 채워 줌
 *  수집 주소는 이 파일에서만 정함 → 파이어베이스로 옮길 때 이 줄만 바꾸면 모든 랜딩페이지가 같이 옮겨짐 */
(function (w, d) {
  'use strict';
  var EP = 'https://script.google.com/macros/s/AKfycbyVFZA4O844YPZPU_nOrkjWm0pvPFCorJMESSWJf3SqrcADhvyLEQrtYnefWIWUOQWz3g/exec';
  var C = w.SLT || {};
  if (!C.id || C._on) return; C._on = 1;
  if (C.ep) EP = C.ep;
  var ua = navigator.userAgent || '';
  if (navigator.webdriver || /bot|crawl|spider|slurp|headless|lighthouse|bingpreview|facebookexternalhit|kakaotalk-scrap|yeti|daumoa/i.test(ua)) return;
  var LS = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var now = Date.now();
  /* 방문자·첫 방문 */
  var vid = LS.get('slt_v'), isNew = !vid;
  if (!vid) { vid = now.toString(36) + Math.random().toString(36).slice(2, 10); LS.set('slt_v', vid); }
  /* 유입 경로: utm → 광고 클릭 ID → 리퍼러 → (30일 안의 마지막 유입) → 직접 */
  var q = {}; location.search.replace(/^\?/, '').split('&').forEach(function (p) { if (!p) return; var i = p.indexOf('='); try { q[decodeURIComponent(i < 0 ? p : p.slice(0, i))] = decodeURIComponent((i < 0 ? '' : p.slice(i + 1)).replace(/\+/g, ' ')); } catch (e) {} });
  var ref = ''; try { ref = d.referrer ? new URL(d.referrer).hostname.replace(/^www\.|^m\./, '') : ''; } catch (e) {}
  if (ref === location.hostname.replace(/^www\.|^m\./, '')) ref = '';
  function fromRef(h) {
    var R = [[/(^|\.)blog\.naver\.com$/, 'naver_blog', 'referral'], [/(^|\.)cafe\.naver\.com$/, 'naver_cafe', 'referral'], [/(^|\.)search\.naver\.com$|(^|\.)naver\.com$/, 'naver', 'organic'],
      [/(^|\.)google\./, 'google', 'organic'], [/(^|\.)daum\.net$/, 'daum', 'organic'], [/(^|\.)bing\.com$/, 'bing', 'organic'], [/instagram\.com$/, 'instagram', 'social'],
      [/facebook\.com$|fb\.com$/, 'facebook', 'social'], [/youtube\.com$|youtu\.be$/, 'youtube', 'social'], [/kakao\.com$|kakao\.co\.kr$/, 'kakao', 'social'], [/tiktok\.com$/, 'tiktok', 'social'],
      [/threads\.net$|threads\.com$/, 'threads', 'social'], [/band\.us$/, 'band', 'social']];
    for (var i = 0; i < R.length; i++) if (R[i][0].test(h)) return { src: R[i][1], med: R[i][2] };
    return { src: h, med: 'referral' };
  }
  var a = null;
  if (q.utm_source) a = { src: q.utm_source, med: q.utm_medium || '', cmp: q.utm_campaign || '', cnt: q.utm_content || '', trm: q.utm_term || '' };
  else if (q.gclid || q.gbraid || q.wbraid) a = { src: 'google', med: 'cpc', cmp: '', cnt: '' };
  else if (q.fbclid) a = { src: ref && /instagram/.test(ref) ? 'instagram' : 'facebook', med: 'social', cmp: '', cnt: '' };
  else if (q.n_media || q.NaPm || q.n_query) a = { src: 'naver', med: 'cpc', cmp: q.n_campaign || '', cnt: q.n_ad || '' };
  else if (q.kclid) a = { src: 'kakao', med: 'cpc', cmp: '', cnt: '' };
  else if (/KAKAOTALK/i.test(ua)) a = { src: 'kakao', med: 'social', cmp: '', cnt: '' };
  else if (/Instagram/i.test(ua)) a = { src: 'instagram', med: 'social', cmp: '', cnt: '' };
  else if (ref) { var r0 = fromRef(ref); a = { src: r0.src, med: r0.med, cmp: '', cnt: '' }; }
  var AK = 'slt_a_' + C.id;
  if (a) LS.set(AK, JSON.stringify({ a: a, t: now }));
  else { try { var o = JSON.parse(LS.get(AK) || 'null'); if (o && now - o.t < 30 * 864e5) a = o.a; } catch (e) {} }
  a = a || { src: '(direct)', med: '(none)', cmp: '', cnt: '' };
  var dev = /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? 't' : /Mobi|iPhone|Android/i.test(ua) ? 'm' : 'd';
  /* 이벤트 — 보낸 만큼은 빼고 남은 것만 다음에 보냄 */
  var ev = { pv: 1, uv: isNew ? 1 : 0, s50: 0, s90: 0, cta: 0, call: 0, kakao: 0, fs: 0, lead: 0, dur: 0 }, sent = {}, vis = d.visibilityState !== 'hidden' ? Date.now() : 0;
  function add(k, n) { ev[k] = (ev[k] || 0) + (n || 1); }
  function send() {
    if (vis) { ev.dur += Math.round((Date.now() - vis) / 1000); vis = d.visibilityState !== 'hidden' ? Date.now() : 0; }
    var out = {}, any = false;
    for (var k in ev) { var v = ev[k] - (sent[k] || 0); if (k === 'dur' && v < 1) continue; if (v > 0) { out[k] = v; any = true; } }
    if (!any || (Object.keys(out).length === 1 && out.dur)) return;   // 머문 시간만 늘었으면 다음 전송에 같이
    for (var j in out) sent[j] = (sent[j] || 0) + out[j];
    var body = JSON.stringify({ v: 1, id: C.id, vid: vid, src: a.src, med: a.med, cmp: a.cmp, cnt: a.cnt, dev: dev, ev: out });
    try { if (navigator.sendBeacon && navigator.sendBeacon(EP, body)) return; } catch (e) {}
    try { fetch(EP, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }); } catch (e) {}
  }
  /* 스크롤 */
  function onScroll() {
    var h = Math.max(d.documentElement.scrollHeight, d.body ? d.body.scrollHeight : 0) - w.innerHeight, p = h > 0 ? (w.scrollY || d.documentElement.scrollTop) / h : 1;
    if (p >= .5 && !ev.s50) ev.s50 = 1;
    if (p >= .9 && !ev.s90) { ev.s90 = 1; w.removeEventListener('scroll', onScroll); }
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  /* 클릭 */
  d.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button,[data-slt]') : null; if (!el) return;
    var href = el.getAttribute('href') || '', tag = el.getAttribute('data-slt') || '';
    if (tag === 'call' || /^tel:/i.test(href)) add('call');
    else if (tag === 'kakao' || /pf\.kakao\.com|open\.kakao\.com|talk\.kakao|^kakaotalk:|kakao\.com\/_/i.test(href)) add('kakao');
    else if (tag === 'cta' || /(^|\s|-)cta(\s|-|$)/i.test(el.className || '')) add('cta');
  }, true);
  /* 폼: 입력 시작 · 제출 = 신청 */
  d.addEventListener('focusin', function (e) { if (!ev.fs && e.target && e.target.form) ev.fs = 1; }, true);
  d.addEventListener('submit', function (e) { if (C.manualLead) return; fill(e.target); add('lead'); send(); }, true);
  /* 숨은 칸 채우기 */
  function fill(root) {
    var map = { utm_source: a.src, utm_medium: a.med, utm_campaign: a.cmp, utm_content: a.cnt, utm_term: a.trm || '', slt_ref: ref, slt_landing: location.pathname, slt_device: { m: '휴대폰', d: '컴퓨터', t: '태블릿' }[dev], slt_id: C.id };
    (root && root.querySelectorAll ? root : d).querySelectorAll('input[name]').forEach(function (i) { if (map.hasOwnProperty(i.name) && !i.value) i.value = map[i.name]; });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { fill(); }); else fill();
  /* 떠날 때 한 번 (다시 돌아와 더 보면 그만큼만 또) */
  d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'hidden') send(); else vis = Date.now(); });
  w.addEventListener('pagehide', send);
  C.lead = function () { add('lead'); send(); };
  C.track = function (k) { if (ev.hasOwnProperty(k) && k !== 'pv' && k !== 'uv') { add(k); } };
  C.attr = function () { return { src: a.src, med: a.med, cmp: a.cmp, cnt: a.cnt, ref: ref, dev: dev }; };
  w.SLT = C;
})(window, document);
