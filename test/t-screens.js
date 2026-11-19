/* 验收：图鉴 / 事件卡 / 抢救 / 每日 / 无尽 / 窄屏 / 答题动画 */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(500);

    console.log('\n[事件卡]');
    await evalJs(cdp, `MFI.App.backHome(); MFI.App.show('game'); MFI.Game.start({mode:'level',level:'lv1',count:10,onFinish:function(){}}); true`);
    await sleep(600);
    /* 把下一题强制设为事件卡插点，走真实流程 */
    await evalJs(cdp, `(() => {
      const s = MFI.Game._state();
      s.eventAt = [s.index + 1];
    })()`);
    let evShown = false;
    for (let i = 0; i < 25; i++) {
      const st = await evalJs(cdp, `({
        ev: !document.getElementById('ovEvent').classList.contains('hidden'),
        phase: MFI.Game._state() ? MFI.Game._state().phase : 'none'
      })`);
      if (st.ev) { evShown = true; break; }
      if (st.phase === 'ask') {
        await evalJs(cdp, `(() => {
          const b = [...document.querySelectorAll('#board .candy-btn')];
          const c = MFI.Game._cur();
          const t = b.find(x => String(x.dataset.val) === String(c.answer));
          if (t) t.click();
        })()`);
      }
      await sleep(400);
    }
    ok('事件卡正常弹出', evShown);
    await sleep(300);
    await shot(cdp, 's-event');
    if (evShown) {
      await clickSel(cdp, '#evOk');
      await sleep(500);
      ok('事件卡可关闭', await evalJs(cdp, `document.getElementById('ovEvent').classList.contains('hidden')`));
    }

    console.log('\n[抢救小游戏]');
    await evalJs(cdp, `(() => {
      const s = MFI.Game._state();
      s.hearts = 0;
      /* 直接触发抢救（内部函数通过 next 的判定链路进入） */
      document.getElementById('ovRescue').classList.remove('hidden');
      MFI.Game._state().phase = 'rescue';
    })()`);
    await sleep(300);
    await shot(cdp, 's-rescue');

    console.log('\n[数数答对动画]');
    await evalJs(cdp, `MFI.Game.stop(); MFI.App.backHome(); MFI.App.show('game'); MFI.Game.start({mode:'level',level:'lv1',count:10,onFinish:function(){}}); true`);
    await sleep(600);
    await evalJs(cdp, `(() => {
      const q = { kind:'count', level:'lv1', fruit:'apple', a:4, answer:4, options:[4,2,6], prompt:'数一数', layout:'count' };
      const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
      s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(400);
    await shot(cdp, 's-count-before');
    await evalJs(cdp, `MFI.Board.countUp(MFI.Game._state().wrap)`);
    await sleep(900);
    const tallies = await evalJs(cdp, `document.querySelectorAll('#board .tally-num').length`);
    ok('数数动画标出 4 个序号', tallies === 4, String(tallies));
    await shot(cdp, 's-count-tally');

    console.log('\n[减法核 + 吃掉]');
    await evalJs(cdp, `(() => {
      const q = { kind:'sub', level:'lv3', fruit:'apple', a:5, b:2, answer:3, options:[3,1,6], prompt:'吃掉2个', layout:'sub' };
      const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
      s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(400);
    const cores = await evalJs(cdp, `({
      total: document.querySelectorAll('#board .fcell').length,
      cores: document.querySelectorAll('#board .fcell .art-core').length,
      apples: document.querySelectorAll('#board .fcell .art-fruit').length
    })`);
    ok('减法显示 5 个水果', cores.total === 5, JSON.stringify(cores));
    ok('被吃掉的 2 个画成苹果核', cores.cores === 2, JSON.stringify(cores));
    ok('剩下 3 个是完整苹果', cores.apples === 3, JSON.stringify(cores));
    await shot(cdp, 's-sub-cores');
    await evalJs(cdp, `MFI.Board.eatAway(MFI.Game._state().wrap)`);
    await sleep(1200);
    const eaten = await evalJs(cdp, `document.querySelectorAll('#board .fcell.eaten').length`);
    ok('答对后苹果核飞走', eaten === 2, String(eaten));
    await shot(cdp, 's-sub-eaten');

    console.log('\n[窄屏 320]');
    await setViewport(cdp, 320, 780);
    await sleep(300);
    await evalJs(cdp, `(() => {
      const q = { kind:'sub', level:'lv5', fruit:'melon', a:9, b:4, answer:5, options:[5,2,8], prompt:'吃掉4个', layout:'sub' };
      const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
      s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(500);
    const narrow = await evalJs(cdp, `(() => {
      const card = document.querySelector('#board .fcard');
      const cells = [...document.querySelectorAll('#board .fcell')];
      const cr = card.getBoundingClientRect();
      const out = cells.filter(c => { const r = c.getBoundingClientRect();
        return r.left < cr.left -1 || r.right > cr.right + 1 || r.top < cr.top -1 || r.bottom > cr.bottom + 1; });
      const candies = [...document.querySelectorAll('#board .candy-btn')];
      return {
        overflow: out.length, cells: cells.length,
        docW: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        candyMin: Math.min(...candies.map(c => Math.min(c.getBoundingClientRect().width, c.getBoundingClientRect().height)))
      };
    })()`);
    ok('320px 水果不溢出', narrow.overflow === 0 && narrow.cells === 9, JSON.stringify(narrow));
    ok('320px 无横向滚动', narrow.docW <= 0, String(narrow.docW));
    ok('320px 选项 ≥44px', narrow.candyMin >= 44, String(narrow.candyMin));
    await shot(cdp, 's-320');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
