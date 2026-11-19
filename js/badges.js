/* ===== 勋章体系：以「连续多天完成挑战」为核心 ===== */
(function () {
  var B = {};

  /* tier: bronze / silver / gold / rainbow —— 决定配色与光泽 */
  B.LIST = [
    /* ---- 连续打卡（核心） ---- */
    { id: 'streak3',   icon: 'flame', tier: 'bronze',  group: 'streak', name: '坚持 3 天', desc: '连续 3 天完成挑战' },
    { id: 'streak7',   icon: 'week',  tier: 'silver',  group: 'streak', name: '一周不断',   desc: '连续 7 天完成挑战' },
    { id: 'streak14',  icon: 'moon',  tier: 'gold',    group: 'streak', name: '两周达人',   desc: '连续 14 天完成挑战' },
    { id: 'streak30',  icon: 'crown', tier: 'gold',    group: 'streak', name: '满月勋章',   desc: '连续 30 天完成挑战' },
    { id: 'streak60',  icon: 'gem',   tier: 'rainbow', group: 'streak', name: '双月坚持',   desc: '连续 60 天完成挑战' },
    { id: 'streak100', icon: 'star',  tier: 'rainbow', group: 'streak', name: '百日之星',   desc: '连续 100 天完成挑战' },

    /* ---- 挑战次数 ---- */
    { id: 'daily1',  icon: 'flag',  tier: 'bronze', group: 'daily', name: '初次挑战',  desc: '完成 1 次每日挑战' },
    { id: 'daily7',  icon: 'medal', tier: 'silver', group: 'daily', name: '挑战达人',  desc: '累计完成 7 次每日挑战' },
    { id: 'daily30', icon: 'trophy', tier: 'gold',  group: 'daily', name: '挑战大师',  desc: '累计完成 30 次每日挑战' },

    /* ---- 闯关 ---- */
    { id: 'lv1',      icon: 'leaf',  tier: 'bronze', group: 'level', name: '启程',     desc: '通过第 1 关' },
    { id: 'lv4',      icon: 'path',  tier: 'silver', group: 'level', name: '半程英雄', desc: '通过第 4 关' },
    { id: 'lv8',      icon: 'gate',  tier: 'gold',   group: 'level', name: '全通关',   desc: '通过全部 8 关' },
    { id: 'allstars', icon: 'crown', tier: 'rainbow', group: 'level', name: '满星制霸', desc: '8 关全部拿到 3 星' },

    /* ---- 技巧 ---- */
    { id: 'combo10', icon: 'bolt',   tier: 'silver', group: 'skill', name: '十连击',   desc: '单局达成 10 连击' },
    { id: 'combo20', icon: 'bolt',   tier: 'gold',   group: 'skill', name: '二十连击', desc: '单局达成 20 连击' },
    { id: 'perfect', icon: 'diamond', tier: 'gold',  group: 'skill', name: '全对一局', desc: '一局全部答对' }
  ];

  B.BY_ID = {};
  B.LIST.forEach(function (b) { B.BY_ID[b.id] = b; });

  B.GROUPS = [
    { id: 'streak', name: '连续挑战', note: '每天都来，最难也最珍贵' },
    { id: 'daily',  name: '挑战次数', note: '一次一次累积' },
    { id: 'level',  name: '闯关进度', note: '把小岛一座座点亮' },
    { id: 'skill',  name: '操作技巧', note: '又快又准才有' }
  ];

  /* ---------- 是否达成 ----------
     ctx: { streak, bestStreak, totalDaily, litLevels, totalLevels,
            allFullStars, bestCombo, perfectRuns } */
  var NEED = {
    streak3:   3,
    streak7:   7,
    streak14:  14,
    streak30:  30,
    streak60:  60,
    streak100: 100,
    daily1:    1,
    daily7:    7,
    daily30:   30,
    lv1:       1,
    lv4:       4,
    lv8:       8,
    allstars:  1,
    combo10:   10,
    combo20:   20,
    perfect:   1
  };

  B.progressOf = function (id, ctx) {
    var need = NEED[id] || 1;
    var cur = 0;
    switch (id) {
      case 'streak3': case 'streak7': case 'streak14':
      case 'streak30': case 'streak60': case 'streak100':
        cur = ctx.bestStreak || 0; break;
      case 'daily1': case 'daily7': case 'daily30':
        cur = ctx.totalDaily || 0; break;
      case 'lv1': case 'lv4': case 'lv8':
        cur = ctx.litLevels || 0; break;
      case 'allstars':
        cur = ctx.allFullStars ? 1 : 0; break;
      case 'combo10': case 'combo20':
        cur = ctx.bestCombo || 0; break;
      case 'perfect':
        cur = ctx.perfectRuns || 0; break;
    }
    return { cur: Math.min(cur, need), need: need, done: cur >= need };
  };

  /* 评估：返回新达成的勋章 id 列表 */
  B.evaluate = function (ctx, earned) {
    var newly = [];
    B.LIST.forEach(function (b) {
      if (earned[b.id]) return;
      if (B.progressOf(b.id, ctx).done) newly.push(b.id);
    });
    return newly;
  };

  /* 连续天数：从今天往前推，看连续有几天标记为完成 */
  B.streakFrom = function (dailyMap, todayKey, offsetDays) {
    var n = 0;
    var d = new Date();
    /* 允许「今天还没做」时从昨天开始数，不打断已有的连续 */
    for (var i = offsetDays; i < 400; i++) {
      var probe = new Date(d.getTime());
      probe.setDate(probe.getDate() - i);
      var key = todayKey(probe);
      var rec = dailyMap[key];
      if (rec && rec.done) n++;
      else if (i === offsetDays) continue;   /* 今天未完成不打断 */
      else break;
    }
    return n;
  };

  window.MFI = window.MFI || {};
  MFI.Badges = B;
})();
