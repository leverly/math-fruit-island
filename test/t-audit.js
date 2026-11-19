/* 题型审计：逐题型渲染并截图，标记是否「纯文字无图示」 */
const { launch, setViewport, goto, evalJs, shot, sleep, close, OUT } = require('./cdp');
const fs = require('fs');
const path = require('path');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();

(async () => {
  const cdp = await launch();
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(600);
    await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'lv1', count:10, onFinish:function(){}}); true`);
    await sleep(700);

    /* 每个 kind 取一道代表题 */
    const kinds = await evalJs(cdp, `(() => {
      const seen = {};
      MFI.Data.LEVELS.forEach(lv => {
        for (let i = 0; i < 40; i++) {
          const q = MFI.Data.makeQuestion(lv.id, i % 4);
          if (q && !seen[q.kind]) seen[q.kind] = lv.id;
        }
      });
      return seen;
    })()`);

    const rows = [];
    for (const kind of Object.keys(kinds)) {
      const lvId = kinds[kind];
      const info = await evalJs(cdp, `(() => {
        const lv = '${lvId}';
        let q = null;
        for (let i = 0; i < 60; i++) {
          const c = MFI.Data.makeQuestion(lv, i % 4);
          if (c.kind === '${kind}') { q = c; break; }
        }
        if (!q) return { err: 'noq' };
        const s = MFI.Game._state();
        s.cur = q; s.phase = 'ask'; s.buttons = [];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), { onPick: function(){} });
        document.querySelectorAll('#board .g-opt, #board .candy-btn').forEach(b => s.buttons.push(b));
        /* 在整个 board 里找「非选项」的图形元素 */
        const board = document.getElementById('board');
        const optsSel = '.g-opt, .candy-btn';
        const figSel = 'svg, img, .gf-group, .cd-grid, .cd-dot, .bc-col, .dt-dot, .cf-item, .bm-block,' +
                       '.ball, .seq-chip, .fcell, .bl-wrap, .op-wrap, .stat-table, .vsum,' +
                       '.barchart-fig, .dots-fig, .coord-fig, .combo-fig, .bar-model, .group-fig,' +
                       '.sh-group, .cal-grid, .pv-fig, .avg-chip, .cmp2-card, .clue-ico, .clue-list,' +
                       '.pbar, .tag-card, .art, .face, .clock-face, .mt-row, .g-make10, .s3-box,' +
                       '.pk-pan, .polygon, .g-polygon, .mo-cell, .expr-card, .dm-wrap, .pos-scene,' +
                       '.clue-ref, .g-months, .bk-dot, .g-pancake, .tl-bar, .sr-wrap, .g-gcd';
        const figN = board.querySelectorAll(figSel).length;
        return {
          kind: q.kind, layout: q.layout, level: lv,
          prompt: String(q.prompt).slice(0, 34),
          figN: figN,
          opts: board.querySelectorAll(optsSel).length,
          plain: figN === 0
        };
      })()`);
      if (info.err) { rows.push({ kind, err: info.err }); continue; }
      await sleep(220);
      await shot(cdp, 'audit-' + kind);
      rows.push(info);
    }

    /* 汇总 */
    const plain = rows.filter(r => r.plain);
    console.log('题型总数:', rows.length);
    console.log('有图示:', rows.length - plain.length);
    console.log('纯文字:', plain.length);
    console.log('\n纯文字题型清单:');
    plain.forEach(r => console.log('  - ' + r.kind + ' (' + r.layout + ')  ' + r.prompt));
    fs.writeFileSync(path.join(OUT, '..', 'audit.json'), JSON.stringify(rows, null, 2));
    console.log('\n明细已写入 test/audit.json');
  } catch (e) {
    console.error('!!', e.message);
  } finally {
    close(cdp);
  }
})();
