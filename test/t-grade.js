/* 三年级 17 个单元：出题正确性 + 渲染 */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL + '?r=' + Date.now());
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL + '?r=' + Date.now());
    await sleep(500);

    console.log('\n[关卡表]');
    const lv = await evalJs(cdp, `({
      total: MFI.Data.LEVELS.length,
      g3up: MFI.Data.countOf('g3','up'),
      g3down: MFI.Data.countOf('g3','down')
    })`);
    ok('总关卡 92', lv.total === 92, String(lv.total));
    ok('三年级上册 9 关', lv.g3up === 9, String(lv.g3up));
    ok('三年级下册 8 关', lv.g3down === 8, String(lv.g3down));

    console.log('\n[每个单元都能出题]');
    const gen = await evalJs(cdp, `(() => {
      const out = {};
      MFI.Data.LEVELS.filter(l => l.grade === 'g3').forEach(l => {
        const seen = new Set();
        let bad = [];
        for (let i = 0; i < 30; i++) {
          const q = MFI.Data.makeQuestion(l.id, i % 4);
          if (!q) { bad.push('null'); continue; }
          seen.add(q.kind);
          if (!q.options || q.options.length < 2) bad.push('opts');
          if (q.options) {
            const vals = q.options.map(o => String(o.v));
            if (new Set(vals).size !== vals.length) bad.push('dupOpt');
            if (vals.indexOf(String(q.answer)) < 0) bad.push('ansMissing');
          }
          if (q.answer == null || q.answer === '') bad.push('noAnswer');
          if (!q.prompt) bad.push('noPrompt');
          if (!q.layout) bad.push('noLayout');
        }
        out[l.id] = { kind: [...seen][0], bad: bad.slice(0,3), badN: bad.length };
      });
      return out;
    })()`);
    Object.keys(gen).forEach(function (id) {
      ok(id + ' 出题正常 (' + gen[id].kind + ')', gen[id].badN === 0, gen[id].bad.join(','));
    });

    console.log('\n[逐关渲染]');
    await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'g1', count:10, onFinish:function(){}}); true`);
    await sleep(700);
    const renders = await evalJs(cdp, `(() => {
      const out = [];
      MFI.Data.LEVELS.filter(l => l.grade === 'g3').forEach(l => {
        const q = MFI.Data.makeQuestion(l.id, 2);
        const s = MFI.Game._state();
        if (!s) return;
        s.cur = q; s.phase = 'ask'; s.buttons = [];
        try {
          s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
          const btns = document.querySelectorAll('#board .g-opt, #board .candy-btn');
          const stage = document.querySelector('#board .g-stage');
          out.push({ id: l.id, kind: q.kind, layout: q.layout,
                     btns: btns.length,
                     stageKids: stage ? stage.children.length : -1 });
        } catch (e) {
          out.push({ id: l.id, err: String(e) });
        }
      });
      return out;
    })()`);
    renders.forEach(function (r) {
      ok((r.id || '?') + ' 渲染成功', !r.err && r.btns >= 2, JSON.stringify(r));
    });

    console.log('\n[截图各题型]');
    for (const id of ['g1','g2','g5','g7','g8','g9','g10','g12','g14','g17']) {
      await evalJs(cdp, `(() => {
        const q = MFI.Data.makeQuestion('${id}', 2);
        const s = MFI.Game._state(); s.cur = q; s.phase='ask'; s.buttons=[];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
        document.querySelectorAll('#board .g-opt, #board .candy-btn').forEach(b=>s.buttons.push(b));
      })()`);
      await sleep(420);
      await shot(cdp, 'grade-' + id);
    }

    console.log('\n[无溢出]');
    const over = await evalJs(cdp, `(() => {
      const bad = [];
      MFI.Data.LEVELS.filter(l => l.grade === 'g3').forEach(l => {
        for (let i = 0; i < 6; i++) {
          const q = MFI.Data.makeQuestion(l.id, i % 4);
          const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
          s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
          const card = document.querySelector('#board .g-card');
          if (!card) { bad.push(l.id + ' no-card'); continue; }
          const cr = card.getBoundingClientRect();
          if (cr.right > window.innerWidth + 1 || cr.left < -1) bad.push(l.id + ' cardW');
          const opts = [...document.querySelectorAll('#board .g-opt')];
          opts.forEach(o => { const r = o.getBoundingClientRect();
            if (r.right > window.innerWidth + 1 || r.height < 44) bad.push(l.id + ' opt'); });
          if (document.documentElement.scrollWidth - document.documentElement.clientWidth > 0)
            bad.push(l.id + ' hscroll');
        }
      });
      return bad.slice(0, 8);
    })()`);
    ok('各题型无溢出、选项≥44', over.length === 0, over.join(' | '));

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.slice(0,8).join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
