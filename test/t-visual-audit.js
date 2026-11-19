/* 图示审计：量每个题型「主图」的实际像素尺寸 + 截图 */
const { launch, setViewport, goto, evalJs, shot, sleep, close, OUT } = require('./cdp');
const fs = require('fs'); const path = require('path');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();

(async () => {
  const cdp = await launch();
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(600);
    await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'lv1', onFinish:function(){}}); true`);
    await sleep(900);

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
      /* 每题前确保局状态存在 */
      const alive = await evalJs(cdp, `!!MFI.Game._state()`);
      if (!alive) {
        await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'lv1', onFinish:function(){}}); true`);
        await sleep(600);
      }
      const kindArg = JSON.stringify(kind);
      const lvArg = JSON.stringify(lvId);
      const info = await evalJs(cdp, `(() => {
        const lvId = ${lvArg}, wantKind = ${kindArg};
        let q = null;
        for (let i = 0; i < 60; i++) {
          const c = MFI.Data.makeQuestion(lvId, i % 4);
          if (c.kind === wantKind) { q = c; break; }
        }
        if (!q) return { err: 'noq' };
        const s = MFI.Game._state();
        s.cur = q; s.phase = 'ask'; s.buttons = [];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), { onPick: function(){} });
        document.querySelectorAll('#board .g-opt, #board .candy-btn').forEach(b => s.buttons.push(b));

        /* 量「主图」：.g-stage 或启蒙容器里最大的可视元素 */
        const scope = document.querySelector('#board .g-stage') || document.getElementById('board');
        /* 覆盖所有已知图示容器，确保不漏测 */
        const cands = [...scope.querySelectorAll(
          'svg, .pos-scene, .ps-stack, .ps-row, .ball-bag, .cal-fig, .cal-grid, .pv-fig, .pv-cell,' +
          '.coord-fig, .cd-grid, .barchart-fig, .bc-cols, .combo-fig, .bar-model, .group-fig, .gf-group,' +
          '.stat-table, .vsum, .expr-card, .seq-chip, .avg-chips, .tag-card, .pbar, .s3-box,' +
          '.make10, .mt-row, .fcell, .bl-wrap, .clue-chip, .share-fig, .sh-group, .dots-fig, .dt-row,' +
          '.g-line, .g-pie2, .g-venn, .g-dir, .g-clock, .g-rect, .g-frac, .g-axis, .g-percentbar,' +
          '.g-scaleruler, .g-timeline, .g-pancake, .g-pigeon, .g-planting, .g-balance, .g-placevalue,' +
          '.g-anglepair, .g-triangle, .g-quad, .g-expr, .g-fracbar, .fb-row, .g-ratiobar, .g-tiles, .g-decmove'
        )];
        let best = null;
        cands.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          const area = r.width * r.height;
          if (!best || area > best.area) best = { area, w: Math.round(r.width), h: Math.round(r.height), cls: el.className.baseVal || el.className };
        });
        return {
          kind: q.kind, layout: q.layout, level: lvId,
          prompt: String(q.prompt).slice(0, 40),
          fig: best ? best.w + 'x' + best.h : 'none',
          figArea: best ? best.area : 0,
          figCls: best ? String(best.cls).slice(0, 30) : '-'
        };
      })()`);
      if (info.err) { rows.push({ kind, err: info.err }); continue; }
      await sleep(240);
      await shot(cdp, 'va-' + kind);
      rows.push(info);
    }

    /* 按尺寸排序输出 */
    rows.sort((a, b) => (a.figArea || 0) - (b.figArea || 0));
    console.log('=== 图示尺寸（从小到大）===');
    console.log('kind'.padEnd(14) + 'layout'.padEnd(14) + '图示尺寸'.padEnd(12) + '题目');
    rows.forEach(r => {
      const flag = (r.figArea || 0) < 4000 ? ' ⚠️小' : '';
      console.log(
        r.kind.padEnd(14) +
        (r.layout || '-').padEnd(14) +
        (r.fig || 'none').padEnd(12) + flag + '  ' + (r.prompt || '')
      );
    });
    fs.writeFileSync(path.join(OUT, '..', 'visual-audit.json'), JSON.stringify(rows, null, 2));
  } catch (e) { console.error('!!', e.message); }
  finally { close(cdp); }
})();
