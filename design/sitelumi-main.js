document.addEventListener('DOMContentLoaded', function() {

  /* ── [0] 메타 디스크립션 보완 ──────────────────────────────
     검색설명(data:view.description) 누락 시 Blogger snippet 사용.
     snippet 마저 비어있거나 40자 미만이면 본문 첫 유효 단락 추출.
     Google 크롤러는 JS 실행 후 메타태그를 읽으므로 SEO에 유효.
  ──────────────────────────────────────────────────────────── */
  (function enhanceMetaDesc() {
    /* post / page 유형에서만 실행 */
    var pageType = document.body.getAttribute('data-page-type');
    if (pageType !== 'post' && pageType !== 'page') return;

    var metaDesc  = document.querySelector('meta[name="description"]');
    var metaOg    = document.querySelector('meta[property="og:description"]');
    var metaTw    = document.querySelector('meta[name="twitter:description"]');
    if (!metaDesc) return;

    var current = (metaDesc.getAttribute('content') || '').trim();
    /* 이미 충분한 description이 있으면 유지 */
    if (current.length >= 40) return;

    /* 본문 영역 탐색 */
    var postBody = document.getElementById('post-body') ||
                   document.querySelector('.post-body.entry-content');
    if (!postBody) return;

    /* 1순위: <p> 태그 중 실질적인 텍스트 단락 */
    var extracted = '';
    var paragraphs = postBody.querySelectorAll('p');
    for (var i = 0; i < paragraphs.length; i++) {
      var txt = paragraphs[i].textContent.replace(/\s+/g, ' ').trim();
      if (txt.length >= 30) { extracted = txt; break; }
    }

    /* 2순위: <p>가 없거나 짧으면 본문 전체 텍스트에서 추출 */
    if (!extracted) {
      extracted = postBody.textContent.replace(/\s+/g, ' ').trim();
    }

    if (!extracted) return;

    /* 160자 제한 (SEO 권장) — 단어 경계에서 자르기 */
    if (extracted.length > 160) {
      extracted = extracted.substring(0, 160);
      var lastSpace = extracted.lastIndexOf(' ');
      extracted = (lastSpace > 100 ? extracted.substring(0, lastSpace) : extracted) + '...';
    }

    /* meta description / og:description / twitter:description 동기 업데이트 */
    metaDesc.setAttribute('content', extracted);
    if (metaOg) metaOg.setAttribute('content', extracted);
    if (metaTw) metaTw.setAttribute('content', extracted);
  })();
  var adWarehouse = document.querySelector('.ad-warehouse');
  if (adWarehouse) adWarehouse.style.display = 'none';

  var adWarehouseNav = document.querySelector('.ad-warehouse-nav');
  if (adWarehouseNav) adWarehouseNav.style.display = 'none';


  /* ── [2] 광고 섹션 이동 헬퍼 ─────────────────────────────── */
  function moveElement(sourceId, targetId) {
    var source = document.getElementById(sourceId);
    var target = document.getElementById(targetId);
    if (!source) return;
    if (!target) { source.style.display = 'none'; return; }
    if (source.querySelectorAll('.widget').length > 0) {
      target.appendChild(source);
      source.style.display = 'block';
    } else {
      source.style.display = 'none';
    }
  }

  moveElement('Post-Top-Ad-Zone',    'ad-target-below-title');
  moveElement('Post-Bottom-Ad-Zone', 'post-bottom-target');
  moveElement('Below-Nav-Ad-Zone',   'ad-target-below-nextprev');


  /* ── [3] 중간 광고 삽입 (3번째 h2/h3 앞 또는 단락 중간) ─── */
  var midSource = document.getElementById('Post-Middle-Ad-Zone');
  if (midSource && midSource.querySelectorAll('.widget').length > 0) {
    var postBody = document.getElementById('post-body');
    if (postBody) {
      var headers    = postBody.querySelectorAll('h2, h3');
      var paragraphs = postBody.querySelectorAll('p');
      var inserted   = false;

      if (headers.length >= 3) {
        headers[2].parentNode.insertBefore(midSource, headers[2]);
        inserted = true;
      } else if (paragraphs.length >= 8) {
        var midIdx = Math.floor(paragraphs.length / 2);
        paragraphs[midIdx].parentNode.insertBefore(midSource, paragraphs[midIdx].nextSibling);
        inserted = true;
      }
      midSource.style.display = inserted ? 'block' : 'none';
    }
  }


  /* ── [4] 외부 링크 새 탭 열기 ───────────────────────────── */
  var host  = window.location.hostname;
  var links = document.querySelectorAll('.post-body a');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.hostname && link.hostname !== host &&
        link.href.indexOf('javascript') === -1) {
      link.target = '_blank';
      link.rel    = 'noopener noreferrer';
    }
  }


  /* ── [5] 이미지 처리 (Blogger CDN 한정 업스케일) ────────── */
  var bloggerCdnPattern = /(?:bp\.blogspot\.com|blogger\.googleusercontent\.com)/i;
  var images = document.querySelectorAll('.post-body img');
  images.forEach(function(img, index) {
    /* Blogger CDN 이미지만 처리 */
    if (bloggerCdnPattern.test(img.src) && img.src.match(/\/s[0-9]+[^/]*\//)) {
      img.src = img.src.replace(/\/s[0-9]+[^/]*\//, '/w1200/');
      /* 부모 링크도 Blogger CDN인 경우만 처리 */
      var parentLink = img.parentElement;
      if (parentLink && parentLink.tagName === 'A' &&
          bloggerCdnPattern.test(parentLink.href) &&
          parentLink.href.match(/\/s[0-9]+[^/]*\//)) {
        parentLink.href = parentLink.href.replace(/\/s[0-9]+[^/]*\//, '/s1600/');
      }
    }
    img.setAttribute('loading', index === 0 ? 'eager' : 'lazy');
    img.removeAttribute('width');
    img.removeAttribute('height');
  });


  /* ── [6] 슬라이드 메뉴 ─────────────────────────────────── */
  var trigger  = document.getElementById('slide-menu-trigger');
  var closeBtn = document.getElementById('slide-menu-close');
  var menu     = document.getElementById('slide-menu');
  var overlay  = document.getElementById('slide-menu-overlay');

  if (trigger && menu && overlay) {
    /* PC 메뉴를 모바일 패널로 복사 */
    var pcMenuUl          = document.querySelector('.header-menu-pc ul');
    var mobileMenuContent = document.getElementById('mobile-menu-content');
    if (pcMenuUl && mobileMenuContent) {
      mobileMenuContent.innerHTML = pcMenuUl.outerHTML;
    }

    function toggleMenu(open) {
      if (open) { menu.classList.add('open'); overlay.classList.add('open'); }
      else       { menu.classList.remove('open'); overlay.classList.remove('open'); }
    }
    trigger.addEventListener('click',  function() { toggleMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function() { toggleMenu(false); });
    overlay.addEventListener('click',  function() { toggleMenu(false); });
  }


  /* ── [7] CTA 버튼 자동 변환 ─────────────────────────────── */
  /*
     조건:
       - 이미지를 포함하지 않는 텍스트 링크
       - 부모 블록의 텍스트 전체가 링크 텍스트와 동일
       - 최소 8자 이상 (짧은 단어 오탐 방지)
       - 부모가 heading(h2~h6)인 경우 제외
       - 인라인 style이 실질적으로 존재하는 링크 제외
       - .hp-cta 는 재처리 방지
  */
  var postBodies = document.querySelectorAll('.post-body');
  postBodies.forEach(function(bodyArea) {
    bodyArea.querySelectorAll('a').forEach(function(singleLink) {
      if (singleLink.querySelector('img')) return;
      if (singleLink.classList.contains('hp-cta')) return;
      if (singleLink.closest('.sl-page, .sl-sitefoot')) return;   // 사이트루미 페이지는 자체 버튼 디자인 사용
      if (singleLink.getAttribute('style') && singleLink.getAttribute('style').trim() !== '') return;

      var blockParent = singleLink.closest('p, div, li');
      if (!blockParent) return;

      /* heading 내 링크 제외 */
      var inHeading = singleLink.closest('h1, h2, h3, h4, h5, h6');
      if (inHeading) return;

      var blockText = blockParent.textContent.replace(/\s+/g, '');
      var linkText  = singleLink.textContent.replace(/\s+/g, '');

      if (blockText === linkText && linkText.length >= 8) {
        var wrapperDiv   = document.createElement('div');
        wrapperDiv.className = 'hp-cta-wrap';
        singleLink.className = 'hp-cta';

        var originalText = singleLink.textContent.trim();
        var svgIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
          + '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'
          + '<polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';
        singleLink.innerHTML = '<span>' + originalText + '</span>' + svgIcon;

        var parentEl = singleLink.parentElement;
        if (parentEl) {
          parentEl.insertBefore(wrapperDiv, singleLink);
          wrapperDiv.appendChild(singleLink);
        }
      }
    });
  });

}); // DOMContentLoaded
