/* ===== 难度分级：4 档统一标准（1 星最简单 → 4 星最难） =====
   所有题型通过 DIFF 提供的工具取值，保证同一档在不同题型里含义一致。 */
(function () {
  var DF = {};

  /* 档位说明（用于 UI 展示与测试断言） */
  DF.TIERS = [
    { level: 1, name: '入门', note: '不进退位、一位数居多' },
    { level: 2, name: '基础', note: '可能进位退位、两位数出现' },
    { level: 3, name: '提高', note: '需要两步思考或较大数' },
    { level: 4, name: '挑战', note: '多步、贴近上限、易错点' }
  ];

  /* 把外部 diff（0..3）规整成档位（1..4） */
  DF.tier = function (diff) {
    var d = diff == null ? 2 : diff;
    return Math.max(1, Math.min(4, Math.round(d) + 1));
  };

  /* 按档位在 [lo, hi] 里取上限，档位越高越接近 hi */
  DF.span = function (tier, lo, hi) {
    var t = Math.max(1, Math.min(4, tier));
    return Math.round(lo + (hi - lo) * ((t - 1) / 3));
  };

  /* 按档位决定「是否允许进位/退位」 */
  DF.allowCarry = function (tier) { return tier >= 2; };
  DF.allowBorrow = function (tier) { return tier >= 2; };

  /* 按档位决定数值的位数（如加减法用几位数） */
  DF.digits = function (tier, one, two, three) {
    var t = Math.max(1, Math.min(4, tier));
    if (t === 1) return one;
    if (t <= 3) return two;
    return three == null ? two : three;
  };

  /* 按档位给「几步运算」：1 档一步，3-4 档两步/带括号 */
  DF.steps = function (tier) { return tier <= 2 ? 1 : 2; };

  /* 按档位决定干扰项贴近程度：档位越高，干扰项越接近答案（更难排除） */
  DF.distractorSpan = function (tier, base) {
    var t = Math.max(1, Math.min(4, tier));
    var tighter = [1.0, 0.7, 0.45, 0.3][t - 1];
    return Math.max(1, Math.round((base || 5) * tighter));
  };

  window.MFI = window.MFI || {};
  MFI.Diff = DF;
})();
