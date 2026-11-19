/* ===== 存档 ===== */
(function () {
  var KEY = 'mfi_save_v1';
  var S = {};

  function todayKey(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  S.todayKey = todayKey;

  function defaults() {
    return {
      v: 1,
      coins: 0,
      muted: false,
      diff: 1,
      levels: {},        /* id -> {best, plays} */
      bestCombo: 0,
      totalCorrect: 0,
      lastDay: '',
      streak: 0,
      daily: {},
      endlessBest: 0,
      grade: 'g1',         /* 当前选择的年级 */
      term: 'up',          /* 当前选择的学期 */
      badges: {},          /* id -> { at: 'YYYY-MM-DD' } */
      bestStreak: 0,       /* 历史最长连续天数 */
      perfectRuns: 0,      /* 全对局数 */
      totalDaily: 0        /* 累计完成每日挑战次数 */
    };
  }

  var data = null;

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) { data = defaults(); return data; }
      var p = JSON.parse(raw);
      if (!p || typeof p !== 'object') { data = defaults(); return data; }
      data = Object.assign(defaults(), p);
      data.levels = p.levels && typeof p.levels === 'object' ? p.levels : {};
      data.daily = p.daily && typeof p.daily === 'object' ? p.daily : {};
      data.badges = p.badges && typeof p.badges === 'object' ? p.badges : {};
      data.grade = p.grade || 'g1';
      data.term = p.term === 'down' ? 'down' : 'up';
      data.bestStreak = Math.max(0, p.bestStreak | 0);
      data.perfectRuns = Math.max(0, p.perfectRuns | 0);
      data.totalDaily = Math.max(0, p.totalDaily | 0);
      data.diff = Math.max(0, Math.min(3, data.diff | 0));
    } catch (e) { data = defaults(); }
    return data;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; }
    catch (e) { return false; }
  }

  S.get = function () { if (!data) load(); return data; };
  S.save = save;
  S.reset = function () { data = defaults(); save(); return data; };

  S.addCoins = function (n) {
    var d = S.get();
    d.coins = Math.max(0, (d.coins || 0) + Math.round(n || 0));
    save();
    return d.coins;
  };

  S.recordLevel = function (id, stars) {
    var d = S.get();
    var cur = d.levels[id] || { best: 0, plays: 0 };
    cur.plays = (cur.plays || 0) + 1;
    var improved = stars > (cur.best || 0);
    if (improved) cur.best = stars;
    d.levels[id] = cur;
    save();
    return { improved: improved, best: cur.best };
  };

  S.levelStars = function (id) {
    var d = S.get();
    return (d.levels[id] && d.levels[id].best) || 0;
  };

  S.totalStars = function () {
    var d = S.get(), sum = 0;
    Object.keys(d.levels || {}).forEach(function (k) { sum += (d.levels[k] && d.levels[k].best) || 0; });
    return sum;
  };

  S.litLevels = function () {
    var d = S.get();
    return Object.keys(d.levels || {}).filter(function (k) { return d.levels[k] && d.levels[k].best > 0; }).length;
  };

  /* 某学期内的关卡是否解锁：第 1 关永久开放，其余需前一关通关 */
  S.isUnlocked = function (gradeId, termId, index) {
    if (index <= 0) return true;
    var list = MFI.Data.levelsOf(gradeId, termId);
    var prev = list[index - 1];
    return prev ? S.levelStars(prev.id) > 0 : true;
  };

  /* 年级/学期选择 */
  S.setGrade = function (g) {
    var d = S.get();
    d.grade = g;
    save();
    return d.grade;
  };
  S.setTerm = function (t) {
    var d = S.get();
    d.term = t === 'down' ? 'down' : 'up';
    save();
    return d.term;
  };

  /* 某学期的完成情况 */
  S.termStats = function (gradeId, termId) {
    var list = MFI.Data.levelsOf(gradeId, termId);
    var done = 0, stars = 0;
    list.forEach(function (lv) {
      var st = S.levelStars(lv.id);
      if (st > 0) done++;
      stars += st;
    });
    return { total: list.length, done: done, stars: stars };
  };

  /* 学期整体是否已通关（用于自动切到下一学期） */
  S.termCleared = function (gradeId, termId) {
    var st = S.termStats(gradeId, termId);
    return st.total > 0 && st.done >= st.total;
  };

  S.bumpDiff = function (ok) {
    var d = S.get();
    d.diff = Math.max(0, Math.min(3, (d.diff || 1) + (ok ? 1 : -1)));
    save();
    return d.diff;
  };

  /* 连续天数只由「完成每日挑战」推进，打开 App 不算 */
  S.streakNow = function () {
    var d = S.get();
    var n = 0;
    for (var i = 0; i < 400; i++) {
      var dt = new Date();
      dt.setDate(dt.getDate() - i);
      var rec = d.daily[todayKey(dt)];
      if (rec && rec.done) {
        n++;
      } else if (i === 0) {
        /* 今天还没完成：不打断昨天为止的连续 */
        continue;
      } else {
        break;
      }
    }
    return n;
  };

  /* 刷新并持久化连续记录（完成挑战后调用） */
  S.refreshStreak = function () {
    var d = S.get();
    var n = S.streakNow();
    d.streak = n;
    if (n > (d.bestStreak || 0)) d.bestStreak = n;
    save();
    return { streak: n, best: d.bestStreak || 0 };
  };

  /* 仅记录「今天来过」，不影响连续天数 */
  S.touchDay = function () {
    var d = S.get();
    var t = todayKey();
    if (d.lastDay === t) return { streak: d.streak || 0, changed: false };
    d.lastDay = t;
    save();
    return { streak: d.streak || 0, changed: true };
  };

  S.dailyRecord = function () { return S.get().daily[todayKey()] || null; };
  S.dailyDone = function () { var r = S.dailyRecord(); return !!(r && r.done); };

  S.saveDaily = function (rec) {
    var d = S.get();
    var t = todayKey();
    var cur = d.daily[t] || {};
    var merged = {
      stars: Math.max(cur.stars || 0, rec.stars || 0),
      correct: Math.max(cur.correct || 0, rec.correct || 0),
      total: rec.total || cur.total || 0,
      combo: Math.max(cur.combo || 0, rec.combo || 0),
      done: true
    };
    if (!cur.done) d.totalDaily = (d.totalDaily || 0) + 1;
    d.daily[t] = merged;
    var keys = Object.keys(d.daily).sort();
    while (keys.length > 60) delete d.daily[keys.shift()];
    save();
    S.refreshStreak();
    return merged;
  };

  /* ---------- 勋章 ---------- */
  /* 收集判定所需的全部上下文 */
  S.badgeContext = function () {
    var d = S.get();
    var D = MFI.Data;
    var lit = 0, full = 0;
    D.LEVELS.forEach(function (lv) {
      var st = S.levelStars(lv.id);
      if (st > 0) lit++;
      if (st >= 3) full++;
    });
    var streakNow = S.streakNow();
    return {
      streak: streakNow,
      bestStreak: Math.max(d.bestStreak || 0, streakNow),
      totalDaily: d.totalDaily || 0,
      litLevels: lit,
      totalLevels: D.LEVELS.length,
      allFullStars: full >= D.LEVELS.length,
      bestCombo: d.bestCombo || 0,
      perfectRuns: d.perfectRuns || 0
    };
  };

  /* 评估并发放新勋章，返回新获得的 id 数组 */
  S.checkBadges = function () {
    var d = S.get();
    var ctx = S.badgeContext();
    var newly = MFI.Badges.evaluate(ctx, d.badges);
    if (newly.length) {
      var t = todayKey();
      newly.forEach(function (id) { d.badges[id] = { at: t }; });
      save();
    }
    return newly;
  };

  S.badgeList = function () {
    var d = S.get();
    var ctx = S.badgeContext();
    return MFI.Badges.LIST.map(function (b) {
      var prog = MFI.Badges.progressOf(b.id, ctx);
      return {
        def: b,
        earned: !!d.badges[b.id],
        at: (d.badges[b.id] && d.badges[b.id].at) || '',
        cur: prog.cur,
        need: prog.need,
        done: prog.done
      };
    });
  };

  S.badgeCount = function () {
    var d = S.get();
    return Object.keys(d.badges || {}).length;
  };

  window.MFI = window.MFI || {};
  MFI.Store = S;
})();
