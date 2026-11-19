/* ===== 玩法主循环 ===== */
(function () {
  var G = {};
  var $ = function (id) { return document.getElementById(id); };
  var S = null;
  var el = {};

  function h(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt != null) n.textContent = txt;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function vibe(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) {} } }

  G.init = function () {
    el = {
      hearts: $('hearts'), coin: $('gameCoin'), combo: $('comboTag'),
      fill: $('progFill'), progText: $('progText'),
      ribbon: $('ribbon'), ribbonText: $('ribbonText'),
      bossBar: $('bossBar'), bossFill: $('bossFill'), bossTime: $('bossTime'),
      lion: $('gameLion'), bubble: $('bubble'), board: $('board'),
      fever: $('feverGlow'), coinPill: $('gameCoin'), tierPill: $('tierPill')
    };
    $('btnQuit').addEventListener('click', function () {
      MFI.Audio.play('click');
      if (S && S.phase !== 'over') G.pause(true);
      else MFI.App.backHome();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && S && S.phase === 'ask') G.pause(true);
    });
  };

  G.start = function (opts) {
    var D = MFI.Data, store = MFI.Store;
    var lv = D.levelOf(opts.level || 'lv1');
    var diff = store.get().diff || 1;

    /* 关卡类型决定这一局的机制组合 */
    var pt = D.PLAY_TYPES[lv.playType] || D.PLAY_TYPES.practice;

    var qs = D.makeRound(lv.id, opts.count || pt.count, diff);
    /* 从易到难：档位升序；同档位内按模式难度递进 */
    qs = D.sortByDifficulty(qs);

    S = {
      mode: opts.mode || 'level',
      lv: lv,
      playType: pt,
      qs: qs,
      total: qs.length,
      index: -1,
      hearts: pt.hearts, maxHearts: pt.hearts,
      bossCorrect: 0,
      combo: 0, maxCombo: 0,
      coins: 0, correct: 0, wrong: 0,
      diff: diff,
      baseDiff: diff,
      liveDiff: MFI.Diff ? MFI.Diff.tier(diff) : 2,   /* 档位 1..4，局内自适应调整 */
      curDiff: MFI.Diff ? MFI.Diff.tier(diff) : 2,    /* 已渲染题目的档位，首次不触发换题 */
      streakUp: 0,           /* 连续答对计数，用于提难 */
      streakDown: 0,         /* 连续答错计数，用于降难 */
      phase: 'idle',
      fever: false,
      buffs: { coin2: 0, hint: 0, shield: false },
      eventAt: [],
      bossWin: false, bossHp: 100, bossTimeLeft: 0, bossBonus: 0,
      bonusStars: 0,
      onFinish: opts.onFinish,
      lockUntil: 0,
      buttons: []
    };

    /* 事件卡只在挑战关出现 */
    if (pt.events) {
      var evCount = Math.max(1, Math.floor(S.total / 4));
      for (var i = 0; i < evCount; i++) {
        var at = 2 + i * 3 + Math.floor(Math.random() * 2);
        if (at < S.total - 1) S.eventAt.push(at);
      }
    }

    $('bossBar').classList.add('hidden');
    el.fever.classList.remove('on');
    MFI.FX.clear();
    var typeTag = { practice: '练习', challenge: '挑战', story: '情境' }[pt.id] || '';
    el.ribbonText.textContent = (lv.name === lv.skill ? lv.skill : lv.name + ' · ' + lv.skill) +
      (typeTag ? ' · ' + typeTag : '');

    MFI.Scene.mountLion(el.lion);
    renderHUD();
    /* 开局一句说明：这一局练什么、用哪些机制 */
    say(pt.tip + '（' + S.total + ' 题）', 2200);
    G.next();
  };

  function renderHUD() {
    if (!S) return;
    clear(el.hearts);
    for (var i = 0; i < S.maxHearts; i++) {
      el.hearts.appendChild(h('i', i < S.hearts ? '' : 'lost', '❤️'));
    }
    el.coin.textContent = S.coins;
    el.combo.textContent = '×' + S.combo;
    el.combo.classList.toggle('hot', S.combo >= 3);
    var done = Math.max(0, S.index);
    el.fill.style.width = Math.min(100, (done / S.total) * 100) + '%';
    el.progText.textContent = Math.min(S.total, done + 1) + '/' + S.total;
    renderTier();
  }

  /* 难度指示：4 格，点亮当前档位 */
  function renderTier() {
    if (!el.tierPill || !S) return;
    var t = S.cur && S.cur.tier ? S.cur.tier : (MFI.Diff ? MFI.Diff.tier(S.liveDiff) : 2);
    var dots = el.tierPill.querySelectorAll('i');
    for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i < t);
    el.tierPill.classList.toggle('hot', t >= 3);
  }

  function say(text, ms) {
    if (!el.bubble) return;
    el.bubble.textContent = text;
    el.bubble.classList.remove('pop');
    void el.bubble.offsetWidth;
    el.bubble.classList.add('pop');
  }

  G.next = function () {
    if (!S) return;
    S.index++;
    if (S.index >= S.total) {
      /* 正题答完：挑战关进入 Boss，其余直接结算 */
      if (S.playType.boss && !S._bossDone) {
        S._bossDone = true;
        startBoss();
        return;
      }
      finish();
      return;
    }
    if (S.hearts <= 0) { finish(); return; }
    if (S.eventAt.indexOf(S.index) >= 0) { showEvent(); return; }
    renderQuestion(S.qs[S.index]);
  };

  function renderQuestion(q) {
    /* 局内难度变了：把当前这道换成新档位的题（保持同知识点） */
    if (S.liveDiff !== S.curDiff && S.qs[S.index]) {
      var t = Math.max(1, Math.min(4, S.liveDiff));
      var fresh = MFI.Data.makeQuestion(S.lv.id, t - 1);
      fresh.tier = t;
      S.qs[S.index] = fresh;
      q = fresh;
      S.curDiff = S.liveDiff;
    }
    S.phase = 'ask';
    S.cur = q;
    S.lockUntil = 0;
    renderHUD();

    S.buttons = [];
    var wrap = MFI.Board.render(q, el.board, {
      onPick: function (val, btn) { onAnswer(val, btn); }
    });
    var btns = el.board.querySelectorAll('.candy-btn, .g-opt');
    for (var i = 0; i < btns.length; i++) S.buttons.push(btns[i]);
    S.wrap = wrap;

    if (S.buffs.hint > 0) {
      S.buffs.hint--;
      setTimeout(function () {
        if (removeOneWrong()) MFI.Audio.play('hint');
      }, 420);
    }

    var tips = {
      count: ['数一数，有几个？', '一个一个数哦！'],
      add: ['把它们合起来数！', '一共有几个呢？'],
      sub: ['吃掉以后还剩几个？', '拿走以后再数一数'],
      compare: ['哪边更多呢？', '比一比谁多']
    };
    var arr = tips[q.kind] || tips.count;
    say(arr[Math.floor(Math.random() * arr.length)]);
    MFI.Audio.play('cardIn');
  }

  function removeOneWrong() {
    if (!S || !S.cur) return false;
    var pool = [];
    for (var i = 0; i < S.buttons.length; i++) {
      var b = S.buttons[i];
      if (String(b.dataset.val) !== String(S.cur.answer) && !b.classList.contains('dim')) pool.push(b);
    }
    if (!pool.length) return false;
    pool[Math.floor(Math.random() * pool.length)].classList.add('dim');
    return true;
  }

  function onAnswer(val, btn) {
    if (!S || S.phase !== 'ask') return;
    if (Date.now() < S.lockUntil) return;
    S.lockUntil = Date.now() + 700;
    S.phase = 'judge';

    var q = S.cur;
    var ok = String(val) === String(q.answer);

    if (ok) {
      S.correct++;
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);

      var gain = 5 + Math.min(S.combo, 10);
      if (S.buffs.coin2 > 0) { gain *= 2; S.buffs.coin2--; }
      if (S.fever) gain *= 2;
      S.coins += gain;
      renderHUD();

      MFI.Board.markRight(btn);
      MFI.Audio.play('correct', { combo: S.combo });
      vibe(12);
      MFI.Scene.lionBounce(el.lion);

      var delay = 0;
      if (q.kind === 'count') delay = MFI.Board.countUp(S.wrap);
      else if (q.kind === 'sub') delay = MFI.Board.eatAway(S.wrap);

      setTimeout(function () {
        if (!S) return;
        var c = MFI.FX.center(btn);
        MFI.FX.floatText('+' + gain, c.x, c.y - 10);
        MFI.Audio.play('coin');
        MFI.FX.flyCoins(btn, el.coin, 3);
      }, Math.min(delay + 100, 900));

      if (S.combo === 3) say('3 连击！金币加倍！');
      if (S.combo >= 5 && !S.fever && S.playType.fever) enterFever();
      else if (S.combo === 8 || S.combo === 12) say(S.combo + ' 连击！太厉害了！');

      /* 局内自适应：连对 2 题就把后面的题悄悄提一档 */
      S.streakUp = (S.streakUp || 0) + 1;
      S.streakDown = 0;
      if (S.streakUp >= 2) {
        S.streakUp = 0;
        S.liveDiff = Math.min(4, (S.liveDiff || 2) + 1);
      }

      setTimeout(function () {
        if (!S) return;
        S.phase = 'idle';
        G.next();
      }, Math.min(delay + 620, 1500));

    } else {
      S.wrong++;
      S.combo = 0;

      /* 局内自适应：连错就悄悄降难 */
      S.streakDown = (S.streakDown || 0) + 1;
      S.streakUp = 0;
      if (S.streakDown >= 2) {
        S.streakDown = 0;
        S.liveDiff = Math.max(1, (S.liveDiff || 2) - 1);
      }
      MFI.Board.markWrong(btn, q.answer, S.buttons);
      MFI.Audio.play('wrong');
      vibe([0, 30, 40, 30]);
      MFI.FX.shake(el.board);
      if (S.fever) exitFever();

      if (S.buffs.shield) {
        S.buffs.shield = false;
        say('护盾挡住了！别怕～');
      } else if (S.playType.id === 'story') {
        /* 情境关：答错只提示，不扣心 */
        say('再想想～ 这道题不扣心');
      } else {
        S.hearts--;
        var hs = el.hearts.querySelectorAll('i');
        if (hs[S.hearts]) hs[S.hearts].classList.add('hit');
        MFI.Audio.play('heart');
        say('没关系，一起看看答案～');
        renderHUD();
      }

      setTimeout(function () {
        if (!S) return;
        var c = MFI.FX.center(el.board);
        MFI.FX.floatText('答案是 ' + q.answer, c.x, Math.max(70, c.y - 30), '#FFD23F');
      }, 380);

      setTimeout(function () {
        if (!S) return;
        if (S.hearts <= 0) { startRescue(); return; }
        S.phase = 'idle';
        G.next();
      }, 1900);
    }
  }

  function enterFever() {
    if (!S) return;
    S.fever = true;
    el.fever.classList.add('on');
    MFI.Audio.play('fever');
    say('🔥 FEVER！金币 ×2！');
    var c = MFI.FX.center(el.ribbon);
    MFI.FX.floatText('FEVER ×2', c.x, Math.max(56, c.y - 20), '#FFD23F');
    MFI.FX.burst(c.x, Math.max(56, c.y - 20), 24, 150, ['#F0207E', '#FFC82E', '#A93FE4']);
    clearTimeout(S._feverTimer);
    S._feverTimer = setTimeout(function () {
      if (!S) return;
      exitFever();
      say('FEVER 结束，继续加油！');
    }, 12000);
  }
  function exitFever() {
    if (!S) return;
    S.fever = false;
    el.fever.classList.remove('on');
    clearTimeout(S._feverTimer);
  }

  /* ---------- 事件卡 ---------- */
  var EV = {
    coin2: function () { S.buffs.coin2 = 2; },
    hint: function () { S.buffs.hint = 3; },
    heart: function () { S.hearts = Math.min(S.maxHearts, S.hearts + 1); renderHUD(); },
    star: function () { S.coins += 30; },
    shield: function () { S.buffs.shield = true; },
    freeze: function () { S.bossBonus = 5; }
  };

  function showEvent() {
    var ev = MFI.Data.EVENTS[Math.floor(Math.random() * MFI.Data.EVENTS.length)];
    $('evEmoji').textContent = ev.emoji;
    $('evTitle').textContent = ev.title;
    $('evDesc').textContent = ev.desc;
    $('ovEvent').classList.remove('hidden');
    MFI.Audio.play('cardIn');
    MFI.Audio.play('unlock');
    say('抽到事件卡！');

    var btn = $('evOk');
    var fn = function () {
      btn.removeEventListener('click', fn);
      $('ovEvent').classList.add('hidden');
      MFI.Audio.play('click');
      if (EV[ev.id]) EV[ev.id]();
      say(ev.title + '！');
      renderQuestion(S.qs[S.index]);
    };
    btn.addEventListener('click', fn);
  }

  /* ---------- Boss ---------- */
  function startBoss() {
    S.phase = 'bossIntro';
    $('ovBoss').classList.remove('hidden');
    MFI.Audio.play('bossIntro');
    say('抢水果猴来了！');
    var btn = $('bossOk');
    var fn = function () {
      btn.removeEventListener('click', fn);
      $('ovBoss').classList.add('hidden');
      runBoss();
    };
    btn.addEventListener('click', fn);
  }

  function runBoss() {
    var D = MFI.Data;
    S.phase = 'boss';
    S.bossHp = 100;
    S.bossHpMax = 100;
    S.bossTimeLeft = 30 + (S.bossBonus || 0);
    el.bossBar.classList.remove('hidden');
    el.bossTime.textContent = S.bossTimeLeft;
    updateBoss();

    /* Boss 只考「本关」这一个知识点：
       不跨单元抽取已学过的旧内容，也不掺入复习关，避免一场挑战里
       突然冒出「时分秒」「测量」这种本关没教过的题。 */
    S.bossPool = [];
    for (var i = 0; i < 24; i++) {
      S.bossPool.push(D.makeQuestion(S.lv.id, Math.min(3, (S.liveDiff != null ? S.liveDiff : S.diff))));
    }
    S.bossIdx = 0;

    clearInterval(S._bossTimer);
    S._bossTimer = setInterval(function () {
      if (!S || S.phase !== 'boss') { clearInterval(S._bossTimer); return; }
      S.bossTimeLeft = Math.max(0, S.bossTimeLeft - 1);
      el.bossTime.textContent = S.bossTimeLeft;
      if (S.bossTimeLeft <= 5 && S.bossTimeLeft > 0) MFI.Audio.play('tick');
      if (S.bossTimeLeft <= 0) endBoss(false);
    }, 1000);

    nextBossQ();
  }

  function nextBossQ() {
    if (!S || S.phase !== 'boss') return;
    if (S.bossHp <= 0) { endBoss(true); return; }
    var q = S.bossPool[S.bossIdx % S.bossPool.length];
    S.bossIdx++;
    S.cur = q;
    S.lockUntil = 0;
    S.buttons = [];
    S.wrap = MFI.Board.render(q, el.board, {
      onPick: function (val, btn) { onBossAnswer(val, btn); }
    });
    var btns = el.board.querySelectorAll('.candy-btn, .g-opt');
    for (var i = 0; i < btns.length; i++) S.buttons.push(btns[i]);
  }

  function onBossAnswer(val, btn) {
    if (!S || S.phase !== 'boss') return;
    if (Date.now() < S.lockUntil) return;
    S.lockUntil = Date.now() + 420;
    var q = S.cur;
    var ok = String(val) === String(q.answer);

    if (ok) {
      /* Boss 答对单独计，不混入正题正确率 */
      S.bossCorrect++;
      S.combo++;
      S.maxCombo = Math.max(S.maxCombo, S.combo);
      S.bossHp = Math.max(0, S.bossHp - 20);
      S.coins += S.fever ? 20 : 10;
      MFI.Board.markRight(btn);
      MFI.Audio.play('bossHit');
      MFI.Audio.play('correct', { combo: S.combo });
      vibe(20);
      var c = MFI.FX.center(el.bossBar);
      MFI.FX.burst(c.x, c.y, 16, 100);
      MFI.FX.floatText('−20', c.x, c.y, '#F0207E');
      updateBoss(); renderHUD();
      setTimeout(function () {
        if (!S || S.phase !== 'boss') return;
        if (S.bossHp <= 0) endBoss(true);
        else nextBossQ();
      }, 420);
    } else {
      S.wrong++;
      S.combo = 0;
      MFI.Board.markWrong(btn, q.answer, S.buttons);
      MFI.Audio.play('wrong');
      vibe([0, 25, 35, 25]);
      MFI.FX.shake(el.board);
      renderHUD();
      setTimeout(function () {
        if (!S || S.phase !== 'boss') return;
        nextBossQ();
      }, 700);
    }
  }

  function updateBoss() {
    if (!el.bossFill) return;
    var pct = Math.max(0, Math.min(100, (S.bossHp / S.bossHpMax) * 100));
    el.bossFill.style.width = pct + '%';
  }

  function endBoss(win) {
    clearInterval(S._bossTimer);
    S.phase = 'bossEnd';
    S.bossWin = !!win;
    if (win) {
      MFI.Audio.play('bossDown');
      MFI.FX.burst(innerWidth / 2, innerHeight * 0.4, 36, 190);
      MFI.FX.floatText('打退它啦！', innerWidth / 2, innerHeight * 0.36, '#FFD23F');
      S.coins += 40;
      say('打退抢水果猴！+40 金币');
      vibe([0, 40, 60, 40, 60, 60]);
      setTimeout(function () {
        if (!S) return;
        el.bossBar.classList.add('hidden');
        S.phase = 'idle';
        finish();
      }, 1400);
    } else {
      MFI.Audio.play('lose');
      say('它抢走了一些水果…');
      setTimeout(function () {
        if (!S) return;
        el.bossBar.classList.add('hidden');
        S.phase = 'idle';
        finish();
      }, 1300);
    }
  }

  /* ---------- 抢救 ---------- */
  function startRescue() {
    S.phase = 'rescue';
    var ov = $('ovRescue'), field = $('rescueField');
    clear(field);
    ov.classList.remove('hidden');
    MFI.Audio.play('rescueStart');
    say('Bobo 饿肚子了！接住水果！');

    var need = 5, got = 0, timeLeft = 12;
    var fruits = ['apple', 'orange', 'grape', 'banana', 'melon', 'peach', 'berry', 'pear'];
    var alive = [], spawnTimer = null, tickTimer = null, rafId = 0, ended = false;

    function cleanup() {
      ended = true;
      clearInterval(spawnTimer); clearInterval(tickTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      alive.forEach(function (o) { if (o.node.parentNode) o.node.remove(); });
      alive = [];
      if (S) S._rescueCleanup = null;
    }
    if (S) S._rescueCleanup = cleanup;

    $('rescueGot').textContent = '0';
    $('rescueTime').textContent = timeLeft;
    $('rescueFill').style.width = '100%';

    function spawn() {
      if (ended) return;
      var f = document.createElement('div');
      f.className = 'falling';
      var name = fruits[Math.floor(Math.random() * fruits.length)];
      f.innerHTML = MFI.Art.fruit(name);
      var w = field.clientWidth;
      var x = 8 + Math.random() * Math.max(10, w - 60);
      f.style.left = x + 'px';
      f.style.transform = 'translateY(-56px)';
      field.appendChild(f);

      var obj = { node: f, y: -56, speed: 1.5 + Math.random() * 1.6, dead: false };
      alive.push(obj);

      f.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        if (obj.dead || ended) return;
        obj.dead = true;
        f.classList.add('caught');
        got++;
        $('rescueGot').textContent = got;
        MFI.Audio.play('pop');
        MFI.Audio.play('coin');
        vibe(10);
        var c = MFI.FX.center(f);
        MFI.FX.burst(c.x, c.y, 8, 44);
        setTimeout(function () { f.remove(); }, 330);
        if (got >= need) endRescue(true);
      });
    }

    function loop() {
      if (ended) return;
      var H = field.clientHeight;
      alive.forEach(function (o) {
        if (o.dead) return;
        o.y += o.speed;
        o.node.style.transform = 'translateY(' + o.y + 'px) rotate(' + (o.y * 0.12) + 'deg)';
        if (o.y > H) { o.dead = true; o.node.remove(); }
      });
      alive = alive.filter(function (o) { return !o.dead; });
      rafId = requestAnimationFrame(loop);
    }

    function tick() {
      if (ended) return;
      timeLeft--;
      $('rescueTime').textContent = Math.max(0, timeLeft);
      $('rescueFill').style.width = Math.max(0, (timeLeft / 12) * 100) + '%';
      if (timeLeft <= 0) endRescue(false);
    }

    function endRescue(saved) {
      if (ended) return;
      ended = true;
      clearInterval(spawnTimer); clearInterval(tickTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      alive.forEach(function (o) { if (o.node.parentNode) o.node.remove(); });
      alive = [];
      if (S) S._rescueCleanup = null;

      if (saved) {
        MFI.Audio.play('rescueSaved');
        S.hearts = 1;
        S.bonusStars = Math.min(2, (S.bonusStars || 0) + 1);
        say('吃饱啦！继续冒险！');
        field.appendChild(h('div', 'rescue-msg', '得救啦！'));
      } else {
        MFI.Audio.play('lose');
        field.appendChild(h('div', 'rescue-msg', '下次再努力～'));
      }
      setTimeout(function () {
        ov.classList.add('hidden');
        clear(field);
        if (!S) return;
        if (saved) { S.phase = 'idle'; renderHUD(); G.next(); }
        else finish();
      }, 1300);
    }

    spawnTimer = setInterval(spawn, 520);
    tickTimer = setInterval(tick, 1000);
    spawn();
    rafId = requestAnimationFrame(loop);
  }

  /* ---------- 暂停 / 停止 ---------- */
  G.pause = function (on) {
    var ov = $('ovPause');
    if (on) {
      ov.classList.remove('hidden');
      if (S && S.phase === 'boss') { S._wasBoss = true; clearInterval(S._bossTimer); }
    } else {
      ov.classList.add('hidden');
      if (S && S._wasBoss && S.phase === 'boss') {
        S._wasBoss = false;
        clearInterval(S._bossTimer);
        S._bossTimer = setInterval(function () {
          if (!S || S.phase !== 'boss') { clearInterval(S._bossTimer); return; }
          S.bossTimeLeft = Math.max(0, S.bossTimeLeft - 1);
          el.bossTime.textContent = S.bossTimeLeft;
          if (S.bossTimeLeft <= 5 && S.bossTimeLeft > 0) MFI.Audio.play('tick');
          if (S.bossTimeLeft <= 0) endBoss(false);
        }, 1000);
      }
    }
  };

  G.stop = function () {
    if (S) {
      if (S._rescueCleanup) S._rescueCleanup();
      clearInterval(S._bossTimer);
      clearTimeout(S._feverTimer);
      S.phase = 'over';
    }
    S = null;
    ['ovEvent', 'ovBoss', 'ovRescue', 'ovPause'].forEach(function (id) {
      var ov = $(id); if (ov) ov.classList.add('hidden');
    });
    clear($('rescueField'));
    MFI.FX.clear();
  };

  G._state = function () { return S; };
  G._cur = function () { return S ? S.cur : null; };

  /* ---------- 结算 ---------- */
  function finish() {
    if (!S) return;
    clearInterval(S._bossTimer);
    clearTimeout(S._feverTimer);
    S.phase = 'over';

    var answered = S.correct + S.wrong;
    var acc = answered ? S.correct / answered : 0;

    /* 星级只由「正题正确率 + 剩余心」决定，来源单一清晰 */
    var stars = 0;
    if (acc >= 0.9) stars = 3;
    else if (acc >= 0.7) stars = 2;
    else if (acc >= 0.4) stars = 1;
    /* 掉光心最多 1 星；情境关（story）答错不扣心，不额外惩罚 */
    if (S.hearts <= 0 && S.playType.id !== 'story') stars = Math.min(stars, 1);
    if (answered === 0) stars = 0;

    var res = {
      mode: S.mode, level: S.lv.id, levelName: S.lv.name,
      playType: S.playType.id, playTypeName: S.playType.name,
      stars: stars, coins: S.coins,
      correct: S.correct, wrong: S.wrong, total: S.total,
      bossCorrect: S.bossCorrect || 0,
      maxCombo: S.maxCombo, bossWin: S.bossWin,
      reason: S.hearts <= 0 ? 'dead' : 'done'
    };
    var cb = S.onFinish;
    S = null;
    MFI.FX.clear();
    if (cb) cb(res);
  }

  window.MFI = window.MFI || {};
  MFI.Game = G;
})();
