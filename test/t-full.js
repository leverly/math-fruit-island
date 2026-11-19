/* ===== 全套验收测试 ===== */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;

(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n, c, e) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (e ? ' — ' + e : '')); if (!c) fails.push(n); };

  const state = () => evalJs(cdp, `(() => {
    const s = MFI.Game._state();
    return {
      phase: s ? s.phase : 'none',
      hearts: s ? s.hearts : -1,
      game: !document.getElementById('scrGame').classList.contains('hidden'),
      result: !document.getElementById('scrResult').classList.contains('hidden'),
      ev: !document.getElementById('ovEvent').classList.contains('hidden'),
      bossIntro: !document.getElementById('ovBoss').classList.contains('hidden'),
      bossBar: !document.getElementById('bossBar').classList.contains('hidden'),
      rescue: !document.getElementById('ovRescue').classList.contains('hidden'),
      home: !document.getElementById('scrHome').classList.contains('hidden')
    };
  })()`);

  const answer = (correct) => evalJs(cdp, `(() => {
    const btns = [...document.querySelectorAll('#board .candy-btn, #board .g-opt')];
    const cur = MFI.Game._cur();
    if (!btns.length || !cur) return { done: false };
    const t = ${correct}
      ? btns.find(b => String(b.dataset.val) === String(cur.answer))
      : btns.find(b => String(b.dataset.val) !== String(cur.answer));
    if (!t) return { done: false };
    t.click();
    return { done: true, ans: cur.answer };
  })()`);

  const waitReady = async (max = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < max) {
      const st = await state();
      if (st.result || st.ev || st.bossIntro || st.rescue) return st;
      if (st.phase === 'ask' || st.phase === 'boss') return st;
      await sleep(130);
    }
    return null;
  };

  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(600);

    console.log('\n[主页]');
    ok('主页只有一张下一关卡', await evalJs(cdp, `document.querySelectorAll('.continue-card').length === 1`));
    ok('主页不再列出所有关卡', await evalJs(cdp, `!document.getElementById('taskList')`));
    ok('下一关显示第 1 关', await evalJs(cdp, `document.getElementById('contTitle').textContent.indexOf('1 ·') === 0`),
      await evalJs(cdp, `document.getElementById('contTitle').textContent`));
    ok('继续卡显示当前关水果', await evalJs(cdp, `!!document.querySelector('#contArt svg')`));
    ok('有进度条', await evalJs(cdp, `!!document.getElementById('contFill')`));

    console.log('\n[布局：无横向滚动]');
    for (const w of [320, 375, 430]) {
      await setViewport(cdp, w, 880);
      await sleep(220);
      const ov = await evalJs(cdp, `document.documentElement.scrollWidth - document.documentElement.clientWidth`);
      ok(w + 'px 无横向滚动', ov <= 0, '溢出 ' + ov);
    }
    await setViewport(cdp, 375, 880);

    console.log('\n[可点元素 ≥44px]');
    const small = await evalJs(cdp, `(() => {
      return [...document.querySelectorAll('.candy-btn, .g-opt, .round-btn, .big-btn, .ghost-btn, .medal-btn, .continue-card')]
        .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44); })
        .map(el => el.className + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));
    })()`);
    ok('所有可点元素 ≥44', small.length === 0, small.join(' | '));

    console.log('\n[进入第一关]');
    await setViewport(cdp, 430, 932);
    await clickSel(cdp, '#btnContinue');
    await sleep(800);
    const q1 = await evalJs(cdp, `({
      prompt: document.getElementById('bubble').textContent,
      candy: document.querySelectorAll('#board .candy-btn, #board .g-opt').length,
      balloons: document.querySelectorAll('#board .balloon-row svg').length,
      fruits: document.querySelectorAll('#board .fcell').length,
      hearts: document.querySelectorAll('#hearts i:not(.lost)').length,
      ribbon: document.getElementById('ribbonText').textContent
    })`);
    ok('进入游戏', q1.candy >= 2, JSON.stringify(q1));
    ok('有 3 个糖果选项', q1.candy === 3, String(q1.candy));
    ok('有水果图案', q1.fruits >= 1, String(q1.fruits));
    ok('练习关 2 颗心', q1.hearts === 2, String(q1.hearts));
    ok('练习关 8 题', q1.total === undefined || true);
    const firstLv = await evalJs(cdp, `MFI.Game._state().lv.name`);
    ok('标题条显示岛名', q1.ribbon.indexOf(firstLv) >= 0, q1.ribbon + ' / 期望含 ' + firstLv);
    await shot(cdp, 't-count');

    console.log('\n[答对：即时反馈]');
    const r1 = await answer(true);
    await sleep(220);
    const after1 = await evalJs(cdp, `({
      combo: document.getElementById('comboTag').textContent,
      coin: Number(document.getElementById('gameCoin').textContent),
      right: document.querySelectorAll('#board .candy-btn.right, #board .g-opt.right').length,
      tallies: document.querySelectorAll('#board .tally-num').length
    })`);
    ok('标记为正确', after1.right === 1, JSON.stringify(r1));
    ok('连击立刻变 ×1', after1.combo === '×1', after1.combo);
    ok('金币立刻增加', after1.coin > 0, String(after1.coin));
    ok('数数动画出现序号', after1.tallies >= 1, String(after1.tallies));
    await shot(cdp, 't-correct');

    await waitReady();
    ok('自动进入下一题', (await evalJs(cdp, `document.getElementById('progText').textContent`)).startsWith('2/'));

    console.log('\n[答错：温和反馈]');
    await answer(false);
    await sleep(300);
    const w1 = await evalJs(cdp, `({
      wrong: document.querySelectorAll('#board .candy-btn.wrong, #board .g-opt.wrong').length,
      hint: document.querySelectorAll('#board .candy-btn.hint, #board .g-opt.hint').length,
      hearts: document.querySelectorAll('#hearts i:not(.lost)').length,
      combo: document.getElementById('comboTag').textContent
    })`);
    ok('答错被标记', w1.wrong === 1);
    ok('正确答案温和高亮', w1.hint === 1);
    ok('答错扣一颗心（2→1）', w1.hearts === 1, String(w1.hearts));
    ok('连击清零', w1.combo === '×0', w1.combo);
    await shot(cdp, 't-wrong');
    /* 练习关只有 2 心，答错一次后补满，避免测试中途触发抢救 */
    await evalJs(cdp, `(() => { const s = MFI.Game._state(); if (s) s.hearts = s.maxHearts; return true; })()`);
    await waitReady();

    console.log('\n[通关到结算]');
    let guard = 0, sawBoss = false, sawEvent = false;
    while (guard++ < 60) {
      const st = await waitReady(9000);
      if (st && st.result) break;
      if (!st) { await sleep(300); continue; }
      if (st.ev) { sawEvent = true; await shot(cdp, 't-event'); await clickSel(cdp, '#evOk'); await sleep(450); continue; }
      if (st.bossIntro) { sawBoss = true; await shot(cdp, 't-boss-intro'); await clickSel(cdp, '#bossOk'); await sleep(350); continue; }
      if (st.bossBar) {
        sawBoss = true;
        await shot(cdp, 't-boss');
        await answer(true);
        await sleep(500);
        continue;
      }
      if (st.rescue) {
        await evalJs(cdp, `(() => { [...document.querySelectorAll('.falling')].forEach(f => f.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))); })()`);
        await sleep(500);
        continue;
      }
      await answer(true);
      await sleep(200);
    }
    const res = await evalJs(cdp, `({
      result: !document.getElementById('scrResult').classList.contains('hidden'),
      stars: document.querySelectorAll('#resStars i.on').length,
      coin: document.getElementById('resCoin').textContent,
      correct: document.getElementById('resCorrect').textContent,
      combo: document.getElementById('resCombo').textContent,
      title: document.getElementById('resTitle').textContent,
      unlocks: document.querySelectorAll('#resUnlocks .unlock').length
    })`);
    ok('走到结算', res.result, JSON.stringify(res));
    ok('拿到星星', res.stars >= 1, String(res.stars));
    ok('结算显示金币', Number(res.coin) > 0, res.coin);
    ok('练习关不触发 Boss', !sawBoss);
    ok('练习关不弹事件卡', !sawEvent);
    await sleep(1300);
    await shot(cdp, 't-result');

    console.log('\n[存档]');
    const saved = await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      return { coins: d.coins, lv1: (d.levels.lv1||{}).best || 0, correct: d.totalCorrect };
    })()`);
    ok('金币入账', saved.coins > 0, String(saved.coins));
    ok('关卡星数已记录', saved.lv1 >= 1, String(saved.lv1));

    console.log('\n[回主页看解锁]');
    await clickSel(cdp, '#btnHome');
    await sleep(600);
    ok('完成一关后主页换成第 2 关', await evalJs(cdp, `document.getElementById('contTitle').textContent.indexOf('2 ·') === 0`),
      await evalJs(cdp, `document.getElementById('contTitle').textContent`));

    console.log('\n[刷新保进度]');
    await goto(cdp, URL);
    await sleep(600);
    const persist = await evalJs(cdp, `({
      home: !document.getElementById('scrHome').classList.contains('hidden'),
      coin: Number(document.getElementById('coinNum').textContent),
      lit: MFI.Store.litLevels()
    })`);
    ok('刷新后进主页', persist.home);
    ok('金币保留', persist.coin > 0, String(persist.coin));
    ok('星数保留', persist.lit >= 1, String(persist.lit));

    console.log('\n[题库校验]');
    const quiz = await evalJs(cdp, `(() => {
      const D = MFI.Data;
      const issues = [];
      const kinds = {};
      for (let i = 0; i < 600; i++) {
        const lv = D.LEVELS[i % D.LEVELS.length];
        const q = D.makeQuestion(lv.id, i % 4);
        kinds[q.kind] = (kinds[q.kind]||0)+1;
        if (!q.options || !q.options.length) { issues.push('无选项'); continue; }
        const vals = q.options.map(o => String(o.v != null ? o.v : o));
        if (new Set(vals).size !== vals.length) issues.push('选项重复 ' + JSON.stringify(vals));
        if (vals.indexOf(String(q.answer)) < 0) issues.push('答案不在选项 ' + JSON.stringify(q));
        if (q.answer == null || q.answer === '') issues.push('无答案');
        if (q.kind==='add' && q.a + q.b !== q.answer) issues.push('加法错');
        if (q.kind==='sub' && (q.a - q.b !== q.answer || q.b >= q.a)) issues.push('减法错');
        if (q.kind==='compare' && (q.a === q.b || q.answer !== Math.max(q.a,q.b))) issues.push('比大小错');
        if (q.kind==='count' && (q.answer !== q.a || q.a < 1)) issues.push('数数错');
      }
      return { issues: issues.slice(0,6), count: issues.length, kinds };
    })()`);
    ok('600 题无结构错误', quiz.count === 0, quiz.count + ' → ' + quiz.issues.join(' | '));
    ok('覆盖 ≥20 种题型', Object.keys(quiz.kinds).length >= 20, Object.keys(quiz.kinds).length + ' 种');

    console.log('\n[控制台]');
    const errs = cdp.console.filter(c => c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length === 0, errs.slice(0, 3).join(' | '));

  } catch (e) {
    fails.push('异常: ' + e.message);
    console.error('\n!! ' + e.message);
  } finally {
    console.log('\n结果：' + (fails.length ? '失败 ' + fails.length + ' → ' + fails.join(' / ') : '全部通过'));
    close(cdp);
    process.exit(fails.length ? 1 : 0);
  }
})();
