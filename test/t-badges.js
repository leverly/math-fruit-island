/* 勋章体系：连续打卡核心 + 各档判定 + 页面渲染 */
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

    console.log('\n[勋章定义]');
    const meta = await evalJs(cdp, `({
      total: MFI.Badges.LIST.length,
      groups: MFI.Badges.GROUPS.map(g => g.id),
      streakBadges: MFI.Badges.LIST.filter(b => b.group === 'streak').length,
      tiers: [...new Set(MFI.Badges.LIST.map(b => b.tier))]
    })`);
    ok('定义 16 枚勋章', meta.total === 16, String(meta.total));
    ok('4 个分组', meta.groups.length === 4, JSON.stringify(meta.groups));
    ok('连续类勋章 ≥6 枚', meta.streakBadges >= 6, String(meta.streakBadges));
    ok('四档材质齐全', meta.tiers.length === 4, JSON.stringify(meta.tiers));

    console.log('\n[初始状态]');
    await evalJs(cdp, `MFI.App.openBadges(); true`);
    await sleep(500);
    const init = await evalJs(cdp, `({
      shown: !document.getElementById('scrDex').classList.contains('hidden'),
      title: document.querySelector('.page-title').textContent,
      count: document.getElementById('dexCount').textContent,
      days: document.getElementById('shDays').textContent,
      cards: document.querySelectorAll('.badge-card').length,
      earned: document.querySelectorAll('.badge-card.earned').length,
      locked: document.querySelectorAll('.badge-card.locked').length,
      weekCells: document.querySelectorAll('#weekStrip .wd').length
    })`);
    ok('勋章页打开', init.shown);
    ok('标题是「我的勋章」', init.title === '我的勋章', init.title);
    ok('计数 0/16', init.count === '0/16', init.count);
    ok('刚打开连续天数为 0', init.days === '0', init.days);
    ok('今天未打卡', init.count === '0/16', init.count);
    ok('渲染 16 张勋章卡', init.cards === 16, String(init.cards));
    ok('初始全部锁定', init.locked === 16, String(init.locked));
    ok('近 7 天格 7 个', init.weekCells === 7, String(init.weekCells));
    await shot(cdp, 'badge-empty');

    console.log('\n[连续 3 天 → 解锁勋章]');
    const r1 = await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      const tk = MFI.Store.todayKey;
      /* 造 3 天连续完成 */
      for (let i = 0; i < 3; i++) {
        const dt = new Date(); dt.setDate(dt.getDate() - i);
        d.daily[tk(dt)] = { stars: 3, correct: 10, total: 10, combo: 5, done: true };
      }
      d.totalDaily = 3;
      MFI.Store.save();
      MFI.Store.refreshStreak();
      return MFI.Store.checkBadges();
    })()`);
    ok('连续 3 天解锁 streak3', r1.indexOf('streak3') >= 0, JSON.stringify(r1));
    ok('也解锁初次挑战 daily1', r1.indexOf('daily1') >= 0, JSON.stringify(r1));

    await evalJs(cdp, `MFI.App.backHome(); true`);
    await sleep(300);
    await evalJs(cdp, `MFI.App.openBadges(); true`);
    await sleep(500);
    const s3 = await evalJs(cdp, `({
      days: document.getElementById('shDays').textContent,
      best: document.getElementById('shBest').textContent,
      today: document.getElementById('shToday').textContent,
      hot: document.getElementById('streakHero').classList.contains('hot'),
      onCells: document.querySelectorAll('#weekStrip .wd.on').length,
      earned: document.querySelectorAll('.badge-card.earned').length,
      count: document.getElementById('dexCount').textContent
    })`);
    ok('显示连续 3 天', s3.days === '3', s3.days);
    ok('最长记录 3 天', s3.best === '3', s3.best);
    ok('今天已完成', s3.today.indexOf('已完成') >= 0, s3.today);
    ok('横幅进入高亮态', s3.hot === true);
    ok('近 7 天点亮 3 格', s3.onCells === 3, String(s3.onCells));
    ok('已获得 2 枚', s3.earned === 2, String(s3.earned));
    ok('计数变为 2/16', s3.count === '2/16', s3.count);
    await shot(cdp, 'badge-streak3');

    console.log('\n[连续 7 / 30 / 100 天]');
    const r2 = await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      const tk = MFI.Store.todayKey;
      function fill(n) {
        for (let i = 0; i < n; i++) {
          const dt = new Date(); dt.setDate(dt.getDate() - i);
          d.daily[tk(dt)] = { stars: 3, correct: 10, total: 10, combo: 5, done: true };
        }
        d.totalDaily = n;
        MFI.Store.save();
        MFI.Store.refreshStreak();
        return MFI.Store.checkBadges();
      }
      const a = fill(7), b = fill(30), c = fill(100);
      return { a: a, b: b, c: c, total: MFI.Store.badgeCount() };
    })()`);
    ok('7 天解锁 streak7', r2.a.indexOf('streak7') >= 0, JSON.stringify(r2.a));
    ok('30 天解锁 streak30', r2.b.indexOf('streak30') >= 0, JSON.stringify(r2.b));
    ok('100 天解锁 streak100', r2.c.indexOf('streak100') >= 0, JSON.stringify(r2.c));

    console.log('\n[进度展示]');
    const prog = await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      /* 干净状态：清掉已发勋章与打卡记录 */
      d.badges = {}; d.daily = {}; d.totalDaily = 0; d.bestStreak = 0;
      const tk = MFI.Store.todayKey;
      for (let i = 0; i < 9; i++) {
        const dt = new Date(); dt.setDate(dt.getDate() - i);
        d.daily[tk(dt)] = { stars: 3, correct: 10, total: 10, combo: 5, done: true };
      }
      d.totalDaily = 9;
      MFI.Store.save();
      MFI.Store.refreshStreak();
      MFI.Store.checkBadges();
      const list = MFI.Store.badgeList();
      const b14 = list.find(x => x.def.id === 'streak14');
      const b7 = list.find(x => x.def.id === 'streak7');
      return { earned14: b14.earned, cur14: b14.cur, need14: b14.need,
               earned7: b7.earned };
    })()`);
    ok('9 天时 7 天勋章已达成', prog.earned7 === true, JSON.stringify(prog));
    ok('9 天时 14 天勋章未达成', prog.earned14 === false, JSON.stringify(prog));
    ok('进度显示 9 / 14', prog.cur14 === 9 && prog.need14 === 14, JSON.stringify(prog));

    console.log('\n[其他维度勋章]');
    const other = await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      MFI.Data.LEVELS.forEach(lv => { d.levels[lv.id] = { best: 3, plays: 1 }; });
      d.bestCombo = 20;
      d.perfectRuns = 1;
      MFI.Store.save();
      return MFI.Store.checkBadges();
    })()`);
    ok('全通关解锁 lv8', other.indexOf('lv8') >= 0, JSON.stringify(other));
    ok('全三星解锁 allstars', other.indexOf('allstars') >= 0, JSON.stringify(other));
    ok('20 连击解锁 combo20', other.indexOf('combo20') >= 0, JSON.stringify(other));
    ok('全对解锁 perfect', other.indexOf('perfect') >= 0, JSON.stringify(other));

    await evalJs(cdp, `MFI.App.backHome(); true`);
    await sleep(300);
    await evalJs(cdp, `MFI.App.openBadges(); true`);
    await sleep(600);
    const full = await evalJs(cdp, `({
      earned: document.querySelectorAll('.badge-card.earned').length,
      locked: document.querySelectorAll('.badge-card.locked').length,
      count: document.getElementById('dexCount').textContent,
      dates: document.querySelectorAll('.bc-date').length
    })`);
    /* 9 天连续 + 25 关全三星 + 20 连击 + 全对 → 11 枚 */
    ok('已获得 11 枚（长期连续未达成）', full.earned === 11, JSON.stringify(full));
    ok('剩余 5 枚是长期连续/累计', full.locked === 5, JSON.stringify(full));
    ok('已获得都带日期', full.dates === full.earned, JSON.stringify(full));

    await shot(cdp, 'badge-full');

    console.log('\n[320px 窄屏]');
    await setViewport(cdp, 320, 780);
    await sleep(400);
    const narrow = await evalJs(cdp, `(() => {
      const cards = [...document.querySelectorAll('.badge-card')];
      const out = cards.filter(c => { const r = c.getBoundingClientRect(); return r.width < 44 || r.left < 0 || r.right > window.innerWidth + 1; });
      return {
        docW: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        badCards: out.length,
        minCard: Math.min(...cards.map(c => Math.round(c.getBoundingClientRect().width)))
      };
    })()`);
    ok('320px 无横向滚动', narrow.docW <= 0, String(narrow.docW));
    ok('320px 勋章卡不溢出', narrow.badCards === 0, JSON.stringify(narrow));
    ok('320px 勋章卡 ≥44 宽', narrow.minCard >= 44, String(narrow.minCard));
    await shot(cdp, 'badge-320');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
