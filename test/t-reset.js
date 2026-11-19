/* 重置：会清空所有进度且不残留 */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
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
    await sleep(600);

    console.log('\n[造一些进度]');
    await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      d.coins = 999; d.totalCorrect = 42; d.bestCombo = 12;
      d.levels = { lv1:{best:3,plays:2}, lv2:{best:2,plays:1} };
      d.badges = { streak3:{at:'2026-11-01'}, lv1:{at:'2026-11-01'} };
      d.grade = 'g4'; d.term = 'down'; d.streak = 5; d.bestStreak = 5;
      MFI.Store.save();
      MFI.App.refreshHome();
      return true;
    })()`);
    await sleep(400);
    const before = await evalJs(cdp, `({
      coins: MFI.Store.get().coins, levels: Object.keys(MFI.Store.get().levels).length,
      badges: MFI.Store.badgeCount(), grade: MFI.Store.get().grade
    })`);
    ok('进度已写入', before.coins === 999 && before.levels === 2, JSON.stringify(before));

    console.log('\n[重置入口存在且需二次确认]');
    await evalJs(cdp, `MFI.App.openBadges(); true`);
    await sleep(500);
    ok('勋章页有重置按钮', await evalJs(cdp, `!!document.getElementById('btnReset')`));
    await clickSel(cdp, '#btnReset');
    await sleep(400);
    ok('弹出确认框', await evalJs(cdp, `!!document.getElementById('ovReset')`));
    await shot(cdp, 'reset-confirm');

    console.log('\n[取消不会清空]');
    await clickSel(cdp, '#resetNo');
    await sleep(300);
    ok('点「再想想」后进度还在', await evalJs(cdp, `MFI.Store.get().coins === 999`));

    console.log('\n[确认后清空]');
    await clickSel(cdp, '#btnReset');
    await sleep(300);
    await clickSel(cdp, '#resetYes');
    await sleep(600);
    const after = await evalJs(cdp, `({
      coins: MFI.Store.get().coins, levels: Object.keys(MFI.Store.get().levels).length,
      badges: MFI.Store.badgeCount(), grade: MFI.Store.get().grade, term: MFI.Store.get().term,
      streak: MFI.Store.get().streak, bestCombo: MFI.Store.get().bestCombo,
      home: !document.getElementById('scrHome').classList.contains('hidden'),
      overlayGone: !document.getElementById('ovReset')
    })`);
    ok('金币归零', after.coins === 0, String(after.coins));
    ok('关卡记录清空', after.levels === 0, String(after.levels));
    ok('勋章清空', after.badges === 0, String(after.badges));
    ok('回到一年级上册', after.grade === 'g1' && after.term === 'up', after.grade + '/' + after.term);
    ok('连续天数与连击清空', after.streak === 0 && after.bestCombo === 0);
    ok('自动回到主页', after.home);
    ok('确认框已移除', after.overlayGone);

    console.log('\n[刷新后仍是空]');
    await goto(cdp, URL);
    await sleep(600);
    const persisted = await evalJs(cdp, `({
      coins: MFI.Store.get().coins, levels: Object.keys(MFI.Store.get().levels).length,
      firstLevel: document.getElementById('btnContinue').dataset.level
    })`);
    ok('刷新后进度仍为空', persisted.coins === 0 && persisted.levels === 0, JSON.stringify(persisted));
    ok('从第 1 关重新开始', persisted.firstLevel === 'lv1', persisted.firstLevel);

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.slice(0,5).join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
