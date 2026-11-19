/* ===== 主控：路由 / 主页 / 结算 / 图鉴 ===== */
(function () {
  var A = {};
  var $ = function (id) { return document.getElementById(id); };
  var store = null;
  var screens = {};
  var current = '';
  var lastRun = null;

  function h(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  A.vibe = function (p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } };

  A.flashCoins = function (n) {
    var pill = $('coinNum');
    if (pill) {
      pill.textContent = n;
      var p = pill.parentNode;
      p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump');
    }
  };

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('hidden', k !== name);
    });
    current = name;
    var d = store.get();
    if (name === 'home' || name === 'result' || name === 'dex') {
      A.flashCoins(d.coins);
      $('starNum').textContent = store.totalStars();
    }
    var app = $('app');
    if (app) app.scrollTop = 0;
  }
  A.show = show;

  /* ---------- 主页 ---------- */
  /* 当前年级/学期 */
  function curGrade() { return store.get().grade || 'g1'; }
  function curTerm() { return store.get().term || 'up'; }

  /* 渲染年级选择器 */
  function renderGradePicker() {
    var host = $('gradePicker');
    clear(host);
    var g = curGrade();
    MFI.Data.GRADES.forEach(function (gr) {
      var b = h('button', 'grade-btn' + (gr.id === g ? ' on' : ''), gr.short + '年级');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', gr.id === g ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (curGrade() === gr.id) return;
        MFI.Audio.play('click');
        MFI.Audio.play('whoosh');
        store.setGrade(gr.id);
        renderHome();
      });
      host.appendChild(b);
    });
  }

  /* 渲染学期选择器 */
  function renderTermPicker() {
    var host = $('termPicker');
    clear(host);
    var g = curGrade(), t = curTerm();
    MFI.Data.TERMS.forEach(function (tm) {
      var st = store.termStats(g, tm.id);
      var b = h('button', 'term-btn' + (tm.id === t ? ' on' : ''));
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', tm.id === t ? 'true' : 'false');
      b.appendChild(document.createTextNode(tm.name));
      b.appendChild(h('em', '', st.done + '/' + st.total + ' 关'));
      b.addEventListener('click', function () {
        if (curTerm() === tm.id) return;
        MFI.Audio.play('click');
        MFI.Audio.play('whoosh');
        store.setTerm(tm.id);
        renderHome();
      });
      host.appendChild(b);
    });
  }

  function renderHome() {
    var d = store.get();
    var D = MFI.Data;
    var gid = curGrade(), tid = curTerm();
    var list = D.levelsOf(gid, tid);

    MFI.Scene.mountLion($('homeLion'));

    /* 选择器 */
    renderGradePicker();
    renderTermPicker();

    /* 本学期该打的关：第一个未通关的 */
    var doneN = 0, curIdx = -1;
    list.forEach(function (lv, i) {
      if (store.levelStars(lv.id) > 0) doneN++;
      if (curIdx < 0 && store.levelStars(lv.id) === 0) curIdx = i;
    });
    var termDone = curIdx < 0;
    if (termDone) curIdx = list.length - 1;
    var cur = list[curIdx] || list[0];

    var gName = D.gradeOf(gid).name;
    var tName = D.termOf(tid).name;
    var tips = termDone
      ? [gName + tName + '全部通关啦！', '换一个学期继续挑战吧']
      : ['答错也没关系，慢慢数～', '连对 3 次金币翻倍！', '每天来打一关，连续勋章等你'];
    $('homeTip').textContent = tips[Math.floor(Math.random() * tips.length)];

    $('contLabel').textContent = termDone ? '本学期通关' : '下一关';
    $('contTitle').textContent = (curIdx + 1) + ' · ' + cur.skill;
    var ptDef = MFI.Data.PLAY_TYPES[cur.playType] || MFI.Data.PLAY_TYPES.practice;
    $('contSub').textContent = cur.name + ' · ' + ptDef.name + ' ' + ptDef.count + ' 题' +
      (cur.unit ? ' · ' + cur.unit : '');
    var typePill = $('contType');
    if (typePill) {
      typePill.textContent = ptDef.name;
      typePill.className = 'cont-type type-' + ptDef.id;
    }
    $('contProgress').textContent = '第 ' + (curIdx + 1) + ' / ' + list.length + ' 关';
    $('contFill').style.width = Math.round((curIdx / Math.max(1, list.length)) * 100) + '%';

    var cart = $('contArt');
    clear(cart);
    cart.innerHTML = MFI.Art.fruit(cur.fruit);

    var go = $('btnContinue');
    go.textContent = termDone ? '重玩第 ' + (curIdx + 1) + ' 关' : '开始第 ' + (curIdx + 1) + ' 关';
    go.dataset.level = cur.id;

    A.flashCoins(d.coins);
  }

  function toast(text) {
    var layer = $('toasts');
    if (!layer) return;
    var t = h('div', 'toast', text);
    layer.appendChild(t);
    setTimeout(function () {
      t.style.transition = 'opacity .25s';
      t.style.opacity = '0';
      setTimeout(function () { t.remove(); }, 260);
    }, 1600);
  }
  A.toast = toast;

  /* ---------- 开局 ---------- */
  function startLevel(id) {
    show('game');
    /* 不传 count：由关卡类型（练习 8 / 挑战 12 / 情境 6）决定 */
    MFI.Game.start({ mode: 'level', level: id, onFinish: A.finish });
  }
  /* ---------- 结算 ---------- */
  A.finish = function (res) {
    lastRun = res;
    var d = store.get();
    var unlocks = [];

    d.coins = Math.max(0, (d.coins || 0) + (res.coins || 0));
    d.totalCorrect = (d.totalCorrect || 0) + res.correct;
    d.bestCombo = Math.max(d.bestCombo || 0, res.maxCombo);

    if (res.mode === 'level') {
      var r = store.recordLevel(res.level, res.stars);
      var lvDef = MFI.Data.levelOf(res.level);
      if (r.improved && res.stars > 0) {
        unlocks.push({ ico: '⭐', text: res.levelName + ' 点亮了 ' + res.stars + ' 颗星！' });
      }
      if (lvDef) {
        var gl = MFI.Data.levelsOf(lvDef.grade, lvDef.term);
        var pos = -1;
        gl.forEach(function (x, i) { if (x.id === res.level) pos = i; });
        var nextLv = gl[pos + 1];
        if (nextLv && !nextLv.skill) nextLv = null;
        if (nextLv) {
          unlocks.push({ ico: '🏝️', text: '解锁下一关：' + nextLv.skill });
        } else if (store.termCleared(lvDef.grade, lvDef.term)) {
          var nt = MFI.Data.nextTerm(lvDef.grade, lvDef.term);
          if (nt) {
            unlocks.push({
              ico: '🎓',
              text: MFI.Data.gradeOf(lvDef.grade).name + MFI.Data.termOf(lvDef.term).name +
                '全部通关！下一站：' + MFI.Data.gradeOf(nt.grade).name + MFI.Data.termOf(nt.term).name
            });
            /* 自动切到下一学期，方便继续 */
            store.setGrade(nt.grade);
            store.setTerm(nt.term);
          } else {
            unlocks.push({ ico: '🏆', text: '全部 12 个学期通关，太厉害了！' });
          }
        }
      }
    }

    /* 每天第一次完成关卡即算「今日挑战完成」，连续天数靠它推进 */
    if (res.correct > 0) {
      var already = store.dailyDone();
      var rec = store.saveDaily({
        stars: res.stars, correct: res.correct, total: res.total, combo: res.maxCombo
      });
      if (!already) {
        var streakNow = store.streakNow();
        if (streakNow > 1) unlocks.push({ ico: '🔥', text: '连续 ' + streakNow + ' 天完成挑战！' });
      }
    }

    if (res.correct + res.wrong > 0) store.bumpDiff(res.correct >= res.wrong);

    /* 全对一局 */
    if (res.wrong === 0 && res.correct > 0) {
      d.perfectRuns = (d.perfectRuns || 0) + 1;
    }
    store.save();

    /* 结算后统一评估勋章 */
    var newBadges = store.checkBadges();
    newBadges.forEach(function (id) {
      var def = MFI.Badges.BY_ID[id];
      if (def) unlocks.push({ ico: '🏅', text: '获得勋章：' + def.name, badge: id });
    });

    var row = $('resStars').children;
    for (var i = 0; i < row.length; i++) {
      row[i].classList.toggle('on', i < res.stars);
      row[i].style.setProperty('--sd', (0.08 + i * 0.16) + 's');
    }

    $('resKicker').textContent = '小岛通关';
    var title;
    var typeName = res.playTypeName || '练习';
    if (res.reason === 'dead') title = 'Bobo 需要休息一下';
    else if (res.bossWin) title = res.levelName + ' · 打退抢水果猴！';
    else title = res.levelName + ' · ' + typeName + '完成！';
    $('resTitle').textContent = title;

    $('resCoin').textContent = res.coins;
    $('resCombo').textContent = res.maxCombo;
    $('resCorrect').textContent = res.correct + '/' + res.total;
    /* 挑战关：额外在解锁列表里报告 Boss 战绩 */
    if (res.playType === 'challenge' && res.bossCorrect != null) {
      unlocks.push({
        ico: res.bossWin ? '🏆' : '🐵',
        text: res.bossWin
          ? '打退抢水果猴！Boss 战答对 ' + res.bossCorrect + ' 题'
          : 'Boss 打退失败，Boss 战答对 ' + res.bossCorrect + ' 题'
      });
    }

    MFI.Scene.mountLion($('resLion'));

    var ul = $('resUnlocks');
    clear(ul);
    unlocks.forEach(function (u, i) {
      var n = h('div', 'unlock' + (u.badge ? ' unlock-badge' : ''));
      if (u.badge) {
        var bi = h('span', 'u-badge');
        bi.innerHTML = MFI.Art.badge(u.badge, false);
        n.appendChild(bi);
      } else {
        n.appendChild(h('span', 'u-ico', u.ico));
      }
      n.appendChild(h('span', '', u.text));
      n.style.animationDelay = (0.28 + i * 0.12) + 's';
      ul.appendChild(n);
    });

    $('btnAgain').textContent = '再来一局';
    show('result');
    MFI.FX.confetti($('resultConfetti'), res.stars >= 2 ? 38 : 14);
    if (res.stars >= 2) { MFI.Audio.play('win'); A.vibe([0, 30, 60, 30]); }
    else if (res.reason === 'dead') MFI.Audio.play('lose');
  };

  /* ---------- 重置进度（二次确认，避免误触） ---------- */
  function showConfirmReset() {
    var ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'ovReset';
    ov.innerHTML =
      '<div class="pause-card">' +
        '<h3>确定要清空进度吗？</h3>' +
        '<p>金币、星星、勋章、关卡记录都会清除，无法恢复</p>' +
        '<button class="big-btn" id="resetYes">确定清空</button>' +
        '<button class="ghost-btn" id="resetNo">再想想</button>' +
      '</div>';
    document.body.appendChild(ov);
    ov.querySelector('#resetNo').addEventListener('click', function () {
      MFI.Audio.play('click');
      ov.remove();
    });
    ov.querySelector('#resetYes').addEventListener('click', function () {
      ov.remove();
      doReset();
    });
  }

  function doReset() {
    store.reset();
    MFI.Audio.play('whoosh');
    MFI.Audio.setMuted(!!store.get().muted);
    renderHome();
    show('home');
    toast('进度已清空，可以重新开始啦');
  }
  A.doReset = doReset;

  /* 打开勋章页（结算页按钮与测试共用） */
  A.openBadges = function () {
    renderBadges();
    show('dex');
  };

  /* 外部可重绘主页（测试与返回时用） */
  A.refreshHome = function () { renderHome(); };

  A.backHome = function () {
    MFI.Game.stop();
    $('ovPause').classList.add('hidden');
    renderHome();
    show('home');
  };

  /* ---------- 图鉴 ---------- */
  /* ---------- 勋章页 ---------- */
  function renderBadges() {
    var d = store.get();
    var B = MFI.Badges;
    var ctx = store.badgeContext();

    /* 计数 */
    $('dexCount').textContent = store.badgeCount() + '/' + B.LIST.length;

    /* 连续天数横幅 */
    var streak = ctx.streak || 0;
    var best = ctx.bestStreak || 0;
    $('shDays').textContent = streak;
    $('shBest').textContent = best;
    var doneToday = store.dailyDone();
    var today = $('shToday');
    today.textContent = doneToday ? '今天已完成 ✓' : '今天还没来';
    today.classList.toggle('done', doneToday);
    $('streakHero').classList.toggle('hot', streak >= 3);

    var fl = $('shFlame');
    fl.innerHTML = MFI.Art.badge(streak >= 7 ? 'streak7' : 'streak3', streak <= 0);

    /* 近 7 天 */
    var strip = $('weekStrip');
    clear(strip);
    var dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (var i = 6; i >= 0; i--) {
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var key = store.todayKey(dt);
      var rec = d.daily[key];
      var on = !!(rec && rec.done);
      var cell = h('div', 'wd' + (on ? ' on' : '') + (i === 0 ? ' today' : ''));
      cell.appendChild(h('i', '', on ? '✓' : ''));
      cell.appendChild(h('span', '', i === 0 ? '今天' : dayNames[dt.getDay()]));
      strip.appendChild(cell);
    }

    /* 分组勋章 */
    var wrap = $('badgeGroups');
    clear(wrap);
    var list = store.badgeList();

    B.GROUPS.forEach(function (g) {
      var items = list.filter(function (x) { return x.def.group === g.id; });
      if (!items.length) return;
      var earnedN = items.filter(function (x) { return x.earned; }).length;

      var sec = h('div', 'bgroup');
      var head = h('div', 'bg-head');
      head.appendChild(h('h3', 'bg-name', g.name));
      var note = h('span', 'bg-note');
      note.textContent = earnedN + '/' + items.length + ' · ' + g.note;
      head.appendChild(note);
      sec.appendChild(head);

      var grid = h('div', 'bg-grid');
      items.forEach(function (it) {
        var card = h('button', 'badge-card' + (it.earned ? ' earned' : ' locked') + ' tier-' + it.def.tier);
        card.setAttribute('aria-label', it.def.name + (it.earned ? ' 已获得' : ' 未获得'));

        var art = h('div', 'bc-art');
        art.innerHTML = MFI.Art.badge(it.def.id, !it.earned);
        card.appendChild(art);
        card.appendChild(h('div', 'bc-name', it.def.name));

        if (it.earned) {
          card.appendChild(h('div', 'bc-desc', it.def.desc));
          card.appendChild(h('div', 'bc-date', it.at ? '获得于 ' + it.at : '已获得'));
        } else {
          card.appendChild(h('div', 'bc-desc', it.def.desc));
          /* 进度 */
          var pct = it.need > 1 ? Math.round((it.cur / it.need) * 100) : 0;
          var bar = h('div', 'bc-bar');
          var fill = h('i');
          fill.style.width = pct + '%';
          bar.appendChild(fill);
          card.appendChild(bar);
          card.appendChild(h('div', 'bc-prog', it.need > 1 ? it.cur + ' / ' + it.need : '未达成'));
        }

        card.addEventListener('click', function () {
          if (it.earned) {
            MFI.Audio.play('unlock');
            MFI.FX.burst(MFI.FX.center(card).x, MFI.FX.center(card).y, 14, 70);
          } else {
            MFI.Audio.play('pop');
            toast(it.def.desc);
          }
        });
        grid.appendChild(card);
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);
    });
  }

  /* ---------- 绑定 ---------- */
  function bind() {

    $('btnContinue').addEventListener('click', function () {
      var lv = this.dataset.level || 'lv1';
      MFI.Audio.play('click');
      MFI.Audio.play('whoosh');
      startLevel(lv);
    });
    $('btnReset').addEventListener('click', function () {
      MFI.Audio.play('click');
      showConfirmReset();
    });
    $('btnMedals').addEventListener('click', function () {
      MFI.Audio.play('click');
      A.openBadges();
    });
    $('btnDexBack').addEventListener('click', function () {
      MFI.Audio.play('click');
      renderHome();
      show('home');
    });
    $('btnAgain').addEventListener('click', function () {
      MFI.Audio.play('click');
      if (!lastRun) { renderHome(); show('home'); return; }
      startLevel(lastRun.level || 'lv1');
    });
    $('btnHome').addEventListener('click', function () {
      MFI.Audio.play('click');
      renderHome();
      show('home');
    });
    $('pauseGo').addEventListener('click', function () { MFI.Audio.play('click'); MFI.Game.pause(false); });
    $('pauseQuit').addEventListener('click', function () { MFI.Audio.play('click'); A.backHome(); });

    var unlockOnce = function () {
      MFI.Audio.unlock();
      document.removeEventListener('pointerdown', unlockOnce);
      document.removeEventListener('keydown', unlockOnce);
    };
    document.addEventListener('pointerdown', unlockOnce);
    document.addEventListener('keydown', unlockOnce);

    document.addEventListener('keydown', function (ev) {
      if (current !== 'game') return;
      if (ev.key === 'Escape') { MFI.Game.pause(true); return; }
      var n = parseInt(ev.key, 10);
      if (n >= 1 && n <= 4) {
        var btns = document.querySelectorAll('#board .candy-btn');
        if (btns[n - 1]) btns[n - 1].click();
      }
    });
  }

  /* ---------- 启动 ---------- */
  A.boot = function () {
    /* 调试入口：打开 ?reset=1 即清空本机存档（刷题记录/金币/勋章/连续天数），
       清完把参数去掉，避免每次刷新都重置 */
    try {
      if (/[?&]reset=1\b/.test(location.search)) {
        localStorage.removeItem('mfi_save_v1');
        location.replace(location.pathname);
        return;
      }
    } catch (e) {}

    store = MFI.Store;
    var d = store.get();

    screens = {
      home: $('scrHome'), game: $('scrGame'), result: $('scrResult'), dex: $('scrDex')
    };

    MFI.FX.setLayer($('fx'));
    MFI.Audio.setMuted(!!d.muted);
    MFI.Game.init();

    MFI.Scene.buildClouds($('bgClouds'));
    MFI.Scene.buildConfetti($('bgConfetti'));

    bind();
    renderHome();
    show('home');
    store.touchDay();
    document.body.classList.add('ready');
  };

  window.MFI = window.MFI || {};
  MFI.App = A;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', A.boot);
  else A.boot();
})();
