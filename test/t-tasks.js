/* 主页单关展示：完成一关后自动换成下一关 */
const { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  const home = () => evalJs(cdp, `({
    cards: document.querySelectorAll('.continue-card').length,
    hasList: !!document.getElementById('taskList'),
    label: document.getElementById('contLabel').textContent,
    title: document.getElementById('contTitle').textContent,
    sub: document.getElementById('contSub').textContent,
    progress: document.getElementById('contProgress').textContent,
    fillW: document.getElementById('contFill').style.width,
    goText: document.getElementById('btnContinue').textContent,
    goLevel: document.getElementById('btnContinue').dataset.level,
    art: !!document.querySelector('#contArt svg')
  })`);

  const clearLevel = async () => {
    let guard = 0;
    /* 先确保在答题状态 */
    const tw = Date.now();
    while (Date.now() - tw < 3000) {
      const ph = await evalJs(cdp, `MFI.Game._state() ? MFI.Game._state().phase : 'none'`);
      if (ph === 'ask' || ph === 'boss' || ph === 'none') break;
      await sleep(150);
    }
    while (guard++ < 120) {
      const st = await evalJs(cdp, `(() => {
        const s = MFI.Game._state();
        return { result: !document.getElementById('scrResult').classList.contains('hidden'),
                 ev: !document.getElementById('ovEvent').classList.contains('hidden'),
                 bi: !document.getElementById('ovBoss').classList.contains('hidden'),
                 bb: !document.getElementById('bossBar').classList.contains('hidden'),
                 ph: s ? s.phase : 'none', idx: s ? s.index : -1 };
      })()`);
      if (st.result) return true;
      if (st.ev) { await clickSel(cdp, '#evOk'); await sleep(400); continue; }
      if (st.bi) { await clickSel(cdp, '#bossOk'); await sleep(350); continue; }
      if (st.ph === 'ask' || st.bb) {
        await evalJs(cdp, `(() => {
          const b=[...document.querySelectorAll('#board .candy-btn, #board .g-opt')];
          const c=MFI.Game._cur();
          const t=b.find(x=>String(x.dataset.val)===String(c.answer));
          if(t) t.click();
        })()`);
        /* 轮询等待回到可作答状态，避免固定 sleep 不够 */
        const t0 = Date.now();
        while (Date.now() - t0 < 3000) {
          const ph = await evalJs(cdp, `MFI.Game._state() ? MFI.Game._state().phase : 'none'`);
          if (ph === 'ask' || ph === 'boss' || ph === 'none') break;
          await sleep(120);
        }
      }
      await sleep(180);
    }
    return false;
  };

  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(500);

    console.log('\n[主页只展示下一关]');
    const h0 = await home();
    ok('只有 1 张关卡卡片', h0.cards === 1, JSON.stringify(h0));
    ok('不再有关卡列表', h0.hasList === false);
    ok('标签是「下一关」', h0.label === '下一关', h0.label);
    ok('显示第 1 关', h0.title.indexOf('1 ·') === 0, h0.title);
    ok('显示关卡归属与类型题数', /练习|挑战|情境/.test(h0.sub) && /\d+ 题/.test(h0.sub), h0.sub);
    ok('进度显示第 1 / 8 关', h0.progress === '第 1 / 8 关', h0.progress);
    ok('按钮指向 lv1', h0.goLevel === 'lv1', h0.goLevel);
    ok('有水果插画', h0.art);
    await shot(cdp, 'task-home-1');

    console.log('\n[点按钮直接开始第 1 关]');
    await evalJs(cdp, `document.getElementById('btnContinue').click(); true`);
    await sleep(900);
    ok('开局成功', await evalJs(cdp, `MFI.Game._state() && MFI.Game._state().phase === 'ask'`));
    ok('进入游戏', await evalJs(cdp, `!document.getElementById('scrGame').classList.contains('hidden')`));
    ok('打的是第 1 关', await evalJs(cdp, `MFI.Game._state().lv.id === 'lv1'`), await evalJs(cdp, `MFI.Game._state().lv.id`));

    console.log('\n[通关后自动换成第 2 关]');
    ok('第 1 关通关', await clearLevel());
    await clickSel(cdp, '#btnHome');
    await sleep(700);
    const h1 = await home();
    ok('仍然只有 1 张卡片', h1.cards === 1, JSON.stringify(h1));
    ok('标题换成第 2 关', h1.title.indexOf('2 ·') === 0, h1.title);
    ok('内容换成第 2 关的技能', h1.title !== h0.title, h0.title + ' → ' + h1.title);
    ok('岛屿名跟着变', h1.sub !== h0.sub, h0.sub + ' → ' + h1.sub);
    ok('进度变成第 2 / 8 关', h1.progress === '第 2 / 8 关', h1.progress);
    ok('按钮指向 lv2', h1.goLevel === 'lv2', h1.goLevel);
    ok('按钮文案是开始第 2 关', h1.goText === '开始第 2 关', h1.goText);
    ok('进度条前进', parseFloat(h1.fillW) > 0, h1.fillW);
    await shot(cdp, 'task-home-2');

    console.log('\n[刷新后仍停在下一关]');
    await goto(cdp, URL + '?r=' + Date.now());
    await sleep(700);
    const h2 = await home();
    ok('刷新后仍是第 2 关', h2.goLevel === 'lv2', h2.goLevel);
    ok('刷新后只有 1 张卡片', h2.cards === 1);

    console.log('\n[全部通关后的表现]');
    await evalJs(cdp, `(() => {
      const d = MFI.Store.get();
      /* 只把当前学期（一年级上册）全部标满 */
      MFI.Data.levelsOf(d.grade, d.term).forEach(lv => { d.levels[lv.id] = { best: 3, plays: 1 }; });
      MFI.Store.save();
      MFI.App.refreshHome();
      return true;
    })()`);
    await sleep(600);
    const h3 = await evalJs(cdp, `({
      label: document.getElementById('contLabel').textContent,
      goText: document.getElementById('btnContinue').textContent,
      progress: document.getElementById('contProgress').textContent,
      fillW: document.getElementById('contFill').style.width
    })`);
    ok('学期通关后标签变「本学期通关」', h3.label === '本学期通关', h3.label);
    ok('全通关后按钮变「重玩」', h3.goText.indexOf('重玩') >= 0, h3.goText);
    ok('进度条接近满格', parseFloat(h3.fillW) >= 80, h3.fillW);
    await shot(cdp, 'task-home-all');

    console.log('\n[320px 窄屏]');
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL + '?r=' + Date.now());
    await sleep(600);
    await setViewport(cdp, 320, 780);
    await sleep(400);
    const narrow = await evalJs(cdp, `(() => {
      const card = document.querySelector('.continue-card').getBoundingClientRect();
      const go = document.getElementById('btnContinue').getBoundingClientRect();
      return {
        docW: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        cardInView: card.bottom <= window.innerHeight + 1,
        goVisible: go.bottom <= window.innerHeight + 1 && go.top >= 0,
        vh: window.innerHeight,
        minHit: Math.min(go.width, go.height)
      };
    })()`);
    ok('320px 无横向滚动', narrow.docW <= 0, String(narrow.docW));
    ok('320px 卡片在屏内', narrow.cardInView, JSON.stringify(narrow));
    ok('320px 开始按钮可见', narrow.goVisible, JSON.stringify(narrow));
    ok('320px 按钮 ≥44px', narrow.minHit >= 44, String(narrow.minHit));
    await shot(cdp, 'task-home-320');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
