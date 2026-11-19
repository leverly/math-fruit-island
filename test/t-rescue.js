/* 抢救小游戏：连错三次触发 → 接住水果 → 回血继续 */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  const st = () => evalJs(cdp, `(() => { const s = MFI.Game._state(); return {
    phase: s?s.phase:'none', hearts: s?s.hearts:-1,
    rescue: !document.getElementById('ovRescue').classList.contains('hidden'),
    result: !document.getElementById('scrResult').classList.contains('hidden'),
    ev: !document.getElementById('ovEvent').classList.contains('hidden'),
    bossIntro: !document.getElementById('ovBoss').classList.contains('hidden'),
    fruits: document.querySelectorAll('.falling').length
  }; })()`);
  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(500);
    await clickSel(cdp, '#btnContinue');
    await sleep(800);

    console.log('\n[连错三次]');
    let saw = false;
    for (let i = 0; i < 20; i++) {
      const s = await st();
      if (s.rescue) { saw = true; break; }
      if (s.result) break;
      if (s.ev) { await clickSel(cdp, '#evOk'); await sleep(400); continue; }
      await evalJs(cdp, `(() => {
        const b=[...document.querySelectorAll('#board .candy-btn, #board .g-opt')];
        const c=MFI.Game._cur();
        const t=b.find(x=>String(x.dataset.val)!==String(c.answer));
        if(t) t.click();
      })()`);
      await sleep(2100);
    }
    ok('三心耗尽触发抢救', saw);
    await sleep(1200);
    const r1 = await st();
    ok('抢救界面有水果掉落', r1.fruits >= 1, JSON.stringify(r1));
    await shot(cdp, 'r-rescue');

    console.log('\n[接住水果]');
    let got = 0;
    for (let i = 0; i < 40; i++) {
      const r = await evalJs(cdp, `(() => {
        const fs=[...document.querySelectorAll('.falling:not(.caught)')];
        fs.forEach(f=>f.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true})));
        return { open: !document.getElementById('ovRescue').classList.contains('hidden'),
                 got: Number(document.getElementById('rescueGot').textContent) };
      })()`);
      got = Math.max(got, r.got);
      if (!r.open) break;
      await sleep(300);
    }
    ok('能接住水果', got >= 1, '已接住 ' + got);

    console.log('\n[救回后继续]');
    let after = null;
    for (let i = 0; i < 40; i++) {
      after = await st();
      if (after.ev) { await clickSel(cdp, '#evOk'); await sleep(400); continue; }
      if (after.bossIntro) { await clickSel(cdp, '#bossOk'); await sleep(400); continue; }
      if (after.phase === 'ask' || after.phase === 'boss' || after.result) break;
      await sleep(200);
    }
    ok('救回后回到答题', after.phase === 'ask' || after.phase === 'boss', after.phase);
    ok('补回一颗心', after.hearts >= 1, String(after.hearts));
    ok('救援浮层已关闭', !after.rescue);
    const clean = await evalJs(cdp, `document.querySelectorAll('#rescueField .falling').length`);
    ok('掉落水果已清理', clean === 0, String(clean));
    await shot(cdp, 'r-after');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
