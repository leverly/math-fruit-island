const { launch, setViewport, goto, shot, evalJs, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(700);
    ok('主页渲染', await evalJs(cdp, `!!document.getElementById('btnContinue').dataset.level`));
    await shot(cdp, 'v-home');

    // 进第一关，强制渲染减法题
    await clickSel(cdp, '#btnContinue');
    await sleep(900);
    ok('进入游戏', await evalJs(cdp, `!document.getElementById('scrGame').classList.contains('hidden')`));
    await shot(cdp, 'v-count');

    // 强制减法
    await evalJs(cdp, `(() => {
      const D = MFI.Data;
      let q=null;
      for(let i=0;i<120;i++){const c=D.makeQuestion('lv3',2); if(c.kind==='sub'){q=c;break;}}
      if(!q) q = D.makeQuestion('lv3',2);
      const s = MFI.Game._state(); s.cur=q; s.phase='ask';
      s.buttons=[]; s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
      return q.kind;
    })()`);
    await sleep(500);
    await shot(cdp, 'v-sub');

    // 强制加法（黑板）
    const addInfo = await evalJs(cdp, `(() => {
      const D = MFI.Data;
      let q=null;
      for(let i=0;i<160;i++){const c=D.makeQuestion('lv4',2); if(c.kind==='add'){q=c;break;}}
      if(!q) return null;
      const s = MFI.Game._state(); s.cur=q; s.phase='ask';
      s.buttons=[]; s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
      return {a:q.a,b:q.b,ans:q.answer};
    })()`);
    await sleep(500);
    await shot(cdp, 'v-add');

    // 比大小
    await evalJs(cdp, `(() => {
      const D = MFI.Data;
      let q=null;
      for(let i=0;i<160;i++){const c=D.makeQuestion('lv6',2); if(c.kind==='compare'){q=c;break;}}
      if(!q) return;
      const s = MFI.Game._state(); s.cur=q; s.phase='ask';
      s.buttons=[]; s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(500);
    await shot(cdp, 'v-compare');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e) { fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n'+(fails.length?'失败 '+fails.length:'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
