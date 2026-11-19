/* 年级/学期选择 + 93 关全量出题 */
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

    console.log('\n[结构]');
    const meta = await evalJs(cdp, `({
      grades: MFI.Data.GRADES.length,
      terms: MFI.Data.TERMS.length,
      levels: MFI.Data.LEVELS.length,
      empty: MFI.Data.GRADES.filter(g =>
        MFI.Data.countOf(g.id,'up') === 0 || MFI.Data.countOf(g.id,'down') === 0).map(g => g.name)
    })`);
    ok('6 个年级', meta.grades === 6, String(meta.grades));
    ok('2 个学期', meta.terms === 2);
    ok('92 个关卡', meta.levels === 92, String(meta.levels));
    ok('每个学期都有内容', meta.empty.length === 0, meta.empty.join(','));

    console.log('\n[首页只显示当前年级学期]');
    const homeBadge = await evalJs(cdp, `({
      badge: document.getElementById('stageGrade').textContent + ' ' + document.getElementById('stageTerm').textContent,
      pickerOnHome: !!document.querySelector('#scrHome .grade-picker'),
      gear: !!document.getElementById('btnSettings')
    })`);
    ok('首页显示当前年级学期', homeBadge.badge === '1年级 上册', homeBadge.badge);
    ok('首页不再有年级切换器', homeBadge.pickerOnHome === false);
    ok('首页有设置入口', homeBadge.gear === true);

    console.log('\n[设置页选择器]');
    await clickSel(cdp, '#btnSettings');
    await sleep(400);
    const ui = await evalJs(cdp, `({
      gradeBtns: document.querySelectorAll('#gradePicker .grade-btn').length,
      termBtns: document.querySelectorAll('#termPicker .term-btn').length,
      activeGrade: document.querySelector('#gradePicker .grade-btn.on').textContent,
      activeTerm: document.querySelector('#termPicker .term-btn.on').textContent,
      firstLevel: document.getElementById('btnContinue').dataset.level,
      title: document.getElementById('contTitle').textContent
    })`);
    ok('6 个年级按钮', ui.gradeBtns === 6, String(ui.gradeBtns));
    ok('2 个学期按钮', ui.termBtns === 2, String(ui.termBtns));
    ok('默认一年级上册', ui.activeGrade === '1年级' && ui.activeTerm.indexOf('上册') >= 0, JSON.stringify(ui));
    ok('第一关是一年级上册首关', ui.firstLevel === 'lv1', ui.firstLevel);
    await shot(cdp, 't-settings');

    console.log('\n[切换年级]');
    await clickSel(cdp, '#gradePicker .grade-btn:nth-child(6)');
    await sleep(500);
    /* 切换后仍在设置页，回首页看结果 */
    await clickSel(cdp, '#btnSettingsBack');
    await sleep(500);
    const g6 = await evalJs(cdp, `({
      grade: MFI.Store.get().grade,
      title: document.getElementById('contTitle').textContent,
      sub: document.getElementById('contSub').textContent,
      level: document.getElementById('btnContinue').dataset.level
    })`);
    ok('切到六年级', g6.grade === 'g6', JSON.stringify(g6));
    ok('显示六年级首关', g6.level === 'g6_1', g6.level);
    await shot(cdp, 't-home-g6up');

    console.log('\n[切换学期]');
    await clickSel(cdp, '#stageBadge');
    await sleep(400);
    await clickSel(cdp, '#termPicker .term-btn:nth-child(2)');
    await sleep(400);
    await clickSel(cdp, '#btnSettingsBack');
    await sleep(500);
    const g6d = await evalJs(cdp, `({
      term: MFI.Store.get().term,
      level: document.getElementById('btnContinue').dataset.level,
      title: document.getElementById('contTitle').textContent
    })`);
    ok('切到六年级下册', g6d.term === 'down', JSON.stringify(g6d));
    ok('显示下册首关', g6d.level === 'h6_1', g6d.level);

    console.log('\n[93 关全量出题]');
    const gen = await evalJs(cdp, `(() => {
      const bad = [];
      const kinds = {};
      MFI.Data.LEVELS.forEach(lv => {
        for (let i = 0; i < 12; i++) {
          let q;
          try { q = MFI.Data.makeQuestion(lv.id, i % 4); }
          catch (e) { bad.push(lv.id + ':throw:' + e.message.slice(0,30)); continue; }
          if (!q) { bad.push(lv.id + ':null'); continue; }
          kinds[q.kind] = 1;
          if (!q.options || q.options.length < 2) { bad.push(lv.id + ':opts'); continue; }
          const vals = q.options.map(o => String(o.v != null ? o.v : o));
          if (new Set(vals).size !== vals.length) bad.push(lv.id + ':dup');
          if (vals.indexOf(String(q.answer)) < 0) bad.push(lv.id + ':ans');
          if (q.answer == null || q.answer === '') bad.push(lv.id + ':empty');
          if (!q.prompt) bad.push(lv.id + ':prompt');
        }
      });
      return { bad: [...new Set(bad)].slice(0, 12), total: new Set(bad).size, kindN: Object.keys(kinds).length };
    })()`);
    ok('92 关出题无错', gen.total === 0, gen.bad.join(' | '));
    ok('题型 ≥60 种', gen.kindN >= 60, String(gen.kindN));

    console.log('\n[93 关全量渲染]');
    const rend = await evalJs(cdp, `(() => {
      MFI.App.show('game');
      MFI.Game.start({mode:'level', level:'lv1', count:10, onFinish:function(){}});
      return true;
    })()`);
    await sleep(700);
    const bad = await evalJs(cdp, `(() => {
      const bad = [];
      MFI.Data.LEVELS.forEach(lv => {
        const q = MFI.Data.makeQuestion(lv.id, 2);
        const s = MFI.Game._state();
        if (!s) return;
        s.cur = q; s.phase = 'ask'; s.buttons = [];
        try {
          s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
        } catch (e) { bad.push(lv.id + ':throw'); return; }
        const btns = document.querySelectorAll('#board .g-opt, #board .candy-btn');
        if (btns.length < 2) bad.push(lv.id + ':btns' + btns.length);
        const card = document.querySelector('#board .g-card');
        if (card) {
          const r = card.getBoundingClientRect();
          if (r.right > window.innerWidth + 1 || r.left < -1) bad.push(lv.id + ':overflow');
        }
        btns.forEach(b => { const br = b.getBoundingClientRect();
          if (br.right > window.innerWidth + 1 || br.bottom > window.innerHeight + 2) bad.push(lv.id + ':btnOut'); });
        if (document.documentElement.scrollWidth - document.documentElement.clientWidth > 0)
          bad.push(lv.id + ':hscroll');
      });
      return [...new Set(bad)].slice(0, 12);
    })()`);
    ok('92 关渲染无错、无溢出', bad.length === 0, bad.join(' | '));

    console.log('\n[通关后学期内推进]');
    await evalJs(cdp, `(() => {
      MFI.Game.stop();
      const d = MFI.Store.get();
      d.grade = 'g1'; d.term = 'up'; d.levels = {}; MFI.Store.save();
      MFI.App.refreshHome();
      MFI.App.show('home');
      return true;
    })()`);
    await sleep(600);
    const before = await evalJs(cdp, `document.getElementById('btnContinue').dataset.level`);
    await evalJs(cdp, `document.getElementById('btnContinue').click(); true`);
    await sleep(900);
    const started = await evalJs(cdp, `MFI.Game._state() ? MFI.Game._state().lv.id : 'none'`);
    console.log('    开局关卡:', started);
    /* 快速通关 */
    let guard = 0;
    while (guard++ < 120) {
      const st = await evalJs(cdp, `(() => {
        const s = MFI.Game._state();
        return { result: !document.getElementById('scrResult').classList.contains('hidden'),
                 ev: !document.getElementById('ovEvent').classList.contains('hidden'),
                 bi: !document.getElementById('ovBoss').classList.contains('hidden'),
                 bb: !document.getElementById('bossBar').classList.contains('hidden'),
                 ph: s ? s.phase : 'none' };
      })()`);
      if (st.result) break;
      if (st.ev) { await evalJs(cdp, `document.getElementById('evOk').click(); true`); await sleep(400); continue; }
      if (st.bi) { await evalJs(cdp, `document.getElementById('bossOk').click(); true`); await sleep(340); continue; }
      if (st.ph === 'ask' || st.bb) {
        await evalJs(cdp, `(() => {
          const b=[...document.querySelectorAll('#board .candy-btn, #board .g-opt')];
          const c=MFI.Game._cur();
          const t=b.find(x=>String(x.dataset.val)===String(c.answer));
          if(t) t.click();
        })()`);
      }
      await sleep(480);
    }
    const resState = await evalJs(cdp, `({
      resultShown: !document.getElementById('scrResult').classList.contains('hidden'),
      stars: MFI.Store.levelStars('lv1'),
      phase: MFI.Game._state() ? MFI.Game._state().phase : 'none'
    })`);
    console.log('    通关后状态:', JSON.stringify(resState));
    await evalJs(cdp, `document.getElementById('btnHome').click(); true`);
    await sleep(700);
    const after = await evalJs(cdp, `({
      level: document.getElementById('btnContinue').dataset.level,
      grade: MFI.Store.get().grade,
      term: MFI.Store.get().term
    })`);
    ok('通关后推进到第 2 关', after.level === 'lv2', before + ' → ' + JSON.stringify(after));

    console.log('\n[学期切换按钮显示进度]');
    await clickSel(cdp, '#stageBadge');
    await sleep(400);
    const terms = await evalJs(cdp, `[...document.querySelectorAll('#termPicker .term-btn')].map(b => b.textContent)`);
    ok('学期按钮带完成进度', terms[0].indexOf('/') > 0, JSON.stringify(terms));

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.slice(0,8).join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
