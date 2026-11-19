/* ===== 人教版三年级上下册题型生成器 ===== */
(function () {
  var U = {};

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  /* 选项：v 用于判定，label 用于显示 */
  function opt(v, label) { return { v: v, label: label == null ? String(v) : String(label) }; }
  /* 分数选项：带 frac 标记，渲染成上下分式 */
  function fopt(txt) {
    var parts = String(txt).split('/');
    return { v: txt, label: txt, frac: [Number(parts[0]), Number(parts[1])] };
  }

  /* 整数干扰项 */
  function numOpts(ans, n, min, max, span) {
    var out = [opt(ans)];
    var seen = {}; seen[ans] = 1;
    var guard = 0;
    while (out.length < n && guard++ < 200) {
      var d = ri(1, Math.max(2, span || Math.max(2, Math.round(Math.abs(ans) * 0.3))));
      var v = ans + d * (Math.random() < 0.5 ? -1 : 1);
      if (v < min || v > max || seen[v]) continue;
      seen[v] = 1;
      out.push(opt(v));
    }
    var p = min;
    while (out.length < n && p <= max) { if (!seen[p]) { seen[p] = 1; out.push(opt(p)); } p++; }
    return shuffle(out);
  }

  /* ============ 三上 U1 时分秒 ============ */
  U.time = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['clock', 'clock', 'conv', 'conv', 'dur', 'h24']);

    if (mode === 'clock') {
      var h = ri(1, 12);
      /* tier1 只整时/半点，档位越高分针越细 */
      var mins = tier <= 1 ? [0, 30] : tier === 2 ? [0, 15, 30, 45] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
      var m = pick(mins);
      var ans = h + ':' + pad2(m);
      var opts = [opt(ans)];
      var seen = {}; seen[ans] = 1;
      var guard = 0;
      while (opts.length < 3 && guard++ < 80) {
        var nh = Math.random() < 0.5 ? h : ri(1, 12);
        var nm = pick([0, 15, 30, 45]);
        var cand = nh + ':' + pad2(nm);
        if (seen[cand]) continue;
        seen[cand] = 1;
        opts.push(opt(cand));
      }
      return {
        kind: 'time', level: lv.id, layout: 'clock',
        hour: h, minute: m,
        prompt: '钟面上是几时几分？',
        answer: ans, options: shuffle(opts),
        sig: 'ck' + h + ':' + m
      };
    }

    if (mode === 'conv') {
      var big = pick([2, 3, 4, 5]);
      var isSec = Math.random() < 0.5;
      var ansV, prompt;
      if (isSec) {
        ansV = big * 60;
        prompt = big + ' 分 = （ ）秒';
      } else {
        ansV = big * 60;
        prompt = big + ' 时 = （ ）分';
      }
      return {
        kind: 'time', level: lv.id, layout: 'unitruler',
        urFrom: isSec ? '分' : '时', urTo: isSec ? '秒' : '分', urRate: 60, urN: big,
        prompt: prompt, unit: isSec ? '秒' : '分',
        answer: ansV, options: numOpts(ansV, 3, 30, 600, 40),
        sig: 'cv' + big + (isSec ? 's' : 'm')
      };
    }

    if (mode === 'h24') {
      var hh = ri(1, 11);
      var ans24 = hh + 12;
      return {
        kind: 'time', level: lv.id, layout: 'clock',
        hour: hh, minute: 0, clkCap: '下午 ' + hh + ' 时',
        prompt: '下午 ' + hh + ' 时，用 24 时计时法表示是（ ）时',
        unit: '时',
        answer: ans24, options: numOpts(ans24, 3, 12, 23, 3),
        sig: 'h24' + hh
      };
    }

    /* 经过时间 */
    var sh = ri(7, 10);
    var sm = pick([0, 10, 20, 30, 40]);
    var dur = pick([10, 20, 25, 30, 40, 50]);
    var total = sh * 60 + sm + dur;
    var eh = Math.floor(total / 60);
    var em = total % 60;
    var ansT = eh + ':' + pad2(em);
    var optsT = [opt(ansT)];
    var seenT = {}; seenT[ansT] = 1;
    var guardT = 0;
    while (optsT.length < 3 && guardT++ < 80) {
      var add = pick([10, 20, 30, 40, 50]) * (Math.random() < 0.5 ? 1 : -1);
      var t2 = sh * 60 + sm + dur + add;
      if (t2 < 0) continue;
      var c2 = Math.floor(t2 / 60) + ':' + pad2(t2 % 60);
      if (seenT[c2]) continue;
      seenT[c2] = 1;
      optsT.push(opt(c2));
    }
    return {
      kind: 'time', level: lv.id, layout: 'clock',
      hour: sh, minute: sm,
      prompt: '现在是这个时刻，再过 ' + dur + ' 分钟是（ ）',
      answer: ansT, options: shuffle(optsT),
      sig: 'du' + sh + sm + dur
    };
  };

  /* ============ 三上 U2/U4 万以内加减 ============ */
  U.addbig = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    /* tier1 不进位，tier2+ 进位，tier3+ 三位数 */
    var carry = tier >= 2 || lv.id === 'g4';
    /* 各档位数范围：T1 两位三位小、T4 三位大 */
    var loN = tier <= 1 ? 112 : tier === 2 ? 123 : 213;
    var hiN = tier <= 1 ? 249 : tier === 2 ? 549 : 899;
    var a, b;
    var guard = 0;
    do {
      a = ri(loN, hiN);
      b = ri(loN, Math.min(hiN, tier <= 1 ? 199 : 799));
      if (!carry) {
        /* 不进位：逐位和 < 10 */
        var ok = true;
        var x = a, y = b;
        for (var i = 0; i < 3; i++) {
          if ((x % 10) + (y % 10) >= 10) { ok = false; break; }
          x = Math.floor(x / 10); y = Math.floor(y / 10);
        }
        if (!ok) continue;
      }
      break;
    } while (guard++ < 200);
    var ans = a + b;
    return {
      kind: 'addbig', level: lv.id, layout: 'vertical', op: '+',
      a: a, b: b, prompt: '算一算',
      answer: ans, options: numOpts(ans, 3, ans - 400, ans + 400, 60),
      sig: 'ab' + a + '+' + b
    };
  };

  U.subbig = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var borrow = tier >= 2 || lv.id === 'g4';
    var loN = tier <= 1 ? 212 : tier === 2 ? 320 : 420;
    var hiN = tier <= 1 ? 486 : tier === 2 ? 686 : 986;
    var a, b;
    var guard = 0;
    do {
      a = ri(loN, hiN);
      b = ri(tier <= 1 ? 112 : 128, Math.min(tier <= 1 ? 199 : 299, hiN - 40));
      if (!borrow) {
        var ok = true;
        var x = a, y = b;
        for (var i = 0; i < 3; i++) {
          if ((x % 10) < (y % 10)) { ok = false; break; }
          x = Math.floor(x / 10); y = Math.floor(y / 10);
        }
        if (!ok) continue;
      }
      break;
    } while (guard++ < 200);
    var ans = a - b;
    return {
      kind: 'subbig', level: lv.id, layout: 'vertical', op: '−',
      a: a, b: b, prompt: '算一算',
      answer: ans, options: numOpts(ans, 3, Math.max(0, ans - 300), ans + 300, 50),
      sig: 'sb' + a + '-' + b
    };
  };

  /* ============ 三上 U3 测量 ============ */
  U.measure = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['conv', 'conv', 'conv', 'unit']);
    if (mode === 'conv') {
      var sets = [
        { from: '千米', to: '米', rate: 1000, max: 9 },
        { from: '米', to: '分米', rate: 10, max: 9 },
        { from: '米', to: '厘米', rate: 100, max: 9 },
        { from: '分米', to: '厘米', rate: 10, max: 9 },
        { from: '厘米', to: '毫米', rate: 10, max: 9 },
        { from: '吨', to: '千克', rate: 1000, max: 9 },
        { from: '千克', to: '克', rate: 1000, max: 9 },
        { from: '米', to: '毫米', rate: 1000, max: 5 }
      ];
      var s = pick(sets);
      var n = ri(2, s.max);
      var ans = n * s.rate;
      return {
        kind: 'measure', level: lv.id, layout: 'unitruler',
        urFrom: s.from, urTo: s.to, urRate: s.rate, urN: n,
        prompt: n + ' ' + s.from + ' = （ ）' + s.to,
        unit: s.to,
        answer: ans, options: numOpts(ans, 3, Math.max(1, Math.round(ans / 4)), ans * 2, Math.max(2, Math.round(ans / 3))),
        sig: 'ms' + s.from + n
      };
    }
    /* 单位选择 */
    var items = [
      { q: '一个鸡蛋大约重 50', a: '克', wrong: ['千克', '吨'], ico: '🥚', ref: '1 千克 = 1000 克' },
      { q: '一头大象大约重 5', a: '吨', wrong: ['千克', '克'], ico: '🐘', ref: '1 吨 = 1000 千克' },
      { q: '教室的门高约 2', a: '米', wrong: ['厘米', '分米'], ico: '🚪', ref: '大人身高约 1 米 70' },
      { q: '一枚硬币厚约 2', a: '毫米', wrong: ['厘米', '分米'], ico: '🪙', ref: '尺子最小格是 1 毫米' },
      { q: '从家到学校大约 1', a: '千米', wrong: ['米', '分米'], ico: '🏫', ref: '1 千米 = 1000 米' },
      { q: '一张课桌高约 7', a: '分米', wrong: ['米', '千米'], ico: '🪑', ref: '1 米 = 10 分米' },
      { q: '数学书厚约 8', a: '毫米', wrong: ['厘米', '米'], ico: '📕', ref: '1 厘米 = 10 毫米' },
      { q: '一袋大米重 25', a: '千克', wrong: ['克', '吨'], ico: '🍚', ref: '1 袋盐约 500 克' }
    ];
    var it = pick(items);
    var opts = [{ v: it.a }].concat(it.wrong.map(function (w) { return { v: w }; }));
    return {
      kind: 'measure', level: lv.id, layout: 'clue',
      clueIco: it.ico, clueRef: it.ref,
      prompt: it.q + '（ ）',
      answer: it.a, options: shuffle(opts),
      sig: 'mu' + it.a + it.q
    };
  };

  /* ============ 三上 U5 倍的认识 ============ */
  U.times = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['findResult', 'findBase', 'findTimes']);
    var base = tier <= 1 ? ri(2, 5) : tier === 2 ? ri(2, 7) : ri(2, 9);
    var k = tier <= 1 ? ri(2, 3) : tier === 2 ? ri(2, 5) : ri(2, 9);

    if (mode === 'findResult') {
      var ans1 = base * k;
      return {
        kind: 'times', level: lv.id, layout: 'barmodel',
        barMode: 'result', barPer: base, barTimes: k,
        prompt: '苹果有 ' + base + ' 个，梨的个数是苹果的 ' + k + ' 倍。梨有多少个？',
        answer: ans1, options: numOpts(ans1, 3, base + 1, ans1 + base * 2, base),
        sig: 'tf' + base + k
      };
    }
    if (mode === 'findBase') {
      var ans2 = k;
      var total = base * k;
      return {
        kind: 'times', level: lv.id, layout: 'barmodel',
        barMode: 'base', barPer: k, barTimes: base, barTotal: total,
        prompt: '梨有 ' + total + ' 个，是苹果的 ' + base + ' 倍。苹果有多少个？',
        answer: ans2, options: numOpts(ans2, 3, 1, Math.max(9, ans2 + 5), Math.max(2, ans2)),
        sig: 'tb' + total + base
      };
    }
    var ans3 = k;
    return {
      kind: 'times', level: lv.id, layout: 'barmodel',
      barMode: 'times', barPer: base, barTimes: k, barTotal: base * k,
      prompt: '苹果 ' + base + ' 个，梨 ' + (base * k) + ' 个。梨是苹果的几倍？',
      answer: ans3, options: numOpts(ans3, 3, 1, Math.max(9, k + 4), 2),
      sig: 'tt' + base + k
    };
  };

  /* ============ 三上 U6 多位数乘一位数 ============ */
  U.mul1 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var aLo = tier <= 1 ? 12 : tier === 2 ? 112 : 126;
    var aHi = tier <= 1 ? 49 : tier === 2 ? 449 : tier === 3 ? 686 : 986;
    var a = ri(aLo, aHi);
    var b = tier <= 1 ? ri(2, 4) : tier === 2 ? ri(2, 6) : ri(2, 9);
    var ans = a * b;
    return {
      kind: 'mul1', level: lv.id, layout: 'vertical', op: '×',
      a: a, b: b, prompt: '算一算',
      answer: ans, options: numOpts(ans, 3, Math.max(1, ans - 600), ans + 600, 80),
      sig: 'm1' + a + 'x' + b
    };
  };

  /* ============ 三上 U7 长方形和正方形（周长） ============ */
  U.perimeter = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var isSquare = Math.random() < 0.4;
    if (isSquare) {
      var s = ri(3, 12);
      var ansS = s * 4;
      return {
        kind: 'perimeter', level: lv.id, layout: 'rect',
        w: s, h: s, square: true, showGrid: false,
        prompt: '正方形的边长是 ' + s + ' 厘米，周长是多少？',
        unit: '厘米',
        answer: ansS, options: numOpts(ansS, 3, s * 2, s * 8, s),
        sig: 'pqs' + s
      };
    }
    var w = tier <= 1 ? ri(4, 8) : ri(4, 15);
    /* 宽必须严格小于长；tier1 也要保证 w ≥ 3 才有合法的 h ≥ 2 */
    var hMax = Math.max(2, w - 1);
    var h = tier <= 1 ? ri(2, Math.min(4, hMax)) : ri(2, hMax);
    if (h >= w) h = w - 1;
    var ansR = (w + h) * 2;
    return {
      kind: 'perimeter', level: lv.id, layout: 'rect',
      w: w, h: h, square: false, showGrid: false,
      prompt: '长方形的长是 ' + w + ' 厘米，宽是 ' + h + ' 厘米，周长是多少？',
      unit: '厘米',
      answer: ansR, options: numOpts(ansR, 3, w + h, (w + h) * 3, Math.max(2, w)),
      sig: 'pqr' + w + 'x' + h
    };
  };

  /* ============ 三上 U8 分数的初步认识 ============ */
  U.fraction = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var den = tier <= 1 ? pick([2, 3, 4]) : pick([2, 3, 4, 5, 6, 8]);
    /* 加法/比大小至少需要分母 ≥3，否则可选分子不足 */
    var modes = den >= 3 ? ['read', 'add', 'compare'] : ['read'];
    var mode = pick(modes);

    if (mode === 'read') {
      var num = ri(1, den - 1);
      var ans = num + '/' + den;
      var opts = [fopt(ans)];
      var seen = {}; seen[ans] = 1;
      /* 干扰项：同分母不同分子 + 不同分母，保证 3 个互不相同 */
      var cands = [];
      for (var k = 1; k < den; k++) if (k !== num) cands.push(k + '/' + den);
      [2, 3, 4, 5, 6, 8].forEach(function (d2) {
        for (var k2 = 1; k2 < d2; k2++) cands.push(k2 + '/' + d2);
      });
      cands = shuffle(cands);
      for (var ci = 0; ci < cands.length && opts.length < 3; ci++) {
        if (seen[cands[ci]]) continue;
        seen[cands[ci]] = 1;
        opts.push(fopt(cands[ci]));
      }
      return {
        kind: 'fraction', level: lv.id, layout: 'fraction',
        den: den, num: num,
        prompt: '涂色部分占整个图形的几分之几？',
        answer: ans, options: shuffle(opts),
        sig: 'fr' + num + den
      };
    }

    if (mode === 'add' && den >= 3) {
      var a1 = ri(1, den - 2);
      var b1 = ri(1, den - a1 - 1);
      var sum = a1 + b1;
      var ansA = sum + '/' + den;
      var optsA = [fopt(ansA)];
      var seenA = {}; seenA[ansA] = 1;
      var pool = [];
      for (var x = 1; x <= den; x++) pool.push(x + '/' + den);
      shuffle(pool).forEach(function (candA) {
        if (optsA.length >= 3 || seenA[candA]) return;
        seenA[candA] = 1;
        optsA.push(fopt(candA));
      });
      return {
        kind: 'fraction', level: lv.id, layout: 'fracbar',
        fbNum: a1, fbDen: den, fbNum2: b1,
        prompt: '§' + a1 + '/' + den + '§ + §' + b1 + '/' + den + '§ = （ ）',
        answer: ansA, options: shuffle(optsA),
        sig: 'fa' + a1 + b1 + den
      };
    }

    /* 同分母比大小 */
    var m1 = ri(1, den - 1), m2 = ri(1, den - 1);
    var guardC = 0;
    while (m2 === m1 && guardC++ < 60) m2 = ri(1, den - 1);
    if (m2 === m1) m2 = m1 === 1 ? 2 : 1;
    var bigger = Math.max(m1, m2);
    var ansC = bigger + '/' + den;
    return {
      kind: 'fraction', level: lv.id, layout: 'fracpair',
      fpA: m1 + '/' + den, fpB: m2 + '/' + den,
      prompt: '§' + m1 + '/' + den + '§ 和 §' + m2 + '/' + den + '§，哪个大？',
      answer: ansC,
      options: shuffle([fopt(m1 + '/' + den), fopt(m2 + '/' + den)]),
      sig: 'fc' + den + m1 + m2
    };
  };

  /* ============ 三上 U9 集合 ============ */
  U.venn = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var a = ri(6, 14), b = ri(6, 14), both = ri(2, Math.min(a, b) - 2 < 2 ? 3 : Math.min(a, b) - 2);
    var ans = a + b - both;
    return {
      kind: 'venn', level: lv.id, layout: 'venn',
      onlyA: a - both, onlyB: b - both, both: both,
      leftName: '语文', rightName: '数学',
      prompt: '参加语文的 ' + a + ' 人，数学的 ' + b + ' 人，两项都参加的 ' + both + ' 人。一共有多少人？',
      answer: ans, options: numOpts(ans, 3, a, a + b, 3),
      sig: 'vn' + a + b + both
    };
  };

  /* ============ 三下 U1 位置与方向 ============ */
  U.direction = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var dirs = [
      { n: '东', dx: 1, dy: 0 }, { n: '西', dx: -1, dy: 0 },
      { n: '南', dx: 0, dy: 1 }, { n: '北', dx: 0, dy: -1 }
    ];
    var d = pick(dirs);
    var opposite = { '东': '西', '西': '东', '南': '北', '北': '南' };
    var mode = pick(['fromCenter', 'opposite']);
    if (mode === 'fromCenter') {
      var ans = d.n;
      var opts = dirs.map(function (x) { return { v: x.n }; });
      var places = { '东': '图书馆', '西': '超市', '南': '图书馆', '北': '超市' };
      var place = places[d.n];
      return {
        kind: 'direction', level: lv.id, layout: 'grid',
        target: d.n, ask: 'center', placeName: place,
        prompt: place + '在学校的（ ）面',
        answer: ans, options: shuffle(opts),
        sig: 'dgc' + d.n
      };
    }
    var ansO = d.n;
    var from = opposite[d.n];
    return {
      kind: 'direction', level: lv.id, layout: 'grid',
      target: d.n, ask: 'invert', from: from,
      placeName: '小明家', otherName: '医院',
      prompt: '小明家在学校的' + d.n + '面，医院在学校的' + from + '面。小明家在医院的（ ）面',
      answer: ansO, options: shuffle(dirs.map(function (x) { return { v: x.n }; })),
      sig: 'dgi' + d.n
    };
  };

  /* ============ 三下 U2 除数是一位数的除法 ============ */
  U.div1 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var b = tier <= 1 ? ri(2, 5) : ri(2, 9);
    var q = tier <= 1 ? ri(2, 9) : tier === 2 ? ri(6, 40) : ri(12, 98);
    var exact = Math.random() < 0.65;
    var a = q * b;
    if (!exact) { q = q - 1; a = q * b + ri(1, b - 1); }
    var rem = a - Math.floor(a / b) * b;
    var qq = Math.floor(a / b);
    var ans = exact || rem === 0 ? String(qq) : qq + '余' + rem;
    var opts = [opt(ans)];
    var seen = {}; seen[ans] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 120) {
      var dv = qq + pick([-2, -1, 1, 2, 3]);
      if (dv < 1) continue;
      var cand = String(dv);
      if (seen[cand]) continue;
      seen[cand] = 1;
      opts.push(opt(cand));
    }
    return {
      kind: 'div1', level: lv.id, layout: 'share', op: '÷',
      a: a, b: b, shareTotal: Math.min(a, 60), shareGroups: Math.min(b, 6),
      prompt: '把 ' + a + ' 平均分成 ' + b + ' 份，每份是多少？',
      answer: ans, options: shuffle(opts),
      sig: 'dv' + a + b
    };
  };

  /* ============ 三下 U3 复式统计表 ============ */
  U.table = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var cats = ['跳绳', '踢毽', '跑步'].slice(0, 3);
    var boys, girls;
    var guardT = 0;
    while (guardT++ < 80) {
      boys = cats.map(function () { return ri(4, 12); });
      girls = cats.map(function () { return ri(4, 12); });
      var t0 = boys[0] + girls[0], t1 = boys[1] + girls[1], t2 = boys[2] + girls[2];
      /* 保证三个项目总人数互不相同，避免「最多」并列导致答案不唯一 */
      if (t0 !== t1 && t1 !== t2 && t0 !== t2) break;
    }
    var mode = pick(['total', 'most', 'diff']);
    var i = ri(0, 2);
    if (mode === 'total') {
      var ans = boys[i] + girls[i];
      return {
        kind: 'table', level: lv.id, layout: 'table',
        cats: cats, boys: boys, girls: girls, hi: i,
        prompt: '参加「' + cats[i] + '」的一共有多少人？',
        answer: ans, options: numOpts(ans, 3, 2, 30, 4),
        sig: 'tbt' + i + boys[i] + girls[i]
      };
    }
    if (mode === 'diff') {
      var d0 = boys[i] - girls[i];
      /* 问「多多少」时男生必须确实更多，否则答案会是 0 */
      if (d0 === 0) { i = (i + 1) % cats.length; d0 = boys[i] - girls[i]; }
      var ans2 = d0 > 0 ? d0 : Math.abs(d0);
      var aName = d0 >= 0 ? '男生' : '女生';
      var bName = d0 >= 0 ? '女生' : '男生';
      return {
        kind: 'table', level: lv.id, layout: 'table',
        cats: cats, boys: boys, girls: girls, hi: i,
        prompt: '「' + cats[i] + '」' + aName + '比' + bName + '多多少人？',
        answer: ans2, options: numOpts(ans2, 3, 1, Math.max(6, ans2 + 6), 2),
        sig: 'tbd' + i + boys[i] + girls[i]
      };
    }
    var totals = cats.map(function (c, k) { return boys[k] + girls[k]; });
    var best = 0;
    totals.forEach(function (t, k) { if (t > totals[best]) best = k; });
    return {
      kind: 'table', level: lv.id, layout: 'table',
      cats: cats, boys: boys, girls: girls, hi: best,
      prompt: '哪个项目参加的人数最多？',
      answer: cats[best],
      options: shuffle(cats.map(function (c) { return { v: c }; })),
      sig: 'tbm' + totals.join(',')
    };
  };

  /* ============ 三下 U4 两位数乘两位数 ============ */
  U.mul2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var a = ri(tier <= 1 ? 12 : 22, tier >= 3 ? 89 : 49);
    var b = ri(tier <= 1 ? 11 : 12, tier >= 3 ? 59 : 29);
    var ans = a * b;
    return {
      kind: 'mul2', level: lv.id, layout: 'vertical', op: '×',
      a: a, b: b, prompt: '算一算',
      answer: ans, options: numOpts(ans, 3, Math.max(50, ans - 900), ans + 900, 120),
      sig: 'm2' + a + 'x' + b
    };
  };

  /* ============ 三下 U5 面积 ============ */
  U.area = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['rect', 'conv', 'square']);
    if (mode === 'rect' || mode === 'square') {
      var sq = mode === 'square';
      var w, h;
      if (sq) {
        w = ri(3, 12);
        h = w;
      } else {
        /* 长方形：长宽必须不等，且长 > 宽（教材约定） */
        w = ri(4, 12);
        h = ri(2, w - 1);
      }
      var ans = w * h;
      var unit = pick(['平方厘米', '平方分米', '平方米']);
      return {
        kind: 'area', level: lv.id, layout: 'rect',
        w: w, h: h, square: sq, showGrid: true, unit: unit,
        prompt: (sq ? '正方形边长 ' + w + ' ' + unit.replace('平方', '') : '长 ' + w + '、宽 ' + h + ' ' + unit.replace('平方', ''))
          + '，面积是多少？',
        answer: ans, options: numOpts(ans, 3, Math.max(2, ans - 20), ans + 25, Math.max(2, Math.round(ans / 4))),
        sig: 'ar' + w + 'x' + h
      };
    }
    var sets = [
      { from: '平方米', to: '平方分米', rate: 100, max: 6 },
      { from: '平方分米', to: '平方厘米', rate: 100, max: 8 },
      { from: '平方米', to: '平方厘米', rate: 10000, max: 3 }
    ];
    var s = pick(sets);
    var n = ri(2, s.max);
    var ansC = n * s.rate;
    return {
      kind: 'area', level: lv.id, layout: 'unitruler',
      urFrom: s.from, urTo: s.to, urRate: s.rate, urN: n,
      prompt: n + ' ' + s.from + ' = （ ）' + s.to,
      unit: s.to,
      answer: ansC, options: numOpts(ansC, 3, Math.max(1, Math.round(ansC / 5)), ansC * 2, Math.max(2, Math.round(ansC / 3))),
      sig: 'arc' + s.from + n
    };
  };

  /* ============ 三下 U6 年、月、日 ============ */
  U.calendar = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['bigMonth', 'days', 'leap', 'yearDays', 'h24']);
    var bigNames = ['1 月', '3 月', '5 月', '7 月', '8 月', '10 月', '12 月'];
    var smallNames = ['4 月', '6 月', '9 月', '11 月'];

    if (mode === 'bigMonth') {
      var isBig = Math.random() < 0.5;
      var mName = isBig ? pick(bigNames) : pick(smallNames);
      var ans = isBig ? 31 : 30;
      return {
        kind: 'calendar', level: lv.id, layout: 'calendar',
        calMonth: mName, calDays: ans,
        prompt: mName + ' 有多少天？',
        answer: ans + ' 天',
        options: shuffle([opt('30 天'), opt('31 天'), opt('28 天')]),
        sig: 'cd' + mName
      };
    }
    if (mode === 'days') {
      var y = pick([2024, 2025, 2026, 2028]);
      var leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
      var feb = leap ? 29 : 28;
      return {
        kind: 'calendar', level: lv.id, layout: 'calendar',
        calMonth: y + ' 年 2 月', calDays: feb,
        prompt: y + ' 年 2 月有多少天？',
        answer: feb + ' 天',
        options: shuffle([opt('28 天'), opt('29 天'), opt('30 天')]),
        sig: 'cf' + y
      };
    }
    if (mode === 'leap') {
      var y2 = pick([2023, 2024, 2025, 2026, 2028, 2030]);
      var leap2 = (y2 % 4 === 0 && y2 % 100 !== 0) || y2 % 400 === 0;
      return {
        kind: 'calendar', level: lv.id, layout: 'months',
        calLeapFeb: leap2, calHiMonth: 2, calYear: y2,
        prompt: y2 + ' 年是闰年还是平年？',
        answer: leap2 ? '闰年' : '平年',
        options: shuffle([opt('闰年'), opt('平年')]),
        sig: 'cl' + y2
      };
    }
    if (mode === 'yearDays') {
      var leapQ = Math.random() < 0.5;
      var ansY = leapQ ? 366 : 365;
      return {
        kind: 'calendar', level: lv.id, layout: 'months',
        calLeapFeb: leapQ, calHiMonth: 2,
        prompt: leapQ ? '闰年一年有多少天？' : '平年一年有多少天？',
        answer: ansY + ' 天',
        options: shuffle([opt('365 天'), opt('366 天'), opt('364 天')]),
        sig: 'cy' + ansY
      };
    }
    var hh = ri(1, 11);
    var ansH = hh + 12;
    return {
      kind: 'calendar', level: lv.id, layout: 'clock',
      hour: hh, minute: 0, clkCap: '晚上 ' + hh + ' 时',
      prompt: '晚上 ' + hh + ' 时，用 24 时计时法表示是（ ）时',
      unit: '时',
      answer: ansH, options: numOpts(ansH, 3, 12, 23, 3),
      sig: 'ch' + hh
    };
  };

  /* ============ 三下 U7 小数的初步认识 ============ */
  U.decimal = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['add', 'sub', 'compare', 'money']);
    function d1() { return ri(1, 9); }
    function fmt(n) { return (n / 10).toFixed(1); }

    if (mode === 'add') {
      var a = ri(1, 8), b = ri(1, 9 - a);
      var ans = ((a + b) / 10).toFixed(1);
      var dOpts = [opt(ans)]; var dSeen = {}; dSeen[ans] = 1;
      [1, -1, 2, -2].forEach(function (dlt) {
        if (dOpts.length >= 3) return;
        var v = a + b + dlt;
        if (v < 1 || v > 18) return;
        var cand = fmt(v);
        if (dSeen[cand]) return;
        dSeen[cand] = 1; dOpts.push(opt(cand));
      });
      return {
        kind: 'decimal', level: lv.id, layout: 'vertical', op: '+',
        a: fmt(a), b: fmt(b), isDecimal: true,
        prompt: '算一算（注意小数点对齐）',
        answer: ans,
        options: shuffle(dOpts),
        sig: 'da' + a + b
      };
    }
    if (mode === 'sub') {
      var a2 = ri(3, 9), b2 = ri(1, a2 - 1);
      var ans2 = ((a2 - b2) / 10).toFixed(1);
      var sOpts = [opt(ans2)]; var sSeen = {}; sSeen[ans2] = 1;
      [1, -1, 2, -2].forEach(function (dlt) {
        if (sOpts.length >= 3) return;
        var v = a2 - b2 + dlt;
        if (v < 1 || v > 12) return;
        var cand = fmt(v);
        if (sSeen[cand]) return;
        sSeen[cand] = 1; sOpts.push(opt(cand));
      });
      return {
        kind: 'decimal', level: lv.id, layout: 'vertical', op: '−',
        a: fmt(a2), b: fmt(b2), isDecimal: true,
        prompt: '算一算（注意小数点对齐）',
        answer: ans2,
        options: shuffle(sOpts),
        sig: 'ds' + a2 + b2
      };
    }
    if (mode === 'compare') {
      var x = ri(1, 9), y = ri(1, 9);
      while (y === x) y = ri(1, 9);
      var big = Math.max(x, y);
      return {
        kind: 'decimal', level: lv.id, layout: 'compare2',
        cmpA: fmt(x), cmpB: fmt(y), cmpDec: true,
        prompt: fmt(x) + ' 和 ' + fmt(y) + '，哪个大？',
        answer: fmt(big),
        options: shuffle([opt(fmt(x)), opt(fmt(y))]),
        sig: 'dc' + x + y
      };
    }
    var yuan = ri(1, 9), jiao = ri(1, 9);
    var ansM = yuan + '.' + jiao;
    var mOpts = [opt(ansM)]; var mSeen = {}; mSeen[ansM] = 1;
    var mCands = [
      yuan + '.' + ((jiao + 1) % 10),
      (yuan + 1) + '.' + jiao,
      yuan + '.' + ((jiao + 2) % 10),
      (yuan + 2) + '.' + jiao,
      '0.' + jiao
    ];
    mCands.forEach(function (cand) {
      if (mOpts.length >= 3 || mSeen[cand]) return;
      mSeen[cand] = 1; mOpts.push(opt(cand));
    });
    return {
      kind: 'decimal', level: lv.id, layout: 'money',
      mYuan: yuan, mJiao: jiao,
      prompt: yuan + ' 元 ' + jiao + ' 角 = （ ）元',
      answer: ansM,
      options: shuffle(mOpts),
      sig: 'dm' + yuan + jiao
    };
  };

  /* ============ 三下 U8 搭配 ============ */
  U.combo = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['outfit', 'food', 'route', 'digit']);
    if (mode === 'outfit') {
      var tops = ri(2, 4), pants = ri(2, 4);
      var ans = tops * pants;
      return {
        kind: 'combo', level: lv.id, layout: 'combo',
        groupA: tops, groupB: pants, nameA: '上衣', nameB: '裤子',
        itemsA: ['红', '蓝', '黄', '绿'].slice(0, tops),
        itemsB: ['长裤', '短裤', '裙子', '运动裤'].slice(0, pants),
        prompt: tops + ' 件上衣和 ' + pants + ' 条裤子，一共有多少种搭配？',
        answer: ans, options: numOpts(ans, 3, 2, tops * pants + 6, 2),
        sig: 'co' + tops + pants
      };
    }
    if (mode === 'food') {
      var mains = ri(2, 4), drinks = ri(2, 4);
      var ans2 = mains * drinks;
      return {
        kind: 'combo', level: lv.id, layout: 'combo',
        groupA: mains, groupB: drinks, nameA: '主食', nameB: '饮料',
        itemsA: ['米饭', '面条', '饺子', '包子'].slice(0, mains),
        itemsB: ['牛奶', '果汁', '豆浆', '汽水'].slice(0, drinks),
        prompt: mains + ' 种主食和 ' + drinks + ' 种饮料，一份套餐有几种选法？',
        answer: ans2, options: numOpts(ans2, 3, 2, mains * drinks + 6, 2),
        sig: 'cf' + mains + drinks
      };
    }
    if (mode === 'digit') {
      var digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      var picked = shuffle(digits).slice(0, 3);
      var ans3 = 6;
      return {
        kind: 'combo', level: lv.id, layout: 'combo',
        groupA: 3, groupB: 2, nameA: '数字', nameB: '位数',
        itemsA: picked.map(String), itemsB: ['十位', '个位'],
        prompt: '用 ' + picked.join('、') + ' 三张数字卡，能组成多少个不同的两位数？',
        answer: ans3, options: numOpts(ans3, 3, 2, 12, 2),
        sig: 'cdg' + picked.join('')
      };
    }
    var roads1 = ri(2, 4), roads2 = ri(2, 3);
    var ans4 = roads1 * roads2;
    return {
      kind: 'combo', level: lv.id, layout: 'combo',
      groupA: roads1, groupB: roads2, nameA: '第一条路', nameB: '第二条路',
      itemsA: ['甲', '乙', '丙', '丁'].slice(0, roads1),
      itemsB: ['A', 'B', 'C'].slice(0, roads2),
      prompt: '从家到车站有 ' + roads1 + ' 条路，车站到学校有 ' + roads2 + ' 条路，一共有多少种走法？',
      answer: ans4, options: numOpts(ans4, 3, 2, roads1 * roads2 + 6, 2),
      sig: 'cr' + roads1 + roads2
    };
  };

  /* ============================================================
     一年级下册 ~ 六年级下册的新题型（人教版）
     ============================================================ */

  /* ---- 通用工具 ---- */
  function mkNumOpts(ans, n, span, min, max) {
    var out = [opt(ans)];
    var seen = {}; seen[ans] = 1;
    var lo = min == null ? Math.max(0, ans - (span || 5) * 4) : min;
    var hi = max == null ? ans + (span || 5) * 4 : max;
    var guard = 0;
    while (out.length < n && guard++ < 200) {
      var v = ans + ri(1, span || 5) * (Math.random() < 0.5 ? -1 : 1);
      if (v < lo || v > hi || seen[v]) continue;
      seen[v] = 1; out.push(opt(v));
    }
    var p = lo;
    while (out.length < n && p <= hi) { if (!seen[p]) { seen[p] = 1; out.push(opt(p)); } p++; }
    return shuffle(out);
  }
  function txtOpts(ans, list) {
    var out = [opt(ans)];
    var seen = {}; seen[String(ans)] = 1;
    shuffle(list).forEach(function (v) {
      if (out.length >= 3 || seen[String(v)]) return;
      seen[String(v)] = 1; out.push(opt(v));
    });
    return shuffle(out);
  }

  /* ============ 一下 U1 认识图形（二） ============ */
  U.shape2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var shapes = [
      { n: '三角形', sides: 3 }, { n: '正方形', sides: 4 },
      { n: '长方形', sides: 4 }, { n: '圆', sides: 0 }
    ];
    var mode = pick(['sides', 'name']);
    var s = pick(shapes);
    if (mode === 'sides' && s.sides > 0) {
      return {
        kind: 'shape2', level: lv.id, layout: 'shape', shape: s.n,
        prompt: '这个图形有几条边？',
        answer: s.sides, options: mkNumOpts(s.sides, 3, 1, 2, 6),
        sig: 'sh2' + s.n
      };
    }
    var other = pick(shapes.filter(function (x) { return x.n !== s.n; }));
    return {
      kind: 'shape2', level: lv.id, layout: 'shape', shape: s.n,
      prompt: '这是什么图形？',
      answer: s.n, options: txtOpts(s.n, shapes.map(function (x) { return x.n; })),
      sig: 'shn' + s.n
    };
  };

  /* ============ 一下 U2 20 以内退位减法 ============ */
  U.sub20 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var hiA = tier <= 1 ? 14 : tier === 2 ? 16 : 18;
    var a = ri(11, hiA);
    var b = ri(a - 9, 9);
    var ans = a - b;
    return {
      kind: 'sub20', level: lv.id, layout: 'numline',
      nlMin: 0, nlMax: 20, nlStep: 1,
      nlMarks: [{ v: a, color: '#F0207E', label: a }, { v: ans, color: '#42B62A', label: '?' }],
      prompt: a + ' 减去 ' + b + '，从 ' + a + ' 往左数 ' + b + ' 格',
      answer: ans, options: mkNumOpts(ans, 3, 2, 0, 18),
      sig: 's20' + a + b
    };
  };

  /* ============ 一下 U3 分类与整理 ============ */
  U.classify = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var groups = [
      { name: '水果', items: ['苹果', '香蕉', '橘子'] },
      { name: '文具', items: ['铅笔', '尺子', '橡皮'] },
      { name: '动物', items: ['小猫', '小狗', '兔子'] }
    ];
    var target = pick(groups);
    var outsiders = [];
    groups.forEach(function (g) { if (g !== target) g.items.forEach(function (i) { outsiders.push(i); }); });
    var pickOut = pick(outsiders);
    var iconMap = {
      '苹果': '🍎', '香蕉': '🍌', '橘子': '🍊', '铅笔': '✏️', '尺子': '📏',
      '橡皮': '🧽', '小猫': '🐱', '小狗': '🐶', '兔子': '🐰'
    };
    var showItems = [pick(target.items), pick(target.items.filter(function (x) { return x; })), pickOut];
    return {
      kind: 'classify', level: lv.id, layout: 'clue',
      clueList: showItems.map(function (t) { return { text: t, ico: iconMap[t] || '•' }; }),
      prompt: '下面哪个不是' + target.name + '？',
      answer: pickOut,
      options: txtOpts(pickOut, [pick(target.items), pick(target.items.filter(function (x) { return x; }))]),
      sig: 'cf' + target.name + pickOut
    };
  };

  /* ============ 一下 U4 100 以内数的认识 ============ */
  U.num100 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['tens', 'compose', 'compare']);
    if (mode === 'tens') {
      var n = ri(21, 99);
      var tens = Math.floor(n / 10);
      var ones = n % 10;
      return {
        kind: 'num100', level: lv.id, layout: 'placevalue2',
        pv2Tens: tens, pv2Ones: ones,
        prompt: n + ' 是由（ ）个十组成的',
        answer: tens, options: mkNumOpts(tens, 3, 1, 1, 10),
        sig: 'nt' + n
      };
    }
    if (mode === 'compose') {
      var t = ri(2, 9), o = ri(1, 9);
      var val = t * 10 + o;
      return {
        kind: 'num100', level: lv.id, layout: 'placevalue2',
        pv2Tens: t, pv2Ones: o,
        prompt: t + ' 个十和 ' + o + ' 个一组成的数是（ ）',
        answer: val, options: mkNumOpts(val, 3, 5, 10, 99),
        sig: 'nc' + t + o
      };
    }
    var a = ri(21, 99), b = ri(21, 99);
    while (b === a) b = ri(21, 99);
    var big = Math.max(a, b);
    return {
      kind: 'num100', level: lv.id, layout: 'numline',
      nlMin: 0, nlMax: 100, nlMarks: [{ v: a, color: '#2794DD', label: a }, { v: b, color: '#F0207E', label: b }],
      prompt: '哪个数离 100 更近一点？还是比一比谁大？',
      answer: big, options: shuffle([opt(a), opt(b)]),
      sig: 'ncm' + a + b
    };
  };

  /* ============ 一下 U5 认识人民币 ============ */
  U.money = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;

    /* 干扰项优先取「典型错误」：孩子选错时能看出是漏了换算、还是元角颠倒，
       而不是随便加减出来的数字 */
    function distract(ans, cands, n) {
      var out = [], seen = {};
      seen[ans] = 1;
      cands.forEach(function (v) {
        if (out.length >= n) return;
        v = Math.round(v);
        if (v <= 0 || seen[v]) return;
        seen[v] = 1;
        out.push(opt(v));
      });
      var d = 1;
      while (out.length < n && d < 60) {
        [ans + d, ans - d].forEach(function (v) {
          if (out.length >= n || v <= 0 || seen[v]) return;
          seen[v] = 1;
          out.push(opt(v));
        });
        d++;
      }
      return out;
    }

    var mode = tier <= 1 ? pick(['conv', 'conv', 'sum']) : pick(['conv', 'sum', 'sum']);

    if (mode === 'conv') {
      /* 几元 = 多少角（1 元 = 10 角）。图上是 y 张 1 元。 */
      var y = ri(2, 5);
      var ansC = y * 10;
      var optsC = [opt(ansC)].concat(distract(ansC, [
        y,            /* 忘了换算 */
        y * 100,      /* 方向反了，当成「分」 */
        ansC + 10,
        ansC - 10
      ], 2));
      return {
        kind: 'money', level: lv.id, layout: 'money',
        mYuan: y, mJiao: 0,
        prompt: '这些钱一共是多少角？',
        answer: ansC, options: shuffle(optsC),
        sig: 'my' + y
      };
    }

    /* 几元几角 = 多少角：元 × 10 + 角，角不再乘 10。
       图上是 a 张 1 元 + b 枚 1 角。 */
    var a = ri(1, 4);
    var b = ri(1, 5);
    var ansS = a * 10 + b;
    var optsS = [opt(ansS)].concat(distract(ansS, [
      a + b,             /* 直接把元数角数相加 */
      b * 10 + a,        /* 元角颠倒 */
      a * 10,            /* 只算了元，漏掉角 */
      ansS + 10,
      ansS - 1
    ], 2));
    return {
      kind: 'money', level: lv.id, layout: 'money',
      mYuan: a, mJiao: b,
      prompt: '数一数，一共多少角？',
      answer: ansS, options: shuffle(optsS),
      sig: 'ms' + a + b
    };
  };

  /* ============ 一下 U6 100 以内加减（一） ============ */
  U.add100 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var isAdd = Math.random() < 0.55;
    if (isAdd) {
      /* 一年级下册只学到 100 以内，和不能超过 100 */
      var b = (tier <= 1 ? ri(1, 4) : ri(1, 6)) * 10;
      var a = ri(1, Math.floor((100 - b) / 10) - 1) * 10 + (tier <= 1 ? 0 : ri(0, 9));
      if (a + b > 100) a = 100 - b - ri(0, 9);
      var ans = a + b;
      return {
        kind: 'add100', level: lv.id, layout: 'numline',
        nlMin: 0, nlMax: 100, nlStep: 10,
        nlMarks: [{ v: a, color: '#2794DD', label: a }, { v: ans, color: '#42B62A', label: '?' }],
        prompt: '从 ' + a + ' 开始，加 ' + b,
        answer: ans, options: mkNumOpts(ans, 3, 10, 20, 100),
        sig: 'a1' + a + b
      };
    }
    var a2 = ri(3, 9) * 10 + ri(0, 9);
    var b2 = ri(1, Math.floor(a2 / 10) - 1) * 10;
    return {
      kind: 'add100', level: lv.id, layout: 'numline',
      nlMin: 0, nlMax: 100, nlStep: 10,
      nlMarks: [{ v: a2, color: '#F0207E', label: a2 }, { v: a2 - b2, color: '#42B62A', label: '?' }],
      prompt: a2 + ' 减去 ' + b2 + '，往左数 ' + (b2 / 10) + ' 个十',
      answer: a2 - b2, options: mkNumOpts(a2 - b2, 3, 10, 10, 100),
      sig: 's1' + a2 + b2
    };
  };

  /* ============ 一下 U7 找规律 ============ */
  U.pattern = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['num', 'shape']);
    if (mode === 'num') {
      var start = ri(1, 9);
      var step = ri(2, 5);
      var seq = [];
      for (var i = 0; i < 4; i++) seq.push(start + step * i);
      var ans = start + step * 4;
      return {
        kind: 'pattern', level: lv.id, layout: 'sequence',
        seqItems: seq.slice(), seqStep: step,
        prompt: '按规律填下一个数',
        answer: ans, options: mkNumOpts(ans, 3, step, start, start + step * 6),
        sig: 'pn' + start + step
      };
    }
    var shapes = ['🔴', '🔵', '🟡', '🟢', '🟣'];
    var two = shuffle(shapes).slice(0, 2);
    var seq2 = [];
    for (var j = 0; j < 5; j++) seq2.push(two[j % 2]);
    var ans2 = two[5 % 2];
    return {
      kind: 'pattern', level: lv.id, layout: 'sequence',
      seqItems: seq2.slice(), seqShape: true,
      prompt: '找到规律，下一个是什么？',
      answer: ans2, options: shuffle(two.map(function (t) { return opt(t); })),
      sig: 'ps' + two.join('')
    };
  };

  /* ============ 二上 U1 长度单位 ============ */
  U.length = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['conv', 'unit']);
    if (mode === 'conv') {
      var n = ri(2, 9);
      var isCm = Math.random() < 0.5;
      return {
        kind: 'length', level: lv.id, layout: 'unitruler',
        urFrom: isCm ? '米' : '厘米', urTo: isCm ? '厘米' : '毫米',
        urRate: isCm ? 100 : 10, urN: n,
        prompt: isCm ? n + ' 米 = （ ）厘米' : n + ' 厘米 = （ ）毫米',
        answer: n * (isCm ? 100 : 10),
        options: mkNumOpts(n * (isCm ? 100 : 10), 3, isCm ? 100 : 10, 10, isCm ? 1000 : 100),
        sig: 'lc' + n + isCm
      };
    }
    var items = [
      { q: '一支铅笔长约 18', a: '厘米', w: ['米', '毫米'], ico: '✏️', ref: '手指宽约 1 厘米' },
      { q: '教室长约 8', a: '米', w: ['厘米', '毫米'], ico: '🏫', ref: '黑板长约 4 米' },
      { q: '一枚硬币厚约 2', a: '毫米', w: ['厘米', '米'], ico: '🪙', ref: '尺子最小格是 1 毫米' },
      { q: '一棵大树高约 10', a: '米', w: ['厘米', '毫米'], ico: '🌳', ref: '教室高约 3 米' }
    ];
    var it = pick(items);
    return {
      kind: 'length', level: lv.id, layout: 'clue',
      clueIco: it.ico, clueRef: it.ref,
      prompt: it.q + '（ ）',
      answer: it.a, options: txtOpts(it.a, it.w),
      sig: 'lu' + it.q
    };
    /* eslint-disable no-unreachable */
    return {
      kind: 'length', level: lv.id, layout: 'plain',
      prompt: it.q + '（ ）',
      answer: it.a, options: txtOpts(it.a, it.w),
      sig: 'lu' + it.q
    };
  };

  /* ============ 二上 U2 100 以内加减（二） ============ */
  U.add100b = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var isAdd = Math.random() < 0.5;
    if (isAdd) {
      var a = ri(12, 68), b = ri(12, 99 - a);
      if (b < 10) b = 12;
      var ans = a + b;
      return {
        kind: 'add100b', level: lv.id, layout: 'vertical', op: '+',
        a: a, b: b, prompt: '算一算',
        answer: ans, options: mkNumOpts(ans, 3, 6, 20, 130),
        sig: 'va' + a + b
      };
    }
    var a2 = ri(35, 99), b2 = ri(12, a2 - 10);
    return {
      kind: 'add100b', level: lv.id, layout: 'vertical', op: '−',
      a: a2, b: b2, prompt: '算一算',
      answer: a2 - b2, options: mkNumOpts(a2 - b2, 3, 6, 0, 90),
      sig: 'vs' + a2 + b2
    };
  };

  /* ============ 二上 U3 角的初步认识 ============ */
  U.angle = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['count', 'kind', 'compare']);
    if (mode === 'count') {
      var n = ri(3, 5);
      var ans = n;
      return {
        kind: 'angle', level: lv.id, layout: 'polygon', sides: n,
        prompt: '这个图形有几个角？',
        answer: ans, options: mkNumOpts(ans, 3, 1, 2, 8),
        sig: 'ac' + n
      };
    }
    if (mode === 'kind') {
      var kinds = [
        { n: '直角', deg: 90 }, { n: '锐角', deg: ri(20, 80) }, { n: '钝角', deg: ri(100, 160) }
      ];
      var k = pick(kinds);
      return {
        kind: 'angle', level: lv.id, layout: 'angle', deg: k.deg,
        prompt: '这个角是什么角？',
        answer: k.n, options: txtOpts(k.n, kinds.map(function (x) { return x.n; })),
        sig: 'ak' + k.deg
      };
    }
    return {
      kind: 'angle', level: lv.id, layout: 'angle', deg: 90,
      prompt: '直角是（ ）度',
      answer: 90, options: mkNumOpts(90, 3, 10, 30, 180),
      sig: 'ar90'
    };
  };

  /* ============ 二上 U4/U6 表内乘法 ============ */
  function mulTable(maxB) {
    var a = ri(2, 9);
    var b = ri(2, maxB);
    return { a: a, b: b, ans: a * b };
  }
  U.multable = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var m = mulTable(tier <= 1 ? 5 : 6);
    return {
      kind: 'multable', level: lv.id, layout: 'group',
      a: m.a, b: m.b, prompt: m.a + ' × ' + m.b + ' = （ ）',
      answer: m.ans, options: mkNumOpts(m.ans, 3, 4, 2, 60),
      sig: 'mt' + m.a + m.b
    };
  };
  U.multable2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var m = mulTable(tier <= 1 ? 7 : 9);
    return {
      kind: 'multable2', level: lv.id, layout: 'group',
      a: m.a, b: m.b, prompt: m.a + ' × ' + m.b + ' = （ ）',
      answer: m.ans, options: mkNumOpts(m.ans, 3, 4, 2, 90),
      sig: 'm2t' + m.a + m.b
    };
  };

  /* ============ 二上 U5 观察物体 ============ */
  U.observe = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var shapes = [
      { n: '正方体', faces: 6 }, { n: '长方体', faces: 6 }, { n: '圆柱', faces: 3 }
    ];
    var mode = pick(['faces', 'name']);
    var s = pick(shapes);
    if (mode === 'faces') {
      return {
        kind: 'observe', level: lv.id, layout: 'solid', shape: s.n,
        prompt: s.n + '有几个面？',
        answer: s.faces, options: mkNumOpts(s.faces, 3, 1, 2, 8),
        sig: 'of' + s.n
      };
    }
    return {
      kind: 'observe', level: lv.id, layout: 'solid', shape: s.n,
      prompt: '这个物体的形状是？',
      answer: s.n, options: txtOpts(s.n, shapes.map(function (x) { return x.n; })),
      sig: 'on' + s.n
    };
  };

  /* ============ 二上 U7 认识时间 ============ */
  U.clock2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var h = ri(1, 12);
    var m = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
    var ans = h + ':' + pad2(m);
    var opts = [opt(ans)];
    var seen = {}; seen[ans] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 120) {
      var nh = Math.random() < 0.5 ? h : ri(1, 12);
      var nm = pick([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]);
      var cand = nh + ':' + pad2(nm);
      if (seen[cand]) continue;
      seen[cand] = 1; opts.push(opt(cand));
    }
    return {
      kind: 'clock2', level: lv.id, layout: 'clock2',
      hour: h, minute: m,
      prompt: '现在是几时几分？',
      answer: ans, options: shuffle(opts),
      sig: 'ck2' + h + ':' + m
    };
  };

  /* ============ 二下 U2/U4 表内除法 ============ */
  function divTable(maxB) {
    var b = ri(2, maxB), q = ri(2, 9);
    return { a: b * q, b: b, ans: q };
  }
  U.divtable = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var d = divTable(6);
    return {
      kind: 'divtable', level: lv.id, layout: 'group',
      a: d.a, b: d.b, prompt: d.a + ' ÷ ' + d.b + ' = （ ）',
      answer: d.ans, options: mkNumOpts(d.ans, 3, 2, 1, 12),
      sig: 'dt' + d.a + d.b
    };
  };
  U.divtable2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var d = divTable(9);
    return {
      kind: 'divtable2', level: lv.id, layout: 'group',
      a: d.a, b: d.b, prompt: d.a + ' ÷ ' + d.b + ' = （ ）',
      answer: d.ans, options: mkNumOpts(d.ans, 3, 2, 1, 12),
      sig: 'd2t' + d.a + d.b
    };
  };

  /* ============ 二下 U3 图形的运动 ============ */
  U.symmetry = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var items = ['正方形', '长方形', '圆', '三角形', '平行四边形'];
    var map = { '正方形': 4, '长方形': 2, '圆': 999, '三角形': 1, '平行四边形': 0 };
    var mode = pick(['axis', 'which']);
    if (mode === 'axis') {
      var s = pick(['正方形', '长方形', '三角形']);
      var ans = map[s];
      return {
        kind: 'symmetry', level: lv.id, layout: 'axis',
        axShape: s,
        prompt: s + '有几条对称轴？',
        answer: ans, options: mkNumOpts(ans, 3, 1, 1, 6),
        sig: 'sy' + s
      };
    }
    return {
      kind: 'symmetry', level: lv.id, layout: 'quadshape',
      quad: 'para',
      prompt: '这个图形有对称轴吗？',
      answer: '没有', options: shuffle([opt('有'), opt('没有')]),
      sig: 'syw'
    };
  };

  /* ============ 二下 U5 混合运算 ============ */
  U.mixed = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['mulAdd', 'addMul', 'paren']);
    if (mode === 'mulAdd') {
      var a = ri(2, 9), b = ri(2, 9);
      var c = tier <= 1 ? ri(1, 9) : tier === 2 ? ri(2, 20) : ri(10, 40);
      var ans = a * b + c;
      return {
        kind: 'mixed', level: lv.id, layout: 'expr',
        expr: a + ' × ' + b + ' + ' + c,
        exprHint: '先算乘法，再算加法',
        prompt: '按运算顺序算一算',
        answer: ans, options: mkNumOpts(ans, 3, 5, 5, 120),
        sig: 'mx1' + a + b + c
      };
    }
    if (mode === 'addMul') {
      var a2 = ri(2, 9), b2 = ri(2, 9), c2 = ri(2, 9);
      var ans2 = (a2 + b2) * c2;
      return {
        kind: 'mixed', level: lv.id, layout: 'expr',
        expr: '(' + a2 + ' + ' + b2 + ') × ' + c2,
        exprHint: '先算括号里的',
        prompt: '按运算顺序算一算',
        answer: ans2, options: mkNumOpts(ans2, 3, 6, 8, 160),
        sig: 'mx2' + a2 + b2 + c2
      };
    }
    var a3 = ri(3, 9), b3 = ri(2, 9), c3 = ri(2, 9);
    var ans3 = a3 * b3 - c3;
    return {
      kind: 'mixed', level: lv.id, layout: 'expr',
      expr: a3 + ' × ' + b3 + ' − ' + c3,
      exprHint: '先算乘法，再算减法',
      prompt: '按运算顺序算一算',
      answer: ans3, options: mkNumOpts(ans3, 3, 5, 1, 80),
      sig: 'mx3' + a3 + b3 + c3
    };
  };

  /* ============ 二下 U6 有余数的除法 ============ */
  U.remainder = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var b = ri(3, 9);
    var q = ri(2, 9);
    var r = ri(1, b - 1);
    var a = b * q + r;
    var ans = q + '余' + r;
    var opts = [opt(ans)];
    var rSeen = {}; rSeen[ans] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 200) {
      var rq = q + pick([-1, 1, 2, -2]);
      if (rq < 1) continue;
      var rr = ri(0, b - 1);
      var cand = rq + '余' + rr;
      if (rSeen[cand]) continue;
      rSeen[cand] = 1;
      opts.push(opt(cand));
    }
    return {
      kind: 'remainder', level: lv.id, layout: 'share',
      shareTotal: Math.min(a, 60), shareGroups: Math.min(b, 6),
      prompt: '把 ' + a + ' 个平均分给 ' + b + ' 个小朋友，每人分几个？还剩几个？',
      answer: ans, options: shuffle(opts),
      sig: 'rm' + a + b
    };
  };

  /* ============ 二下 U7 万以内数的认识 ============ */
  U.num10000 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var n = ri(1000, 9999);
    var mode = pick(['read', 'compose', 'compare']);
    if (mode === 'read') {
      var th = Math.floor(n / 1000);
      return {
        kind: 'num10000', level: lv.id, layout: 'placevalue4',
        pv4: [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10],
        prompt: n + ' 的千位上是（ ）',
        answer: th, options: mkNumOpts(th, 3, 1, 1, 9),
        sig: 'n1w' + n
      };
    }
    if (mode === 'compose') {
      var t = ri(1, 9), h = ri(0, 9), te = ri(0, 9), o = ri(1, 9);
      var val = t * 1000 + h * 100 + te * 10 + o;
      return {
        kind: 'num10000', level: lv.id, layout: 'placevalue4',
        pv4: [t, h, te, o],
        prompt: t + ' 个千、' + h + ' 个百、' + te + ' 个十、' + o + ' 个一组成的数是（ ）',
        answer: val, options: mkNumOpts(val, 3, 100, 1000, 9999),
        sig: 'n2w' + val
      };
    }
    var a = ri(1000, 9999), b = ri(1000, 9999);
    while (b === a) b = ri(1000, 9999);
    return {
      kind: 'num10000', level: lv.id, layout: 'compare2',
      cmpA: a, cmpB: b,
      prompt: a + ' 和 ' + b + '，哪个大？',
      answer: Math.max(a, b), options: shuffle([opt(a), opt(b)]),
      sig: 'n3w' + a + b
    };
  };

  /* ============ 二下 U8 克和千克 ============ */
  U.weight = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['conv', 'unit']);
    if (mode === 'conv') {
      var n = ri(2, 9);
      return {
        kind: 'weight', level: lv.id, layout: 'unitruler',
        urFrom: '千克', urTo: '克', urRate: 1000, urN: n,
        prompt: n + ' 千克 = （ ）克',
        answer: n * 1000, options: mkNumOpts(n * 1000, 3, 500, 1000, 10000),
        sig: 'wc' + n
      };
    }
    var items = [
      { q: '一个苹果约重 200', a: '克', w: ['千克', '吨'], ico: '🍎', ref: '1 千克 = 1000 克' },
      { q: '一袋大米重 25', a: '千克', w: ['克', '吨'], ico: '🍚', ref: '1 袋盐约 500 克' },
      { q: '一枚鸡蛋约重 50', a: '克', w: ['千克', '吨'], ico: '🥚', ref: '1 千克 = 1000 克' },
      { q: '爸爸体重约 70', a: '千克', w: ['克', '吨'], ico: '🧑', ref: '1 袋大米约 25 千克' }
    ];
    var it = pick(items);
    return {
      kind: 'weight', level: lv.id, layout: 'clue',
      clueIco: it.ico, clueRef: it.ref,
      prompt: it.q + '（ ）',
      answer: it.a, options: txtOpts(it.a, it.w),
      sig: 'wu' + it.q
    };
    /* eslint-disable no-unreachable */
    return {
      kind: 'weight', level: lv.id, layout: 'plain',
      prompt: it.q + '（ ）',
      answer: it.a, options: txtOpts(it.a, it.w),
      sig: 'wu' + it.q
    };
  };

  /* ============ 四上 U1 大数的认识 ============ */
  U.bignum = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['read', 'convert', 'compare']);
    if (mode === 'read') {
      /* 整万数改写：v 一定是 10000 的整数倍，答案才精确等于「几万」。
         位值表按万位→个位完整列出 5 列，列名与数位一一对应。 */
      /* 只出「几万」这种整万数（2~9 万），位值表正好 5 列：万位~个位 */
      var w5 = ri(2, 9);
      var v = w5 * 10000;
      var digits = String(v).padStart(5, '0').split('').map(Number);
      return {
        kind: 'bignum', level: lv.id, layout: 'placevalue5',
        pv5: digits,
        prompt: v.toLocaleString('en-US') + ' 改写成用「万」作单位的数是（ ）万',
        answer: w5, options: mkNumOpts(w5, 3, 1, 1, 10),
        sig: 'bgr' + v
      };
    }
    if (mode === 'convert') {
      var w = ri(2, 99);
      return {
        kind: 'bignum', level: lv.id, layout: 'unitruler',
        urFrom: '万', urTo: '', urRate: 10000, urN: w,
        prompt: w + ' 万 = （ ）',
        answer: w * 10000, options: mkNumOpts(w * 10000, 3, 10000, 10000, 1000000),
        sig: 'bgc' + w
      };
    }
    var a = ri(10000, 999999), b = ri(10000, 999999);
    while (b === a) b = ri(10000, 999999);
    return {
      kind: 'bignum', level: lv.id, layout: 'compare2',
      cmpA: a.toLocaleString('en-US'), cmpB: b.toLocaleString('en-US'),
      prompt: a.toLocaleString('en-US') + ' 和 ' + b.toLocaleString('en-US') + '，哪个大？',
      answer: Math.max(a, b).toLocaleString('en-US'),
      options: shuffle([opt(a.toLocaleString('en-US')), opt(b.toLocaleString('en-US'))]),
      sig: 'bgm' + a + b
    };
  };

  /* ============ 四上 U2 公顷和平方千米 ============ */
  U.areaunit = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var sets = [
      { from: '公顷', to: '平方米', rate: 10000 },
      { from: '平方千米', to: '公顷', rate: 100 }
    ];
    var s = pick(sets);
    var n = ri(2, 9);
    return {
      kind: 'areaunit', level: lv.id, layout: 'unitruler',
      urFrom: s.from, urTo: s.to, urRate: s.rate, urN: n,
      prompt: n + ' ' + s.from + ' = （ ）' + s.to,
      answer: n * s.rate, options: mkNumOpts(n * s.rate, 3, s.rate, s.rate, n * s.rate * 3),
      sig: 'au' + s.from + n
    };
  };

  /* ============ 四上 U3 角的度量 ============ */
  U.angle2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['sum', 'kind']);
    if (mode === 'sum') {
      var a = ri(20, 70);
      var b = 180 - a;
      return {
        kind: 'angle2', level: lv.id, layout: 'anglepair',
        apA: a, apB: 180 - a,
        prompt: '两个角合成一个平角，另一个角是多少度？',
        answer: b, options: mkNumOpts(b, 3, 10, 60, 170),
        sig: 'a2s' + a
      };
    }
    var kinds = [
      { n: '锐角', lo: 1, hi: 89 }, { n: '直角', lo: 90, hi: 90 },
      { n: '钝角', lo: 91, hi: 179 }, { n: '平角', lo: 180, hi: 180 }
    ];
    var k = pick(kinds);
    var deg = k.lo === k.hi ? k.lo : ri(k.lo, k.hi);
    return {
      kind: 'angle2', level: lv.id, layout: 'angle', deg: deg,
      prompt: '这个角是多少度？',
      answer: deg + '°', options: txtOpts(deg + '°', [ri(20, 80) + '°', ri(100, 170) + '°', '180°', '90°']),
      sig: 'a2k' + deg
    };
  };

  /* ============ 四上 U4 三位数乘两位数 ============ */
  U.mul3 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var a = ri(102, 899);
    var b = ri(11, 89);
    var ans = a * b;
    return {
      kind: 'mul3', level: lv.id, layout: 'vertical', op: '×',
      a: a, b: b, prompt: '算一算',
      answer: ans, options: mkNumOpts(ans, 3, 800, Math.max(1000, ans - 9000), ans + 9000),
      sig: 'm3' + a + b
    };
  };

  /* ============ 四上 U5 平行四边形和梯形 ============ */
  U.quad = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var facts = [
      { q: '两组对边分别平行的四边形是', a: '平行四边形', w: ['梯形', '三角形', '长方形'] },
      { q: '只有一组对边平行的四边形是', a: '梯形', w: ['平行四边形', '正方形', '菱形'] },
      { q: '四个角都是直角的平行四边形是', a: '长方形', w: ['梯形', '菱形', '三角形'] },
      { q: '四条边都相等的长方形是', a: '正方形', w: ['梯形', '平行四边形', '菱形'] }
    ];
    var f = pick(facts);
    var quadShape = { '平行四边形': 'para', '梯形': 'trap', '长方形': 'rect', '正方形': 'square' }[f.a] || 'para';
    return {
      kind: 'quad', level: lv.id, layout: 'quadshape',
      quad: quadShape,
      prompt: f.q + '（ ）',
      answer: f.a, options: txtOpts(f.a, f.w),
      sig: 'qd' + f.q
    };
  };

  /* ============ 四上 U6 除数是两位数的除法 ============ */
  U.div2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var b = ri(12, 89);
    var q = ri(3, 40);
    var exact = Math.random() < 0.5;
    var a = b * q;
    if (!exact) a = b * (q - 1) + ri(1, b - 1);
    var qq = Math.floor(a / b), rr = a % b;
    var ans = rr === 0 ? String(qq) : qq + '余' + rr;
    var opts = [opt(ans)];
    var dSeen = {}; dSeen[ans] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 120) {
      var cand = String(qq + pick([-2, -1, 1, 2, 3]));
      if (dSeen[cand] || parseInt(cand) < 1) continue;
      dSeen[cand] = 1;
      opts.push(opt(cand));
    }
    return {
      kind: 'div2', level: lv.id, layout: 'share',
      shareTotal: Math.min(a, 60), shareGroups: Math.min(b, 6),
      prompt: '把 ' + a + ' 平均分成 ' + b + ' 份，每份是多少？',
      answer: ans, options: shuffle(opts),
      sig: 'd2' + a + b
    };
  };

  /* ============ 四上 U7 条形统计图 ============ */
  U.barchart = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var cats = ['语文', '数学', '英语', '科学'];
    var vals = cats.map(function () { return ri(4, 14); });
    var mode = pick(['most', 'total', 'diff']);
    if (mode === 'most') {
      var best = 0;
      vals.forEach(function (v, i) { if (v > vals[best]) best = i; });
      /* 避免并列 */
      if (vals.filter(function (v) { return v === vals[best]; }).length > 1) vals[best] += 2;
      return {
        kind: 'barchart', level: lv.id, layout: 'barchart',
        cats: cats, vals: vals, hi: best,
        prompt: '哪一科喜欢的人最多？',
        answer: cats[best], options: shuffle(cats.map(function (c) { return opt(c); })),
        sig: 'bcm' + vals.join(',')
      };
    }
    if (mode === 'total') {
      var sum = vals.reduce(function (a, b) { return a + b; }, 0);
      return {
        kind: 'barchart', level: lv.id, layout: 'barchart',
        cats: cats, vals: vals, hi: -1,
        prompt: '一共多少人？',
        answer: sum, options: mkNumOpts(sum, 3, 4, 10, 80),
        sig: 'bct' + vals.join(',')
      };
    }
    var i1 = ri(0, 3), i2 = (i1 + 1) % 4;
    var dv = Math.abs(vals[i1] - vals[i2]);
    if (dv === 0) { vals[i2] += 3; dv = 3; }
    return {
      kind: 'barchart', level: lv.id, layout: 'barchart',
      cats: cats, vals: vals, hi: i1,
      prompt: cats[i1] + '比' + cats[i2] + '多多少人？',
      answer: dv, options: mkNumOpts(dv, 3, 2, 1, 20),
      sig: 'bcd' + vals.join(',') + i1
    };
  };

  /* ============ 四上 U8 优化（烙饼/沏茶） ============ */
  U.optimize = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['pancake', 'tea']);
    if (mode === 'pancake') {
      var n = ri(2, 6);
      var ans = n <= 2 ? 2 : n;
      return {
        kind: 'optimize', level: lv.id, layout: 'pancake',
        pkN: n,
        prompt: '锅里每次最多烙 2 张饼，每面 3 分钟。烙 ' + n + ' 张饼最少要（ ）分钟',
        answer: ans * 3, options: mkNumOpts(ans * 3, 3, 3, 3, 40),
        sig: 'op' + n
      };
    }
    var acts = 1 + ri(1, 3);
    var ans2 = 8 + acts;
    return {
      kind: 'optimize', level: lv.id, layout: 'timeline',
      tlWater: 8, tlActs: acts,
      prompt: '烧水 8 分钟，期间可以做 ' + acts + ' 件各 1 分钟的事。最少需要（ ）分钟',
      answer: ans2, options: mkNumOpts(ans2, 3, 1, 8, 16),
      sig: 'ot' + acts
    };
  };

  /* ============ 四下 U1 四则运算 ============ */
  U.four = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var a = ri(10, 99), b = ri(2, 9), c = ri(2, 9), d = ri(5, 40);
    var ans = a + b * c - d;
    return {
      kind: 'four', level: lv.id, layout: 'expr',
      expr: a + ' + ' + b + ' × ' + c + ' − ' + d,
      exprHint: '先乘除后加减',
      prompt: '按运算顺序算一算',
      answer: ans, options: mkNumOpts(ans, 3, 6, 1, 150),
      sig: 'f4' + a + b + c + d
    };
  };

  /* ============ 四下 U3 运算定律 ============ */
  U.law = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['assoc', 'dist', 'comm']);
    if (mode === 'dist') {
      var a = ri(3, 9), b = ri(11, 29);
      var ans = a * b;
      return {
        kind: 'law', level: lv.id, layout: 'expr',
        expr: a + ' × ' + b,
        exprHint: '拆成 ' + a + ' × ' + (Math.floor(b / 10) * 10) + ' + ' + a + ' × ' + (b % 10),
        prompt: '用分配律简便计算',
        answer: ans, options: mkNumOpts(ans, 3, a * 2, 10, ans * 2),
        sig: 'ld' + a + b
      };
    }
    var x = ri(11, 40), y = ri(11, 40), z = ri(2, 9);
    var ans2 = mode === 'assoc' ? (x + y) + z : (x + y) + z;
    return {
      kind: 'law', level: lv.id, layout: 'expr',
      expr: '(' + x + ' + ' + y + ') + ' + z,
      exprHint: '先凑整再相加更快',
      prompt: '用加法结合律简便计算',
      answer: ans2, options: mkNumOpts(ans2, 3, 5, 20, 120),
      sig: 'la' + x + y + z
    };
  };

  /* ============ 四下 U4 小数的意义和性质 ============ */
  U.decimal2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['place', 'compare', 'move']);
    if (mode === 'place') {
      var v = ri(1, 9) + '.' + ri(10, 99);
      /* v 是字符串，直接取小数部分第一位即可 */
      var d = parseInt(String(v).split('.')[1].charAt(0), 10);
      return {
        kind: 'decimal2', level: lv.id, layout: 'placevalue',
        pvNum: v,
        prompt: '这个数的十分位上是几？',
        answer: d, options: mkNumOpts(d, 3, 1, 0, 9),
        sig: 'dp' + v
      };
    }
    if (mode === 'compare') {
      var a = ri(1, 9) + '.' + ri(1, 9);
      var b = ri(1, 9) + '.' + ri(1, 9);
      if (a === b) b = (parseFloat(b) + 0.1).toFixed(1);
      return {
        kind: 'decimal2', level: lv.id, layout: 'compare2',
        cmpA: a, cmpB: b, cmpDec: true,
        prompt: a + ' 和 ' + b + '，哪个大？',
        answer: parseFloat(a) > parseFloat(b) ? a : b,
        options: shuffle([opt(a), opt(b)]),
        sig: 'dc2' + a + b
      };
    }
    var n = ri(1, 9) + '.' + ri(1, 9);
    var nv = parseFloat(n);
    var ans = (nv * 10).toFixed(1);
    return {
      kind: 'decimal2', level: lv.id, layout: 'decimalmove',
      dmFrom: n, dmTimes: 10,
      prompt: n + ' × 10，小数点向哪边移动几位？结果是（ ）',
      answer: ans, options: txtOpts(ans, [
        (nv / 10).toFixed(2),
        (nv * 100).toFixed(0),
        nv.toFixed(1)
      ]),
      sig: 'dm' + n
    };
  };

  /* ============ 四下 U5 三角形 ============ */
  U.triangle = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['sum', 'third', 'kind']);
    if (mode === 'sum') {
      return {
        kind: 'triangle', level: lv.id, layout: 'trianglesum',
        prompt: '三角形内角和是多少度？',
        answer: '180°', options: txtOpts('180°', ['90°', '360°', '270°']),
        sig: 'ts'
      };
    }
    if (mode === 'third') {
      var a = ri(30, 80), b = ri(30, 140 - a);
      var c = 180 - a - b;
      return {
        kind: 'triangle', level: lv.id, layout: 'triangle',
        triA: a, triB: b,
        prompt: '三角形两个角是 ' + a + '° 和 ' + b + '°，第三个角是（ ）',
        answer: c + '°', options: txtOpts(c + '°', [(c + 10) + '°', (c - 10) + '°', (c + 20) + '°']),
        sig: 'tt' + a + b
      };
    }
    var kinds = [
      { n: '锐角三角形', lo: 50, hi: 80 }, { n: '直角三角形', lo: 90, hi: 90 },
      { n: '钝角三角形', lo: 95, hi: 150 }
    ];
    var k = pick(kinds);
    var kdeg = k.lo === k.hi ? k.lo : ri(Math.min(k.lo, k.hi), Math.max(k.lo, k.hi));
    return {
      kind: 'triangle', level: lv.id, layout: 'anglesingle',
      asDeg: kdeg,
      prompt: '有一个角是 ' + kdeg + '° 的三角形是（ ）',
      answer: k.n, options: txtOpts(k.n, kinds.map(function (x) { return x.n; })),
      sig: 'tk' + k.n
    };
  };

  /* ============ 四下 U6 小数加减 ============ */
  U.decimaladd = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var isAdd = Math.random() < 0.5;
    var av, bv, a, b;
    var maxI = tier <= 1 ? 4 : 9;
    if (isAdd) {
      av = parseFloat(ri(1, maxI) + '.' + ri(1, 9));
      bv = parseFloat(ri(1, maxI) + '.' + ri(1, 9));
    } else {
      /* 减法必须大减小，小学生不接触负数结果 */
      av = parseFloat(ri(3, 9) + '.' + ri(1, 9));
      bv = parseFloat(ri(1, 2) + '.' + ri(1, 9));
      if (bv >= av) bv = +(av - 1.1).toFixed(1);
      if (bv < 0.1) bv = 0.1;
    }
    a = av.toFixed(1); b = bv.toFixed(1);
    var ans = (isAdd ? (av + bv) : (av - bv)).toFixed(1);
    /* 顺带补一个竖式示意图参数 */
    var decAdd = { a: a, b: b, op: isAdd ? '+' : '−' };
    return {
      kind: 'decimaladd', level: lv.id, layout: 'vertical', op: isAdd ? '+' : '−',
      a: a, b: b, isDecimal: true,
      prompt: '算一算（注意小数点对齐）',
      answer: ans,
      options: txtOpts(ans, [
        (parseFloat(ans) + 0.1).toFixed(1),
        Math.max(0.1, parseFloat(ans) - 0.1).toFixed(1),
        (parseFloat(ans) + 1).toFixed(1)
      ]),
      decAdd: decAdd,
      sig: 'da2' + a + b + isAdd
    };
  };

  /* ============ 四下 U7 图形的运动（二） ============ */
  U.symmetry2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var facts = [
      { q: '长方形有几条对称轴？', a: 2 },
      { q: '正方形有几条对称轴？', a: 4 },
      { q: '等腰三角形有几条对称轴？', a: 1 },
      { q: '等边三角形有几条对称轴？', a: 3 },
      { q: '圆有几条对称轴？', a: '无数条' }
    ];
    var f = pick(facts);
    var opts = typeof f.a === 'number'
      ? mkNumOpts(f.a, 3, 1, 1, 6)
      : txtOpts('无数条', ['1 条', '2 条', '4 条']);
    return {
      kind: 'symmetry2', level: lv.id, layout: 'axis',
      axShape: f.a === 4 ? '正方形' : f.a === 1 ? '等腰三角形' : '长方形',
      prompt: f.q,
      answer: f.a, options: opts,
      sig: 's2' + f.q
    };
  };

  /* ============ 四下 U8 平均数 ============ */
  U.average = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var n = ri(3, 5);
    var avg = ri(5, 20);
    var vals = [];
    var sum = avg * n;
    var rest = sum;
    for (var i = 0; i < n - 1; i++) {
      var v = ri(Math.max(1, avg - 5), avg + 5);
      vals.push(v);
      rest -= v;
    }
    vals.push(rest);
    if (rest < 1) return U.average(lv, diff);
    return {
      kind: 'average', level: lv.id, layout: 'avg',
      avgVals: vals.slice(),
      prompt: '这组数的平均数是多少？',
      answer: avg, options: mkNumOpts(avg, 3, 2, 3, 30),
      sig: 'av' + vals.join(',')
    };
  };

  /* ============ 五上 U1 小数乘法 ============ */
  U.decmul = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var a = ri(1, 9) + '.' + ri(1, 9);
    var b = ri(2, 9);
    var ans = (parseFloat(a) * b).toFixed(2).replace(/0$/, '');
    return {
      kind: 'decmul', level: lv.id, layout: 'vertical', op: '×',
      a: a, b: b, isDecimal: true,
      prompt: '算一算',
      answer: ans,
      options: txtOpts(ans, [
        (parseFloat(a) * b / 10).toFixed(2),
        (parseFloat(a) * b * 10).toFixed(1),
        (parseFloat(a) * b + 1).toFixed(2)
      ]),
      sig: 'dm2' + a + b
    };
  };

  /* ============ 五上 U2 位置（数对） ============ */
  U.coords = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var x = ri(1, 8), y = ri(1, 8);
    var mode = pick(['read', 'find']);
    if (mode === 'read') {
      return {
        kind: 'coords', level: lv.id, layout: 'coords', cx: x, cy: y,
        prompt: '红点在（ ）的位置',
        answer: '(' + x + ',' + y + ')',
        options: txtOpts('(' + x + ',' + y + ')', [
          '(' + y + ',' + x + ')', '(' + (x + 1) + ',' + y + ')', '(' + x + ',' + (y + 1) + ')'
        ]),
        sig: 'cor' + x + y
      };
    }
    return {
      kind: 'coords', level: lv.id, layout: 'coords', cx: x, cy: y,
      prompt: '红点的横坐标是（ ）',
      answer: x, options: mkNumOpts(x, 3, 1, 1, 8),
      sig: 'cof' + x + y
    };
  };

  /* ============ 五上 U3 小数除法 ============ */
  U.decdiv = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var b = tier <= 1 ? ri(2, 4) : ri(2, 9);
    var q = tier <= 1 ? String(ri(2, 9)) : ri(2, 9) + '.' + ri(1, 9);
    var a = (parseFloat(q) * b).toFixed(2).replace(/0$/, '');
    var ans = q.toString();
    return {
      kind: 'decdiv', level: lv.id, layout: 'vertical', op: '÷',
      a: a, b: b, isDecimal: true,
      prompt: '算一算',
      answer: ans,
      options: txtOpts(ans, [
        (parseFloat(q) / 10).toFixed(2),
        (parseFloat(q) * 10).toFixed(1),
        (parseFloat(q) + 1).toFixed(1)
      ]),
      sig: 'dd' + a + b
    };
  };

  /* ============ 五上 U4 可能性 ============ */
  U.chance = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['certain', 'compare']);
    if (mode === 'certain') {
      var cases = [
        { q: '盒子里全是红球，摸出一个球是红球', a: '一定' },
        { q: '盒子里全是红球，摸出一个球是白球', a: '不可能' },
        { q: '盒子里有红球也有白球，摸出一个球是红球', a: '可能' }
      ];
      var c = pick(cases);
      var onlyRed = c.a === '一定' || c.a === '不可能';
      return {
        kind: 'chance', level: lv.id, layout: 'balls',
        ballRed: onlyRed ? 5 : 4, ballWhite: onlyRed ? 0 : 3,
        prompt: c.q + '，这件事（ ）',
        answer: c.a, options: txtOpts(c.a, ['一定', '可能', '不可能']),
        sig: 'ch' + c.q
      };
    }
    var r1 = ri(2, 6), r2 = ri(1, r1 - 1);
    return {
      kind: 'chance', level: lv.id, layout: 'balls',
      ballRed: r1, ballWhite: r2,
      prompt: '口袋里有这些球，摸一次，哪种球更容易摸到？',
      answer: '红球', options: shuffle([opt('红球'), opt('白球')]),
      sig: 'chc' + r1 + r2
    };
  };

  /* ============ 五上 U5 简易方程 ============ */
  U.equation = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['solve', 'express']);
    if (mode === 'solve') {
      var x = ri(2, 20);
      var a = ri(2, 9);
      var b = ri(1, 30);
      /* a*x + b = c */
      var c = a * x + b;
      return {
        kind: 'equation', level: lv.id, layout: 'balance',
        balN: a, balX: 'x', balPlus: b, balEq: c,
        prompt: a + 'x + ' + b + ' = ' + c + '，x 是多少？',
        answer: x, options: mkNumOpts(x, 3, 2, 1, 30),
        sig: 'eq' + a + b + c
      };
    }
    var n = ri(3, 12);
    return {
      kind: 'equation', level: lv.id, layout: 'expr',
      expr: n + ' × x',
      exprHint: '每支 ' + n + ' 元 × 支数 x',
      prompt: '每支笔 ' + n + ' 元，买 x 支共（ ）元',
      answer: n + 'x', options: txtOpts(n + 'x', ['x', (n + 1) + 'x', n + '+x', 'x+' + n]),
      sig: 'ee' + n
    };
  };

  /* ============ 五上 U6 多边形的面积 ============ */
  U.polyarea = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['tri', 'para', 'trap']);
    var unit = '平方厘米';
    if (mode === 'tri') {
      var b = ri(4, 16), h = ri(3, 12);
      /* 保证底*高是偶数，答案是整数 */
      if ((b * h) % 2) h++;
      var ans = (b * h) / 2;
      return {
        kind: 'polyarea', level: lv.id, layout: 'polygonarea', poly: 'tri', b: b, h: h,
        prompt: '三角形底 ' + b + ' 厘米、高 ' + h + ' 厘米，面积是（ ）' + unit,
        answer: ans, options: mkNumOpts(ans, 3, Math.max(2, Math.round(ans / 3)), 4, ans * 2 + 10),
        sig: 'pat' + b + h
      };
    }
    if (mode === 'para') {
      var b2 = ri(4, 16), h2 = ri(3, 12);
      var ans2 = b2 * h2;
      return {
        kind: 'polyarea', level: lv.id, layout: 'polygonarea', poly: 'para', b: b2, h: h2,
        prompt: '平行四边形底 ' + b2 + ' 厘米、高 ' + h2 + ' 厘米，面积是（ ）' + unit,
        answer: ans2, options: mkNumOpts(ans2, 3, Math.max(2, Math.round(ans2 / 3)), 6, ans2 * 2),
        sig: 'pap' + b2 + h2
      };
    }
    var u = ri(4, 12), d = ri(4, 12), hh = ri(3, 10);
    if (((u + d) * hh) % 2) hh++;
    var ans3 = (u + d) * hh / 2;
    return {
      kind: 'polyarea', level: lv.id, layout: 'polygonarea', poly: 'trap', a1: u, a2: d, h: hh,
      prompt: '梯形上底 ' + u + '、下底 ' + d + '、高 ' + hh + ' 厘米，面积是（ ）' + unit,
      answer: ans3, options: mkNumOpts(ans3, 3, Math.max(2, Math.round(ans3 / 3)), 6, ans3 * 2),
      sig: 'paz' + u + d + hh
    };
  };

  /* ============ 五上 U7 植树问题 ============ */
  U.planting = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var len = ri(4, 20);
    var gap = ri(1, 4);
    var mode = pick(['both', 'one', 'none']);
    var seg = Math.floor(len / gap);
    if (mode === 'both') return {
      kind: 'planting', level: lv.id, layout: 'planting',
      plLen: len, plGap: gap, plMode: 'both',
      prompt: '一条 ' + len + ' 米的小路，每 ' + gap + ' 米种一棵树，两端都种，共种（ ）棵',
      answer: seg + 1, options: mkNumOpts(seg + 1, 3, 1, 2, seg + 5),
      sig: 'plb' + len + gap
    };
    if (mode === 'one') return {
      kind: 'planting', level: lv.id, layout: 'planting',
      plLen: len, plGap: gap, plMode: 'one',
      prompt: '一条 ' + len + ' 米的小路，每 ' + gap + ' 米种一棵树，只种一端，共种（ ）棵',
      answer: seg, options: mkNumOpts(seg, 3, 1, 1, seg + 4),
      sig: 'plo' + len + gap
    };
    return {
      kind: 'planting', level: lv.id, layout: 'planting',
      plLen: len, plGap: gap, plMode: 'none',
      prompt: '一条 ' + len + ' 米的小路，每 ' + gap + ' 米种一棵树，两端都不种，共种（ ）棵',
      answer: Math.max(0, seg - 1), options: mkNumOpts(Math.max(0, seg - 1), 3, 1, 0, seg + 4),
      sig: 'pln' + len + gap
    };
  };

  /* ============ 五下 U2 因数与倍数 ============ */
  U.factor = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['count', 'prime', 'gcd']);
    if (mode === 'count') {
      var n = ri(4, 36);
      var c = 0;
      for (var i = 1; i <= n; i++) if (n % i === 0) c++;
      return {
        kind: 'factor', level: lv.id, layout: 'tiles',
        tileN: n, tileHint: '能整齐排满的长方形有几种，就有几对因数',
        prompt: n + ' 有多少个因数？',
        answer: c, options: mkNumOpts(c, 3, 1, 1, 12),
        sig: 'fc' + n
      };
    }
    if (mode === 'prime') {
      var primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
      var comps = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25];
      var isPrime = Math.random() < 0.5;
      var num = isPrime ? pick(primes) : pick(comps);
      return {
        kind: 'factor', level: lv.id, layout: 'tiles',
        tileN: num,
        prompt: num + ' 能排成长方形点阵吗？想想它的因数',
        answer: isPrime ? '质数' : '合数',
        options: shuffle([opt('质数'), opt('合数')]),
        sig: 'fp' + num
      };
    }
    var a = ri(4, 24), b = ri(4, 24);
    function gcd(x, y) { return y === 0 ? x : gcd(y, x % y); }
    var g = gcd(a, b);
    return {
      kind: 'factor', level: lv.id, layout: 'gcdfig',
      gcdA: a, gcdB: b,
      prompt: a + ' 和 ' + b + ' 的最大公因数是（ ）',
      answer: g, options: mkNumOpts(g, 3, 1, 1, Math.max(a, b)),
      sig: 'fg' + a + b
    };
  };

  /* ============ 五下 U3 长方体与正方体 ============ */
  U.cuboid = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['volume', 'surface', 'cubevol']);
    if (mode === 'cubevol') {
      var s = ri(2, 8);
      return {
        kind: 'cuboid', level: lv.id, layout: 'solid', shape: '正方体',
        prompt: '棱长 ' + s + ' 厘米的正方体，体积是（ ）立方厘米',
        answer: s * s * s, options: mkNumOpts(s * s * s, 3, 10, 8, s * s * s * 2),
        sig: 'cbv' + s
      };
    }
    var a = ri(2, 9), b = ri(2, 9), c = ri(2, 9);
    if (mode === 'volume') {
      return {
        kind: 'cuboid', level: lv.id, layout: 'solid', shape: '长方体',
        prompt: '长 ' + a + '、宽 ' + b + '、高 ' + c + ' 厘米的长方体体积是（ ）立方厘米',
        answer: a * b * c, options: mkNumOpts(a * b * c, 3, 10, 8, a * b * c * 2),
        sig: 'cbw' + a + b + c
      };
    }
    var surf = 2 * (a * b + a * c + b * c);
    return {
      kind: 'cuboid', level: lv.id, layout: 'solid', shape: '长方体',
      prompt: '长 ' + a + '、宽 ' + b + '、高 ' + c + ' 厘米的长方体表面积是（ ）平方厘米',
      answer: surf, options: mkNumOpts(surf, 3, 12, 20, surf * 2),
      sig: 'cbs' + a + b + c
    };
  };

  /* ============ 五下 U4 分数的意义和性质 ============ */
  U.frac2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['simplify', 'compare', 'improper']);
    if (mode === 'simplify') {
      var d = pick([2, 3, 4, 5]);
      var b = ri(1, d - 1);
      var k = ri(2, 5);
      var num = b * k, den = d * k;
      return {
        kind: 'frac2', level: lv.id, layout: 'fracbar',
        fbNum: num, fbDen: den, fbLarge: true,
        prompt: '§' + num + '/' + den + '§ 约分后是（ ）',
        answer: b + '/' + d,
        options: shuffle(['§' + b + '/' + d + '§', '§' + (b + 1) + '/' + d + '§', '§' + b + '/' + (d + 1) + '§']
          .map(function (t) {
            var m = t.match(/§(\d+)\/(\d+)§/);
            return fopt(m[1] + '/' + m[2]);
          })),
        sig: 'fs' + num + den
      };
    }
    if (mode === 'compare') {
      var d1 = pick([3, 4, 5, 6]), d2 = d1 * 2;
      var n1 = ri(1, d1 - 1);
      /* 同值不同分母比较 */
      var big = Math.random() < 0.5;
      var a = n1 + '/' + d1;
      var b2 = (n1 * 2) + '/' + d2;
      return {
        kind: 'frac2', level: lv.id, layout: 'fracpair',
        fpA: a, fpB: b2,
        prompt: '§' + a + '§ 和 §' + b2 + '§，它们的关系是？',
        answer: '相等', options: txtOpts('相等', ['左边大', '右边大']),
        sig: 'fc2' + a + b2
      };
    }
    var den = pick([3, 4, 5, 6, 8]);
    var num = den + ri(1, den - 1);
    var whole = Math.floor(num / den), rem = num % den;
    var ans = whole + (rem ? '又' + rem + '/' + den : '');
    return {
      kind: 'frac2', level: lv.id, layout: 'fracbar',
      fbNum: num, fbDen: den, fbMixed: true,
      prompt: '§' + num + '/' + den + '§ 化成带分数是（ ）',
      answer: ans, options: txtOpts(ans, [
        (whole + 1) + '又' + rem + '/' + den,
        whole + '又' + (rem + 1) + '/' + den,
        (whole + 2) + '又' + rem + '/' + den
      ]),
      sig: 'fi' + num + den
    };
  };

  /* ============ 五下 U5 分数加减 ============ */
  U.fracadd = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    /* tier1-2 只同分母；tier3+ 才出异分母（需通分） */
    var sameDen = tier <= 2 ? true : Math.random() < 0.5;
    var isAdd = Math.random() < 0.5;
    if (sameDen) {
      var d = tier <= 1 ? pick([2, 3, 4, 5]) : pick([4, 5, 6, 8, 9, 10]);
      var a = ri(1, d - 2), b = ri(1, d - a - 1);
      var isAdd2 = true;
      var num = a + b;
      var ans = num + '/' + d;
      return {
        kind: 'fracadd', level: lv.id, layout: 'fracbar',
        fbNum: a, fbDen: d, fbNum2: b,
        prompt: '§' + a + '/' + d + '§ + §' + b + '/' + d + '§ = （ ）',
        answer: ans,
        options: shuffle([ans, (a + b + 1) + '/' + d, Math.max(1, a + b - 1) + '/' + d]
          .map(function (t) { var m = t.split('/'); return fopt(m[0] + '/' + m[1]); })),
        sig: 'fa2' + a + b + d
      };
    }
    var d1 = pick([2, 3, 4, 5]);
    var d2 = d1 * 2;
    var n1 = 1;
    var n2 = ri(1, d2 - 1);
    var res = (n1 * (d2 / d1) + n2);
    return {
      kind: 'fracadd', level: lv.id, layout: 'fracbar',
      fbNum: 1, fbDen: d1, fbNum2: n2, fbDen2: d2,
      fbHint: '分母不同，先通分成 §' + d2 + '§ 再相加',
      prompt: '§1/' + d1 + '§ + §' + n2 + '/' + d2 + '§ = （ ）',
      answer: res + '/' + d2,
      options: shuffle([res + '/' + d2, (res + 1) + '/' + d2, Math.max(1, res - 1) + '/' + d2]
        .map(function (t) { var m = t.split('/'); return fopt(m[0] + '/' + m[1]); })),
      sig: 'fa3' + d1 + n2
    };
  };

  /* ============ 五下 U6 图形的运动（三） ============ */
  U.rotation = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['deg', 'clock']);
    if (mode === 'deg') {
      var facts = [
        { q: '时针从 12 走到 3，旋转了（ ）度', a: 90 },
        { q: '时针从 12 走到 6，旋转了（ ）度', a: 180 },
        { q: '分针走 15 分，旋转了（ ）度', a: 90 },
        { q: '时针走 1 小时，旋转了（ ）度', a: 30 }
      ];
      var f = pick(facts);
      return {
        kind: 'rotation', level: lv.id, layout: 'clock',
        hour: f.a === 90 ? 3 : f.a === 180 ? 6 : 12,
        minute: 0,
        prompt: f.q,
        answer: f.a, options: mkNumOpts(f.a, 3, 30, 30, 360),
        sig: 'rt' + f.q
      };
    }
    return {
      kind: 'rotation', level: lv.id, layout: 'clock',
      hour: 3, minute: 0,
      prompt: '钟面上，分针顺时针旋转 90°，相当于走了（ ）分钟',
      answer: 15, options: mkNumOpts(15, 3, 5, 5, 45),
      sig: 'rc15'
    };
  };

  /* ============ 五下 U7 折线统计图 ============ */
  U.linechart = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var labels = ['1月', '2月', '3月', '4月', '5月'];
    var vals = [];
    var cur = ri(10, 30);
    for (var i = 0; i < 5; i++) { cur += ri(-5, 8); if (cur < 5) cur = 5; vals.push(cur); }
    var mode = pick(['max', 'change', 'rise']);
    if (mode === 'max') {
      var bi = 0;
      vals.forEach(function (v, i) { if (v > vals[bi]) bi = i; });
      if (vals.filter(function (v) { return v === vals[bi]; }).length > 1) vals[bi] += 2;
      return {
        kind: 'linechart', level: lv.id, layout: 'linechart',
        labels: labels, vals: vals, hi: bi,
        prompt: '哪个月最多？',
        answer: labels[bi], options: shuffle(labels.map(function (l) { return opt(l); })),
        sig: 'lcm' + vals.join(',')
      };
    }
    var i1 = ri(0, 3);
    var dv = vals[i1 + 1] - vals[i1];
    if (mode === 'change') {
      /* 相等时「多多少」没有意义，挑一对不相等的月份 */
      var guardC = 0;
      while (dv === 0 && guardC++ < 40) {
        i1 = ri(0, 3);
        dv = vals[i1 + 1] - vals[i1];
      }
      if (dv === 0) { vals[i1 + 1] = vals[i1] + 3; dv = 3; }
      return {
        kind: 'linechart', level: lv.id, layout: 'linechart',
        labels: labels, vals: vals, hi: i1 + 1,
        prompt: labels[i1 + 1] + '比' + labels[i1] + (dv > 0 ? '多' : '少') + '多少？',
        answer: Math.abs(dv), options: mkNumOpts(Math.abs(dv), 3, 2, 0, 20),
        sig: 'lcc' + vals.join(',') + i1
      };
    }
    return {
      kind: 'linechart', level: lv.id, layout: 'linechart',
      labels: labels, vals: vals, hi: i1,
      prompt: '一共多少？',
      answer: vals.reduce(function (a, b) { return a + b; }, 0),
      options: mkNumOpts(vals.reduce(function (a, b) { return a + b; }, 0), 3, 8, 20, 300),
      sig: 'lct' + vals.join(',')
    };
  };

  /* ============ 五下 U8 找次品 ============ */
  U.weigh = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var facts = [
      { q: '3 个零件中 1 个次品（轻一些），用天平至少称（ ）次找出', a: 1 },
      { q: '9 个零件中 1 个次品（轻一些），用天平至少称（ ）次找出', a: 2 },
      { q: '27 个零件中 1 个次品（轻一些），用天平至少称（ ）次找出', a: 3 }
    ];
    var f = pick(facts);
    var nMatch = (f.q.match(/(\d+)\s*个零件/) || [])[1];
    return {
      kind: 'weigh', level: lv.id, layout: 'balance',
      balN: Number(nMatch) || 3,
      prompt: f.q,
      answer: f.a, options: mkNumOpts(f.a, 3, 1, 1, 5),
      sig: 'wg' + f.q
    };
  };

  /* ============ 六上 U1 分数乘法 ============ */
  U.fracmul = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var d = pick([2, 3, 4, 5, 6]);
    var n = ri(1, d - 1);
    var k = ri(2, 6);
    function reduce(a, b) {
      function gcd(x, y) { return y ? gcd(y, x % y) : x; }
      var g = gcd(a, b);
      return (a / g) + '/' + (b / g);
    }
    var res = reduce(n * k, d);
    return {
      kind: 'fracmul', level: lv.id, layout: 'fracbar',
      fbNum: n, fbDen: d, fbTimes: k,
      fbHint: '把 §' + n + '/' + d + '§ 连加 ' + k + ' 次',
      prompt: '§' + n + '/' + d + '§ × ' + k + ' = （ ）',
      answer: res,
      options: shuffle([res, reduce(n * k, d * 2), reduce(n * (k + 1), d)]
        .map(function (t) { var m = t.split('/'); return fopt(m[0] + '/' + m[1]); })),
      sig: 'fm' + n + d + k
    };
  };

  /* ============ 六上 U2 位置与方向（二） ============ */
  U.bearing = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var dirs = [
      { n: '东偏北 30°', back: '西偏南 30°' },
      { n: '北偏东 45°', back: '南偏西 45°' },
      { n: '西偏南 20°', back: '东偏北 20°' },
      { n: '南偏东 60°', back: '北偏西 60°' }
    ];
    var d = pick(dirs);
    var bdir = d.n.indexOf('北') >= 0 ? '北' : d.n.indexOf('南') >= 0 ? '南' : '东';
    return {
      kind: 'bearing', level: lv.id, layout: 'grid',
      target: bdir, ask: 'invert',
      prompt: 'A 在 B 的' + d.n + '方向，那么 B 在 A 的（ ）方向',
      answer: d.back, options: txtOpts(d.back, dirs.map(function (x) { return x.n; })),
      sig: 'bd' + d.n
    };
  };

  /* ============ 六上 U3 分数除法 ============ */
  U.fracdiv = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var d = pick([2, 3, 4, 5, 6]);
    var n = ri(1, d - 1);
    var k = ri(2, 5);
    function reduce(a, b) {
      function gcd(x, y) { return y ? gcd(y, x % y) : x; }
      var g = gcd(a, b);
      return (a / g) + '/' + (b / g);
    }
    /* (n/d) ÷ k = n/(d*k) */
    var res = reduce(n, d * k);
    var isDiv = Math.random() < 0.5;
    if (isDiv) {
      return {
        kind: 'fracdiv', level: lv.id, layout: 'fracbar',
        fbNum: n, fbDen: d, fbDiv: k,
        prompt: '§' + n + '/' + d + '§ ÷ ' + k + ' = （ ）',
        answer: res,
        options: shuffle([res, reduce(n * k, d), reduce(n, d * (k + 1))]
          .map(function (t) { var m = t.split('/'); return fopt(m[0] + '/' + m[1]); })),
        sig: 'fd' + n + d + k
      };
    }
    return {
      kind: 'fracdiv', level: lv.id, layout: 'fracbar',
      fbNum: n, fbDen: d, fbDiv: k,
      prompt: '§' + n + '/' + d + '§ ÷ §1/' + k + '§ = （ ）',
      answer: reduce(n * k, d),
      options: shuffle([reduce(n * k, d), reduce(n, d * k), reduce(n * k + 1, d)]
        .map(function (t) { var m = t.split('/'); return fopt(m[0] + '/' + m[1]); })),
      sig: 'fd2' + n + d + k
    };
  };

  /* ============ 六上 U4 比 ============ */
  U.ratio = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['simplify', 'value', 'share']);
    if (mode === 'simplify') {
      var a = ri(2, 9), b = ri(2, 9);
      var k = ri(2, 5);
      return {
        kind: 'ratio', level: lv.id, layout: 'ratiobar',
        rbA: a * k, rbB: b * k, rbLabel: '最简比 ?',
        prompt: (a * k) + ' : ' + (b * k) + ' 化成最简整数比是（ ）',
        answer: a + ':' + b,
        options: txtOpts(a + ':' + b, [b + ':' + a, (a + 1) + ':' + b, a + ':' + (b + 1)]),
        sig: 'rs' + a + b + k
      };
    }
    if (mode === 'value') {
      var x = ri(2, 9), y = ri(2, 9);
      return {
        kind: 'ratio', level: lv.id, layout: 'ratiobar',
        rbA: x, rbB: y,
        prompt: x + ' : ' + y + ' 的比值是（ ）',
        answer: (x / y).toFixed(2).replace(/0$/, ''),
        options: txtOpts((x / y).toFixed(2).replace(/0$/, ''), [
          (y / x).toFixed(2), (x / y + 0.5).toFixed(2), (x / y - 0.5 > 0 ? x / y - 0.5 : 0.5).toFixed(2)
        ]),
        sig: 'rv' + x + y
      };
    }
    var total = ri(3, 8) * 10;
    var r1 = ri(1, 3), r2 = ri(1, 3);
    var sum = r1 + r2;
    var part = Math.round(total * r1 / sum);
    return {
      kind: 'ratio', level: lv.id, layout: 'ratiobar',
      rbA: r1, rbB: r2,
      prompt: '把 ' + total + ' 按 ' + r1 + ':' + r2 + ' 分配，第一份是（ ）',
      answer: part, options: mkNumOpts(part, 3, Math.max(2, Math.round(part / 4)), 1, total),
      sig: 'rh' + total + r1 + r2
    };
  };

  /* ============ 六上 U5 圆 ============ */
  U.circle = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var PI = 3.14;
    var mode = pick(['circ', 'area', 'diam']);
    var r = ri(2, 10);
    if (mode === 'circ') {
      var c = +(2 * PI * r).toFixed(2);
      return {
        kind: 'circle', level: lv.id, layout: 'circle', r: r,
        prompt: '半径 ' + r + ' 厘米的圆，周长是（ ）厘米（π 取 3.14）',
        answer: c, options: txtOpts(c, [PI * r, +(PI * r * r).toFixed(2), +(2 * PI * r + 6.28).toFixed(2)]),
        sig: 'cc' + r
      };
    }
    if (mode === 'area') {
      var s = +(PI * r * r).toFixed(2);
      return {
        kind: 'circle', level: lv.id, layout: 'circle', r: r,
        prompt: '半径 ' + r + ' 厘米的圆，面积是（ ）平方厘米（π 取 3.14）',
        answer: s, options: txtOpts(s, [2 * PI * r, +(PI * r * r / 2).toFixed(2), +(PI * r * r + 3.14).toFixed(2)]),
        sig: 'ca' + r
      };
    }
    var d = r * 2;
    return {
      kind: 'circle', level: lv.id, layout: 'circle', r: r,
      prompt: '直径 ' + d + ' 厘米的圆，半径是（ ）厘米',
      answer: r, options: mkNumOpts(r, 3, 1, 1, 12),
      sig: 'cd' + r
    };
  };

  /* ============ 六上 U6 百分数（一） ============ */
  U.percent = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['toDec', 'toPct', 'of']);
    if (mode === 'toDec') {
      var p = pick([10, 20, 25, 40, 50, 60, 75, 80]);
      return {
        kind: 'percent', level: lv.id, layout: 'percentbar',
        pbPct: p, pbTotal: 100, pbShowPct: true,
        prompt: p + '% 化成小数是（ ）',
        answer: (p / 100).toString(),
        options: txtOpts((p / 100).toString(), [(p / 10).toString(), (p / 1000).toString(), p.toString()]),
        sig: 'pd' + p
      };
    }
    if (mode === 'toPct') {
      var v = pick([0.1, 0.25, 0.4, 0.5, 0.75, 0.8]);
      return {
        kind: 'percent', level: lv.id, layout: 'percentbar',
        pbPct: Math.round(v * 100), pbTotal: 100, pbShowDec: v,
        prompt: v + ' 化成百分数是（ ）',
        answer: (v * 100) + '%',
        options: txtOpts((v * 100) + '%', [(v * 10) + '%', (v * 1000) + '%', v + '%']),
        sig: 'pp' + v
      };
    }
    var total = tier <= 1 ? pick([100, 200]) : pick([20, 40, 50, 100, 200]);
    var pc = tier <= 1 ? pick([10, 50]) : tier === 2 ? pick([10, 20, 50]) : pick([15, 25, 35, 45]);
    var ans = total * pc / 100;
    return {
      kind: 'percent', level: lv.id, layout: 'percentbar',
      pbPct: pc, pbTotal: total,
      prompt: total + ' 的 ' + pc + '% 是多少？',
      answer: ans, options: mkNumOpts(ans, 3, Math.max(1, Math.round(ans / 3)), 1, total),
      sig: 'po' + total + pc
    };
  };

  /* ============ 六上 U7 扇形统计图 ============ */
  U.piechart = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var total = pick([100, 200, 400]);
    var parts = [20, 30, 50];
    var idx = ri(0, 2);
    var ans = total * parts[idx] / 100;
    return {
      kind: 'piechart', level: lv.id, layout: 'piechart',
      parts: parts, total: total, hi: idx,
      labels: ['A', 'B', 'C'],
      prompt: '一共 ' + total + ' 人，占 ' + parts[idx] + '% 的那部分有多少人？',
      answer: ans, options: mkNumOpts(ans, 3, Math.max(2, Math.round(ans / 4)), 1, total),
      sig: 'pc' + total + idx
    };
  };

  /* ============ 六上 U8 数与形 ============ */
  U.numbershape = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var n = ri(3, 8);
    var mode = pick(['square', 'tri']);
    if (mode === 'square') {
      return {
        kind: 'numbershape', level: lv.id, layout: 'dots', n: n, shape: 'square',
        prompt: '摆 ' + n + ' 层正方形点阵共有多少个点？',
        answer: n * n, options: mkNumOpts(n * n, 3, n, 3, n * n + 8),
        sig: 'ns' + n
      };
    }
    return {
      kind: 'numbershape', level: lv.id, layout: 'dots', n: n, shape: 'tri',
      prompt: '第 ' + n + ' 个三角形数是多少？',
      answer: n * (n + 1) / 2, options: mkNumOpts(n * (n + 1) / 2, 3, n, 3, n * (n + 1)),
      sig: 'nt2' + n
    };
  };

  /* ============ 六下 U1 负数 ============ */
  U.negative = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['read', 'compare', 'temp']);
    if (mode === 'read') {
      var t = ri(1, 20);
      return {
        kind: 'negative', level: lv.id, layout: 'thermo',
        thC: -t,
        prompt: '温度计上是多少度？',
        answer: '-' + t + '℃',
        options: txtOpts('-' + t + '℃', ['+' + t + '℃', t + '℃', '-' + (t + 1) + '℃']),
        sig: 'ng' + t
      };
    }
    if (false) {
      return {
        kind: 'negative', level: lv.id, layout: 'plain',
        prompt: '零下 ' + t + ' 摄氏度记作（ ）',
        answer: '-' + t + '℃',
        options: txtOpts('-' + t + '℃', ['+' + t + '℃', t + '℃', '-' + (t + 1) + '℃']),
        sig: 'ng' + t
      };
    }
    if (mode === 'compare') {
      var a = -ri(1, 20), b = ri(1, 20);
      return {
        kind: 'negative', level: lv.id, layout: 'numline',
        nlMin: -20, nlMax: 20, nlStep: 5,
        nlMarks: [{ v: a, color: '#F0207E', label: a }, { v: b, color: '#2794DD', label: b }],
        prompt: '在数轴上，越靠右的数越大。哪个更大？',
        answer: b, options: shuffle([opt(a), opt(b)]),
        sig: 'ngc' + a + b
      };
    }
    var up = ri(3, 12), down = ri(2, 8);
    return {
      kind: 'negative', level: lv.id, layout: 'thermo2',
      thFrom: up, thTo: -down,
      prompt: '气温从 ' + up + '℃ 降到零下 ' + down + '℃，下降了（ ）℃',
      answer: up + down, options: mkNumOpts(up + down, 3, 2, 1, 25),
      sig: 'ngt' + up + down
    };
  };

  /* ============ 六下 U2 百分数（二） ============ */
  U.percent2 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['discount', 'interest', 'tax']);
    if (mode === 'discount') {
      var price = pick([100, 200, 300, 400, 500]);
      var disc = pick([7, 8, 9]);
      var ans = price * disc / 10;
      return {
        kind: 'percent2', level: lv.id, layout: 'tag',
        tagPrice: price, tagDisc: disc,
        prompt: '衣服原价 ' + price + ' 元，现在打 ' + disc + ' 折',
        answer: ans, options: mkNumOpts(ans, 3, Math.max(5, Math.round(ans / 5)), 10, price),
        sig: 'p2d' + price + disc
      };
    }
    if (mode === 'interest') {
      var principal = pick([1000, 2000, 5000]);
      var rate = pick([2, 3, 4]);
      var years = ri(2, 3);
      var ans2 = principal * rate / 100 * years;
      return {
        kind: 'percent2', level: lv.id, layout: 'expr',
        expr: principal + ' × ' + rate + '% × ' + years,
        exprHint: '利息 = 本金 × 利率 × 年数',
        prompt: '存 ' + principal + ' 元，年利率 ' + rate + '%，' + years + ' 年利息（ ）元',
        answer: ans2, options: mkNumOpts(ans2, 3, Math.max(5, Math.round(ans2 / 4)), 5, ans2 * 2),
        sig: 'p2i' + principal + rate + years
      };
    }
    var income = pick([2000, 4000, 5000, 8000]);
    var tr = pick([3, 5, 10]);
    var ans3 = income * tr / 100;
    return {
      kind: 'percent2', level: lv.id, layout: 'percentbar',
      pbPct: tr, pbTotal: income, pbUnit: '元',
      prompt: '收入 ' + income + ' 元，按 ' + tr + '% 缴税，应缴（ ）元',
      answer: ans3, options: mkNumOpts(ans3, 3, Math.max(4, Math.round(ans3 / 4)), 4, ans3 * 2),
      sig: 'p2t' + income + tr
    };
  };

  /* ============ 六下 U3 圆柱与圆锥 ============ */
  U.cylinder = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var PI = 3.14;
    var mode = pick(['cylvol', 'conevol', 'cylside']);
    var r = ri(2, 6), h = ri(2, 8);
    if (mode === 'cylvol') {
      var v = +(PI * r * r * h).toFixed(2);
      return {
        kind: 'cylinder', level: lv.id, layout: 'cylinder', r: r, h: h, shape: 'cyl',
        prompt: '底面半径 ' + r + '、高 ' + h + ' 厘米的圆柱体积是（ ）立方厘米',
        answer: v, options: txtOpts(v, [
          +(PI * r * r * h / 3).toFixed(2), +(PI * r * h).toFixed(2), +(PI * r * r).toFixed(2)
        ]),
        sig: 'cyv' + r + h
      };
    }
    if (mode === 'conevol') {
      var v2 = +(PI * r * r * h / 3).toFixed(2);
      return {
        kind: 'cylinder', level: lv.id, layout: 'cylinder', r: r, h: h, shape: 'cone',
        prompt: '底面半径 ' + r + '、高 ' + h + ' 厘米的圆锥体积是（ ）立方厘米',
        answer: v2, options: txtOpts(v2, [
          +(PI * r * r * h).toFixed(2), +(PI * r * h).toFixed(2), +(PI * r * r).toFixed(2)
        ]),
        sig: 'cov' + r + h
      };
    }
    var side = +(2 * PI * r * h).toFixed(2);
    return {
      kind: 'cylinder', level: lv.id, layout: 'cylinder', r: r, h: h, shape: 'cyl',
      prompt: '底面半径 ' + r + '、高 ' + h + ' 厘米的圆柱侧面积是（ ）平方厘米',
      answer: side, options: txtOpts(side, [
        +(PI * r * r).toFixed(2), +(PI * r * h).toFixed(2), +(2 * PI * r * r).toFixed(2)
      ]),
      sig: 'cys' + r + h
    };
  };

  /* ============ 六下 U4 比例 ============ */
  U.proportion = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['solve', 'scale', 'decide']);
    if (mode === 'solve') {
      var a = ri(2, 9), b = ri(2, 9), k = ri(2, 6);
      var ans = b * k;
      return {
        kind: 'proportion', level: lv.id, layout: 'expr',
        expr: a + ' : ' + b + ' = ' + (a * k) + ' : x',
        exprHint: '内项之积 = 外项之积',
        prompt: a + ' : ' + b + ' = ' + (a * k) + ' : x，x = （ ）',
        answer: ans, options: mkNumOpts(ans, 3, 2, 1, Math.max(20, ans + 10)),
        sig: 'pr' + a + b + k
      };
    }
    if (mode === 'scale') {
      var sc = pick([100, 200, 500, 1000]);
      var cm = ri(2, 9);
      var real = cm * sc / 100;
      return {
        kind: 'proportion', level: lv.id, layout: 'scaleruler',
        srScale: sc, srCm: cm,
        prompt: '比例尺 1:' + sc + '，图上 ' + cm + ' 厘米表示实际（ ）米',
        answer: real, options: mkNumOpts(real, 3, Math.max(1, Math.round(real / 3)), 1, real * 2),
        sig: 'ps2' + sc + cm
      };
    }
    var x1 = 2, y1 = 3;
    var m = pick([2, 3, 4]);
    return {
      kind: 'proportion', level: lv.id, layout: 'ratiobar',
      rbA: x1, rbB: y1, rbLabel: x1 + ':' + y1 + ' 的 ' + m + ' 倍？',
      prompt: x1 + ':' + y1 + ' 和 ' + (x1 * m) + ':' + (y1 * m) + ' 是否成比例？',
      answer: '成比例', options: shuffle([opt('成比例'), opt('不成比例')]),
      sig: 'pd' + m
    };
  };

  /* ============ 六下 U5 鸽巢问题 ============ */
  U.pigeon = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var facts = [
      { q: '把 4 个苹果放进 3 个抽屉，至少有一个抽屉里有（ ）个苹果', a: 2 },
      { q: '把 5 只鸽子放进 4 个笼子，至少有一个笼子里有（ ）只鸽子', a: 2 },
      { q: '把 7 本书放进 3 层书架，至少有一层放（ ）本', a: 3 },
      { q: '13 个人中至少有（ ）人同一个月出生', a: 2 }
    ];
    var f = pick(facts);
    var mm = f.q.match(/把\s*(\d+)\s*(只鸽子|个苹果|本书)/);
    var hh = f.q.match(/(\d+)\s*(个笼子|个抽屉|层书架)/);
    return {
      kind: 'pigeon', level: lv.id, layout: 'pigeon',
      pgBirds: mm ? Number(mm[1]) : 5, pgHoles: hh ? Number(hh[1]) : 4,
      prompt: f.q,
      answer: f.a, options: mkNumOpts(f.a, 3, 1, 1, 6),
      sig: 'pg' + f.q
    };
  };

  /* ============================================================
     一年级专属题型（按人教版教材单元，比三-六年级版本更简单）
     ============================================================ */

  /* ---- 一上 U2 位置：上下前后左右（用真实空间排布） ---- */
  U.pos = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    /* 每道题给出一个「场景」，用 CSS grid 摆放，让相对位置真实可见 */
    var scenes = [
      { rel: '上', scene: 'onTable', q: '小猫在桌子的什么位置？', a: '上面', w: ['下面', '左边', '右边'] },
      { rel: '下', scene: 'underTable', q: '皮球在桌子的什么位置？', a: '下面', w: ['上面', '左边', '右边'] },
      { rel: '左', scene: 'leftOf', q: '大树在小房子的什么位置？', a: '左边', w: ['右边', '上面', '下面'] },
      { rel: '右', scene: 'rightOf', q: '小花在小房子的什么位置？', a: '右边', w: ['左边', '上面', '下面'] }
    ];
    var it = pick(scenes);
    return {
      kind: 'pos', level: lv.id, layout: 'pos', posScene: it.scene,
      prompt: it.q,
      answer: it.a, options: txtOpts(it.a, it.w),
      sig: 'po' + it.scene
    };
  };

  /* ---- 一上 U4 认识图形（一）：立体图形 ---- */
  U.solid3d = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var items = [
      { n: '球', ico: '⚽', like: '皮球', can: '滚动' },
      { n: '正方体', ico: '🧊', like: '魔方', can: '不能滚动' },
      { n: '长方体', ico: '📦', like: '牙膏盒', can: '不能滚动' },
      { n: '圆柱', ico: '🥫', like: '易拉罐', can: '滚动' }
    ];
    var mode = pick(['name', 'like', 'roll']);
    var it = pick(items);
    if (mode === 'name') {
      return {
        kind: 'solid3d', level: lv.id, layout: 'solid3d', s3dIco: it.ico, s3dName: it.n,
        prompt: '这是什么形状？',
        answer: it.n, options: txtOpts(it.n, items.map(function (x) { return x.n; })),
        sig: 's3n' + it.n
      };
    }
    if (mode === 'like') {
      return {
        kind: 'solid3d', level: lv.id, layout: 'solid3d', s3dIco: it.ico, s3dName: it.n,
        prompt: '它和下面哪个东西形状一样？',
        answer: it.like, options: txtOpts(it.like, items.map(function (x) { return x.like; })),
        sig: 's3l' + it.n
      };
    }
    var canRoll = it.can === '滚动';
    return {
      kind: 'solid3d', level: lv.id, layout: 'solid3d', s3dIco: it.ico, s3dName: it.n,
      prompt: it.n + '容易滚动吗？',
      answer: canRoll ? '能滚动' : '不能滚动',
      options: shuffle([opt('能滚动'), opt('不能滚动')]),
      sig: 's3r' + it.n
    };
  };

  /* ---- 一上 U6 11~20 各数的认识 ---- */
  U.num20 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var mode = pick(['compose', 'order', 'compare']);
    if (mode === 'compose') {
      var t = 1, o = ri(1, 9);
      var val = 10 + o;
      return {
        kind: 'num20', level: lv.id, layout: 'placevalue2',
        pv2Tens: t, pv2Ones: o,
        prompt: '1 个十和 ' + o + ' 个一组成的数是（ ）',
        answer: val, options: mkNumOpts(val, 3, 2, 10, 20),
        sig: 'n20c' + o
      };
    }
    if (mode === 'order') {
      var n = ri(11, 19);
      var next = n + 1;
      return {
        kind: 'num20', level: lv.id, layout: 'numline',
        nlMin: 10, nlMax: 20, nlStep: 1,
        nlMarks: [{ v: n, color: '#F0207E', label: n }, { v: next, color: '#42B62A', label: '?' }],
        prompt: n + ' 后面一个数是几？',
        answer: next, options: mkNumOpts(next, 3, 1, 11, 21),
        sig: 'n20o' + n
      };
    }
    var a = ri(11, 19), b = ri(11, 19);
    while (b === a) b = ri(11, 19);
    return {
      kind: 'num20', level: lv.id, layout: 'compare2',
      cmpA: a, cmpB: b,
      prompt: '哪个数大？',
      answer: Math.max(a, b), options: shuffle([opt(a), opt(b)]),
      sig: 'n20m' + a + b
    };
  };

  /* ---- 一上 U7 认识钟表（整时 / 半时） ---- */
  U.clock1 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    var isHalf = Math.random() < 0.4;
    var h = ri(1, 12);
    var m = isHalf ? 30 : 0;
    var ans = h + (isHalf ? ' 时半' : ' 时');
    var opts = [opt(ans)];
    var seen = {}; seen[ans] = 1;
    var guard = 0;
    while (opts.length < 3 && guard++ < 100) {
      var nh = Math.random() < 0.5 ? h : ri(1, 12);
      var nm = Math.random() < 0.5 ? 0 : 30;
      var cand = nh + (nm ? ' 时半' : ' 时');
      if (seen[cand]) continue;
      seen[cand] = 1;
      opts.push(opt(cand));
    }
    return {
      kind: 'clock1', level: lv.id, layout: 'clock',
      hour: h, minute: m,
      prompt: '钟面上是几时？',
      answer: ans, options: shuffle(opts),
      sig: 'c1' + h + m
    };
  };

  /* ---- 一上 U8 20 以内进位加法（凑十法） ---- */
  U.carry10 = function (lv, diff) {
    var tier = MFI.Diff ? MFI.Diff.tier(diff) : 2;
    /* 9 加几 / 8 加几 / 7 加几，结果 11~18 */
    var pool = tier <= 1 ? [9] : tier === 2 ? [9, 8] : [9, 8, 7, 6];
    var a = pick(pool);
    /* tier1 只加较小的数（2~5），档位越高加数越大 */
    var bLo = Math.max(11 - a, tier <= 1 ? 2 : 3);
    var bHi = tier <= 1 ? 5 : tier === 2 ? 7 : 9;
    var b = ri(Math.min(bLo, bHi), Math.max(bLo, bHi));
    var ans = a + b;
    var makeTen = 10 - a;
    return {
      kind: 'carry10', level: lv.id, layout: 'make10',
      mtA: a, mtB: b, mtSplit: makeTen, mtRest: b - makeTen,
      prompt: '用凑十法算一算',
      answer: ans, options: mkNumOpts(ans, 3, 2, 10, 20),
      sig: 'ct' + a + b
    };
  };

  /* ---- 1~5 / 6~10 的认识和加减法：数、比、加减混合 ---- */
  function smallNumUnit(max) {
    return function (lv, diff) {
      var mode = pick(['count', 'add', 'sub', 'compare']);
      if (mode === 'count') {
        var n = ri(1, max);
        return {
          kind: max <= 5 ? 'num5' : 'num10', level: lv.id, layout: 'countdots',
          cdN: n,
          prompt: '数一数，有几个？',
          answer: n, options: mkNumOpts(n, 3, 1, 1, max + 1),
          sig: 'sn' + max + n
        };
      }
      if (mode === 'add') {
        var a = ri(1, max - 1), b = ri(1, max - a);
        return {
          kind: max <= 5 ? 'num5' : 'num10', level: lv.id, layout: 'blocks',
          bkA: a, bkB: b, bkOp: '+',
          prompt: '算一算，一共有几个？',
          answer: a + b, options: mkNumOpts(a + b, 3, 1, 0, max + 1),
          sig: 'sa' + max + a + b
        };
      }
      if (mode === 'sub') {
        var c = ri(2, max), d = ri(1, c - 1);
        return {
          kind: max <= 5 ? 'num5' : 'num10', level: lv.id, layout: 'blocks',
          bkA: c, bkB: d, bkOp: '−',
          prompt: '吃掉 ' + d + ' 个，还剩几个？',
          answer: c - d, options: mkNumOpts(c - d, 3, 1, 0, max),
          sig: 'ss' + max + c + d
        };
      }
      var x = ri(1, max), y = ri(1, max);
      while (y === x) y = ri(1, max);
      return {
        kind: max <= 5 ? 'num5' : 'num10', level: lv.id, layout: 'compare2',
        cmpA: x, cmpB: y,
        prompt: '哪个数大？',
        answer: Math.max(x, y), options: shuffle([opt(x), opt(y)]),
        sig: 'sc' + max + x + y
      };
    };
  }
  U.num5 = smallNumUnit(5);
  U.num10 = smallNumUnit(10);

  /* ---------- 分发 ---------- */
  U.MAP = {
    /* 三年级 */
    time: U.time, addbig: U.addbig, subbig: U.subbig, measure: U.measure,
    times: U.times, mul1: U.mul1, perimeter: U.perimeter, fraction: U.fraction,
    venn: U.venn, direction: U.direction, div1: U.div1, table: U.table,
    mul2: U.mul2, area: U.area, calendar: U.calendar, decimal: U.decimal, combo: U.combo,
    /* 一年级下 */
    shape2: U.shape2, sub20: U.sub20, classify: U.classify, num100: U.num100,
    pos: U.pos, solid3d: U.solid3d, num20: U.num20, clock1: U.clock1,
    carry10: U.carry10, num5: U.num5, num10: U.num10,
    money: U.money, add100: U.add100, pattern: U.pattern,
    /* 二年级 */
    length: U.length, add100b: U.add100b, angle: U.angle,
    multable: U.multable, multable2: U.multable2, observe: U.observe, clock2: U.clock2,
    divtable: U.divtable, divtable2: U.divtable2, symmetry: U.symmetry,
    mixed: U.mixed, remainder: U.remainder, num10000: U.num10000, weight: U.weight,
    /* 四年级 */
    bignum: U.bignum, areaunit: U.areaunit, angle2: U.angle2, mul3: U.mul3,
    quad: U.quad, div2: U.div2, barchart: U.barchart, optimize: U.optimize,
    four: U.four, law: U.law, decimal2: U.decimal2, triangle: U.triangle,
    decimaladd: U.decimaladd, symmetry2: U.symmetry2, average: U.average,
    /* 五年级 */
    decmul: U.decmul, coords: U.coords, decdiv: U.decdiv, chance: U.chance,
    equation: U.equation, polyarea: U.polyarea, planting: U.planting,
    factor: U.factor, cuboid: U.cuboid, frac2: U.frac2, fracadd: U.fracadd,
    rotation: U.rotation, linechart: U.linechart, weigh: U.weigh,
    /* 六年级 */
    fracmul: U.fracmul, bearing: U.bearing, fracdiv: U.fracdiv, ratio: U.ratio,
    circle: U.circle, percent: U.percent, piechart: U.piechart, numbershape: U.numbershape,
    negative: U.negative, percent2: U.percent2, cylinder: U.cylinder,
    proportion: U.proportion, pigeon: U.pigeon
  };
  U.make = function (kind, lv, diff) {
    var fn = U.MAP[kind];
    return fn ? fn(lv, diff) : null;
  };

  window.MFI = window.MFI || {};
  MFI.Units = U;
})();
