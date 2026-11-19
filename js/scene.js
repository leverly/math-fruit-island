/* ===== 场景：云 / 彩纸 / 小狮子挂载 ===== */
(function () {
  var SC = {};
  var A = MFI.Art;

  /* 云朵漂浮 */
  SC.buildClouds = function (host) {
    if (!host) return;
    host.innerHTML = '';
    var conf = [
      { x: 6, y: 8, s: 1.0, d: 26, op: .95 },
      { x: 62, y: 3, s: .78, d: 34, op: .9 },
      { x: 34, y: 17, s: .6, d: 42, op: .75 },
      { x: 82, y: 21, s: .52, d: 38, op: .7 }
    ];
    conf.forEach(function (c) {
      var d = document.createElement('div');
      d.style.cssText = 'position:absolute;left:' + c.x + '%;top:' + c.y + '%;width:' +
        (c.s * 108) + 'px;animation:cloudDrift ' + c.d + 's ease-in-out infinite alternate';
      d.innerHTML = A.cloud(c.op);
      d.querySelector('svg').style.width = '100%';
      d.querySelector('svg').style.height = 'auto';
      host.appendChild(d);
    });
    if (!document.getElementById('cloudKf')) {
      var st = document.createElement('style');
      st.id = 'cloudKf';
      st.textContent = '@keyframes cloudDrift{from{transform:translateX(-8px)}to{transform:translateX(14px)}}';
      document.head.appendChild(st);
    }
  };

  /* 彩纸飘落 */
  SC.buildConfetti = function (host) {
    if (!host) return;
    host.innerHTML = '';
    var colors = ['#FFC82E', '#F0207E', '#4FC62E', '#2794DD', '#A93FE4', '#FF8A2B', '#FFF06B'];
    for (var i = 0; i < 16; i++) {
      var p = document.createElement('i');
      var s = 6 + Math.random() * 6;
      p.style.left = (Math.random() * 100) + '%';
      p.style.top = (-10 - Math.random() * 40) + '%';
      p.style.width = s + 'px';
      p.style.height = (s * (0.5 + Math.random())) + 'px';
      p.style.background = colors[i % colors.length];
      p.style.borderRadius = Math.random() < 0.4 ? '50%' : '1.5px';
      p.style.animationDuration = (7 + Math.random() * 7) + 's';
      p.style.animationDelay = (-Math.random() * 10) + 's';
      p.style.opacity = 0.5 + Math.random() * 0.45;
      host.appendChild(p);
    }
  };

  /* 小狮子挂载 */
  SC.mountLion = function (host, size) {
    if (!host) return;
    host.innerHTML = A.lion();
    var svg = host.querySelector('svg');
    if (svg) { svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.display = 'block'; }
    host.classList.add('lion-mounted');
  };

  /* 表情：给狮子加轻微动作 */
  SC.lionBounce = function (host) {
    if (!host) return;
    host.style.animation = 'none';
    void host.offsetWidth;
    host.style.animation = 'lionBounce .5s cubic-bezier(.34,1.56,.64,1)';
    if (!document.getElementById('lionKf')) {
      var st = document.createElement('style');
      st.id = 'lionKf';
      st.textContent = '@keyframes lionBounce{0%{transform:scale(1)}40%{transform:scale(1.1) rotate(-3deg)}100%{transform:scale(1)}}';
      document.head.appendChild(st);
    }
  };

  window.MFI = window.MFI || {};
  MFI.Scene = SC;
})();
