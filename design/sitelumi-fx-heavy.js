/*!
 * 사이트루미 무거운 효과 v4.0 (표준 상품부터 · 무게 4) — 쓰는 페이지에서만 따로 불러옴
 *   particles  상호 글자 입자: 상호가 점들로 모였다가 포인터를 피해 흩어짐 (캔버스)
 *   liquid     물결 사진: 포인터가 지나간 자리의 첫 화면 사진이 물결처럼 일렁임 (WebGL)
 *   glaurora   빛의 커튼: 대표색으로 그린 오로라가 천천히 흐름 (WebGL)
 *   depth      2.5D 깊이: 사진·글이 다른 깊이로 포인터·기울기를 따라 움직임
 *   sequence   이어지는 장면: 갤러리 사진이 스크롤에 맞춰 한 장씩 넘어가는 짧은 영상처럼 (갤러리 섹션)
 * 공통: 화면 밖이면 멈춤 · WebGL 이 안 되면 조용히 아무것도 안 함 · 휴대폰은 해상도를 낮춰 그림
 */
(function () {
  'use strict';
  var W = window, D = document;
  if (W.SLFXH) return;
  var mobile = W.innerWidth < 700;

  function visible(el, cb) {
    if (!('IntersectionObserver' in W)) { cb(true); return; }
    new IntersectionObserver(function (es) { cb(es[0].isIntersecting); }).observe(el);
  }
  function keyColors(page) {
    var cs = getComputedStyle(page), pick = function (v, d) { return (cs.getPropertyValue(v) || '').trim() || d; };
    return [pick('--sl-key', '#3355ff'), pick('--sl-key2', '#ff8a65'), pick('--sl-tint', '#9ad1ff')];
  }
  function rgb(c) {
    var x = D.createElement('canvas').getContext('2d'); x.fillStyle = c; var h = x.fillStyle;
    if (/^#/.test(h)) return [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    var m = h.match(/\d+/g) || [128, 128, 128]; return [m[0] / 255, m[1] / 255, m[2] / 255];
  }
  function layerCanvas(host, z) {
    var cv = D.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:' + (z == null ? 1 : z);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    host.insertBefore(cv, host.firstChild); return cv;
  }
  function gl(cv) { try { return cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }) || cv.getContext('experimental-webgl'); } catch (e) { return null; } }
  function program(g, vs, fs) {
    var sh = function (t, src) { var s = g.createShader(t); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; };
    var v = sh(g.VERTEX_SHADER, vs), f = sh(g.FRAGMENT_SHADER, fs); if (!v || !f) return null;
    var p = g.createProgram(); g.attachShader(p, v); g.attachShader(p, f); g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) return null;
    g.useProgram(p);
    var b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    var loc = g.getAttribLocation(p, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    return p;
  }
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';

  var FX = {
    /* 상호 글자 입자 */
    particles: function (hero, o) {
      var cv = layerCanvas(hero, 1), ctx = cv.getContext('2d'), dpr = Math.min(mobile ? 1.5 : 2, W.devicePixelRatio || 1);
      var col = keyColors(hero.closest('.sl-page') || D.body)[0], name = o.name || '', P = [], w = 0, h = 0, mx = -999, my = -999, vis = true, t0 = performance.now();
      function build() {
        var r = hero.getBoundingClientRect(); w = r.width; h = r.height; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        var off = D.createElement('canvas'), oc = off.getContext('2d'); off.width = Math.ceil(w); off.height = Math.ceil(h);
        var fs = Math.min(w / Math.max(2, name.length) * 1.3, h * .32);
        oc.font = '900 ' + fs + 'px Pretendard, sans-serif'; oc.textAlign = 'center'; oc.textBaseline = 'middle'; oc.fillText(name, w / 2, h * .78);
        var data = oc.getImageData(0, 0, off.width, off.height).data, gap = mobile ? 6 : 5; P = [];
        for (var y = 0; y < off.height; y += gap) for (var x = 0; x < off.width; x += gap) if (data[(y * off.width + x) * 4 + 3] > 128) P.push({ hx: x, hy: y, x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0 });
        if (P.length > 3000) P = P.filter(function (_, i) { return i % Math.ceil(P.length / 3000) === 0; });
      }
      build(); W.addEventListener('resize', build);
      hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
      hero.addEventListener('pointerleave', function () { mx = my = -999; });
      visible(hero, function (v) { vis = v; if (v) frame(); });
      function frame() {
        if (!vis) return;
        ctx.clearRect(0, 0, w, h); ctx.fillStyle = col; ctx.globalAlpha = .55;
        var k = Math.min(1, (performance.now() - t0) / 2400);
        for (var i = 0; i < P.length; i++) {
          var p = P[i], dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < 6400) { var f = (6400 - d2) / 6400 * 4 * o.str; p.vx += dx / Math.sqrt(d2 + 1) * f; p.vy += dy / Math.sqrt(d2 + 1) * f; }
          p.vx += (p.hx - p.x) * .02 * k; p.vy += (p.hy - p.y) * .02 * k; p.vx *= .86; p.vy *= .86; p.x += p.vx; p.y += p.vy;
          ctx.fillRect(p.x, p.y, 2, 2);
        }
        requestAnimationFrame(frame);
      }
      frame();
    },

    /* 물결 사진 (WebGL) */
    liquid: function (hero, o) {
      var img = hero.querySelector('.sl-hero-photo img, .sl-hero img'); if (!img) return;
      var go = function () {
        var box = orig.parentNode; box.style.isolation = 'isolate'; var cv = layerCanvas(box, 0), g = gl(cv); if (!g) { cv.remove(); return; }
        var p = program(g, VS, 'precision mediump float;varying vec2 v;uniform sampler2D u;uniform vec2 m,r,ir;uniform float t,s,a;' +
          'void main(){vec2 q=v;q.y=1.-q.y;vec2 d=q-m;d.x*=r.x/r.y;float l=length(d);float w=sin(l*40.-t*4.)*exp(-l*6.)*.02*s*a;' +
          'q+=normalize(d+1e-4)*w;float ra=r.x/r.y,ia=ir.x/ir.y;vec2 sc=ra>ia?vec2(1.,ia/ra):vec2(ra/ia,1.);q=(q-.5)*sc+.5;gl_FragColor=texture2D(u,q);}');
        if (!p) { cv.remove(); return; }
        var tex = g.createTexture(); g.bindTexture(g.TEXTURE_2D, tex);
        try { g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img); } catch (e) { cv.remove(); return; }   // 다른 주소 사진(CORS 막힘)이면 포기
        [g.TEXTURE_WRAP_S, g.TEXTURE_WRAP_T].forEach(function (k) { g.texParameteri(g.TEXTURE_2D, k, g.CLAMP_TO_EDGE); });
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
        var U = function (n) { return g.getUniformLocation(p, n); }, mx = .5, my = .5, amp = 0, vis = true, t0 = performance.now();
        var size = function () { var r = box.getBoundingClientRect(), dpr = mobile ? 1 : Math.min(1.5, W.devicePixelRatio || 1); cv.width = r.width * dpr; cv.height = r.height * dpr; g.viewport(0, 0, cv.width, cv.height); g.uniform2f(U('r'), cv.width, cv.height); };
        size(); W.addEventListener('resize', size);
        orig.style.visibility = 'hidden';
        hero.addEventListener('pointermove', function (e) { var r = box.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; amp = 1; });
        g.uniform1f(U('s'), o.str); g.uniform2f(U('ir'), img.naturalWidth, img.naturalHeight);
        visible(hero, function (v) { vis = v; if (v) frame(); });
        function frame() { if (!vis) return; amp *= .985; g.uniform2f(U('m'), mx, my); g.uniform1f(U('a'), Math.max(amp, .25)); g.uniform1f(U('t'), (performance.now() - t0) / 1000 / o.speed); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); requestAnimationFrame(frame); }
        frame();
      };
      /* 사진을 CORS 로 다시 받아야 WebGL 이 읽을 수 있음 (블로거 사진 주소는 허용) — 막히면 조용히 포기 */
      var src = img; img = new Image(); img.crossOrigin = 'anonymous'; img.decoding = 'async';
      img.onload = go;
      img.src = src.currentSrc || src.src;
      var orig = src;
    },

    /* 빛의 커튼 (WebGL 오로라) */
    glaurora: function (hero, o) {
      var ph = hero.querySelector('.sl-hero-photo'), host = ph || hero; host.style.isolation = 'isolate';
      var cv = layerCanvas(host, ph ? 1 : 0), g = gl(cv); if (!g) { cv.remove(); return; }
      if (ph) ph.appendChild(cv);                                     // 사진 위에 은은하게 (글보다는 아래)
      cv.style.opacity = ph ? '.45' : '.55'; cv.style.mixBlendMode = ph ? 'screen' : 'multiply';
      var p = program(g, VS, 'precision mediump float;varying vec2 v;uniform float t;uniform vec3 c1,c2,c3;' +
        'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
        'float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.;a*=.5;}return s;}' +
        'void main(){vec2 q=v*vec2(3.,1.5);float f=fb(q+vec2(t*.05,t*.02));float g2=fb(q*1.7-vec2(t*.03,0.)+f);vec3 c=mix(c1,c2,smoothstep(.2,.8,f));c=mix(c,c3,smoothstep(.3,.9,g2));' +
        'float band=smoothstep(.25,.6,g2)*smoothstep(1.,.3,v.y);gl_FragColor=vec4(mix(vec3(1.),c,band),1.);}');
      if (!p) { cv.remove(); return; }
      var C = keyColors(hero.closest('.sl-page') || D.body).map(rgb), U = function (n) { return g.getUniformLocation(p, n); };
      g.uniform3fv(U('c1'), C[0]); g.uniform3fv(U('c2'), C[1]); g.uniform3fv(U('c3'), C[2]);
      var size = function () { var r = hero.getBoundingClientRect(), k = mobile ? .5 : .75; cv.width = r.width * k; cv.height = r.height * k; g.viewport(0, 0, cv.width, cv.height); };
      size(); W.addEventListener('resize', size);
      var vis = true, t0 = performance.now();
      visible(hero, function (v) { vis = v; if (v) frame(); });
      function frame() { if (!vis) return; g.uniform1f(U('t'), (performance.now() - t0) / 1000 / o.speed); g.drawArrays(g.TRIANGLE_STRIP, 0, 4); requestAnimationFrame(frame); }
      frame();
    },

    /* 2.5D 깊이: 사진(뒤)·글(앞)이 다른 깊이로 움직임 · 휴대폰은 기울기 */
    depth: function (hero, o) {
      var img = hero.querySelector('.sl-hero-photo img, .sl-hero img'), txt = hero.querySelector('.sl-hero-text, .sl-hero-over .sl-wrap');
      hero.style.perspective = '1200px';
      if (img) { img.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)'; img.style.transform = 'scale(1.08)'; }
      if (txt) txt.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
      var k = 14 * o.str;
      var move = function (x, y) {             // x,y: -1 ~ 1
        if (img) img.style.transform = 'scale(1.08) translate3d(' + (-x * k) + 'px,' + (-y * k) + 'px,0) rotateY(' + (x * 2) + 'deg) rotateX(' + (-y * 2) + 'deg)';
        if (txt) txt.style.transform = 'translate3d(' + (x * k * .6) + 'px,' + (y * k * .6) + 'px,0)';
      };
      hero.addEventListener('pointermove', function (e) { var r = hero.getBoundingClientRect(); move((e.clientX - r.left) / r.width * 2 - 1, (e.clientY - r.top) / r.height * 2 - 1); });
      hero.addEventListener('pointerleave', function () { move(0, 0); });
      if (mobile && 'DeviceOrientationEvent' in W && typeof DeviceOrientationEvent.requestPermission !== 'function')
        W.addEventListener('deviceorientation', function (e) { if (e.gamma == null) return; move(Math.max(-1, Math.min(1, e.gamma / 30)), Math.max(-1, Math.min(1, (e.beta - 45) / 30))); });
      /* 스크롤: 사진이 글보다 천천히 */
      W.addEventListener('scroll', function () { var r = hero.getBoundingClientRect(); if (r.bottom < 0 || !img) return; img.style.translate = '0 ' + (-r.top * .25) + 'px'; }, { passive: true });
    },

    /* 이어지는 장면: 갤러리 사진이 스크롤에 맞춰 넘어감 (섹션을 화면에 붙잡아 두고) */
    sequence: function (sec, o) {
      var imgs = [].slice.call(sec.querySelectorAll('img')).filter(function (x) { return x.getAttribute('src'); });
      if (imgs.length < 3) return;
      var n = Math.min(imgs.length, 12), wrap = D.createElement('div'), stage = D.createElement('div'), bar = D.createElement('i');
      wrap.className = 'slfx-seq'; wrap.style.height = (n * (mobile ? 55 : 70)) + 'vh';
      stage.className = 'slfx-seq-stage'; stage.setAttribute('aria-hidden', 'true');
      stage.style.cssText = 'position:sticky;top:0;height:100vh;overflow:hidden;background:#000';
      var frames = imgs.slice(0, n).map(function (im, i) {
        var f = D.createElement('img'); f.src = im.currentSrc || im.src; f.alt = ''; f.loading = 'lazy'; f.decoding = 'async';
        f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:' + (i ? 0 : 1) + ';transform:scale(1.06);transition:opacity .25s linear';
        stage.appendChild(f); return f;
      });
      bar.style.cssText = 'position:absolute;left:0;bottom:0;height:3px;width:0;background:var(--sl-key,#fff)'; stage.appendChild(bar);
      wrap.appendChild(stage);
      sec.insertBefore(wrap, sec.firstChild);                          // 섹션 폭 전체로
      var cur = 0;
      W.addEventListener('scroll', function () {
        var r = wrap.getBoundingClientRect(), total = r.height - W.innerHeight; if (r.bottom < 0 || r.top > W.innerHeight) return;
        var prog = Math.max(0, Math.min(1, -r.top / total)), idx = Math.min(n - 1, Math.floor(prog * n)), sub = prog * n - idx;
        if (idx !== cur) { frames[cur].style.opacity = 0; cur = idx; }
        frames[idx].style.opacity = 1; frames[idx].style.transform = 'scale(' + (1.06 - sub * .06) + ')';
        if (frames[idx + 1]) frames[idx + 1].style.opacity = sub > .7 ? (sub - .7) / .3 : 0;
        bar.style.width = (prog * 100) + '%';
      }, { passive: true });
    }
  };
  W.SLFXH = FX;
})();
