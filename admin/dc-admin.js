/*! 디씨젼랩 관리 화면 (dc-admin.js) — decisionlabx.com 안에서 #dcadmin 으로 열림
 *  접수 글 = 디씨젼랩 블로그 임시글 (공개·검색 안 됨) · 읽기/처리는 접수 GAS 가 관리자 키로
 *  주소: #dcadmin · #dcadmin/t/라벨 · #dcadmin/q/검색어 · #dcadmin/p/글번호 · #dcadmin/stats(/접수번호)
 *  관리자 키는 이 브라우저에만 저장 (코드·테마에 없음) */
(function () {
  'use strict';
  if (window.__dcAdmin) { window.__dcAdmin(); return; }
  var STATUS = { '새 접수': 'new', '진행 중': 'doing', '보류': 'hold', '완료': 'done' };
  var CFG_KEY = 'dcAdminCfg';
  var DEFAULT_URL = 'https://script.google.com/macros/s/AKfycbzcRM7Tpexe8vIsD-BTCnt72o-e69Cq4voBpXonPnlOytdi_noXjs1RqwghNKMhJSV8xA/exec';
  var TRACK_URL = 'https://script.google.com/macros/s/AKfycbyVFZA4O844YPZPU_nOrkjWm0pvPFCorJMESSWJf3SqrcADhvyLEQrtYnefWIWUOQWz3g/exec';
  function cfg() { var c = {}; try { c = JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) {} c.url = DEFAULT_URL; return c; }
  function escH(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; }); }
  function labelsOf(el) { return Array.prototype.map.call(el.querySelectorAll('.chip, .ad-labels a'), function (x) { return x.textContent.trim(); }).filter(Boolean); }
  function statusOf(ls) { for (var i = 0; i < ls.length; i++) if (STATUS[ls[i]]) return ls[i]; return ''; }
  function api(body) { body.key = cfg().key; return fetch(DEFAULT_URL, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
  var ICON = {
    key: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2"/></svg>',
    x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>'
  };
  var CSS = [
    '#dc-admin{position:fixed;inset:0;z-index:2147483000;overflow:auto;background:#f8fafc;color:#0f172a;font:15px/1.65 Pretendard,"Pretendard Variable",-apple-system,"Apple SD Gothic Neo",sans-serif;word-break:keep-all;overflow-wrap:break-word;-webkit-text-size-adjust:100%}',
    '#dc-admin{--key:#6366f1;--ink:#0f172a;--sub:#475569;--mute:#94a3b8;--line:#e2e8f0;--bg:#f1f5f9;--card:#fff;--new:#e11d48;--doing:#2f5bea;--done:#12805c;--hold:#94a3b8;--r:0px}',
    '#dc-admin *{box-sizing:border-box}#dc-admin a{color:var(--ink);text-decoration:none}#dc-admin button,#dc-admin input,#dc-admin select{font:inherit;color:inherit}',
    '#dc-admin .wrap{max-width:1120px;margin:0 auto;padding:0 22px}',
    '#dc-admin .ad-top{position:sticky;top:0;z-index:5;background:rgba(248,250,252,.96);backdrop-filter:blur(8px);border-bottom:1px solid var(--ink)}',
    '#dc-admin .ad-bar{display:flex;align-items:center;gap:10px;min-height:64px;padding:12px 0 10px}',
    '#dc-admin .ad-logo{display:flex;align-items:baseline;gap:10px;font-family:Pretendard,sans-serif;font-weight:800;font-size:18px;letter-spacing:-.02em;white-space:nowrap}',
    '#dc-admin .ad-logo small{font-family:Pretendard,sans-serif;font-size:12.5px;font-weight:700;color:var(--key)}',
    '#dc-admin .ad-search{flex:1;display:flex;max-width:420px;margin-left:auto}',
    '#dc-admin .ad-search input{flex:1;min-width:0;height:40px;padding:0 14px;border:1px solid var(--line);border-right:0;background:#fff;outline:none}',
    '#dc-admin .ad-search input:focus{border-color:var(--ink)}',
    '#dc-admin .ad-search button{height:40px;padding:0 14px;border:1px solid var(--ink);background:var(--ink);color:#fff;cursor:pointer;display:grid;place-items:center}',
    '#dc-admin .ad-icon{width:40px;height:40px;border:1px solid var(--line);background:#fff;cursor:pointer;display:grid;place-items:center;color:var(--sub);flex:none}',
    '#dc-admin .ad-icon:hover{border-color:var(--ink);color:var(--ink)}',
    '#dc-admin .ad-tabs{display:flex;flex-wrap:wrap;align-items:center;gap:8px 6px;padding:2px 0 14px}',
    '#dc-admin .ad-tabs .grp{flex:none;padding:0 2px 0 4px;color:var(--mute);font-size:12px;font-weight:700;white-space:nowrap}',
    '#dc-admin .ad-tabs a{flex:none;padding:6px 12px;border:1px solid var(--line);background:#fff;color:var(--sub);font-size:14px;white-space:nowrap}',
    '#dc-admin .ad-tabs a:hover{border-color:var(--ink)}#dc-admin .ad-tabs a.on{background:var(--ink);border-color:var(--ink);color:#fff}',
    '#dc-admin .ad-tabs .sep{flex:none;width:1px;height:20px;background:var(--line);margin:0 4px}',
    '#dc-admin main{padding:32px 22px 96px}',
    '#dc-admin .ad-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:0 0 18px}',
    '#dc-admin .ad-head h1{margin:0;font-size:24px;font-weight:900;letter-spacing:-.03em}#dc-admin .ad-head small{color:var(--mute)}',
    '#dc-admin .ad-list{display:grid;gap:8px}',
    '#dc-admin .ad-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:16px 18px;background:var(--card);border:1px solid var(--line);color:var(--ink);transition:border-color .15s}',
    '#dc-admin .ad-item:hover{border-color:var(--ink)}',
    '#dc-admin .ad-item h2{margin:0 0 4px;font-size:16px;font-weight:800;line-height:1.4;letter-spacing:-.02em}',
    '#dc-admin .ad-meta{display:flex;flex-wrap:wrap;gap:6px;align-items:center;color:var(--mute);font-size:13px}',
    '#dc-admin .ad-date{color:var(--mute);font-size:13px;white-space:nowrap}',
    '#dc-admin .chip{display:inline-flex;align-items:center;height:22px;padding:0 8px;background:var(--bg);color:var(--sub);font-size:12px;font-weight:700}',
    '#dc-admin .st{display:inline-flex;align-items:center;justify-content:center;min-width:68px;height:28px;padding:0 10px;font-size:13px;font-weight:800;color:#fff;background:var(--hold)}',
    '#dc-admin .st-new{background:var(--new)}#dc-admin .st-doing{background:var(--doing)}#dc-admin .st-done{background:var(--done)}#dc-admin .st-hold{background:var(--hold)}',
    '#dc-admin .is-photo{display:none}#dc-admin .show-photos .is-photo{display:grid}',
    '#dc-admin .ad-empty{padding:48px 20px;text-align:center;color:var(--mute);background:#fff;border:1px dashed var(--line)}',
    '#dc-admin .ad-pager{display:flex;justify-content:center;margin-top:16px}',
    '#dc-admin .ad-pager a{padding:10px 18px;border:1px solid var(--ink);background:#fff;font-weight:800}',
    '#dc-admin .ad-post{background:var(--card);border:1px solid var(--line);padding:26px}',
    '#dc-admin .ad-post>h1{margin:0 0 8px;font-size:24px;line-height:1.35;font-weight:900;letter-spacing:-.03em}',
    '#dc-admin .ad-actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0 4px;padding:12px;background:var(--bg)}',
    '#dc-admin .ad-actions b{font-size:14px;color:var(--sub);margin-right:4px}',
    '#dc-admin .ad-btn{height:36px;padding:0 14px;border:1px solid var(--line);background:#fff;font-weight:700;font-size:14px;cursor:pointer;color:var(--ink);display:inline-flex;align-items:center;justify-content:center;gap:6px}',
    '#dc-admin .ad-btn:hover{border-color:var(--ink)}#dc-admin .ad-btn.on{color:#fff;border-color:transparent}',
    '#dc-admin .ad-btn[data-to="새 접수"].on{background:var(--new)}#dc-admin .ad-btn[data-to="진행 중"].on{background:var(--doing)}#dc-admin .ad-btn[data-to="완료"].on{background:var(--done)}#dc-admin .ad-btn[data-to="보류"].on{background:var(--hold)}',
    '#dc-admin .ad-msg{font-size:13px;color:var(--sub)}',
    '#dc-admin .post-body{margin-top:18px;font-size:15px}#dc-admin .post-body table{width:100%;border-collapse:collapse}#dc-admin .post-body th,#dc-admin .post-body td{border-bottom:1px solid var(--line);padding:6px 4px;text-align:left;vertical-align:top}',
    '#dc-admin .post-body h3{padding-top:10px;border-top:2px solid var(--ink)}#dc-admin .post-body img{max-width:100%;height:auto}',
    '#dc-admin .post-body .ik-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}#dc-admin .post-body .ik-ph{background:var(--bg);padding:8px}',
    '#dc-admin .post-body a{color:var(--key);text-decoration:underline;text-underline-offset:3px}',
    '#dc-admin .ad-labels{display:flex;flex-wrap:wrap;gap:6px;margin-top:20px;padding-top:16px;border-top:1px solid var(--line)}',
    '#dc-admin .ad-labels a{padding:4px 10px;background:var(--bg);color:var(--sub);font-size:13px}',
    '#dc-admin .ad-nav{display:flex;justify-content:space-between;gap:8px;margin-top:16px}#dc-admin .ad-nav a{color:var(--sub);font-size:14px}',
    '#dc-admin .ad-modal{position:fixed;inset:0;z-index:6;display:none;place-items:center;background:rgba(15,23,42,.5);padding:20px}#dc-admin .ad-modal.on{display:grid}',
    '#dc-admin .ad-modal>div{width:100%;max-width:440px;background:#fff;padding:24px}',
    '#dc-admin .ad-modal h3{margin:0 0 6px;font-size:19px;font-weight:900}#dc-admin .ad-modal p{margin:0 0 12px;color:var(--sub);font-size:14px}',
    '#dc-admin .ad-modal label{display:block;font-weight:800;font-size:14px;margin:10px 0 4px}#dc-admin .ad-modal input{width:100%;height:44px;padding:0 12px;border:1px solid var(--line)}',
    '#dc-admin .ad-modal .row{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}',
    '#dc-admin .ad-hidden{display:none!important}',
    '#dc-admin .ad-gate{max-width:440px;margin:80px auto;padding:28px;background:#fff;border:1px solid var(--ink)}#dc-admin .ad-gate h1{margin:0 0 6px;font-size:22px;font-weight:900}',
    '@media (max-width:640px){#dc-admin .ad-bar{flex-wrap:wrap;row-gap:10px}#dc-admin .ad-top{position:static}#dc-admin .ad-tabs a{padding:5px 10px;font-size:13px}#dc-admin .ad-tabs .sep{display:none}#dc-admin .ad-tabs .grp{flex-basis:100%;padding:4px 0 0}#dc-admin main{padding:22px 16px 80px}#dc-admin .ad-search{order:3;max-width:none;flex-basis:100%}#dc-admin .ad-item{grid-template-columns:1fr auto}#dc-admin .ad-item .st{grid-column:1/-1;justify-self:start}#dc-admin .ad-post{padding:18px}}'
  ].join('\n');
  var TABS = [['all', '전체'], ['새 접수', '새 접수'], ['진행 중', '진행 중'], ['보류', '보류'], ['완료', '완료'], '|', ['문의', '간단 문의'], '|', 'grp:상품', 'PROD', ['사이트루미', '사이트루미 세팅'], '|', 'grp:성과', ['@stats', '랜딩 통계'],
              '|', 'grp:운영', ['주문', '편집기 주문'], ['사이트 목록', '사이트 목록'], ['브랜드 자산', '브랜드 자산'], ['사진', '사진 글'], ['맞춤 코드', '맞춤 코드'], ['씬 등록부', '씬 등록부']];
  var PROD_DEFAULT = ['AI 영상', '상세페이지', '랜딩페이지', '광고 이미지', '썸네일'];
  var root, mainBox, cur = 'all', qWord = '', prevTitle = document.title, prevOverflow = '';
  function tabHref(k) { return k === 'all' ? '#dcadmin' : k === '@stats' ? '#dcadmin/stats' : '#dcadmin/t/' + encodeURIComponent(k); }
  function prodNames() { var c = null; try { c = JSON.parse(localStorage.getItem('dcCatalog2') || 'null'); } catch (e) {} return c && c.c && c.c.products ? c.c.products.map(function (p) { return p.name; }).filter(function (n) { return n !== '홈페이지' && n !== '사이트루미'; }) : PROD_DEFAULT; }
  function drawTabs() {
    var nav = root.querySelector('#ad-tabs'), h = '';
    TABS.forEach(function (t) {
      if (t === '|') h += '<span class="sep">&#8203;</span>';
      else if (typeof t === 'string' && t.indexOf('grp:') === 0) h += '<span class="grp">' + escH(t.slice(4)) + '</span>';
      else if (t === 'PROD') prodNames().forEach(function (n) { h += '<a data-tab="' + escH(n) + '" href="' + tabHref(n) + '">' + escH(n) + '</a>'; });
      else h += '<a data-tab="' + escH(t[0]) + '" href="' + tabHref(t[0]) + '">' + escH(t[1]) + '</a>';
    });
    nav.innerHTML = h;
    nav.querySelectorAll('a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === cur); });
  }
  function refreshCatalog() {
    var cached = null; try { cached = JSON.parse(localStorage.getItem('dcCatalog2') || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.t < 6 * 3600 * 1000) return;
    fetch(DEFAULT_URL + '?a=catalog').then(function (r) { return r.json(); }).then(function (c) {
      if (!c || !c.ok) return; try { localStorage.setItem('dcCatalog2', JSON.stringify({ t: Date.now(), c: c })); } catch (e) {} if (root) drawTabs();
    }).catch(function () {});
  }
  function build() {
    var st = document.createElement('style'); st.id = 'dc-admin-css'; st.textContent = CSS; document.head.appendChild(st);
    root = document.createElement('div'); root.id = 'dc-admin'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', '디씨젼랩 관리');
    root.innerHTML = '<header class="ad-top"><div class="wrap"><div class="ad-bar"><a class="ad-logo" href="#dcadmin">DecisionLAB<small>관리</small></a>' +
      '<form class="ad-search" id="ad-search" role="search"><input aria-label="접수 검색" id="ad-q" placeholder="상호 · 이름 · 접수번호 · 라벨"/><button aria-label="검색" type="submit">' + ICON.search + '</button></form>' +
      '<button class="ad-icon" id="ad-set" title="관리자 키" aria-label="관리자 키" type="button">' + ICON.key + '</button><button class="ad-icon" id="ad-close" title="사이트로 돌아가기" aria-label="닫기" type="button">' + ICON.x + '</button></div>' +
      '<nav aria-label="보기" class="ad-tabs" id="ad-tabs"></nav></div></header><main class="wrap" id="ad-main"></main>' +
      '<div class="ad-modal" id="ad-modal"><div><h3>관리자 키</h3><p>접수 GAS 의 관리자 키를 넣으면 이 브라우저에서만 기억해요. 공용 컴퓨터에서는 쓰지 마세요.</p><label for="ad-key">관리자 키</label><input autocomplete="off" id="ad-key" type="password"/>' +
      '<div class="row"><button class="ad-btn" id="ad-forget" type="button">이 브라우저에서 지우기</button><button class="ad-btn" id="ad-cancel" type="button">닫기</button><button class="ad-btn" id="ad-save" style="background:#0f172a;color:#fff;border-color:#0f172a" type="button">저장</button></div></div></div>';
    document.body.appendChild(root);
    mainBox = root.querySelector('#ad-main');
    root.querySelector('#ad-search').addEventListener('submit', function (e) { e.preventDefault(); var q = root.querySelector('#ad-q').value.trim(); location.hash = q ? '#dcadmin/q/' + encodeURIComponent(q) : '#dcadmin'; });
    root.querySelector('#ad-close').addEventListener('click', function () { history.pushState(null, '', location.pathname + location.search); route(); });
    var modal = root.querySelector('#ad-modal');
    root.querySelector('#ad-set').addEventListener('click', openSet);
    root.querySelector('#ad-cancel').addEventListener('click', function () { modal.classList.remove('on'); });
    root.querySelector('#ad-forget').addEventListener('click', function () { try { localStorage.removeItem(CFG_KEY); } catch (e) {} modal.classList.remove('on'); route(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('on'); });
    root.querySelector('#ad-save').addEventListener('click', function () {
      var key = root.querySelector('#ad-key').value.trim(); if (key.length < 10) { alert('관리자 키를 확인해 주세요.'); return; }
      try { localStorage.setItem(CFG_KEY, JSON.stringify({ key: key })); } catch (e) {}
      modal.classList.remove('on'); route();
    });
  }
  function openSet() { root.querySelector('#ad-key').value = cfg().key || ''; root.querySelector('#ad-modal').classList.add('on'); setTimeout(function () { root.querySelector('#ad-key').focus(); }, 50); }
  function open() {
    if (!root) build();
    root.style.display = '';
    if (!prevOverflow) prevOverflow = document.documentElement.style.overflow || 'x';
    document.documentElement.style.overflow = 'hidden';
    var m = document.querySelector('meta[name="robots"]'); if (m) m.setAttribute('content', 'noindex, nofollow');
    document.title = '관리 · DecisionLAB';
  }
  function close() {
    if (root) root.style.display = 'none';
    document.documentElement.style.overflow = prevOverflow === 'x' ? '' : prevOverflow; prevOverflow = '';
    document.title = prevTitle;
  }
  /* ───── 화면 고르기 ───── */
  function route() {
    var h = location.hash || '';
    if (!/^#dcadmin(\/|$)/.test(h)) { close(); return; }
    open(); refreshCatalog();
    var parts = h.slice(1).split('/'), kind = parts[1] || '', arg = parts.slice(2).join('/');
    try { arg = decodeURIComponent(arg); } catch (e) {}
    qWord = ''; cur = '';
    if (kind === 'p') cur = '';
    else if (kind === 'q') qWord = arg;
    else if (kind === 'stats') cur = '@stats';
    else if (kind === 't') cur = arg;
    else cur = 'all';
    drawTabs();
    root.querySelector('#ad-q').value = qWord;
    root.scrollTop = 0;
    if (!cfg().key) {
      mainBox.innerHTML = '<div class="ad-gate"><h1>관리자 키가 필요해요</h1><p style="color:#475569;font-size:14px">접수 GAS 의 관리자 키를 넣으면 이 브라우저에서만 기억해요.</p><button class="ad-btn" id="ad-gate-key" style="background:#0f172a;color:#fff;border-color:#0f172a" type="button">관리자 키 넣기</button></div>';
      mainBox.querySelector('#ad-gate-key').addEventListener('click', openSet); return;
    }
    if (kind === 'p') return viewPost(arg);
    if (kind === 'stats') return renderStats(mainBox, arg);
    listView();
  }

  /* ───── 목록 ───── */
  function listView() {
    var title = qWord ? '「' + qWord + '」 검색' : cur === 'all' ? '전체 접수' : cur;
    mainBox.innerHTML = '<div class="ad-head"><h1>' + escH(title) + '</h1><small id="ad-count">불러오는 중…</small></div><div class="ad-list" id="ad-list"></div><div class="ad-pager" id="ad-pager"></div>';
    load('', false);
  }
  function say(t) { var cnt = root.querySelector('#ad-count'); if (cnt) cnt.textContent = t; }
  function load(token, more) {
    var list = root.querySelector('#ad-list'), pager = root.querySelector('#ad-pager');
    var want = cur, wantQ = qWord;
    api({ a: 'list', label: qWord || cur === 'all' ? '' : cur, q: qWord, pageToken: token || '' }).then(function (r) {
      if (want !== cur || wantQ !== qWord || !list.isConnected) return;
      if (!r || !r.ok) { say((r && r.msg) || '목록을 못 읽었어요'); if (r && /키/.test(r.msg || '')) openSet(); return; }
      var html = (r.items || []).map(function (x) {
        return '<a class="ad-item" href="#dcadmin/p/' + escH(x.id) + '"><span class="st">…</span><div><h2>' + escH(x.title) + '</h2><div class="ad-meta">' +
          (x.labels || []).map(function (l) { return '<span class="chip">' + escH(l) + '</span>'; }).join('') + '</div></div><span class="ad-date">' + escH(String(x.published || '').slice(0, 10)) + '</span></a>';
      }).join('');
      if (more) list.insertAdjacentHTML('beforeend', html); else list.innerHTML = html;
      decorate(list);
      if (!list.querySelector('.ad-item')) list.innerHTML = '<div class="ad-empty">' + (qWord ? '찾는 접수가 없어요. 상호·접수번호·라벨로 찾아보세요.' : '아직 접수가 없어요.') + '</div>';
      pager.innerHTML = r.next ? '<a href="#" id="ad-more">더 보기</a>' : '';
      var mb = root.querySelector('#ad-more'); if (mb) mb.addEventListener('click', function (e) { e.preventDefault(); load(r.next, true); });
    }).catch(function (e) { say('접수 GAS 에 연결하지 못했어요 (' + (e && e.message || e) + ')'); });
  }
  function decorate(list) {
    if (cur === '사진') list.classList.add('show-photos'); else list.classList.remove('show-photos');
    var shown = 0;
    list.querySelectorAll('.ad-item').forEach(function (it) {
      var ls = labelsOf(it), st = statusOf(ls), badge = it.querySelector('.st');
      var set = function (t, k) { badge.textContent = t; badge.className = 'st st-' + k; shown++; };
      if (ls.indexOf('사이트 목록') >= 0) return set('목록', 'done');
      if (ls.indexOf('맞춤 코드') >= 0) { var sent = ls.indexOf('공개됨') >= 0 ? '공개됨' : ls.indexOf('보냄') >= 0 ? '보냄' : '작성 중'; return set(sent, sent === '작성 중' ? 'hold' : 'done'); }
      if (ls.indexOf('씬 등록부') >= 0) return set('등록부', 'done');
      if (ls.indexOf('브랜드 자산') >= 0) return set('자산', 'done');
      if (ls.indexOf('주문') >= 0) { var paid = ls.indexOf('입금 확인') >= 0; return set(paid ? '입금 확인' : '입금 대기', paid ? 'done' : 'new'); }
      if (ls.indexOf('사진') >= 0) { it.classList.add('is-photo'); badge.textContent = '사진'; badge.className = 'st st-hold'; if (cur === '사진' || qWord) { it.classList.remove('is-photo'); shown++; } return; }
      set(st || '접수', STATUS[st] || 'hold');
      it.querySelectorAll('.chip').forEach(function (c) { if (STATUS[c.textContent] || /^[A-Z]{2}\d{6}-/.test(c.textContent) || /^BA[0-9a-f]+$/.test(c.textContent)) c.style.display = 'none'; });
    });
    say(shown + '건');
  }

  /* ───── 글 보기 ───── */
  function viewPost(id) {
    mainBox.innerHTML = '<div class="ad-empty">접수 글을 불러오는 중…</div>';
    api({ a: 'get', id: id }).then(function (r) {
      if (!r || !r.ok) { mainBox.innerHTML = '<div class="ad-empty">글을 불러오지 못했어요: ' + escH((r && r.msg) || '알 수 없는 오류') + '</div>'; return; }
      var x = r.post;
      mainBox.innerHTML = '<article class="ad-post" data-id="' + escH(x.id) + '"><h1>' + escH(x.title) + '</h1><div class="ad-meta"><span>' + escH(String(x.published || '').slice(0, 16).replace('T', ' ')) + '</span></div>' +
        '<div class="ad-actions" id="ad-actions"><b>상태</b>' + ['새 접수', '진행 중', '보류', '완료'].map(function (t) { return '<button class="ad-btn" data-to="' + t + '" type="button">' + t + '</button>'; }).join('') +
        '<button class="ad-btn ad-hidden" id="ad-confirm" type="button">입금 확인 · 상품 적용</button><button class="ad-btn ad-hidden" id="ad-csend" type="button">초안으로 보내기</button><button class="ad-btn ad-hidden" id="ad-cpub" type="button">바로 공개</button>' +
        '<span style="flex:1"></span><button class="ad-btn ad-hidden" id="ad-brief" style="background:#6366f1;color:#fff;border-color:#6366f1" type="button">Claude 작업 지시서 복사</button><button class="ad-btn ad-hidden" id="ad-copy" type="button">편집기용 데이터 복사</button>' +
        '<a class="ad-btn" href="https://www.blogger.com/blog/post/edit/' + escH(r.blogId) + '/' + escH(x.id) + '" rel="noopener" target="_blank">원본 글 편집</a><span class="ad-msg" id="ad-msg" role="status"></span></div>' +
        '<div class="post-body">' + (x.content || '') + '</div><div class="ad-labels">' + (x.labels || []).map(function (l) { return '<a href="#dcadmin/t/' + encodeURIComponent(l) + '">' + escH(l) + '</a>'; }).join('') + '</div></article>' +
        '<div class="ad-nav"><a href="#dcadmin">← 전체 접수</a></div>';
      mainBox.querySelectorAll('.post-body script').forEach(function (old) { var sc = document.createElement('script'); sc.textContent = old.textContent; old.parentNode.replaceChild(sc, old); });
      initPost(mainBox.querySelector('.ad-post'));
    }).catch(function (e) { mainBox.innerHTML = '<div class="ad-empty">접수 GAS 에 연결하지 못했어요: ' + escH(e && e.message || e) + '</div>'; });
  }

  /* ───── 글 보기 동작 (상태·지시서·편집기 데이터·입금 확인·맞춤 코드) ───── */
    function initPost(post) {
      if (!post) return;
      var ls = labelsOf(post), st = statusOf(ls), msg = document.getElementById('ad-msg'), acts = document.getElementById('ad-actions');
      if (ls.indexOf('사진') >= 0 || ls.indexOf('사이트 목록') >= 0) acts.querySelectorAll('[data-to]').forEach(function (b) { b.classList.add('ad-hidden'); });
      acts.querySelectorAll('[data-to]').forEach(function (b) {
        if (b.getAttribute('data-to') === st) b.classList.add('on');
        b.addEventListener('click', function () { setStatus(b.getAttribute('data-to')); });
      });
      var store = post.querySelector('.sl-store[data-kind="intake"]'), copy = document.getElementById('ad-copy');
      if (store && copy) {
        copy.classList.remove('ad-hidden');
        copy.addEventListener('click', function () {
          var t = store.textContent.replace(/\s+/g, ''), a = t.indexOf('~~SLB~~'), z = t.indexOf('~~SLE~~');
          if (a < 0 || z < a) return;
          var p = t.slice(a + 7, z).split(':'), json;
          try { json = decodeURIComponent(escape(atob(p.slice(2).join(':')))); } catch (e) { msg.textContent = '데이터를 읽지 못했습니다.'; return; }
          var done = function () { msg.textContent = '복사했습니다. 편집기 「접수 내용 불러오기」에 붙여 넣으세요.'; };
          if (navigator.clipboard) navigator.clipboard.writeText(json).then(done, function () { prompt('복사해 주세요', json); });
          else { prompt('복사해 주세요', json); }
        });
      }
      /* Claude 작업 지시서: 접수 내용으로 만든 기획·제작 지시문 (Claude 에 붙여 넣기 · 웹 검색 켜기) */
      var bstore = post.querySelector('.sl-store[data-kind="brief"]'), bbtn = document.getElementById('ad-brief');
      if (bstore && bbtn) {
        bbtn.classList.remove('ad-hidden');
        bbtn.addEventListener('click', function () {
          var t = bstore.textContent.replace(/\s+/g, ''), a = t.indexOf('~~SLB~~'), z = t.indexOf('~~SLE~~');
          if (a < 0 || z < a) return;
          var txt; try { txt = decodeURIComponent(escape(atob(t.slice(a + 7, z).split(':').slice(2).join(':')))); } catch (e) { msg.textContent = '지시서를 읽지 못했습니다.'; return; }
          var ok = function () { msg.textContent = '복사했어요. Claude 새 대화에 붙여 넣으세요 (웹 검색 켜기 · 자료 사진은 함께 올려 주세요).'; };
          if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, function () { prompt('복사해 주세요', txt); }); else prompt('복사해 주세요', txt);
        });
      }
      /* 주문 글: 상태 버튼 대신 「입금 확인 · 상품 적용」 (판매자 서명 등급 증명 발급 → 구매자 사이트에 바로 적용) */
      var cbtn = document.getElementById('ad-confirm');
      if (ls.indexOf('주문') >= 0 && cbtn) {
        acts.querySelectorAll('[data-to]').forEach(function (b) { b.classList.add('ad-hidden'); });
        if (ls.indexOf('입금 확인') >= 0) msg.textContent = '입금 확인 완료된 주문입니다.';
        else cbtn.classList.remove('ad-hidden');
        cbtn.addEventListener('click', function () {
          var c = cfg();
          if (!c.url || !c.key) { openSet(); return; }
          if (!confirm('통장에 입금이 들어온 것을 확인하셨나요?\n확인을 누르면 등급 증명을 발급해 구매자 사이트에 바로 적용합니다.')) return;
          cbtn.disabled = true; msg.textContent = '적용하는 중… (10~30초)';
          fetch(c.url, { method: 'POST', body: JSON.stringify({ a: 'confirm', key: c.key, postId: post.getAttribute('data-id') }) })
            .then(function (r) { return r.json(); })
            .then(function (r) { if (!r.ok) throw new Error(r.msg || '실패'); msg.textContent = r.msg; cbtn.classList.add('ad-hidden'); setTimeout(route, 2500); })
            .catch(function (e) { cbtn.disabled = false; msg.textContent = '적용하지 못했습니다: ' + e.message + ' (설정 확인)'; });
        });
      }
      /* 맞춤 코드 글: <textarea data-sl="css|js|hero|note"> · <textarea data-sl="section" data-id="섹션ID"> (HTML 그대로 쓸 수 있음, <pre> 도 됨) · 라벨 site:블로그ID */
      if (ls.indexOf('맞춤 코드') >= 0) {
        acts.querySelectorAll('[data-to]').forEach(function (b) { b.classList.add('ad-hidden'); });
        var site = ls.filter(function (l) { return /^site:\d+$/.test(l); })[0];
        var collect = function () {
          var b = { css: '', js: '', hero: '', note: '', sections: {} };
          post.querySelectorAll('.post-body [data-sl]').forEach(function (el) {
            var k = el.getAttribute('data-sl'), t = (el.tagName === 'TEXTAREA' ? el.value : el.textContent).replace(/^\n/, '');
            if (k === 'section') { var id = el.getAttribute('data-id'); if (id) b.sections[id] = t; }
            else if (b.hasOwnProperty(k)) b[k] += (b[k] ? '\n' : '') + t;
          });
          return b;
        };
        var sendC = function (publish) {
          var c = cfg(); if (!c.url || !c.key) { openSet(); return; }
          if (!site) { msg.textContent = '라벨에 site:블로그ID 를 넣어 주세요 (사이트 목록 글에 블로그 ID 가 있어요).'; return; }
          var b = collect(), size = JSON.stringify(b).length;
          if (b.js) { try { new Function('page', 'HP', b.js); } catch (e) { msg.textContent = 'JS 문법 오류: ' + e.message; return; } }
          if (!confirm((publish ? '바로 공개합니다.' : '초안으로 보냅니다.') + '\n받는 사이트: ' + site.slice(5) + '\n크기: ' + Math.round(size / 100) / 10 + 'KB')) return;
          msg.textContent = '보내는 중… (10~30초)';
          fetch(c.url, { method: 'POST', body: JSON.stringify({ a: 'customSend', key: c.key, blogId: site.slice(5), postId: post.getAttribute('data-id'), publish: publish, bundle: b }) })
            .then(function (r) { return r.json(); })
            .then(function (r) { if (!r.ok) throw new Error(r.msg || '실패'); msg.textContent = r.msg; setTimeout(route, 2500); })
            .catch(function (e) { msg.textContent = '보내지 못했습니다: ' + e.message; });
        };
        ['ad-csend', 'ad-cpub'].forEach(function (id, i) { var b = document.getElementById(id); b.classList.remove('ad-hidden'); b.addEventListener('click', function () { sendC(i === 1); }); });
        if (!site) msg.textContent = '라벨에 site:블로그ID 가 없습니다.';
      }
      function setStatus(to) {
        var c = cfg();
        if (!c.url || !c.key) { openSet(); return; }
        msg.textContent = '바꾸는 중…';
        fetch(c.url, { method: 'POST', body: JSON.stringify({ a: 'status', key: c.key, postId: post.getAttribute('data-id'), to: to }) })
          .then(function (r) { return r.json(); })
          .then(function (r) {
            if (!r.ok) throw new Error(r.msg || '실패');
            acts.querySelectorAll('[data-to]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-to') === to); });
            msg.textContent = '「' + to + '」로 바꿨습니다.';
          })
          .catch(function (e) { msg.textContent = '바꾸지 못했습니다: ' + e.message + ' (설정 확인)'; });
      }
    }

  /* ───── 랜딩 통계 ───── */
  function renderStats(mainBox, sel0) { (function () {
      var c = cfg(), ID_RE = /^[A-Z]{2}\d{6}-\d{6}-\d{3}$/, days = 30, sel = sel0 || '', names = {}, last = null;
      var SRC = { '(direct)': '직접 방문', naver: '네이버', google: '구글', daum: '다음', kakao: '카카오', instagram: '인스타그램', facebook: '페이스북', meta: '메타', youtube: '유튜브', tiktok: '틱톡', naver_blog: '네이버 블로그', naver_cafe: '네이버 카페', band: '밴드', threads: '스레드', qr: 'QR(오프라인)' };
      var MED = { '(none)': '', cpc: '광고', paid: '광고', ad: '광고', display: '배너 광고', organic: '검색', social: 'SNS', referral: '링크', qr: 'QR', email: '이메일', sms: '문자', offline: '오프라인' };
      function chName(k) { var p = k.split(' / '), s = SRC[p[0]] || p[0], m = MED[p[1]] != null ? MED[p[1]] : p[1]; return m ? s + ' · ' + m : s; }
      function n(x) { return Number(x || 0).toLocaleString('ko-KR'); }
      function pct(a, b) { return b ? (a / b * 100).toFixed(1) + '%' : '-'; }
      function dpct(a, b) { if (!b) return a ? '신규' : '-'; var d = (a - b) / b * 100; return (d >= 0 ? '+' : '') + d.toFixed(0) + '%'; }
      function diff(a, b) { var t = dpct(a, b); return t === '-' ? '' : '<i style="font-style:normal;font-size:12px;margin-left:6px;color:' + (t.charAt(0) === '-' ? '#B42318' : '#067647') + '">' + t + '</i>'; }
      function secs(s, v) { if (!v) return '-'; var a = Math.round(s / v); return a >= 60 ? Math.floor(a / 60) + '분 ' + (a % 60) + '초' : a + '초'; }
      function post(body) { body.key = c.key; return fetch(TRACK_URL, { method: 'POST', body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
      function copy(t, btn) { var done = function () { var o = btn.textContent; btn.textContent = '복사했어요'; setTimeout(function () { btn.textContent = o; }, 1500); }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { prompt('복사하세요', t); }); else prompt('복사하세요', t); }
      var st = document.createElement('style');
      st.textContent = '.ts-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 14px}.ts-bar select,.ts-bar input{font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:#fff;min-width:0}' +
        '.ts-seg button{font:inherit;font-size:13px;padding:6px 12px;border:1px solid var(--line);background:#fff;border-radius:999px;cursor:pointer;margin-right:4px}.ts-seg button.on{background:var(--ink);color:#fff;border-color:var(--ink)}' +
        '.ts-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin:0 0 14px}.ts-card{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:12px 14px}.ts-card span{display:block;color:var(--sub);font-size:12px}.ts-card b{font-size:22px;letter-spacing:-.02em}' +
        '.ts-box{background:#fff;border:1px solid var(--line);border-radius:var(--r);padding:14px 16px;margin:0 0 12px;overflow-x:auto}.ts-box h2{font-size:15px;margin:0 0 8px}.ts-box table{width:100%;border-collapse:collapse;font-size:13px}.ts-box th,.ts-box td{text-align:right;padding:6px;border-bottom:1px solid var(--line);white-space:nowrap}.ts-box th:first-child,.ts-box td:first-child{text-align:left}.ts-box th{color:var(--sub);font-weight:500}' +
        '.ts-acts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}.ts-out{word-break:break-all;font-size:13px;background:var(--bg);border-radius:10px;padding:8px 10px;margin-top:8px}.ts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}.ts-grid label{font-size:12px;color:var(--sub);display:block}.ts-grid input,.ts-grid select{width:100%;font:inherit;padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:#fff}';
      if (!document.getElementById('ts-style')) { st.id = 'ts-style'; document.head.appendChild(st); }
      mainBox.innerHTML = '<div class="ad-head"><h1>랜딩 통계</h1><small id="ts-msg">불러오는 중…</small></div>' +
        '<div class="ts-bar"><select id="ts-id" aria-label="랜딩페이지 고르기"><option value="">랜딩페이지 고르기</option></select>' +
        '<span class="ts-seg" id="ts-seg"><button data-d="7" type="button">7일</button><button data-d="30" type="button" class="on">30일</button><button data-d="90" type="button">90일</button></span></div>' +
        '<div id="ts-view"></div>' +
        '<div class="ts-box"><h2>추적 링크 만들기</h2><div class="ts-grid">' +
        '<div style="grid-column:1/-1"><label for="ts-u">랜딩페이지 주소</label><input id="ts-u" placeholder="https://…"/></div>' +
        '<div><label for="ts-s">채널</label><select id="ts-s"><option value="naver|cpc">네이버 광고</option><option value="naver_blog|referral">네이버 블로그</option><option value="naver_cafe|referral">네이버 카페</option><option value="instagram|social">인스타그램 (게시물·프로필)</option><option value="instagram|cpc">인스타그램 광고</option><option value="facebook|cpc">페이스북 광고</option><option value="kakao|social">카카오톡 채널·공유</option><option value="kakao|cpc">카카오 광고</option><option value="youtube|social">유튜브</option><option value="google|cpc">구글 광고</option><option value="qr|offline">QR (전단·포스터·매장)</option><option value="sms|sms">문자</option><option value="band|social">밴드</option></select></div>' +
        '<div><label for="ts-c">캠페인 (예: 2026_11_오픈)</label><input id="ts-c"/></div><div><label for="ts-t">소재 (예: 영상a, 포스터b)</label><input id="ts-t"/></div></div>' +
        '<div class="ts-acts" style="margin:10px 0 0"><button class="ad-btn" id="ts-mk" type="button">링크 만들기 · 복사</button></div><div class="ts-out" id="ts-link" hidden></div></div>';
      var msg = document.getElementById('ts-msg'), pick = document.getElementById('ts-id'), view = document.getElementById('ts-view');
      if (!c.key) { msg.textContent = '오른쪽 위 열쇠 버튼에 관리자 키를 넣으면 통계가 보여요'; return; }
      function fill(ids) {
        var all = {}; Object.keys(names).forEach(function (k) { all[k] = { id: k, pv: 0, lead: 0 }; }); (ids || []).forEach(function (x) { all[x.id] = x; });
        var list = Object.keys(all).map(function (k) { return all[k]; }).sort(function (a, b) { return (b.last || '') < (a.last || '') ? -1 : 1; });
        pick.innerHTML = '<option value="">랜딩페이지 고르기 (' + list.length + ')</option>' + list.map(function (x) { return '<option value="' + escH(x.id) + '"' + (x.id === sel ? ' selected' : '') + '>' + escH((names[x.id] || '이름 없음') + ' · ' + x.id + (x.pv ? ' · 방문 ' + n(x.pv) : '')) + '</option>'; }).join('');
        msg.textContent = list.length ? '랜딩페이지 ' + list.length + '곳' : '아직 랜딩페이지 접수나 통계가 없어요';
        if (sel) load();
      }
      Promise.all([
        fetch(DEFAULT_URL, { method: 'POST', body: JSON.stringify({ a: 'list', key: c.key, label: '랜딩페이지', q: '', pageToken: '' }) }).then(function (r) { return r.json(); }).catch(function () { return null; }),
        post({ a: 'ids', days: 400 }).catch(function (e) { return { ok: false, msg: String(e && e.message || e) }; })
      ]).then(function (res) {
        ((res[0] && res[0].items) || []).forEach(function (x) { var no = (x.labels || []).filter(function (l) { return ID_RE.test(l); })[0]; if (no) names[no] = String(x.title || '').replace(/^\[[^\]]*\]\s*/, '').split(' · ')[0]; });
        if (res[1] && res[1].ok === false) msg.textContent = '통계 서버 응답: ' + (res[1].msg || '확인 필요') + ' (수집기 트랙설정 실행 여부 확인)';
        fill(res[1] && res[1].ids);
        if (res[1] && res[1].ok === false) msg.textContent = '통계 서버 응답: ' + (res[1].msg || '확인 필요');
      });
      pick.addEventListener('change', function () { sel = pick.value; history.replaceState(null, '', '#dcadmin/stats' + (sel ? '/' + sel : '')); if (sel) load(); else view.innerHTML = ''; });
      document.getElementById('ts-seg').addEventListener('click', function (e) { var b = e.target.closest('button'); if (!b) return; days = Number(b.getAttribute('data-d')); this.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); }); if (sel) load(); });
      function table(title, rows, nameFn) {
        if (!rows || !rows.length) return '';
        return '<div class="ts-box"><h2>' + title + '</h2><table><tr><th>구분</th><th>방문</th><th>신청</th><th>전환율</th><th>전화</th><th>카톡</th><th>버튼</th><th>끝까지 읽음</th></tr>' +
          rows.map(function (r) { return '<tr><td>' + escH(nameFn(r.key)) + '</td><td>' + n(r.pv) + '</td><td>' + n(r.lead) + '</td><td>' + pct(r.lead, r.pv) + '</td><td>' + n(r.call) + '</td><td>' + n(r.kakao) + '</td><td>' + n(r.cta) + '</td><td>' + pct(r.s90, r.pv) + '</td></tr>'; }).join('') + '</table></div>';
      }
      function chart(D) {
        var W = 900, H = 170, pad = 22, ds = D.byDay, max = Math.max.apply(null, ds.map(function (d) { return d.pv; }).concat([1])), maxL = Math.max.apply(null, ds.map(function (d) { return d.lead; }).concat([1])), bw = (W - pad * 2) / ds.length;
        var s = '<svg viewBox="0 0 ' + W + ' ' + (H + 24) + '" width="100%" role="img" aria-label="날짜별 방문과 신청">';
        ds.forEach(function (d, i) {
          var bh = (H - pad) * d.pv / max, x = pad + i * bw;
          s += '<rect x="' + (x + bw * .15) + '" y="' + (H - bh) + '" width="' + (bw * .7) + '" height="' + bh + '" rx="2" fill="#2F5BEA" opacity=".8"><title>' + d.key + ' 방문 ' + d.pv + ' · 신청 ' + d.lead + '</title></rect>';
          if (d.lead) s += '<circle cx="' + (x + bw / 2) + '" cy="' + (H - (H - pad) * d.lead / maxL) + '" r="3.5" fill="#F79009"/>';
          if (i % Math.max(1, Math.ceil(ds.length / 8)) === 0) s += '<text x="' + (x + bw / 2) + '" y="' + (H + 17) + '" font-size="11" text-anchor="middle" fill="#98A2B3">' + d.key.slice(5).replace('-', '.') + '</text>';
        });
        return s + '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + H + '" y2="' + H + '" stroke="#E4E7EC"/></svg>';
      }
      function reportText(D) {
        var T = D.total, P = D.prev, nm = names[D.id] || D.id;
        var ch = D.bySource.slice(0, 5).map(function (r) { return '- ' + chName(r.key) + ': 방문 ' + n(r.pv) + ' / 신청 ' + n(r.lead) + ' (' + pct(r.lead, r.pv) + ')'; }).join('\n');
        return '[광고 성과 보고] ' + nm + '\n기간: ' + D.from + ' ~ ' + D.to + ' (' + D.days + '일, 직전 같은 기간과 비교)\n\n' +
          '방문 ' + n(T.pv) + ' (' + dpct(T.pv, P.pv) + ') · 신청 ' + n(T.lead) + ' (' + dpct(T.lead, P.lead) + ') · 전환율 ' + pct(T.lead, T.pv) + '\n' +
          '전화 클릭 ' + n(T.call) + ' · 카톡 클릭 ' + n(T.kakao) + ' · 평균 머문 시간 ' + secs(T.dur, T.pv) + '\n\n채널별\n' + (ch || '- 아직 없음') + '\n\n다음 할 일\n1. \n2. \n3. \n\n자세히 보기: ' + D.report;
      }
      function claudeText(D) {
        var slim = { 기간: D.from + '~' + D.to, 합계: D.total, 직전기간: D.prev, 채널별: D.bySource.slice(0, 12), 캠페인소재별: D.byCampaign.slice(0, 12), 기기별: D.byDev, 날짜별: D.byDay.map(function (d) { return [d.key, d.pv, d.lead]; }) };
        return '너는 디씨젼의 퍼포먼스 마케터다. 아래는 「' + (names[D.id] || D.id) + '」 랜딩페이지(접수번호 ' + D.id + ')의 자체 추적 통계다. 지표: pv 방문, uv 새 방문자, lead 신청, call 전화 클릭, kakao 카톡 클릭, cta 신청 버튼 클릭, fs 폼 입력 시작, s50/s90 50%·90% 스크롤, dur 머문 시간 합계(초).\n\n' +
          '의뢰인(소상공인)에게 보낼 카톡 보고서를 써라: ① 한 줄 요약 ② 핵심 숫자 3개와 직전 기간 대비 ③ 잘 된 채널·안 된 채널과 이유 추정(추정이라고 표시) ④ 다음 할 일 3개(예산 이동·소재 교체·페이지 수정 중 구체적으로) ⑤ 자세히 보기 링크: ' + D.report + '\n숫자는 아래 데이터에 있는 것만 쓰고 지어내지 마라. 표본이 적으면(방문 100 미만) 판단을 보류한다고 써라.\n\n```json\n' + JSON.stringify(slim) + '\n```';
      }
      function load() {
        view.innerHTML = '<div class="ad-empty">불러오는 중…</div>';
        post({ a: 'stats', id: sel, days: days }).then(function (D) {
          if (!D || !D.ok) { view.innerHTML = '<div class="ad-empty">' + escH((D && D.msg) || '통계를 못 읽었어요') + '</div>'; return; }
          last = D; var T = D.total, P = D.prev;
          var cards = [['방문', T.pv, P.pv], ['신청', T.lead, P.lead], ['전화 클릭', T.call, P.call], ['카톡 클릭', T.kakao, P.kakao], ['신청 버튼', T.cta, P.cta]];
          view.innerHTML = '<div class="ts-acts"><button class="ad-btn" id="ts-rep" type="button">구매자 보고 링크 복사</button><button class="ad-btn" id="ts-txt" type="button">보고 문구 복사</button>' +
            '<button class="ad-btn" id="ts-ai" style="background:#D97757;color:#fff;border-color:#D97757" type="button">Claude 분석 요청 복사</button><a class="ad-btn" href="' + escH(D.report) + '" target="_blank" rel="noopener">보고 화면 열기</a></div>' +
            '<div class="ts-cards">' + cards.map(function (x) { return '<div class="ts-card"><span>' + x[0] + '</span><b>' + n(x[1]) + diff(x[1], x[2]) + '</b></div>'; }).join('') +
            '<div class="ts-card"><span>전환율</span><b>' + pct(T.lead, T.pv) + '</b></div><div class="ts-card"><span>평균 머문 시간</span><b style="font-size:18px">' + secs(T.dur, T.pv) + '</b></div></div>' +
            '<div class="ts-box"><h2>날짜별 <small style="color:var(--mute);font-weight:400">막대 방문 · 점 신청 · ' + escH(D.from + ' ~ ' + D.to) + '</small></h2>' + chart(D) + '</div>' +
            table('유입 채널별', D.bySource, chName) + table('캠페인 · 소재별', D.byCampaign, function (k) { return k; }) + table('기기별', D.byDev, function (k) { return k; }) +
            (T.pv ? '' : '<div class="ad-empty">이 기간에 들어온 방문이 아직 없어요. 랜딩페이지에 추적 코드(window.SLT id=' + escH(D.id) + ')가 들어갔는지 확인하세요.</div>');
          document.getElementById('ts-rep').onclick = function () { copy(D.report, this); };
          document.getElementById('ts-txt').onclick = function () { copy(reportText(D), this); };
          document.getElementById('ts-ai').onclick = function () { copy(claudeText(D), this); };
        }).catch(function (e) { view.innerHTML = '<div class="ad-empty">통계 서버에 연결하지 못했어요 (' + escH(e && e.message || e) + ')</div>'; });
      }
      document.getElementById('ts-mk').addEventListener('click', function () {
        var u = document.getElementById('ts-u').value.trim(), sv = document.getElementById('ts-s').value.split('|'), out = document.getElementById('ts-link');
        if (!/^https?:\/\//.test(u)) { out.hidden = false; out.textContent = '랜딩페이지 주소를 https:// 부터 넣어 주세요'; return; }
        var clean = function (t) { return t.trim().replace(/\s+/g, '_'); }, cmp = clean(document.getElementById('ts-c').value), cnt = clean(document.getElementById('ts-t').value);
        var q = 'utm_source=' + encodeURIComponent(sv[0]) + '&utm_medium=' + encodeURIComponent(sv[1]) + (cmp ? '&utm_campaign=' + encodeURIComponent(cmp) : '') + (cnt ? '&utm_content=' + encodeURIComponent(cnt) : '');
        var link = u.split('#')[0] + (u.indexOf('?') >= 0 ? '&' : '?') + q;
        out.hidden = false; out.textContent = link; copy(link, this);
      });
    })(); }
  window.__dcAdmin = route;
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  route();
})();
