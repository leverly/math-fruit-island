/* ===== 题面渲染：还原参考图的两套布局 =====
   A) 卡片式（数数/减法）：气球数字 + 奶油水果卡 + 紫色运算符，横排
   B) 黑板式（加法）：木框黑板 + 粉笔算式 + 礼物卡 + 右侧糖果选项 */
(function () {
  var B = {};
  var A = MFI.Art;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clear(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  /* 水果 SVG 按水果名取 */
  function fruitArt(name) {
    return A.fruit(name);
  }

  /* 选列数：优先让每行都排满，避免出现「前几行 4 个、最后一行 2 个」的参差 */
  B.colsFor = function (n) {
    if (n <= 3) return n;
    if (n === 4) return 2;
    if (n === 5) return 3;      /* 3+2 */
    if (n === 6) return 3;
    if (n === 7) return 4;      /* 4+3 */
    if (n === 8) return 4;
    if (n === 9) return 3;
    if (n === 10) return 5;     /* 5+5 */
    if (n === 11) return 4;     /* 4+4+3 */
    if (n === 12) return 4;
    if (n === 13) return 5;     /* 5+5+3 */
    if (n === 14) return 5;     /* 5+5+4 */
    if (n === 15) return 5;
    if (n === 16) return 4;
    if (n === 17) return 6;     /* 6+6+5 */
    if (n === 18) return 6;
    if (n === 19) return 5;     /* 5+5+5+4 */
    return 5;
  };

  /* ---------- 水果网格卡（奶油底 + 紫边，参考图同款） ---------- */
  B.fruitCard = function (count, fruitName, opt) {
    opt = opt || {};
    var cols = opt.cols || B.colsFor(count);
    var rows = Math.ceil(count / cols);

    var card = el('div', 'fcard');
    var grid = el('div', 'fgrid');
    grid.style.setProperty('--cols', cols);
    grid.dataset.cols = cols;
    grid.dataset.rows = rows;

    for (var i = 0; i < count; i++) {
      var gone = opt.goneFrom != null && i >= opt.goneFrom;
      var cell = el('div', 'fcell' + (gone ? ' gone' : ''));
      /* 苹果用「咬剩的果核」特别表现，其它水果用残影 + 缺口 */
      if (gone && fruitName === 'apple') cell.innerHTML = A.core();
      else cell.innerHTML = fruitArt(fruitName);
      if (!gone) {
        cell.style.animationDelay = Math.min(i * 0.04, 0.4) + 's';
        cell.classList.add('pop-in');
      }
      grid.appendChild(cell);
    }
    card.appendChild(grid);
    card.dataset.cols = cols;
    card.dataset.rows = rows;
    card.dataset.count = count;
    return card;
  };

  /* 让水果可点：点一下标一个序号，帮孩子逐个点数 */
  B.enableTapCount = function (root) {
    var cells = root.querySelectorAll('.fcell:not(.gone)');
    var tapped = 0;
    for (var i = 0; i < cells.length; i++) {
      (function (cell) {
        cell.classList.add('tappable');
        cell.addEventListener('click', function (ev) {
          ev.stopPropagation();
          if (cell.classList.contains('counted')) return;
          cell.classList.add('counted');
          tapped++;
          var badge = document.createElement('em');
          badge.className = 'tally-num';
          badge.textContent = tapped;
          cell.appendChild(badge);
          MFI.Audio.play('count', tapped - 1);
          var r = cell.getBoundingClientRect();
          MFI.FX.burst(r.left + r.width / 2, r.top + r.height / 2, 5, 26,
            ['#FFD23F', '#FFC46B', '#FFE9A8']);
        });
      })(cells[i]);
    }
    return cells.length;
  };

  /* 挑行列组合：先保证整齐（每行排满），再让格子尽量大；少量时避免挤成一行 */
  function bestGrid(n, innerW, innerH) {
    if (n === 1) return { cols: 1, rows: 1, size: Math.min(innerW, innerH) * 0.9 };
    if (n === 2) return { cols: 2, rows: 1, size: Math.min(innerW / 2, innerH) * 0.94 };
    if (n === 3) {
      /* 3 个排成 3×1 或 2×2（后者更饱满） */
      var a = Math.min(innerW / 3, innerH) * 0.94;
      var b = Math.min(innerW / 2, innerH / 2) * 0.94;
      return b > a ? { cols: 2, rows: 2, size: b } : { cols: 3, rows: 1, size: a };
    }
    var all = [];
    /* 列数上限：数量少时不超过 4 列，避免「5 个排一行」这种难数又扁的布局 */
    var maxCols = n <= 8 ? 4 : 6;
    for (var c = 2; c <= Math.min(maxCols, n); c++) {
      var rows = Math.ceil(n / c);
      var rem = n % c;
      var size = Math.min(innerW / c, innerH / rows) * 0.94;
      /* 整齐度：整除最高；末行缺 1 扣分；末行只剩 1 个也扣 */
      var tidy = rem === 0 ? 3 : (rem === 1 && c > 2 ? 1 : 2);
      all.push({ cols: c, rows: rows, size: size, tidy: tidy });
    }
    var maxTidy = Math.max.apply(null, all.map(function (o) { return o.tidy; }));
    var pool = all.filter(function (o) { return o.tidy === maxTidy; });
    pool.sort(function (x, y) { return y.size - x.size; });
    return pool[0];
  }

  /* 按可用宽高算格子尺寸：自动挑行列，保证不溢出且尽量铺满 */
  function fitFruits(root) {
    var cards = root.querySelectorAll('.fcard');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var grid = card.querySelector('.fgrid');
      if (!grid) continue;
      var n = Number(card.dataset.count) || 1;
      var innerW = card.clientWidth - 16;
      var innerH = card.clientHeight - 16;
      if (innerW <= 0) continue;
      if (!(innerH > 40)) {
        var vh = window.innerHeight;
        innerH = Math.min(vh * 0.46, vh - 340);
      }
      if (innerH <= 0) continue;

      /* 迭代几次：网格高度会反过来影响卡片高度，单次测量会偏小 */
      var best = bestGrid(n, innerW, innerH);
      var size = Math.max(12, Math.min(best.size, 108));
      card.dataset.cols = best.cols;
      card.dataset.rows = best.rows;
      grid.style.setProperty('--cols', best.cols);
      grid.style.setProperty('--fs', size + 'px');
      /* 网格高度不超过可用高度，避免把格子压扁 */
      var gh = Math.min(best.rows * size, innerH);
      grid.style.height = Math.max(0, gh) + 'px';
    }
  }
  B.fitFruits = fitFruits;

  /* ---------- 气球算式行 ---------- */
  function balloonRow(parts) {
    var row = el('div', 'balloon-row');
    parts.forEach(function (p) {
      if (p.op) {
        var chip = el('div', 'op-wrap');
        chip.innerHTML = A.opChip(p.op);
        row.appendChild(chip);
      } else {
        var b = el('div', 'bl-wrap' + (p.q ? ' unknown' : ''));
        b.innerHTML = A.balloon(p.text, p.color);
        row.appendChild(b);
      }
    });
    return row;
  }

  /* ---------- 糖果选项（参考图的光泽方块） ---------- */
  var CANDY_COLORS = ['pink', 'green', 'blue', 'purple', 'orange'];
  function optionsRow(options, onPick) {
    var row = el('div', 'candy-row');
    row.className = 'candy-row cols-' + Math.min(options.length, 4);
    var off = Math.floor(Math.random() * CANDY_COLORS.length);
    options.forEach(function (v, i) {
      var btn = el('button', 'candy-btn');
      btn.type = 'button';
      btn.dataset.val = v;
      btn.setAttribute('aria-label', '答案 ' + v);
      btn.innerHTML = A.candy(String(v), CANDY_COLORS[(i + off) % CANDY_COLORS.length]);
      btn.addEventListener('click', function () { onPick(v, btn); });
      row.appendChild(btn);
    });
    return row;
  }

  /* ================= 三年级题型的题面渲染 ================= */

  /* 通用：题干卡片 + 图形区 + 选项 */
  function gradeShell() {
    var wrap = el('div', 'q-layout grade-layout');
    var card = el('div', 'g-card');
    var stem = el('div', 'g-stem');
    var stage = el('div', 'g-stage');
    card.appendChild(stem);
    card.appendChild(stage);
    wrap.appendChild(card);
    wrap._stem = stem;
    wrap._stage = stage;
    return wrap;
  }

  /* ---- 钟面 ---- */
  function clockFace(h, m) {
    var g = 'ck' + Math.random().toString(36).slice(2, 8);
    var ticks = '';
    for (var i = 0; i < 60; i++) {
      var isHour = i % 5 === 0;
      var ang = (i * 6) * Math.PI / 180;
      var r1 = isHour ? 40 : 43.5;
      var r2 = 46;
      ticks += '<line x1="' + (50 + r1 * Math.sin(ang)).toFixed(1) + '" y1="' + (50 - r1 * Math.cos(ang)).toFixed(1) +
        '" x2="' + (50 + r2 * Math.sin(ang)).toFixed(1) + '" y2="' + (50 - r2 * Math.cos(ang)).toFixed(1) +
        '" stroke="' + (isHour ? '#3A2E55' : 'rgba(58,46,85,.42)') + '" stroke-width="' + (isHour ? 2.4 : 1.1) + '" stroke-linecap="round"/>';
    }
    var nums = '';
    for (var n = 1; n <= 12; n++) {
      var a = (n * 30) * Math.PI / 180;
      nums += '<text x="' + (50 + 32 * Math.sin(a)).toFixed(1) + '" y="' + (50 - 32 * Math.cos(a) + 5).toFixed(1) +
        '" text-anchor="middle" font-size="10.5" font-weight="900" fill="#3A2E55">' + n + '</text>';
    }
    var hAng = ((h % 12) + m / 60) * 30;
    var mAng = m * 6;
    return '<svg class="art art-clock" viewBox="0 0 100 100">' +
      '<defs><radialGradient id="' + g + '" cx="38%" cy="30%" r="78%">' +
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset="70%" stop-color="#FFF8E8"/>' +
        '<stop offset="100%" stop-color="#F2E2C4"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="47" fill="url(#' + g + ')"/>' +
      '<circle cx="50" cy="50" r="47" fill="none" stroke="#8B7BA8" stroke-width="3.5"/>' +
      '<circle cx="50" cy="50" r="42" fill="none" stroke="rgba(139,123,168,.35)" stroke-width="1.2"/>' +
      ticks + nums +
      '<line x1="50" y1="50" x2="' + (50 + 20 * Math.sin(hAng * Math.PI / 180)).toFixed(2) +
        '" y2="' + (50 - 20 * Math.cos(hAng * Math.PI / 180)).toFixed(2) +
        '" stroke="#2B2140" stroke-width="5.2" stroke-linecap="round"/>' +
      '<line x1="50" y1="50" x2="' + (50 + 30 * Math.sin(mAng * Math.PI / 180)).toFixed(2) +
        '" y2="' + (50 - 30 * Math.cos(mAng * Math.PI / 180)).toFixed(2) +
        '" stroke="#E8590C" stroke-width="3.4" stroke-linecap="round"/>' +
      '<circle cx="50" cy="50" r="4" fill="#2B2140"/>' +
      '<circle cx="50" cy="50" r="1.8" fill="#fff"/>' +
      '</svg>';
  }

  /* ---- 竖式 ---- */
  function verticalSum(q) {
    var box = el('div', 'vsum');
    var a = String(q.a), b = String(q.b);
    if (q.isDecimal) box.classList.add('decimal');
    var width = Math.max(a.length, b.length);
    box.innerHTML =
      '<div class="vs-row vs-a">' + a + '</div>' +
      '<div class="vs-row vs-b"><span class="vs-op">' + q.op + '</span>' + b + '</div>' +
      '<div class="vs-line"></div>' +
      '<div class="vs-row vs-q">?</div>';
    return box;
  }

  /* ---- 矩形（周长/面积） ---- */
  /* 长方形/正方形：按题目给的 w:h 真实比例绘制。
     正方形必须画成正方形；长方形的长宽比必须等于题目里的比；
     网格格数也必须是 w × h，否则「面积 = 数格子」就教错了。 */
  function rectFig(q) {
    var g = 'rc' + Math.random().toString(36).slice(2, 8);
    var w = Math.max(1, Number(q.w) || 1);
    var h = Math.max(1, Number(q.h) || 1);
    var isSquare = q.square || w === h;

    /* 在 MAX_W × MAX_H 的框内按真实比例取最大尺寸 */
    var MAX_W = 124, MAX_H = 92;
    var scale = Math.min(MAX_W / w, MAX_H / h);
    var rw = w * scale, rh = h * scale;

    var x0 = 14, y0 = 12;
    var rightPad = isSquare ? 16 : 52;   /* 非正方形右侧要放竖排「宽」 */
    var bottomPad = 24;                  /* 下方放「长」或「边长」 */
    var W = x0 + rw + rightPad;
    var H = y0 + rh + bottomPad;

    var unit = q.showGrid ? '' : ' 厘米';

    /* 网格：严格 w 列 × h 行 */
    var cells = '';
    if (q.showGrid) {
      var nCols = Math.min(w, 16), nRows = Math.min(h, 16);
      for (var i = 1; i < nCols; i++) {
        var gx = (x0 + rw * i / nCols).toFixed(2);
        cells += '<line x1="' + gx + '" y1="' + y0 + '" x2="' + gx + '" y2="' + (y0 + rh).toFixed(2) +
          '" stroke="rgba(43,127,168,.55)" stroke-width="1.2"/>';
      }
      for (var j = 1; j < nRows; j++) {
        var gy = (y0 + rh * j / nRows).toFixed(2);
        cells += '<line x1="' + x0 + '" y1="' + gy + '" x2="' + (x0 + rw).toFixed(2) + '" y2="' + gy +
          '" stroke="rgba(43,127,168,.55)" stroke-width="1.2"/>';
      }
    }

    var labelY = (y0 + rh + 16).toFixed(1);
    var dims;
    if (isSquare) {
      dims = '<text x="' + (x0 + rw / 2).toFixed(1) + '" y="' + labelY + '" text-anchor="middle" font-size="10" font-weight="900" fill="#2B2140">边长 ' + w + unit + '</text>';
    } else {
      dims = '<text x="' + (x0 + rw / 2).toFixed(1) + '" y="' + labelY + '" text-anchor="middle" font-size="10" font-weight="900" fill="#2B2140">长 ' + w + unit + '</text>' +
        /* 竖排「宽」：整体旋转，不用 writing-mode（中英混排会被逐字折行） */
        '<g transform="translate(' + (x0 + rw + 26).toFixed(1) + ',' + (y0 + rh / 2).toFixed(1) + ') rotate(90)">' +
          '<text x="0" y="0" text-anchor="middle" font-size="10" font-weight="900" fill="#2B2140">宽 ' + h + unit + '</text>' +
        '</g>';
    }

    return '<svg class="art art-rect" viewBox="0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0) + '">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#B9F0FF"/><stop offset="100%" stop-color="#7FD0F0"/></linearGradient></defs>' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + rw.toFixed(2) + '" height="' + rh.toFixed(2) +
        '" rx="3" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.6"/>' +
      cells + dims +
      '</svg>';
  }

  /* ---- 分数饼图 ---- */
  function pieFig(num, den) {
    var g = 'pi' + Math.random().toString(36).slice(2, 8);
    var slices = '';
    var r = 36, cx = 50, cy = 46;
    for (var i = 0; i < den; i++) {
      var a1 = (i / den) * Math.PI * 2 - Math.PI / 2;
      var a2 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2;
      var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      var large = (a2 - a1) > Math.PI ? 1 : 0;
      var filled = i < num;
      slices += '<path d="M' + cx + ' ' + cy + ' L' + x1.toFixed(2) + ' ' + y1.toFixed(2) +
        ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z" ' +
        'fill="' + (filled ? 'url(#' + g + ')' : '#FFFDF5') + '" stroke="#C08BFA" stroke-width="1.6"/>';
    }
    return '<svg class="art art-pie" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#FFC46B"/><stop offset="100%" stop-color="#F08512"/></linearGradient></defs>' +
      slices +
      '<circle cx="50" cy="46" r="36" fill="none" stroke="#8B5CF6" stroke-width="2.4"/>' +
      '</svg>';
  }

  /* ---- 统计表 ---- */
  function tableFig(q) {
    var t = el('div', 'stat-table');
    var head = '<tr><th></th>' + q.cats.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
    var r1 = '<tr><th class="rh">男生</th>' + q.boys.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    var r2 = '<tr><th class="rh">女生</th>' + q.girls.map(function (v) { return '<td>' + v + '</td>'; }).join('') + '</tr>';
    t.innerHTML = '<table>' + head + r1 + r2 + '</table>';
    return t;
  }

  /* ---- 韦恩图 ---- */
  function vennFig(q) {
    var g1 = 'vn1', g2 = 'vn2';
    return '<svg class="art art-venn" viewBox="0 0 220 110">' +
      '<defs>' +
        '<radialGradient id="' + g1 + '" cx="36%" cy="30%" r="76%"><stop offset="0" stop-color="rgba(120,200,255,.55)"/><stop offset="100%" stop-color="rgba(60,150,220,.28)"/></radialGradient>' +
        '<radialGradient id="' + g2 + '" cx="36%" cy="30%" r="76%"><stop offset="0" stop-color="rgba(255,190,120,.55)"/><stop offset="100%" stop-color="rgba(230,140,50,.28)"/></radialGradient>' +
      '</defs>' +
      '<ellipse cx="80" cy="55" rx="58" ry="42" fill="url(#' + g1 + ')" stroke="#2B7FA8" stroke-width="2"/>' +
      '<ellipse cx="140" cy="55" rx="58" ry="42" fill="url(#' + g2 + ')" stroke="#C96A1E" stroke-width="2"/>' +
      '<text x="42" y="58" text-anchor="middle" font-size="15" font-weight="900" fill="#1B5E80">' + q.onlyA + '</text>' +
      '<text x="110" y="58" text-anchor="middle" font-size="15" font-weight="900" fill="#6B3A0A">' + q.both + '</text>' +
      '<text x="178" y="58" text-anchor="middle" font-size="15" font-weight="900" fill="#8A4400">' + q.onlyB + '</text>' +
      '<text x="46" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#1B5E80">' + q.leftName + '</text>' +
      '<text x="174" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="#8A4400">' + q.rightName + '</text>' +
      '<text x="110" y="96" text-anchor="middle" font-size="8" font-weight="800" fill="#6B5C86">两项都参加</text>' +
      '</svg>';
  }

  /* ---- 方向网格 ---- */
  /* 方向题：把题目里提到的地点真的画在学校的对应方位上。
     画布固定 220×220（显示尺寸约 240px），所有构件用固定坐标，
     不再根据文字长度反推画布，避免互相放大。 */
  function dirFig(q) {
    var g = 'dr' + Math.random().toString(36).slice(2, 8);
    var OFF = { '东': [1, 0], '西': [-1, 0], '南': [0, 1], '北': [0, -1] };
    var W = 220, H = 220, cx = 110, cy = 112;
    var DIST = 68;          /* 地点到学校的距离 */
    var CARD_H = 30;

    var items = [];
    if (q.ask === 'center') {
      items.push({ dir: q.target, label: q.placeName || '地点' });
    } else {
      items.push({ dir: q.target, label: q.placeName || '小明家' });
      items.push({ dir: q.from, label: q.otherName || '医院' });
    }

    function posOf(dir) {
      var o = OFF[dir] || [0, 0];
      return { x: cx + o[0] * DIST, y: cy + o[1] * DIST };
    }

    /* 卡片：文字自适应宽度，但不超过 82，超长则缩字号 */
    function card(label, p) {
      var fs = 15;
      var w = label.length * fs + 14;
      if (w > 82) { fs = 12.5; w = label.length * fs + 12; }
      return { w: w, svg:
        '<rect x="' + (p.x - w / 2).toFixed(1) + '" y="' + (p.y - CARD_H / 2).toFixed(1) +
        '" width="' + w.toFixed(1) + '" height="' + CARD_H + '" rx="8" fill="#EAF8FF" stroke="#2B7FA8" stroke-width="2.6"/>' +
        '<text x="' + p.x.toFixed(1) + '" y="' + (p.y + fs * 0.36).toFixed(1) +
        '" text-anchor="middle" font-size="' + fs + '" font-weight="900" fill="#1B5E80">' + label + '</text>' };
    }

    var placed = items.map(function (it) {
      var p = posOf(it.dir);
      var c = card(it.label, p);
      return { x: p.x, y: p.y, w: c.w, dir: it.dir, svg: c.svg };
    });

    var shapes = placed.map(function (p) { return p.svg; }).join('');

    if (placed.length === 2) {
      var A = placed[0], B = placed[1];
      var dxs = A.x - B.x, dys = A.y - B.y;
      var lenS = Math.sqrt(dxs * dxs + dys * dys) || 1;
      var uxs = dxs / lenS, uys = dys / lenS;
      var hA = (Math.abs(uxs) > 0.5 ? A.w / 2 : CARD_H / 2) + 5;
      var hB = (Math.abs(uxs) > 0.5 ? B.w / 2 : CARD_H / 2) + 5;
      var x1 = B.x + uxs * hB, y1 = B.y + uys * hB;
      var x2 = A.x - uxs * hA, y2 = A.y - uys * hA;
      if (Math.abs(x2 - x1) + Math.abs(y2 - y1) > 16) {
        shapes += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
          '" stroke="#E8590C" stroke-width="3" stroke-dasharray="7 5" marker-end="url(#' + g + 'ar)"/>';
      }
    }

    /* 学校（中心） */
    var school =
      '<rect x="' + (cx - 13) + '" y="' + (cy - 2) + '" width="26" height="17" rx="3" fill="#FFD86B" stroke="#C99A0A" stroke-width="2.4"/>' +
      '<path d="M' + (cx - 16) + ' ' + (cy - 2) + ' L' + cx + ' ' + (cy - 13) + ' L' + (cx + 16) + ' ' + (cy - 2) +
        ' Z" fill="#F08512" stroke="#C97A0A" stroke-width="2.4" stroke-linejoin="round"/>' +
      '<rect x="' + (cx - 4) + '" y="' + (cy + 4) + '" width="8" height="11" fill="#fff" opacity=".85"/>' +
      '<text x="' + cx + '" y="' + (cy + 30) + '" text-anchor="middle" font-size="13" font-weight="900" fill="#8A5A00">学校</text>';

    /* 有横向地点时，东西方位字放上角；否则放两侧中部 */
    var hasHPlace = items.some(function (it) { var o = OFF[it.dir]; return o && o[0] !== 0; });
    var wxY = hasHPlace ? 36 : cy + 5;
    var exY = hasHPlace ? 36 : cy + 5;

    return '<svg class="art art-dir" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<defs>' +
        '<linearGradient id="' + g + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#F4FBFF"/><stop offset="100%" stop-color="#DBF0FA"/></linearGradient>' +
        '<marker id="' + g + 'ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto">' +
          '<path d="M0 0 L10 5 L0 10 z" fill="#E8590C"/></marker>' +
      '</defs>' +
      '<rect x="3" y="3" width="214" height="214" rx="18" fill="url(#' + g + ')" stroke="#7FC3DE" stroke-width="2.6"/>' +
      '<text x="' + cx + '" y="22" text-anchor="middle" font-size="15" font-weight="900" fill="#3A8FB0">北</text>' +
      '<text x="' + cx + '" y="213" text-anchor="middle" font-size="15" font-weight="900" fill="#3A8FB0">南</text>' +
      '<text x="16" y="' + wxY + '" text-anchor="middle" font-size="15" font-weight="900" fill="#3A8FB0">西</text>' +
      '<text x="204" y="' + exY + '" text-anchor="middle" font-size="15" font-weight="900" fill="#3A8FB0">东</text>' +
      shapes + school +
      '</svg>';
  }

  /* ---- 搭配（两组物品连线） ---- */
  function comboFig(q) {
    var box = el('div', 'combo-fig');
    var left = el('div', 'cf-col cf-a');
    q.itemsA.forEach(function (it) { left.appendChild(el('span', 'cf-item', it)); });
    var mid = el('div', 'cf-mid');
    mid.innerHTML = '<span class="cf-x">×</span>';
    var right = el('div', 'cf-col cf-b');
    q.itemsB.forEach(function (it) { right.appendChild(el('span', 'cf-item', it)); });
    box.appendChild(left);
    box.appendChild(mid);
    box.appendChild(right);
    return box;
  }

  /* ---- 倍的认识（条形模型） ---- */
  /* 倍的认识：一格 = 苹果的数量，梨有几格就是几倍 */
  function barModel(q) {
    var box = el('div', 'bar-model');
    var per = Math.max(1, q.barPer || 2);       /* 一格代表几个 */
    var times = Math.max(1, Math.min(q.barTimes || 2, 9));  /* 几倍 */
    var mode = q.barMode || 'result';

    function bar(label, groups, cls, cellCount, cellText) {
      var row = el('div', 'bm-row');
      row.appendChild(el('span', 'bm-label', label));
      var track = el('div', 'bm-track ' + cls);
      for (var g = 0; g < groups; g++) {
        var cell = el('div', 'bm-cell');
        if (cellText != null) {
          cell.appendChild(el('span', 'bm-ask', cellText));
        } else if (cellCount <= 12) {
          for (var i = 0; i < cellCount; i++) cell.appendChild(el('i', 'bm-block'));
        } else {
          cell.appendChild(el('span', 'bm-cell-n', String(cellCount)));
        }
        track.appendChild(cell);
      }
      row.appendChild(track);
      return row;
    }

    if (mode === 'base') {
      /* 已知梨的总数与倍数，求苹果：梨分 times 格，一格就是苹果 */
      box.appendChild(bar('梨', times, 'b', per));
      box.appendChild(bar('苹果', 1, 'a', 0, '? 个'));
      box.appendChild(el('div', 'g-cap',
        '梨共 ' + (q.barTotal || per * times) + ' 个，分成 ' + times + ' 份，1 份就是苹果'));
    } else {
      /* 苹果 1 格，梨 times 格 —— 直接数格子得出倍数关系 */
      box.appendChild(bar('苹果', 1, 'a', per));
      box.appendChild(bar('梨', times, 'b', per));
      box.appendChild(el('div', 'g-cap',
        mode === 'times'
          ? '苹果 1 格 = ' + per + ' 个，梨有 ' + times + ' 格，所以是 ' + times + ' 倍'
          : '苹果 ' + per + ' 个是 1 格，梨要画 ' + times + ' 格'));
    }
    return box;
  }

  /* ==================================================================
     通用可视化组件（给原本纯文字的题型补图示）
     ================================================================== */

  /* ---- 数轴：标出 a 与 b，或标出待求位置 ---- */
  function numberLineFig(opt) {
    var min = opt.min, max = opt.max;
    var marks = opt.marks || [];
    var W = 300, H = 76, pad = 22;
    var span = max - min || 1;
    function px(v) { return pad + ((v - min) / span) * (W - pad * 2); }
    var ticks = '';
    var step = opt.step || Math.max(1, Math.round(span / 10));
    /* 数字标签太密时隔一个标一次，避免挤在一起 */
    var labelEvery = Math.max(1, Math.ceil(span / 10 / step));
    var idx = 0;
    for (var v = min; v <= max; v += step) {
      var x = px(v);
      var isKey = (opt.marks || []).some(function (m) { return m.v === v; });
      ticks += '<line x1="' + x.toFixed(1) + '" y1="' + (isKey ? 28 : 31) + '" x2="' + x.toFixed(1) + '" y2="40" stroke="' +
        (isKey ? '#5A4C7A' : '#B0A6C4') + '" stroke-width="' + (isKey ? 2 : 1.4) + '"/>';
      if (idx % labelEvery === 0 || isKey) {
        ticks += '<text x="' + x.toFixed(1) + '" y="55" text-anchor="middle" font-size="9.5" font-weight="800" fill="' +
          (isKey ? '#3A2E55' : '#8B82A0') + '">' + v + '</text>';
      }
      idx++;
    }
    var dots = marks.map(function (m) {
      var x = px(m.v);
      var color = m.color || '#F0207E';
      var lbl = m.label == null ? '' : '<text x="' + x.toFixed(1) + '" y="24" text-anchor="middle" font-size="10" font-weight="900" fill="' + color + '">' + m.label + '</text>';
      return '<circle cx="' + x.toFixed(1) + '" cy="35" r="6" fill="' + color + '" stroke="#fff" stroke-width="2"/>' + lbl;
    }).join('');
    return '<svg class="art art-numline" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<line x1="' + pad + '" y1="35" x2="' + (W - pad) + '" y2="35" stroke="#5A4C7A" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M' + (W - pad) + ' 35 L' + (W - pad - 8) + ' 30 M' + (W - pad) + ' 35 L' + (W - pad - 8) + ' 40" stroke="#5A4C7A" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      ticks + dots + '</svg>';
  }

  /* ---- 分数条：分格涂色 ---- */
  function fracBarFig(num, den, opt) {
    opt = opt || {};
    var W = 260, H = 54, barW = 220, cellW = barW / den, x0 = 20, y0 = 16, barH = 30;
    var cells = '';
    for (var i = 0; i < den; i++) {
      var filled = i < num;
      cells += '<rect x="' + (x0 + i * cellW).toFixed(1) + '" y="' + y0 + '" width="' + cellW.toFixed(1) + '" height="' + barH +
        '" fill="' + (filled ? '#FFB13F' : '#FFFDF5') + '" stroke="#A93FE4" stroke-width="1.6"/>';
    }
    return '<svg class="art art-fracbar" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<rect x="' + x0 + '" y="' + y0 + '" width="' + barW + '" height="' + barH + '" rx="5" fill="none" stroke="#8B5CF6" stroke-width="2.4"/>' +
      cells + '</svg>';
  }

  /* ---- 人民币：纸币与硬币分行排列 ---- */
  function moneyFig(kind, yuan, jiao) {
    var nB = Math.max(0, yuan || 0), nC = Math.max(0, jiao || 0);
    var step = 44, billW = 36, billH = 52, coinR = 16;
    var pad = 6, gap = (nB && nC) ? 16 : 0;

    /* 画布按内容紧贴计算：不留方框空白，避免被拉伸后大片留白 */
    var rowB = nB ? (nB - 1) * step + billW : 0;
    var rowC = nC ? (nC - 1) * step + coinR * 2 : 0;
    var innerW = Math.max(rowB, rowC);
    var W = innerW + pad * 2;
    var H = pad * 2 + (nB ? billH : 0) + gap + (nC ? coinR * 2 : 0);

    var bills = '';
    var bx0 = pad + (innerW - rowB) / 2;
    for (var i = 0; i < nB; i++) {
      var x = bx0 + i * step;
      bills += '<g transform="translate(' + x.toFixed(1) + ',' + pad + ')">' +
        '<rect width="' + billW + '" height="' + billH + '" rx="5" fill="#C8EFD8" stroke="#3E8A5E" stroke-width="2"/>' +
        '<rect x="4" y="4" width="' + (billW - 8) + '" height="' + (billH - 8) + '" rx="3" fill="none" stroke="rgba(62,138,94,.4)" stroke-width="1"/>' +
        '<text x="' + (billW / 2) + '" y="27" text-anchor="middle" font-size="15" font-weight="900" fill="#1E6B45">1</text>' +
        '<text x="' + (billW / 2) + '" y="41" text-anchor="middle" font-size="9" font-weight="900" fill="#3E8A5E">元</text>' +
        '</g>';
    }

    var coins = '';
    var cy = pad + (nB ? billH + gap : 0) + coinR;
    var cx0 = pad + (innerW - rowC) / 2 + coinR;
    for (var j = 0; j < nC; j++) {
      var cx = cx0 + j * step;
      coins += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + coinR + '" fill="#FFE08A" stroke="#C99A0A" stroke-width="2"/>' +
        '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (coinR - 4.5) + '" fill="none" stroke="rgba(201,154,10,.45)" stroke-width="1"/>' +
        '<text x="' + cx.toFixed(1) + '" y="' + (cy + 4).toFixed(1) + '" text-anchor="middle" font-size="9.5" font-weight="900" fill="#8A5A00">1角</text>';
    }

    var sep = (nB && nC)
      ? '<line x1="' + (pad + 4) + '" y1="' + (pad + billH + gap / 2).toFixed(1) + '" x2="' + (W - pad - 4) +
        '" y2="' + (pad + billH + gap / 2).toFixed(1) + '" stroke="rgba(122,43,184,.16)" stroke-width="1.5" stroke-dasharray="4 4"/>'
      : '';

    return '<svg class="art art-money" viewBox="0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1) + '">' +
      bills + sep + coins + '</svg>';
  }

  /* ---- 单位换算尺（长度/质量/面积共用） ---- */
  function unitRulerFig(from, to, rate, n) {
    /* 左上 → 右下 的斜箭头：起点贴住上框右边，终点落在下框左边，
       箭头必须真正指到目标框，不能悬在半空 */
    var W = 300, H = 92;
    var ax1 = 122, ay1 = 33;      /* 上框右边中点 */
    var ax2 = 158, ay2 = 66;      /* 下框左边中点 */
    var dx = ax2 - ax1, dy = ay2 - ay1;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    /* 箭头两翼：以指向为基准旋转 ±150° */
    function wing(sign) {
      var a = Math.atan2(uy, ux) + sign * 2.62;
      return (ax2 + Math.cos(a) * 11).toFixed(1) + ' ' + (ay2 + Math.sin(a) * 11).toFixed(1);
    }
    return '<svg class="art art-units" viewBox="0 0 ' + W + ' ' + H + '">' +
      /* 上：原单位盒子 */
      '<rect x="18" y="16" width="104" height="34" rx="8" fill="#DFF4FC" stroke="#2B7FA8" stroke-width="2"/>' +
      '<text x="70" y="38" text-anchor="middle" font-size="13" font-weight="900" fill="#1B5E80">' + n + ' ' + from + '</text>' +
      /* 箭头 + 倍率标注（放在箭头上方，不压住框） */
      '<line x1="' + ax1 + '" y1="' + ay1 + '" x2="' + (ax2 - ux * 8).toFixed(1) + '" y2="' + (ay2 - uy * 8).toFixed(1) +
        '" stroke="#A93FE4" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + ax2 + ' ' + ay2 + ' L' + wing(-1) + ' M' + ax2 + ' ' + ay2 + ' L' + wing(1) +
        '" stroke="#A93FE4" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<text x="' + ((ax1 + ax2) / 2).toFixed(1) + '" y="' + (ay1 - 8) + '" text-anchor="middle" font-size="10" font-weight="900" fill="#7C1CC0">×' + rate + '</text>' +
      /* 下：目标单位盒子（与箭头终点对齐） */
      '<rect x="158" y="50" width="110" height="34" rx="8" fill="#FFF3DE" stroke="#C97A0A" stroke-width="2"/>' +
      '<text x="213" y="72" text-anchor="middle" font-size="12.5" font-weight="900" fill="#8A5A00">？' + to + '</text>' +
      '</svg>';
  }

  /* ---- 天平：方程模型 a·x + b = c ---- */
  function eqBalanceFig(a, b, c) {
    var leftItems = '';
    for (var i = 0; i < Math.min(a, 4); i++) {
      leftItems += '<span class="eq-x">x</span>';
    }
    if (a > 4) leftItems += '<span class="eq-xmore">×' + a + '</span>';
    if (b > 0) leftItems += '<span class="eq-b">+' + b + '</span>';
    return '<svg class="art art-eqbal" viewBox="0 0 260 130">' +
      /* 支柱与横梁 */
      '<line x1="46" y1="52" x2="214" y2="52" stroke="#8B7BA8" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M46 52 L32 78 M46 52 L60 78" stroke="#8B7BA8" stroke-width="3"/>' +
      '<path d="M214 52 L200 78 M214 52 L228 78" stroke="#8B7BA8" stroke-width="3"/>' +
      '<ellipse cx="46" cy="80" rx="30" ry="8" fill="#E8D9FF" stroke="#8A3FD1" stroke-width="2"/>' +
      '<ellipse cx="214" cy="80" rx="30" ry="8" fill="#FFF3DE" stroke="#C97A0A" stroke-width="2"/>' +
      '<circle cx="130" cy="52" r="6" fill="#A93FE4" stroke="#fff" stroke-width="2"/>' +
      '<path d="M130 58 L114 100 L146 100 Z" fill="#C79BFA" stroke="#7C1CC0" stroke-width="2" stroke-linejoin="round"/>' +
      '<text x="46" y="98" text-anchor="middle" font-size="9" font-weight="900" fill="#6B21AC">' + a + 'x' + (b ? ' + ' + b : '') + '</text>' +
      '<text x="214" y="98" text-anchor="middle" font-size="11" font-weight="900" fill="#8A5A00">' + c + '</text>' +
      '<text x="46" y="40" text-anchor="middle" font-size="8" font-weight="800" fill="#6B5C86">左边</text>' +
      '<text x="214" y="40" text-anchor="middle" font-size="8" font-weight="800" fill="#6B5C86">右边</text>' +
      '</svg>';
  }

  /* ---- 天平（找次品 / 比较重量） ---- */
  function balanceFig(leftN, rightN, labelL, labelR) {
    var tilt = leftN === rightN ? 0 : (leftN > rightN ? 1 : -1);
    var rot = tilt * 7;
    return '<svg class="art art-balance" viewBox="18 52 204 62">' +
      '<g transform="rotate(' + rot + ' 120 66)">' +
        '<line x1="46" y1="66" x2="194" y2="66" stroke="#8B7BA8" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M46 66 L34 88 M46 66 L58 88" stroke="#8B7BA8" stroke-width="3"/>' +
        '<path d="M194 66 L182 88 M194 66 L206 88" stroke="#8B7BA8" stroke-width="3"/>' +
        '<ellipse cx="46" cy="90" rx="24" ry="7" fill="#FFD86B" stroke="#C99A0A" stroke-width="2"/>' +
        '<ellipse cx="194" cy="90" rx="24" ry="7" fill="#FFD86B" stroke="#C99A0A" stroke-width="2"/>' +
        (labelL ? '<text x="46" y="94" text-anchor="middle" font-size="11" font-weight="900" fill="#8A5A00">' + labelL + '</text>' : '') +
        (labelR ? '<text x="194" y="94" text-anchor="middle" font-size="11" font-weight="900" fill="#8A5A00">' + labelR + '</text>' : '') +
      '</g>' +
      '<circle cx="120" cy="66" r="6" fill="#A93FE4" stroke="#fff" stroke-width="2"/>' +
      '<path d="M120 72 L106 106 L134 106 Z" fill="#C79BFA" stroke="#7C1CC0" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* ---- 图形分解（拼组/割补） ---- */
  function tileFig(kind, n, opts) {
    opts = opts || {};
    n = Math.max(1, Math.min(n || 1, 60));
    var cols = opts.cols || Math.ceil(Math.sqrt(n));
    var gap = n <= 16 ? 30 : n <= 36 ? 22 : 17;
    var cell = gap - 3;
    var pad = 8;
    var cells = '';
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols), c = i % cols;
      cells += '<rect x="' + (pad + c * gap) + '" y="' + (pad + r * gap) + '" width="' + cell + '" height="' + cell + '" rx="' + (cell / 6).toFixed(1) + '" ' +
        'fill="' + (kind === 'tri' ? '#8CE86A' : '#6FC8FF') + '" stroke="#fff" stroke-width="1.8"/>';
    }
    var rows = Math.ceil(n / cols);
    return '<svg class="art art-tiles" viewBox="0 0 ' + (pad * 2 + (cols - 1) * gap + cell) + ' ' +
      (pad * 2 + (rows - 1) * gap + cell) + '">' + cells + '</svg>';
  }

  /* ---- 比例/搭配：两组连线 ---- */
  function ratioBarsFig(a, b) {
    /* 画布紧贴两条色块，高度不再留出上下空白 */
    var total = a + b;
    var padX = 10, padY = 6, barH = 40;
    var W = 300, inner = W - padX * 2;
    var wa = Math.round((a / total) * inner), wb = inner - wa;
    var H = barH + padY * 2;
    var midY = (padY + barH / 2).toFixed(1);
    return '<svg class="art art-ratio" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<rect x="' + padX + '" y="' + padY + '" width="' + wa + '" height="' + barH + '" rx="7" fill="#6FC8FF" stroke="#2B7FA8" stroke-width="2"/>' +
      '<rect x="' + (padX + wa) + '" y="' + padY + '" width="' + wb + '" height="' + barH + '" rx="7" fill="#FFC46B" stroke="#C97A0A" stroke-width="2"/>' +
      '<text x="' + (padX + wa / 2) + '" y="' + midY + '" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="900" fill="#12405C">' + a + '</text>' +
      '<text x="' + (padX + wa + wb / 2) + '" y="' + midY + '" text-anchor="middle" dominant-baseline="middle" font-size="15" font-weight="900" fill="#7A4400">' + b + '</text>' +
      '</svg>';
  }

  /* ---- 温度计（负数/百分数场景通用） ---- */
  function thermoFig(celsius) {
    var min = -20, max = 40;
    var H = 110, y0 = 12, hh = H - 24;
    function py(v) { return y0 + (1 - (v - min) / (max - min)) * hh; }
    var zeroY = py(0), curY = py(Math.max(min, Math.min(max, celsius)));
    var ticks = '';
    for (var v = -20; v <= 40; v += 10) {
      ticks += '<line x1="20" y1="' + py(v).toFixed(1) + '" x2="26" y2="' + py(v).toFixed(1) + '" stroke="#8B7BA8" stroke-width="1.4"/>' +
        '<text x="18" y="' + (py(v) + 3).toFixed(1) + '" text-anchor="end" font-size="7.5" font-weight="800" fill="#6B5C86">' + v + '</text>';
    }
    return '<svg class="art art-thermo" viewBox="0 0 86 ' + H + '">' +
      '<rect x="26" y="' + y0 + '" width="14" height="' + hh + '" rx="7" fill="#FFFDF5" stroke="#8B7BA8" stroke-width="2"/>' +
      '<rect x="29" y="' + Math.min(curY, zeroY).toFixed(1) + '" width="8" height="' + Math.abs(zeroY - curY).toFixed(1) + '" rx="4" fill="#FF6B8F"/>' +
      '<line x1="22" y1="' + zeroY.toFixed(1) + '" x2="44" y2="' + zeroY.toFixed(1) + '" stroke="#2B2140" stroke-width="1.6"/>' +
      ticks +
      '<circle cx="33" cy="' + (H - 12) + '" r="11" fill="#FF6B8F" stroke="#C9405F" stroke-width="2"/>' +
      '<text x="56" y="' + (curY + 3).toFixed(1) + '" font-size="9" font-weight="900" fill="#C9405F">' + celsius + '℃</text>' +
      '</svg>';
  }

  function numOf(t) { return Number(String(t).split('/')[0]) || 1; }
  function denOf(t) { return Number(String(t).split('/')[1]) || 2; }

  /* 补角（两角拼成平角） */
  function anglePairFig(a, b) {
    var rad = a * Math.PI / 180;
    var L = 76;
    var padT = 18, padB = 16, padL = 16, padR = 16;
    var rise = L * Math.sin(rad);
    var x1 = padL, y1 = padT + rise;
    var x2 = x1 + L, y2 = y1;
    var x3 = x1 + L * Math.cos(-rad), y3 = y1 + L * Math.sin(-rad);
    var W = padL + L + padR, H = padT + rise + padB;
    return '<svg class="art art-anglepair" viewBox="0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0) + '">' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#2B2140" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x3.toFixed(1) + '" y2="' + y3.toFixed(1) + '" stroke="#2794DD" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M' + (x1 + 26) + ' ' + y1 + ' A26 26 0 0 0 ' + (x1 + 26 * Math.cos(-rad)).toFixed(1) + ' ' + (y1 + 26 * Math.sin(-rad)).toFixed(1) + '" fill="rgba(39,148,221,.18)" stroke="#2794DD" stroke-width="2"/>' +
      '<text x="' + (x1 + 36) + '" y="' + (y1 - 6) + '" font-size="10" font-weight="900" fill="#1B6FA8">' + a + '°</text>' +
      '<text x="' + (x2 - 20) + '" y="' + (y1 - 8) + '" font-size="10" font-weight="900" fill="#C9542A">?°</text>' +
      '<circle cx="' + x1 + '" cy="' + y1 + '" r="4" fill="#F0207E"/>' +
      '</svg>';
  }

  /* 三角形（标出两个已知角） */
  function triangleFig(a, b) {
    var A = { x: 100, y: 14 }, B = { x: 20, y: 88 }, C = { x: 180, y: 88 };
    var la = Math.round(Math.sqrt(Math.pow(156, 2) / 2));
    return '<svg class="art art-triangle2" viewBox="0 0 200 100">' +
      '<polygon points="' + A.x + ',' + A.y + ' ' + B.x + ',' + B.y + ' ' + C.x + ',' + C.y + '" ' +
        'fill="rgba(111,200,255,.35)" stroke="#2B7FA8" stroke-width="3" stroke-linejoin="round"/>' +
      '<text x="' + (B.x + 10) + '" y="' + (B.y - 6) + '" font-size="10" font-weight="900" fill="#1B6FA8">' + a + '°</text>' +
      '<text x="' + (C.x - 26) + '" y="' + (C.y - 6) + '" font-size="10" font-weight="900" fill="#1B6FA8">' + b + '°</text>' +
      '<text x="' + A.x + '" y="' + (A.y + 18) + '" font-size="11" font-weight="900" fill="#C9542A" text-anchor="middle">?</text>' +
      '</svg>';
  }

  /* 四边形 */
  function quadFig(kind) {
    var map = {
      para: '20,30 180,30 160,80 0,80',
      trap: '40,28 170,28 190,80 10,80',
      rect: '25,26 175,26 175,80 25,80',
      square: '45,22 155,22 155,84 45,84'
    };
    var pts = map[kind] || map.para;
    var shift = kind === 'para' ? 10 : 0;
    var adj = pts.split(' ').map(function (p) {
      var xy = p.split(',');
      return (Number(xy[0]) + shift) + ',' + xy[1];
    }).join(' ');
    return '<svg class="art art-quad2" viewBox="0 18 200 70">' +
      '<polygon points="' + adj + '" fill="rgba(111,200,255,.32)" stroke="#2B7FA8" stroke-width="3" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* ---- 新布局渲染（数轴 / 钱币 / 分数条 / 单位尺 / 温度计 / 比例条 / 球袋 / 序列） ---- */
  B.extendGrade2 = function (q, wrap) {
    switch (q.layout) {
      case 'numline':
        var nl = el('div', 'g-numline');
        nl.innerHTML = numberLineFig({
          min: q.nlMin, max: q.nlMax,
          step: q.nlStep || Math.max(1, Math.round((q.nlMax - q.nlMin) / 10)),
          marks: q.nlMarks || []
        });
        wrap._stage.appendChild(nl);
        return true;

      case 'money':
        var mw = el('div', 'g-money');
        mw.innerHTML = moneyFig('bills', q.mYuan || 0, q.mJiao || 0);
        wrap._stage.appendChild(mw);
        var cap = el('div', 'g-cap',
          (q.mYuan ? q.mYuan + ' 张 1 元' : '') +
          (q.mYuan && q.mJiao ? '，' : '') +
          (q.mJiao ? q.mJiao + ' 枚 1 角' : ''));
        wrap._stage.appendChild(cap);
        return true;

      case 'fracbar':
        var fw = el('div', 'g-fracbar');
        var bars = el('div', 'fb-row');
        bars.innerHTML = fracBarFig(q.fbNum, q.fbDen) +
          '<span class="fb-plus">' + (q.fbTimes ? '×' : q.fbDiv ? '÷' : '+') + '</span>' +
          (q.fbTimes || q.fbDiv
            ? '<span class="fb-times">' + (q.fbTimes || q.fbDiv) + '</span>'
            : fracBarFig(q.fbNum2 || 1, q.fbDen2 || q.fbDen));
        fw.appendChild(bars);
        if (q.fbHint) {
          fw.appendChild(el('div', 'g-cap')).innerHTML =
            String(q.fbHint).replace(/§(\d+)\/(\d+)§/g, function (_, a, b) {
              return '<span class="frac-inline"><b>' + a + '</b><i></i><b>' + b + '</b></span>';
            });
        }
        wrap._stage.appendChild(fw);
        return true;

      case 'unitruler':
        var uw = el('div', 'g-unitruler');
        uw.innerHTML = unitRulerFig(q.urFrom, q.urTo, q.urRate, q.urN);
        wrap._stage.appendChild(uw);
        return true;

      case 'thermo':
        var tw = el('div', 'g-thermo');
        tw.innerHTML = thermoFig(q.thC);
        wrap._stage.appendChild(tw);
        return true;

      case 'ratiobar':
        var rw = el('div', 'g-ratiobar');
        rw.innerHTML = ratioBarsFig(q.rbA, q.rbB);
        var rcap = el('div', 'g-cap', '蓝色 ' + q.rbA + ' 份，橙色 ' + q.rbB + ' 份');
        rw.appendChild(rcap);
        wrap._stage.appendChild(rw);
        return true;

      case 'balls':
        var bw = el('div', 'g-balls');
        var bag = el('div', 'ball-bag');
        for (var i = 0; i < q.ballRed; i++) bag.appendChild(el('i', 'ball red'));
        for (var j = 0; j < q.ballWhite; j++) bag.appendChild(el('i', 'ball white'));
        bw.appendChild(bag);
        var bcap = el('div', 'g-cap', '红球 ' + q.ballRed + ' 个，白球 ' + q.ballWhite + ' 个');
        bw.appendChild(bcap);
        wrap._stage.appendChild(bw);
        return true;

      case 'sequence':
        var sw = el('div', 'g-seq');
        (q.seqItems || []).forEach(function (it, idx) {
          sw.appendChild(el('span', 'seq-chip', String(it)));
          if (idx < q.seqItems.length - 1) sw.appendChild(el('span', 'seq-arrow', '→'));
        });
        if (q.seqShape) sw.appendChild(el('span', 'seq-arrow', '→'));
        else sw.appendChild(el('span', 'seq-arrow', '→'));
        sw.appendChild(el('span', 'seq-chip seq-q', '?'));
        wrap._stage.appendChild(sw);
        if (q.seqStep && !q.seqShape) {
          wrap._stage.appendChild(el('div', 'g-cap', '每次增加 ' + q.seqStep + '？自己找找规律'));
        }
        return true;


      case 'share':
        wrap._stage.appendChild(shareFig(q.shareTotal || 12, q.shareGroups || 3));
        return true;

      case 'calendar':
        var cal = el('div', 'g-calendar');
        cal.innerHTML = calendarFig(q.calMonth || '1 月', q.calDays || 30).replace(
          '<div class="cal-month">', '<div class="cal-month">');
        wrap._stage.appendChild(cal);
        return true;

      case 'months':
        var mw = el('div', 'g-months');
        var daysOf = [31, q.calLeapFeb ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        var yl = el('div', 'g-cap', (q.calYear ? q.calYear + ' 年' : '一年') + '的 12 个月');
        mw.appendChild(yl);
        var mg = el('div', 'mo-grid');
        daysOf.forEach(function (d, i) {
          var c = el('div', 'mo-cell' + (q.calHiMonth === i + 1 ? ' hi' : ''));
          c.appendChild(el('b', '', String(i + 1)));
          c.appendChild(el('i', '', d + '天'));
          mg.appendChild(c);
        });
        mw.appendChild(mg);
        mw.appendChild(el('div', 'g-cap', '二月天数随闰年、平年变化'));
        wrap._stage.appendChild(mw);
        return true;

      case 'axis':
        var ax = el('div', 'g-axis');
        ax.innerHTML = axisFig(q.axShape || '长方形');
        wrap._stage.appendChild(ax);
        wrap._stage.appendChild(el('div', 'g-cap', '虚线是可能的对称轴'));
        return true;

      case 'avg':
        var av = el('div', 'g-avg');
        var chips = el('div', 'avg-chips');
        (q.avgVals || []).forEach(function (v) { chips.appendChild(el('i', 'avg-chip', String(v))); });
        av.appendChild(chips);
        av.appendChild(el('div', 'g-cap', '把它们匀一匀，每份一样多'));
        wrap._stage.appendChild(av);
        return true;

      case 'balance':
        var bl = el('div', 'g-balance');
        if (q.balEq != null) {
          /* 方程：左边是 a 个 x 加 b，右边是 c */
          bl.innerHTML = eqBalanceFig(q.balN || 2, q.balPlus || 0, q.balEq || 0);
          wrap._stage.appendChild(bl);
          wrap._stage.appendChild(el('div', 'g-cap', '两边同时减去 ' + (q.balPlus || 0) + '，再同时除以 ' + (q.balN || 1)));
        } else {
          bl.innerHTML = balanceFig(0, 0, (q.balN || 3) + ' 个', (q.balN || 3) + ' 个');
          wrap._stage.appendChild(bl);
          wrap._stage.appendChild(el('div', 'g-cap', '天平平衡说明两边一样重；不平衡时，轻的那边有次品'));
        }
        return true;

      case 'planting':
        var pl = el('div', 'g-planting');
        pl.innerHTML = plantingFig(q.plLen || 10, q.plGap || 2, q.plMode || 'both');
        var pcap = { both: '两端都种', one: '只种一端', none: '两端都不种' }[q.plMode || 'both'];
        pl.appendChild(el('div', 'g-cap', pcap + ' · 每 ' + (q.plGap || 2) + ' 米一棵'));
        wrap._stage.appendChild(pl);
        return true;

      case 'pigeon':
        var pg = el('div', 'g-pigeon');
        pg.innerHTML = pigeonFig(q.pgBirds || 5, q.pgHoles || 4);
        wrap._stage.appendChild(pg);
        return true;

      case 'placevalue':
        var pv = el('div', 'g-placevalue');
        pv.innerHTML = placeValueFig(q.pvNum || '1.5');
        wrap._stage.appendChild(pv);
        return true;

      case 'percentbar':
        /* 百分比条：带 10% 刻度线，小占比也能看出真实比例 */
        var pb = el('div', 'g-percentbar');
        var pct = Math.max(1, Math.min(q.pbPct || 20, 100));
        var ticks = '';
        for (var ti = 1; ti < 10; ti++) {
          ticks += '<line x1="' + (ti * 10) + '%" y1="0" x2="' + (ti * 10) + '%" y2="100%"/>';
        }
        pb.innerHTML = '<div class="pbar">' +
          '<div class="pbar-fill" style="width:' + pct + '%"></div>' +
          '<svg class="pbar-ticks" preserveAspectRatio="none" viewBox="0 0 100 10">' +
            '<line x1="10" y1="0" x2="10" y2="10"/><line x1="20" y1="0" x2="20" y2="10"/>' +
            '<line x1="30" y1="0" x2="30" y2="10"/><line x1="40" y1="0" x2="40" y2="10"/>' +
            '<line x1="50" y1="0" x2="50" y2="10"/><line x1="60" y1="0" x2="60" y2="10"/>' +
            '<line x1="70" y1="0" x2="70" y2="10"/><line x1="80" y1="0" x2="80" y2="10"/>' +
            '<line x1="90" y1="0" x2="90" y2="10"/>' +
          '</svg>' +
          '<span class="pbar-label">' + pct + '%</span></div>' +
          '<div class="g-cap">总共 ' + (q.pbTotal || 100) + (q.pbUnit || '') + '，标出的部分占 ' + pct + '%</div>';
        wrap._stage.appendChild(pb);
        return true;

      case 'tag':
        var tg = el('div', 'g-tag');
        tg.innerHTML = '<div class="tag-card">' +
          '<span class="tag-orig">原价 ' + (q.tagPrice || 100) + ' 元</span>' +
          '<span class="tag-disc">' + (q.tagDisc || 8) + ' 折</span>' +
          '<span class="tag-now">现价 ?</span></div>';
        wrap._stage.appendChild(tg);
        return true;

      case 'tiles':
        var tl = el('div', 'g-tiles');
        tl.innerHTML = tileFig('sq', q.tileN || 6, { cols: q.tileCols });
        wrap._stage.appendChild(tl);
        wrap._stage.appendChild(el('div', 'g-cap', q.tileHint || '试着排成一样宽的长方形'));
        return true;

      case 'gcdfig':
        /* 最大公因数：两个数各自的因数排两行，公因数描成金色 */
        var gw = el('div', 'g-gcd');
        var ga = q.gcdA || 12, gb = q.gcdB || 18;
        function factorsOf(x) {
          var f = [];
          for (var d = 1; d <= x; d++) if (x % d === 0) f.push(d);
          return f;
        }
        var fa = factorsOf(ga), fb = factorsOf(gb);
        function gcdRow(num, list, other) {
          var row = el('div', 'gcd-row');
          row.appendChild(el('span', 'gcd-num', num));
          var chips = el('div', 'gcd-chips');
          list.forEach(function (v) {
            chips.appendChild(el('b', 'gcd-chip' + (other.indexOf(v) >= 0 ? ' common' : ''), String(v)));
          });
          row.appendChild(chips);
          return row;
        }
        gw.appendChild(gcdRow(ga, fa, fb));
        gw.appendChild(gcdRow(gb, fb, fa));
        gw.appendChild(el('div', 'g-cap', '金色的数是两个数共同的因数（公因数）'));
        wrap._stage.appendChild(gw);
        return true;

      case 'clue':
        var cw = el('div', 'g-clue');
        if (q.clueIco) cw.appendChild(el('div', 'clue-ico', q.clueIco));
        /* 单位题：给一个 A4 纸大小的参照框，让「大/小」有视觉锚点 */
        if (q.clueRef) {
          var rf = el('div', 'clue-ref');
          rf.appendChild(el('span', 'cr-ico', '📄'));
          rf.appendChild(el('span', 'cr-txt', q.clueRef));
          cw.appendChild(rf);
        }
        if (q.clueList) {
          var cl = el('div', 'clue-list');
          q.clueList.forEach(function (it) {
            var c = el('span', 'clue-chip');
            c.appendChild(el('span', 'cc-ico', it.ico));
            c.appendChild(el('span', '', it.text));
            cl.appendChild(c);
          });
          cw.appendChild(cl);
        }
        wrap._stage.appendChild(cw);
        return true;

      case 'placevalue2':
        var pv2 = el('div', 'g-placevalue');
        pv2.innerHTML = '<div class="pv-fig">' +
          '<div class="pv-cell hi"><span class="pv-h">十位</span><b>' + q.pv2Tens + '</b></div>' +
          '<div class="pv-cell"><span class="pv-h">个位</span><b>' + q.pv2Ones + '</b></div>' +
          '</div>';
        wrap._stage.appendChild(pv2);
        return true;

      case 'placevalue4':
        var pv4 = el('div', 'g-placevalue');
        var heads4 = ['千位', '百位', '十位', '个位'];
        var html4 = '<div class="pv-fig">';
        var pv4d = (q.pv4 || []).slice(0, 4);
        while (pv4d.length < 4) pv4d.push(0);
        pv4d.forEach(function (d, i) {
          html4 += '<div class="pv-cell' + (i === 0 ? ' hi' : '') + '">' +
            '<span class="pv-h">' + heads4[i] + '</span><b>' + d + '</b></div>';
        });
        html4 += '</div>';
        pv4.innerHTML = html4;
        wrap._stage.appendChild(pv4);
        return true;

      case 'placevalue5':
        /* 万级位值表：万位→个位 5 列，万位高亮（本题就是问「几万」） */
        var pv5w = el('div', 'g-placevalue');
        var heads5 = ['万位', '千位', '百位', '十位', '个位'];
        var html5 = '<div class="pv-fig pv-fig-5">';
        var pv5d = (q.pv5 || []).slice(0, 5);
        while (pv5d.length < 5) pv5d.push(0);
        pv5d.forEach(function (d, i) {
          html5 += '<div class="pv-cell' + (i === 0 ? ' hi' : '') + '">' +
            '<span class="pv-h">' + heads5[i] + '</span><b>' + d + '</b></div>';
        });
        html5 += '</div>';
        pv5w.innerHTML = html5;
        wrap._stage.appendChild(pv5w);
        return true;

      case 'countdots':
        var cdw = el('div', 'g-countdots');
        var cn = Math.max(1, Math.min(q.cdN || 5, 20));
        var ccols = cn <= 3 ? cn : cn <= 8 ? 4 : 5;
        var cgrid = el('div', 'cd-grid');
        cgrid.style.setProperty('--cd-cols', ccols);
        for (var ci = 0; ci < cn; ci++) {
          var cdot = el('i', 'cd-dot');
          cdot.style.animationDelay = (ci * 0.05) + 's';
          cgrid.appendChild(cdot);
        }
        cdw.appendChild(cgrid);
        cdw.appendChild(el('div', 'g-cap', '点一点，数一数有几个'));
        wrap._stage.appendChild(cdw);
        return true;

      case 'blocks':
        /* 加减法方块图：两组方块，减法把被拿走的画成虚线框 */
        var bkw = el('div', 'g-blocks');
        var a = q.bkA || 3, b = q.bkB || 2, op = q.bkOp || '+';
        function blockGroup(n, dimFrom) {
          var g = el('div', 'bk-group');
          for (var bi = 0; bi < n; bi++) {
            var isDim = dimFrom != null && bi >= dimFrom;
            g.appendChild(el('i', 'bk-dot' + (isDim ? ' dim' : '')));
          }
          return g;
        }
        var row = el('div', 'bk-row');
        if (op === '+') {
          row.appendChild(blockGroup(a));
          row.appendChild(el('span', 'bk-op', '+'));
          row.appendChild(blockGroup(b));
        } else {
          /* 减法：整体 a 个，后 b 个标灰表示拿走 */
          row.appendChild(blockGroup(a, a - b));
        }
        bkw.appendChild(row);
        bkw.appendChild(el('div', 'g-cap',
          op === '+' ? (a + ' 个 和 ' + b + ' 个，合起来是几个？')
                     : (a + ' 个里拿走 ' + b + ' 个（浅色），还剩几个？')));
        wrap._stage.appendChild(bkw);
        return true;

      case 'polygon':
        /* 数角：画出多边形，并把每个顶点角标出来 */
        var pgw = el('div', 'g-polygon');
        var sides = Math.max(3, Math.min(q.sides || 4, 6));
        pgw.innerHTML = polygonFig(sides);
        pgw.appendChild(el('div', 'g-cap', '数一数，这个图形有几个角'));
        wrap._stage.appendChild(pgw);
        return true;

      case 'pos':
        var pw = el('div', 'g-pos');
        var scene = q.posScene || 'onTable';
        /* 用真实空间排布：上 / 下 / 左 / 右 一眼可见 */
        var layoutHTML = {
          onTable: '<div class="ps-stack"><span class="ps-obj hi">🐱</span><span class="ps-ref">🪑</span></div>',
          underTable: '<div class="ps-stack"><span class="ps-ref">🪑</span><span class="ps-obj hi">⚽</span></div>',
          leftOf: '<div class="ps-row"><span class="ps-obj hi">🌳</span><span class="ps-ref">🏠</span></div>',
          rightOf: '<div class="ps-row"><span class="ps-ref">🏠</span><span class="ps-obj hi">🌸</span></div>'
        }[scene] || '';
        pw.innerHTML = '<div class="pos-scene">' + layoutHTML + '</div>';
        wrap._stage.appendChild(pw);
        return true;

      case 'solid3d':
        var s3 = el('div', 'g-solid3d');
        s3.innerHTML = '<div class="s3-box"><span class="s3-ico">' + (q.s3dIco || '⚽') + '</span></div>' +
          '<div class="g-cap">摸一摸，想一想它的形状</div>';
        wrap._stage.appendChild(s3);
        return true;

      case 'make10':
        var m10 = el('div', 'g-make10');
        var a = q.mtA || 9, b = q.mtB || 4;
        var split = q.mtSplit || 1, rest = q.mtRest || 3;
        m10.innerHTML =
          '<div class="mt-row">' +
            '<span class="mt-ball big">' + a + '</span>' +
            '<span class="mt-plus">+</span>' +
            '<span class="mt-ball big">' + b + '</span>' +
          '</div>' +
          '<div class="mt-arrow">拆成</div>' +
          '<div class="mt-row">' +
            '<span class="mt-ball big">' + a + '</span>' +
            '<span class="mt-plus">+</span>' +
            '<span class="mt-split">' +
              '<span class="mt-ball small green">' + split + '</span>' +
              '<span class="mt-ball small">' + rest + '</span>' +
            '</span>' +
          '</div>' +
          '<div class="mt-arrow">' + a + ' + ' + split + ' = 10</div>' +
          '<div class="mt-row">' +
            '<span class="mt-ball ten">10</span>' +
            '<span class="mt-plus">+</span>' +
            '<span class="mt-ball small">' + rest + '</span>' +
            '<span class="mt-eq">= ?</span>' +
          '</div>';
        wrap._stage.appendChild(m10);
        return true;

      case 'anglesingle':
        var as1 = el('div', 'g-angle');
        as1.innerHTML = angleFig(q.asDeg || 60);
        wrap._stage.appendChild(as1);
        return true;

      case 'decimalmove':
        var dmm = el('div', 'g-decmove');
        dmm.innerHTML = '<div class="dm-wrap">' +
          '<div class="dm-from">' + (q.dmFrom || '1.5') + '</div>' +
          '<div class="dm-arrow">× ' + (q.dmTimes || 10) + ' →</div>' +
          '<div class="dm-to">?</div></div>' +
          '<div class="g-cap">乘 10，小数点向右移一位</div>';
        wrap._stage.appendChild(dmm);
        return true;

      case 'trianglesum':
        var ts = el('div', 'g-triangle');
        ts.innerHTML = '<svg class="art" viewBox="0 0 200 100">' +
          '<polygon points="100,14 20,88 180,88" fill="rgba(111,200,255,.35)" stroke="#2B7FA8" stroke-width="3" stroke-linejoin="round"/>' +
          '<text x="66" y="86" font-size="10" font-weight="900" fill="#1B6FA8">∠1</text>' +
          '<text x="128" y="86" font-size="10" font-weight="900" fill="#1B6FA8">∠2</text>' +
          '<text x="100" y="36" font-size="10" font-weight="900" fill="#1B6FA8" text-anchor="middle">∠3</text>' +
          '<text x="100" y="62" font-size="13" font-weight="900" fill="#C9542A" text-anchor="middle">?</text>' +
          '</svg>';
        wrap._stage.appendChild(ts);
        return true;

      case 'scaleruler':
        var sr = el('div', 'g-scaleruler');
        sr.innerHTML = '<div class="sr-wrap">' +
          '<div class="sr-map"><span class="sr-line"></span><b>' + (q.srCm || 3) + ' 厘米</b></div>' +
          '<div class="sr-arrow">比例尺 1:' + (q.srScale || 100) + '</div>' +
          '<div class="sr-real"><span>实际 ?</span></div>' +
          '</div>';
        wrap._stage.appendChild(sr);
        return true;

      case 'pancake':
        /* 烙饼：每轮锅里有 2 个位置，用底色区分「已烙好」与「待烙」 */
        var pkw = el('div', 'g-pancake');
        var pkN = Math.max(2, Math.min(q.pkN || 3, 6));
        for (var pi = 0; pi < pkN; pi++) {
          var pan = el('div', 'pk-pan');
          pan.appendChild(el('span', 'pk-idx', '第 ' + (pi + 1) + ' 张'));
          var faces = el('div', 'pk-faces');
          faces.appendChild(el('i', 'pk-face', '正面'));
          faces.appendChild(el('i', 'pk-face', '反面'));
          pan.appendChild(faces);
          pkw.appendChild(pan);
        }
        pkw.appendChild(el('div', 'g-cap',
          '锅一次最多放 2 张，每面 3 分钟 —— 正面反面都要烙'));
        wrap._stage.appendChild(pkw);
        return true;

      case 'timeline':
        var tlw = el('div', 'g-timeline');
        var waterW = Math.round((q.tlWater || 8) / (q.tlWater + (q.tlActs || 1)) * 100);
        tlw.innerHTML = '<div class="tl-bar">' +
          '<div class="tl-water" style="width:' + waterW + '%">烧水 ' + (q.tlWater || 8) + ' 分</div>' +
          '<div class="tl-acts" style="width:' + (100 - waterW) + '%">同时做 ' + (q.tlActs || 1) + ' 件事</div>' +
          '</div>';
        wrap._stage.appendChild(tlw);
        wrap._stage.appendChild(el('div', 'g-cap', '做别的事可以和烧水同时进行'));
        return true;

      case 'expr':
        var ex = el('div', 'g-expr');
        ex.innerHTML = '<div class="expr-card">' + (q.expr || '') + '</div>' +
          (q.exprHint ? '<div class="g-cap">' + q.exprHint + '</div>' : '');
        wrap._stage.appendChild(ex);
        return true;

      case 'anglepair':
        var ap = el('div', 'g-anglepair');
        ap.innerHTML = anglePairFig(q.apA || 60, q.apB || 120);
        wrap._stage.appendChild(ap);
        return true;

      case 'triangle':
        var tf = el('div', 'g-triangle');
        tf.innerHTML = triangleFig(q.triA || 50, q.triB || 60);
        wrap._stage.appendChild(tf);
        return true;

      case 'quadshape':
        var qs = el('div', 'g-quad');
        qs.innerHTML = quadFig(q.quad || 'para');
        wrap._stage.appendChild(qs);
        return true;

      case 'fracpair':
        var fp = el('div', 'g-fracpair');
        fp.innerHTML = '<div class="fp-row">' +
          '<div class="fp-item">' + fracBarFig(numOf(q.fpA), denOf(q.fpA)) + '<span>' + q.fpA + '</span></div>' +
          '<div class="fp-vs">?</div>' +
          '<div class="fp-item">' + fracBarFig(numOf(q.fpB), denOf(q.fpB)) + '<span>' + q.fpB + '</span></div>' +
          '</div>';
        wrap._stage.appendChild(fp);
        return true;

      case 'thermo2':
        var t2 = el('div', 'g-thermo2');
        t2.innerHTML = '<div class="th2-wrap">' +
          thermoFig(q.thFrom) + '<div class="th2-arrow">↓</div>' + thermoFig(q.thTo) + '</div>';
        wrap._stage.appendChild(t2);
        return true;

      case 'compare2':
        var c2 = el('div', 'g-compare2');
        /* 小于 20 的数用圆点直观呈现数量；大数只显示数字卡片 */
        function dotsFor(n) {
          var wrapD = el('div', 'cmp2-dots');
          var shown = Math.min(n, 20);
          for (var di = 0; di < shown; di++) wrapD.appendChild(el('i', 'cmp2-dot'));
          if (n > 20) wrapD.appendChild(el('span', 'cmp2-more', '…'));
          return wrapD;
        }
        var va = q.cmpA, vb = q.cmpB;
        var na = Number(String(va).replace(/[,，]/g, ''));
        var nb = Number(String(vb).replace(/[,，]/g, ''));
        var showDots = !q.cmpDec && isFinite(na) && isFinite(nb) && na <= 20 && nb <= 20;
        var cardA = el('div', 'cmp2-card' + (q.cmpDec ? ' dec' : ''));
        cardA.appendChild(el('b', '', String(va)));
        if (showDots) cardA.appendChild(dotsFor(na));
        var cardB = el('div', 'cmp2-card' + (q.cmpDec ? ' dec' : ''));
        cardB.appendChild(el('b', '', String(vb)));
        if (showDots) cardB.appendChild(dotsFor(nb));
        c2.appendChild(cardA);
        c2.appendChild(el('div', 'cmp2-vs', '?'));
        c2.appendChild(cardB);
        wrap._stage.appendChild(c2);
        return true;

      case 'expr':
        var ex = el('div', 'g-expr');
        ex.innerHTML = '<div class="expr-card">' + (q.expr || '') + '</div>' +
          (q.exprHint ? '<div class="g-cap">' + q.exprHint + '</div>' : '');
        wrap._stage.appendChild(ex);
        return true;

      case 'anglepair':
        var ap = el('div', 'g-anglepair');
        ap.innerHTML = anglePairFig(q.apA || 60, q.apB || 120);
        wrap._stage.appendChild(ap);
        return true;

      case 'triangle':
        var tf = el('div', 'g-triangle');
        tf.innerHTML = triangleFig(q.triA || 50, q.triB || 60);
        wrap._stage.appendChild(tf);
        return true;

      case 'quadshape':
        var qs = el('div', 'g-quad');
        qs.innerHTML = quadFig(q.quad || 'para');
        wrap._stage.appendChild(qs);
        return true;

      case 'fracpair':
        var fp = el('div', 'g-fracpair');
        fp.innerHTML = '<div class="fp-row">' +
          '<div class="fp-item">' + fracBarFig(numOf(q.fpA), denOf(q.fpA)) + '<span>' + q.fpA + '</span></div>' +
          '<div class="fp-vs">?</div>' +
          '<div class="fp-item">' + fracBarFig(numOf(q.fpB), denOf(q.fpB)) + '<span>' + q.fpB + '</span></div>' +
          '</div>';
        wrap._stage.appendChild(fp);
        return true;

      case 'thermo2':
        var t2 = el('div', 'g-thermo2');
        t2.innerHTML = '<div class="th2-wrap">' +
          thermoFig(q.thFrom) + '<div class="th2-arrow">↓</div>' + thermoFig(q.thTo) + '</div>';
        wrap._stage.appendChild(t2);
        return true;

      case 'compare2':
        var c2 = el('div', 'g-compare2');
        c2.innerHTML =
          '<div class="cmp2-card' + (q.cmpDec ? ' dec' : '') + '">' + q.cmpA + '</div>' +
          '<div class="cmp2-vs">?</div>' +
          '<div class="cmp2-card' + (q.cmpDec ? ' dec' : '') + '">' + q.cmpB + '</div>';
        wrap._stage.appendChild(c2);
        return true;

      default:
        return false;
    }
  };
  /* ---- 小数位值表 ---- */
  function placeValueFig(numStr) {
    var parts = String(numStr).split('.');
    var intPart = parts[0] || '0';
    var decPart = parts[1] || '';
    var heads = ['个位', '十分位', '百分位'];
    var cells = '';
    var digits = (intPart.slice(-1) + decPart).split('');
    digits.forEach(function (d, i) {
      if (i >= 3) return;
      var hi = i === 1;
      cells += '<div class="pv-cell' + (hi ? ' hi' : '') + '">' +
        '<span class="pv-h">' + heads[i] + '</span>' +
        '<b>' + d + '</b></div>';
    });
    return '<div class="pv-fig">' + cells + '</div>';
  }

  /* ---- 植树问题示意图 ---- */
  function plantingFig(len, gap, mode) {
    var n = Math.floor(len / gap);
    var W = 300, H = 76, x0 = 20, x1 = W - 20;
    var pts = '';
    var canCount = Math.min(n, 18);
    for (var i = 0; i <= canCount; i++) {
      var x = x0 + (i / n) * (x1 - x0);
      var isEnd = (i === 0 || i === n);
      var show = true;
      if (mode === 'one' && i === n) show = false;
      if (mode === 'none' && isEnd) show = false;
      if (show) {
        pts += '<path d="M' + x.toFixed(1) + ' 46 L' + x.toFixed(1) + ' 30" stroke="#6B4A12" stroke-width="2.4"/>' +
          '<circle cx="' + x.toFixed(1) + '" cy="26" r="7" fill="#5AC63A" stroke="#2F8A24" stroke-width="1.6"/>';
      }
    }
    return '<svg class="art art-plant" viewBox="0 0 300 76">' +
      '<rect x="' + x0 + '" y="50" width="' + (x1 - x0) + '" height="10" rx="5" fill="#D9B478"/>' +
      '<text x="' + x0 + '" y="72" font-size="8" font-weight="800" fill="#8A6A3A">0</text>' +
      '<text x="' + x1 + '" y="72" font-size="8" font-weight="800" fill="#8A6A3A" text-anchor="end">' + len + ' 米</text>' +
      pts + '</svg>';
  }

  /* ---- 鸽巢示意图 ---- */
  function pigeonFig(birds, holes) {
    var boxes = '';
    var per = Math.ceil(birds / holes);
    for (var i = 0; i < Math.min(holes, 6); i++) {
      var n = Math.min(per, birds - i * per);
      var x = 12 + i * 46;
      boxes += '<rect x="' + x + '" y="30" width="40" height="40" rx="6" fill="#E8D9FF" stroke="#8A3FD1" stroke-width="2"/>';
      for (var j = 0; j < Math.max(0, n); j++) {
        boxes += '<circle cx="' + (x + 20) + '" cy="' + (44 + j * 11) + '" r="4.5" fill="#F0207E"/>';
      }
    }
    var w = 12 + Math.min(holes, 6) * 46;
    return '<svg class="art art-pigeon" viewBox="0 0 ' + w + ' 84">' +
      boxes + '<text x="' + (w / 2) + '" y="14" text-anchor="middle" font-size="9" font-weight="900" fill="#6B5C86">' + birds + ' 只鸽子 → ' + holes + ' 个笼子</text></svg>';
  }

  /* ---- 图形对称轴示意 ---- */
  function axisFig(shape) {
    var lines = '';
    if (shape === '正方形') {
      lines = '<line x1="50" y1="10" x2="50" y2="90"/><line x1="10" y1="50" x2="90" y2="50"/>' +
        '<line x1="18" y1="18" x2="82" y2="82"/><line x1="82" y1="18" x2="18" y2="82"/>';
      return '<svg class="art" viewBox="8 8 84 84">' +
        '<rect x="18" y="18" width="64" height="64" fill="#B9F0FF" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<g stroke="#F0207E" stroke-width="1.6" stroke-dasharray="4 3">' + lines + '</g></svg>';
    }
    if (shape === '等腰三角形') {
      return '<svg class="art" viewBox="10 8 80 82">' +
        '<polygon points="50,14 84,84 16,84" fill="#B9F0FF" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<line x1="50" y1="14" x2="50" y2="84" stroke="#F0207E" stroke-width="1.6" stroke-dasharray="4 3"/></svg>';
    }
    return '<svg class="art" viewBox="8 18 84 64">' +
      '<rect x="14" y="24" width="72" height="52" fill="#B9F0FF" stroke="#2B7FA8" stroke-width="2.5"/>' +
      '<g stroke="#F0207E" stroke-width="1.6" stroke-dasharray="4 3">' +
      '<line x1="50" y1="24" x2="50" y2="76"/><line x1="14" y1="50" x2="86" y2="50"/></g></svg>';
  }

  /* ---- 平均分：把方块均分到几组 ---- */
  function shareFig(total, groups) {
    var wrap = el('div', 'share-fig');
    var per = Math.floor(total / groups);
    for (var g = 0; g < Math.min(groups, 6); g++) {
      var gEl = el('div', 'sh-group');
      for (var i = 0; i < Math.min(per, 8); i++) gEl.appendChild(el('i', 'sh-dot'));
      if (per > 8) gEl.appendChild(el('span', 'sh-more', '+' + (per - 8)));
      wrap.appendChild(gEl);
    }
    if (groups > 6) wrap.appendChild(el('span', 'sh-more', '…'));
    wrap.appendChild(el('div', 'g-cap', '一共 ' + total + ' 个，平均分成 ' + groups + ' 份'));
    return wrap;
  }

  /* ---- 日历小卡 ---- */
  function calendarFig(month, days, highlight) {
    var cells = '';
    for (var d = 1; d <= days; d++) {
      cells += '<div class="cal-cell' + (highlight === d ? ' hi' : '') + '">' + d + '</div>';
    }
    return '<div class="cal-fig"><div class="cal-month">' + month + '</div><div class="cal-grid">' + cells + '</div></div>';
  }

  /* ---- 平面图形（三角形/正方形等） ---- */
  /* 认识图形（二）：按名字画对图形。
     正方形是等比四边，长方形必须是明显不等边的四边，不能共用同一个多边形。 */
  function shapeFig(name) {
    var g = 'sh' + Math.random().toString(36).slice(2, 8);
    var grad = '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0.4" y2="1">' +
      '<stop offset="0" stop-color="#B9F0FF"/><stop offset="100%" stop-color="#5FB8E0"/></linearGradient></defs>';
    var fill = 'fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="3" stroke-linejoin="round"';

    if (name === '圆') {
      return '<svg class="art" viewBox="0 0 100 100">' + grad +
        '<circle cx="50" cy="50" r="38" ' + fill + '/></svg>';
    }
    if (name === '三角形') {
      return '<svg class="art" viewBox="0 0 100 100">' + grad +
        '<polygon points="50,12 88,84 12,84" ' + fill + '/></svg>';
    }
    if (name === '长方形') {
      /* 明显不等边：宽:高 ≈ 1.5 */
      return '<svg class="art" viewBox="0 0 100 76">' + grad +
        '<rect x="8" y="12" width="84" height="52" rx="2" ' + fill + '/></svg>';
    }
    /* 正方形 */
    return '<svg class="art" viewBox="0 0 100 100">' + grad +
      '<rect x="14" y="14" width="72" height="72" rx="2" ' + fill + '/></svg>';
  }

  function polygonFig(sides) {
    var g = 'pg' + Math.random().toString(36).slice(2, 8);
    var pts = [], cx = 50, cy = 50, r = 44;
    var rot = sides === 4 ? -Math.PI / 4 : -Math.PI / 2;
    for (var i = 0; i < sides; i++) {
      var a = rot + i * 2 * Math.PI / sides;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return '<svg class="art" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0.4" y2="1">' +
        '<stop offset="0" stop-color="#B9F0FF"/><stop offset="100%" stop-color="#5FB8E0"/></linearGradient></defs>' +
      '<polygon points="' + pts.join(' ') + '" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="3" stroke-linejoin="round"/>' +
      '</svg>';
  }

  /* ---- 角 ---- */
  function angleFig(deg) {
    var g = 'ag' + Math.random().toString(36).slice(2, 8);
    var rad = deg * Math.PI / 180;
    /* 顶点放在画布中下部，一条边水平向右，另一条按角度张开。
       画布按两条边的实际包围盒计算 —— 钝角时斜边会向左伸，
       所以左边也要留够空间，不能把顶点贴死左边缘。 */
    var len = 64;
    var pad = 14;
    var ex = len, ey = 0;                      /* 水平边端点（相对顶点） */
    var ux = len * Math.cos(rad), uy = -len * Math.sin(rad);  /* 斜边端点 */
    /* 弧的外凸部分也要算进包围盒：弧半径处可能比斜边端点更靠外 */
    var arcR0 = Math.min(30, len * 0.5);
    var minX = Math.min(0, ux, arcR0 * Math.cos(rad), arcR0);
    var maxX = Math.max(0, ex);
    var minY = Math.min(0, uy, -arcR0 * Math.sin(rad), -arcR0);
    var maxY = Math.max(0, ey);
    var W = (maxX - minX) + pad * 2;
    var H = (maxY - minY) + pad * 2;
    var ox = -minX + pad, oy = -minY + pad;    /* 顶点在画布中的坐标 */
    var arcR = arcR0;
    var a1x = ox + arcR, a1y = oy;
    var a2x = ox + arcR * Math.cos(rad), a2y = oy - arcR * Math.sin(rad);
    var sweep = deg > 180 ? 1 : 0;
    /* 直角用方角标记，比圆弧更醒目 */
    var rightMark = deg === 90
      ? '<path d="M' + (ox + 13) + ' ' + oy + ' L' + (ox + 13) + ' ' + (oy - 13) + ' L' + ox + ' ' + (oy - 13) +
        '" fill="none" stroke="#F0207E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
      : '';
    return '<svg class="art" viewBox="0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0) + '">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#FFC46B"/><stop offset="100%" stop-color="#F08512"/></linearGradient></defs>' +
      '<line x1="' + ox.toFixed(1) + '" y1="' + oy.toFixed(1) + '" x2="' + (ox + ex).toFixed(1) + '" y2="' + (oy + ey).toFixed(1) +
        '" stroke="#2B2140" stroke-width="3.5" stroke-linecap="round"/>' +
      '<line x1="' + ox.toFixed(1) + '" y1="' + oy.toFixed(1) + '" x2="' + (ox + ux).toFixed(1) + '" y2="' + (oy + uy).toFixed(1) +
        '" stroke="#2B2140" stroke-width="3.5" stroke-linecap="round"/>' +
      '<path d="M' + a1x.toFixed(1) + ' ' + a1y.toFixed(1) + ' A' + arcR + ' ' + arcR + ' 0 ' + sweep + ' 0 ' +
        a2x.toFixed(1) + ' ' + a2y.toFixed(1) + '" fill="rgba(255,180,60,.35)" stroke="url(#' + g + ')" stroke-width="2.5"/>' +
      rightMark +
      '<circle cx="' + ox.toFixed(1) + '" cy="' + oy.toFixed(1) + '" r="3.4" fill="#F0207E"/>' +
      '</svg>';
  }

  /* ---- 立体图形（正方体/长方体/圆柱） ---- */
  function solidFig(kind) {
    var g = 'sl' + Math.random().toString(36).slice(2, 8);
    if (kind === '圆柱') {
      return '<svg class="art" viewBox="0 0 100 100">' +
        '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#8FD0F0"/><stop offset="45%" stop-color="#CFEFFC"/>' +
          '<stop offset="100%" stop-color="#6FB8E0"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="76" rx="28" ry="9" fill="rgba(40,90,120,.18)"/>' +
        '<path d="M22 28 L22 72 A28 9 0 0 0 78 72 L78 28 Z" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<ellipse cx="50" cy="28" rx="28" ry="9" fill="#DFF4FC" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '</svg>';
    }
    /* 正方体 / 长方体 */
    return '<svg class="art" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0.4" y2="1">' +
        '<stop offset="0" stop-color="#B9F0FF"/><stop offset="100%" stop-color="#5FB8E0"/></linearGradient></defs>' +
      '<path d="M22 36 L58 22 L84 34 L48 50 Z" fill="#DFF4FC" stroke="#2B7FA8" stroke-width="2"/>' +
      '<path d="M22 36 L48 50 L48 82 L22 68 Z" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2"/>' +
      '<path d="M48 50 L84 34 L84 66 L48 82 Z" fill="#8FD0F0" stroke="#2B7FA8" stroke-width="2" opacity=".9"/>' +
      '</svg>';
  }

  /* ---- 分组块（乘法/除法示意） ---- */
  function groupFig(q) {
    var box = el('div', 'group-fig');
    /* a × b 读作「a 组、每组 b 个」；除法 a ÷ b 也按「分给 b 份」显示 */
    var isDiv = q.kind && q.kind.indexOf('div') === 0;
    var groups = isDiv ? q.b : q.a;
    var per = isDiv ? Math.floor(q.a / q.b) : q.b;
    var total = groups * per;
    /* 数量多时用一排小方块表示总数 */
    var rowWrap = el('div', 'gf-groups');
    var shownGroups = Math.min(groups, 6);
    for (var gi = 0; gi < shownGroups; gi++) {
      var gEl = el('div', 'gf-group');
      var shownItems = Math.min(per, 6);
      for (var i = 0; i < shownItems; i++) gEl.appendChild(el('i', 'gf-dot'));
      if (per > 6) gEl.appendChild(el('span', 'gf-more', '+' + (per - 6)));
      rowWrap.appendChild(gEl);
    }
    if (groups > 6) rowWrap.appendChild(el('span', 'gf-more', '…'));
    box.appendChild(rowWrap);
    box.appendChild(el('div', 'gf-total',
      isDiv ? (groups + ' 份，每份 ' + per + ' 个')
            : (groups + ' 组，每组 ' + per + ' 个，共 ' + total + ' 个')));
    return box;
  }

  /* ---- 数对坐标格 ---- */
  function coordsFig(q) {
    var cells = '';
    var N = 8;
    for (var y = N; y >= 1; y--) {
      for (var x = 1; x <= N; x++) {
        var isDot = (x === q.cx && y === q.cy);
        cells += '<div class="cd-cell' + (isDot ? ' dot' : '') + '">' +
          (isDot ? '<i></i>' : '') + '</div>';
      }
    }
    var box = el('div', 'coord-fig');
    box.innerHTML = '<div class="cd-grid">' + cells + '</div>';
    return box;
  }

  /* ---- 条形统计图 ---- */
  function barChartFig(q) {
    var max = Math.max.apply(null, q.vals.concat([1]));
    var scale = Math.ceil(max / 4) * 4;
    var bars = q.vals.map(function (v, i) {
      var h = Math.max(6, Math.round((v / scale) * 100));
      return '<div class="bc-col' + (q.hi === i ? ' hi' : '') + '">' +
        '<span class="bc-val">' + v + '</span>' +
        '<div class="bc-bar" style="height:' + h + '%"></div>' +
        '<span class="bc-cat">' + q.cats[i] + '</span>' +
        '</div>';
    }).join('');
    var lines = '';
    for (var k = 0; k <= 4; k++) {
      lines += '<i style="bottom:' + (k * 25) + '%"></i>';
    }
    return '<div class="barchart-fig"><div class="bc-lines">' + lines + '</div>' +
      '<div class="bc-cols">' + bars + '</div></div>';
  }

  /* ---- 折线统计图 ---- */
  function lineChartFig(q) {
    var max = Math.max.apply(null, q.vals.concat([1]));
    var min = Math.min.apply(null, q.vals.concat([0]));
    var span = Math.max(4, max - min);
    var W = 100, H = 100;
    var pts = q.vals.map(function (v, i) {
      var x = 8 + (i / (q.vals.length - 1)) * (W - 16);
      var y = H - 12 - ((v - min) / span) * (H - 24);
      return { x: x, y: y, v: v, i: i };
    });
    var path = pts.map(function (p, i) { return (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join(' ');
    var dots = pts.map(function (p) {
      return '<circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="' +
        (q.hi === p.i ? 3.4 : 2.4) + '" fill="' + (q.hi === p.i ? '#F0207E' : '#2794DD') + '"/>';
    }).join('');
    var labels = q.labels.map(function (l, i) {
      var x = 8 + (i / (q.labels.length - 1)) * (W - 16);
      return '<text x="' + x.toFixed(1) + '" y="98" text-anchor="middle" font-size="5.5" font-weight="800" fill="#6B5C86">' + l + '</text>';
    }).join('');
    return '<svg class="art art-line" viewBox="0 0 100 100">' +
      '<path d="' + path + '" fill="none" stroke="#2794DD" stroke-width="2.4" stroke-linejoin="round"/>' +
      dots + labels + '</svg>';
  }

  /* ---- 饼图/扇形统计图 ---- */
  function pieChartFig(q) {
    var total = q.parts.reduce(function (a, b) { return a + b; }, 0);
    var colors = ['#FF8A2B', '#2794DD', '#42B62A'];
    var acc = 0;
    var segs = '';
    q.parts.forEach(function (p, i) {
      var a1 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      acc += p;
      var a2 = (acc / total) * Math.PI * 2 - Math.PI / 2;
      var sx = 50 + 34 * Math.cos(a1), sy = 46 + 34 * Math.sin(a1);
      var ex = 50 + 34 * Math.cos(a2), ey = 46 + 34 * Math.sin(a2);
      var large = (a2 - a1) > Math.PI ? 1 : 0;
      segs += '<path d="M50 46 L' + sx.toFixed(2) + ' ' + sy.toFixed(2) +
        ' A34 34 0 ' + large + ' 1 ' + ex.toFixed(2) + ' ' + ey.toFixed(2) + ' Z" ' +
        'fill="' + colors[i] + '" opacity="' + (q.hi === i ? 1 : 0.62) + '" stroke="#fff" stroke-width="1.4"/>';
      var mx = 50 + 20 * Math.cos((a1 + a2) / 2), my = 46 + 20 * Math.sin((a1 + a2) / 2);
      segs += '<text x="' + mx.toFixed(1) + '" y="' + (my + 2).toFixed(1) + '" text-anchor="middle" ' +
        'font-size="7" font-weight="900" fill="#fff">' + p + '%</text>';
    });
    return '<svg class="art art-pie2" viewBox="0 0 100 100">' + segs +
      '<circle cx="50" cy="46" r="34" fill="none" stroke="#8B5CF6" stroke-width="2"/>' +
      '</svg>';
  }

  /* ---- 点子图（数与形） ---- */
  function dotsFig(q) {
    var box = el('div', 'dots-fig');
    if (q.shape === 'square') {
      for (var r = 0; r < q.n; r++) {
        var row = el('div', 'dt-row');
        for (var c = 0; c < q.n; c++) row.appendChild(el('i', 'dt-dot'));
        box.appendChild(row);
      }
    } else {
      for (var r2 = 1; r2 <= q.n; r2++) {
        var row2 = el('div', 'dt-row');
        for (var c2 = 0; c2 < r2; c2++) row2.appendChild(el('i', 'dt-dot'));
        box.appendChild(row2);
      }
    }
    return box;
  }

  /* ---- 平面图形面积示意 ---- */
  function polygonAreaFig(q) {
    var g = 'pa' + Math.random().toString(36).slice(2, 8);
    var shape = '';
    if (q.poly === 'tri') {
      shape = '<polygon points="50,16 88,78 12,78" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<line x1="50" y1="16" x2="50" y2="78" stroke="#F0207E" stroke-width="2" stroke-dasharray="3 3"/>';
    } else if (q.poly === 'para') {
      shape = '<polygon points="28,20 88,20 72,78 12,78" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<line x1="28" y1="20" x2="28" y2="78" stroke="#F0207E" stroke-width="2" stroke-dasharray="3 3"/>';
    } else {
      shape = '<polygon points="34,20 66,20 88,78 12,78" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
        '<line x1="50" y1="20" x2="50" y2="78" stroke="#F0207E" stroke-width="2" stroke-dasharray="3 3"/>';
    }
    return '<svg class="art" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="0.4" y2="1">' +
        '<stop offset="0" stop-color="#C9F5D8"/><stop offset="100%" stop-color="#5CC98A"/></linearGradient></defs>' +
      shape + '</svg>';
  }

  /* ---- 圆柱/圆锥 ---- */
  function cylinderFig(q) {
    var g = 'cy' + Math.random().toString(36).slice(2, 8);
    if (q.shape === 'cone') {
      return '<svg class="art" viewBox="0 0 100 100">' +
        '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#FFC46B"/><stop offset="45%" stop-color="#FFE9B8"/>' +
          '<stop offset="100%" stop-color="#E8912A"/></linearGradient></defs>' +
        '<ellipse cx="50" cy="80" rx="30" ry="9" fill="rgba(120,70,10,.18)"/>' +
        '<path d="M50 18 L20 76 A30 9 0 0 0 80 76 Z" fill="url(#' + g + ')" stroke="#C97A0A" stroke-width="2.5"/>' +
        '<ellipse cx="50" cy="76" rx="30" ry="9" fill="none" stroke="#C97A0A" stroke-width="2"/>' +
        '</svg>';
    }
    return '<svg class="art" viewBox="0 0 100 100">' +
      '<defs><linearGradient id="' + g + '" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#8FD0F0"/><stop offset="45%" stop-color="#DFF4FC"/>' +
        '<stop offset="100%" stop-color="#5FA8D0"/></linearGradient></defs>' +
      '<ellipse cx="50" cy="82" rx="28" ry="8" fill="rgba(40,90,120,.16)"/>' +
      '<path d="M22 22 L22 78 A28 8 0 0 0 78 78 L78 22 Z" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
      '<ellipse cx="50" cy="22" rx="28" ry="8" fill="#EAF8FF" stroke="#2B7FA8" stroke-width="2.5"/>' +
      '<line x1="50" y1="22" x2="50" y2="78" stroke="#F0207E" stroke-width="1.6" stroke-dasharray="3 3"/>' +
      '</svg>';
  }

  /* ---- 圆 ---- */
  function circleFig(q) {
    var g = 'ci' + Math.random().toString(36).slice(2, 8);
    return '<svg class="art" viewBox="0 0 100 100">' +
      '<defs><radialGradient id="' + g + '" cx="36%" cy="30%" r="76%">' +
        '<stop offset="0" stop-color="#DFF4FC"/><stop offset="70%" stop-color="#9BD8F5"/>' +
        '<stop offset="100%" stop-color="#5FA8D0"/></radialGradient></defs>' +
      '<circle cx="50" cy="50" r="36" fill="url(#' + g + ')" stroke="#2B7FA8" stroke-width="2.5"/>' +
      '<line x1="50" y1="50" x2="86" y2="50" stroke="#F0207E" stroke-width="2.2"/>' +
      '<circle cx="50" cy="50" r="2.6" fill="#F0207E"/>' +
      '<text x="68" y="46" font-size="7" font-weight="900" fill="#C0186A">r</text>' +
      '</svg>';
  }

  /* 注册到主分发 */
  B.extendGrade = function (q, wrap) {
    switch (q.layout) {
      case 'shape':
        var sw = el('div', 'g-shape');
        sw.innerHTML = shapeFig(q.shape || '正方形');
        wrap._stage.appendChild(sw);
        return true;
      case 'angle':
        var aw = el('div', 'g-angle');
        aw.innerHTML = angleFig(q.deg);
        wrap._stage.appendChild(aw);
        return true;
      case 'solid':
        var ow = el('div', 'g-solid');
        ow.innerHTML = solidFig(q.shape);
        wrap._stage.appendChild(ow);
        return true;
      case 'group':
        wrap._stage.appendChild(groupFig(q));
        return true;
      case 'coords':
        wrap._stage.appendChild(coordsFig(q));
        return true;
      case 'barchart':
        var bw = el('div', 'g-barchart');
        bw.innerHTML = barChartFig(q);
        wrap._stage.appendChild(bw);
        return true;
      case 'linechart':
        var lw = el('div', 'g-line');
        lw.innerHTML = lineChartFig(q);
        wrap._stage.appendChild(lw);
        return true;
      case 'piechart':
        var pw = el('div', 'g-pie2');
        pw.innerHTML = pieChartFig(q);
        wrap._stage.appendChild(pw);
        return true;
      case 'dots':
        wrap._stage.appendChild(dotsFig(q));
        return true;
      case 'polygonarea':
        var paw = el('div', 'g-polyarea');
        paw.innerHTML = polygonAreaFig(q);
        wrap._stage.appendChild(paw);
        return true;
      case 'cylinder':
        var cw = el('div', 'g-cyl');
        cw.innerHTML = cylinderFig(q);
        wrap._stage.appendChild(cw);
        return true;
      case 'circle':
        var ccw = el('div', 'g-circle');
        ccw.innerHTML = circleFig(q);
        wrap._stage.appendChild(ccw);
        return true;
      case 'clock2':
        var k2 = el('div', 'g-clock');
        k2.innerHTML = clockFace(q.hour, q.minute);
        wrap._stage.appendChild(k2);
        return true;
      default:
        return false;
    }
  };

  /* ---------- 三年级题型主分发 ---------- */
  B.renderGrade = function (q, host, handlers) {
    var wrap = gradeShell();
    /* 题干中的 §n/d§ 渲染成上下分式 */
    /* 题干排版：
       1) §n/d§ 渲染成上下分式；
       2) 括号填空「（ ）」用不换行空格绑定，否则会在空格处断行，
          「）」被挤到下一行，出现「小明家在医院的（\n）面」这种断裂。 */
    wrap._stem.innerHTML = String(q.prompt)
      .replace(/§(\d+)\/(\d+)§/g, function (_, n, d) {
        return '<span class="frac-inline"><b>' + n + '</b><i></i><b>' + d + '</b></span>';
      })
      .replace(/（\s*）/g, '<span class="blank-paren">（&nbsp;）</span>');

    switch (q.layout) {
      case 'clock':
        var cw = el('div', 'g-clock');
        cw.innerHTML = clockFace(q.hour, q.minute);
        wrap._stage.appendChild(cw);
        if (q.clkCap) wrap._stage.appendChild(el('div', 'g-cap', q.clkCap));
        break;
      case 'vertical':
        wrap._stage.appendChild(verticalSum(q));
        break;
      case 'rect':
        var rw = el('div', 'g-rect');
        rw.innerHTML = rectFig(q);
        wrap._stage.appendChild(rw);
        break;
      case 'fraction':
        var fw = el('div', 'g-frac');
        fw.innerHTML = pieFig(q.num, q.den);
        wrap._stage.appendChild(fw);
        break;
      case 'table':
        wrap._stage.appendChild(tableFig(q));
        break;
      case 'venn':
        var vw = el('div', 'g-venn');
        vw.innerHTML = vennFig(q);
        wrap._stage.appendChild(vw);
        break;
      case 'grid':
        var dw = el('div', 'g-dir');
        dw.innerHTML = dirFig(q);
        wrap._stage.appendChild(dw);
        break;
      case 'combo':
        wrap._stage.appendChild(comboFig(q));
        break;
      case 'barmodel':
        wrap._stage.appendChild(barModel(q));
        break;
      default:
        if (!B.extendGrade2(q, wrap)) B.extendGrade(q, wrap);
        break;
    }

    /* 选项 */
    var opts = el('div', 'g-opts');
    var off = Math.floor(Math.random() * 5);
    var COLORS = ['c-green', 'c-blue', 'c-pink', 'c-purple', 'c-orange'];
    var btns = [];
    q.options.forEach(function (o, i) {
      var b = el('button', 'g-opt ' + COLORS[(i + off) % COLORS.length]);
      b.type = 'button';
      b.dataset.val = o.v;
      if (o.frac) {
        b.innerHTML = '<span class="frac-opt"><b>' + o.frac[0] + '</b><i></i><b>' + o.frac[1] + '</b></span>';
      } else {
        b.innerHTML = '<span>' + (o.label != null ? o.label : o.v) + '</span>';
      }
      b.addEventListener('click', function () { handlers.onPick(o.v, b); });
      opts.appendChild(b);
      btns.push(b);
    });
    if (q.options.length === 2) opts.classList.add('cols-2');
    else if (q.options.length === 3) opts.classList.add('cols-3');
    else if (q.options.length === 4) opts.classList.add('cols-4');
    else if (q.options.length === 5) opts.classList.add('cols-5');
    wrap.appendChild(opts);
    return wrap;
  };

  /* ================= 主渲染 ================= */
  B.render = function (q, host, handlers) {
    var old = host.querySelector('.q-layout');
    if (old && old._ro) { try { old._ro.disconnect(); } catch (e) {} }
    clear(host);
    var wrap;

    if (q.layout === 'add') {
      wrap = renderBlackboard(q, handlers);
    } else if (q.kind !== 'count' && q.kind !== 'add' && q.kind !== 'sub' && q.kind !== 'compare') {
      /* 除启蒙四类外，全部走三年级/小学题型渲染（含新增布局） */
      wrap = B.renderGrade(q, host, handlers);
    } else if (q.layout === 'compare') {
      wrap = renderCompare(q, handlers);
    } else if (q.layout === 'sub') {
      wrap = renderCardLayout(q, handlers);
    } else {
      wrap = renderCardLayout(q, handlers);
    }

    host.appendChild(wrap);
    /* 宽高互相依赖，多算几轮直到稳定 */
    var pass = 0;
    (function settle() {
      fitFruits(host);
      if (wrap._fitGifts) wrap._fitGifts();
      if (++pass < 8) requestAnimationFrame(settle);
    })();
    /* 布局稳定后再补一算，修正首次测量偏小 */
    setTimeout(function () { fitFruits(host); if (wrap._fitGifts) wrap._fitGifts(); }, 60);
    /* 启蒙题的水果卡支持点触计数 */
    if (q.kind === 'count' || q.kind === 'sub') {
      B.enableTapCount(wrap);
    }
    wrap._refit = function () {
      fitFruits(host);
      if (wrap._fitGifts) wrap._fitGifts();
    };
    return wrap;
  };

  /* ---------- 布局 A：卡片式（数数 / 减法）---------- */
  function renderCardLayout(q, handlers) {
    var wrap = el('div', 'q-layout card-layout');

    if (q.kind === 'count') {
      var row1 = balloonRow([{ text: '?', color: 'gray', q: true }]);
      row1.classList.add('solo');
      wrap.appendChild(row1);

      var rowC = el('div', 'card-row single');
      rowC.appendChild(B.fruitCard(q.a, q.fruit, { wide: true }));
      wrap.appendChild(rowC);
    } else {
      /* 减法：5 − 1 = ? */
      wrap.appendChild(balloonRow([
        { text: String(q.a), color: 'pink' },
        { op: '−' },
        { text: String(q.b), color: 'pink' },
        { op: '=' },
        { text: '?', color: 'green', q: true }
      ]));

      var rowS = el('div', 'card-row single');
      rowS.appendChild(B.fruitCard(q.a, q.fruit, { wide: true, goneFrom: q.a - q.b }));
      wrap.appendChild(rowS);
    }

    wrap.appendChild(optionsRow(q.options, handlers.onPick));
    return wrap;
  }

  /* ---------- 布局 B：黑板式（加法，参考图 2）---------- */
  function renderBlackboard(q, handlers) {
    var wrap = el('div', 'q-layout bb-layout');

    /* 木框 + 黑板 */
    var frame = el('div', 'bb-frame');
    var board = el('div', 'bb-board');

    /* 粉笔算式 */
    var eq = el('div', 'chalk-eq');
    eq.innerHTML =
      '<span class="chalk c-g">' + q.a + '</span>' +
      '<span class="chalk c-w">+</span>' +
      '<span class="chalk c-b">' + q.b + '</span>' +
      '<span class="chalk c-w">=</span>' +
      '<span class="chalk-q">?</span>';
    board.appendChild(eq);

    /* 两组礼物 */
    var row = el('div', 'gift-row');
    [q.a, q.b].forEach(function (n, gi) {
      var box = el('div', 'gift-box');
      var g = el('div', 'gift-grid');
      var cols = n <= 2 ? n : n <= 4 ? 2 : 3;
      g.style.setProperty('--cols', cols);
      g.dataset.cols = cols;
      g.dataset.rows = Math.ceil(n / cols);
      for (var i = 0; i < n; i++) {
        var c = el('div', 'gcell pop-in');
        c.innerHTML = A.gift(gi === 0 ? 'green' : 'blue');
        c.style.animationDelay = (i * 0.05) + 's';
        g.appendChild(c);
      }
      box.appendChild(g);
      box.dataset.cols = cols;
      box.dataset.rows = Math.ceil(n / cols);
      row.appendChild(box);
    });
    board.appendChild(row);
    frame.appendChild(board);
    wrap.appendChild(frame);

    /* 右侧糖果选项（参考图那种竖排深色卡） */
    var side = el('div', 'bb-side');
    side.appendChild(optionsRow(q.options, handlers.onPick));
    wrap.appendChild(side);

    /* 礼物尺寸贴合可用空间 */
    function fitGifts() {
      var boxes = wrap.querySelectorAll('.gift-box');
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        var g = b.querySelector('.gift-grid');
        if (!g) continue;
        var cols = Number(b.dataset.cols) || 2;
        var rows = Number(b.dataset.rows) || 1;
        var w = b.clientWidth - 12;
        if (w <= 0) continue;
        /* 按宽度定尺寸并设上限，面板高度随内容，避免大片空白 */
        var size = Math.min((w / cols) * 0.94, 78);
        size = Math.max(12, size);
        g.style.setProperty('--fs', size + 'px');
        g.style.height = 'auto';
      }
    }
    /* 用 ResizeObserver 跟随真实尺寸，避免早期量到 0 */
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () { fitGifts(); });
      ro.observe(wrap);
      wrap._ro = ro;
    }
    var tries = 0;
    (function retryFit() {
      fitGifts();
      if (++tries < 12) setTimeout(retryFit, 45);
    })();
    wrap._fitGifts = fitGifts;

    return wrap;
  }

  /* ---------- 布局 C：比大小 ---------- */
  function renderCompare(q, handlers) {
    var wrap = el('div', 'q-layout cmp-layout');

    var row = el('div', 'cmp-row');
    [[q.a, 'pink'], [q.b, 'green']].forEach(function (pair) {
      var side = el('div', 'cmp-side');
      var b = el('div', 'bl-wrap');
      b.innerHTML = A.balloon(String(pair[0]), pair[1]);
      side.appendChild(b);
      side.appendChild(B.fruitCard(pair[0], q.fruit, { wide: true }));
      row.appendChild(side);
    });
    wrap.appendChild(row);
    wrap.appendChild(optionsRow(q.options, handlers.onPick));
    return wrap;
  }

  /* ---------- 判分表现 ---------- */
  B.markRight = function (btn) {
    btn.classList.add('right');
    var r = btn.getBoundingClientRect();
    MFI.FX.burst(r.left + r.width / 2, r.top + r.height / 2, 16, 90);
    MFI.FX.ring(r.left + r.width / 2, r.top + r.height / 2, '#4FC62E');
  };

  B.markWrong = function (btn, answer, allBtns) {
    btn.classList.add('wrong');
    for (var i = 0; i < allBtns.length; i++) {
      var b = allBtns[i];
      if (String(b.dataset.val) === String(answer)) b.classList.add('hint');
      else if (b !== btn) b.classList.add('dim');
    }
  };

  /* 数数动画：水果挨个跳，标上序号 */
  B.countUp = function (root) {
    var cells = root.querySelectorAll('.fcell');
    var step = Math.max(90, Math.min(180, 1000 / Math.max(1, cells.length)));
    for (var i = 0; i < cells.length; i++) {
      (function (cell, idx) {
        setTimeout(function () {
          if (!cell.parentNode) return;
          cell.classList.add('tally');
          var badge = el('em', 'tally-num', String(idx + 1));
          cell.appendChild(badge);
          MFI.Audio.play('count', idx);
        }, idx * step);
      })(cells[i], i);
    }
    return cells.length * step;
  };

  /* 减法：被标记的水果一个个变成苹果核再飞走 */
  B.eatAway = function (root) {
    var gone = root.querySelectorAll('.fcell.gone');
    for (var i = 0; i < gone.length; i++) {
      (function (cell, idx) {
        setTimeout(function () {
          if (!cell.parentNode) return;
          cell.classList.add('eaten');
          var mark = cell.querySelector('.gone-mark');
          if (mark) mark.remove();
          MFI.Audio.play('eat');
        }, 150 + idx * 190);
      })(gone[i], i);
    }
    return 150 + gone.length * 190 + 620;
  };

  window.MFI = window.MFI || {};
  MFI.Board = B;
})();
