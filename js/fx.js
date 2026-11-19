/* ===== 特效：粒子 / 飘字 / 金币飞入 / 彩带 ===== */
(function () {
  var FX = {};
  var layer = null;
  function L() { if (!layer) layer = document.getElementById('fx'); return layer; }
  FX.setLayer = function (el) { layer = el; };

  FX.center = function (el) {
    if (!el) return { x: innerWidth / 2, y: innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  FX.floatText = function (text, x, y, color) {
    var l = L(); if (!l) return;
    var n = document.createElement('div');
    n.className = 'float-text';
    n.textContent = text;
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    if (color) n.style.color = color;
    l.appendChild(n);
    setTimeout(function () { n.remove(); }, 1200);
  };

  FX.burst = function (x, y, count, spread, colors) {
    var l = L(); if (!l) return;
    count = count || 14;
    colors = colors || ['#FFC82E', '#F0207E', '#4FC62E', '#2794DD', '#A93FE4', '#FF8A2B'];
    for (var i = 0; i < count; i++) {
      var p = document.createElement('i');
      p.className = 'spark';
      var ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      var dist = (spread || 70) * (0.5 + Math.random());
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', (Math.sin(ang) * dist - 20) + 'px');
      p.style.setProperty('--dur', (0.5 + Math.random() * 0.5) + 's');
      var s = 6 + Math.random() * 7;
      p.style.width = s + 'px';
      p.style.height = s + 'px';
      if (Math.random() < 0.35) p.style.borderRadius = '2px';
      l.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 1100); })(p);
    }
  };

  FX.ring = function (x, y, color) {
    var l = L(); if (!l) return;
    var n = document.createElement('div');
    n.className = 'ring';
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    if (color) n.style.borderColor = color;
    l.appendChild(n);
    setTimeout(function () { n.remove(); }, 600);
  };

  FX.flyCoins = function (fromEl, toEl, count) {
    var l = L(); if (!l) return;
    var from = FX.center(fromEl), to = FX.center(toEl);
    count = count || 3;
    for (var i = 0; i < count; i++) {
      (function (idx) {
        setTimeout(function () {
          var c = document.createElement('div');
          c.className = 'fly-coin';
          var jx = (Math.random() - 0.5) * 40, jy = (Math.random() - 0.5) * 26;
          c.style.left = (from.x + jx) + 'px';
          c.style.top = (from.y + jy) + 'px';
          l.appendChild(c);
          void c.offsetWidth;
          c.style.transform = 'translate(' + (to.x - from.x - jx) + 'px,' + (to.y - from.y - jy) + 'px) translate(-50%,-50%) scale(.8)';
          c.style.opacity = '0.15';
          setTimeout(function () { c.remove(); }, 760);
        }, idx * 55);
      })(i);
    }
  };

  FX.confetti = function (host, n) {
    if (!host) return;
    while (host.firstChild) host.removeChild(host.firstChild);
    var colors = ['#FFC82E', '#F0207E', '#2794DD', '#A93FE4', '#FF8A2B', '#4FC62E'];
    for (var i = 0; i < n; i++) {
      var p = document.createElement('i');
      var s = 5 + Math.random() * 8;
      p.style.position = 'absolute';
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = '-24px';
      p.style.width = s + 'px';
      p.style.height = (s * (Math.random() < 0.5 ? 1 : 2.2)) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
      p.style.opacity = '0.92';
      p.style.animation = 'confettiFall ' + (1.5 + Math.random() * 1.4) + 's ease-in ' + (Math.random() * 0.7) + 's forwards';
      host.appendChild(p);
    }
  };

  FX.shake = function (el, ms) {
    if (!el) return;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'cardShake ' + (ms || 400) + 'ms ease-out';
  };

  FX.clear = function () {
    var l = L();
    if (l) while (l.firstChild) l.removeChild(l.firstChild);
  };

  window.MFI = window.MFI || {};
  MFI.FX = FX;
})();
