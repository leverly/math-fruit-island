/* 一年级内容审查：对齐人教版 8+8 单元 */
const { launch, setViewport, goto, evalJs, shot, sleep, close } = require('./cdp');
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

    /* 现在每个教材单元按课时拆成多关，所以按「单元」聚合校验，
       而不是假设「1 单元 = 1 关」。 */
    console.log('\n[一年级上册 = 教材 8 个单元]');
    const upUnits = await evalJs(cdp, `(() => {
      const m = {};
      MFI.Data.levelsOf('g1','up').forEach(l => {
        const k = l.unit;
        (m[k] = m[k] || []).push(l.skill);
      });
      return Object.keys(m).sort((a,b) => parseInt(a.replace(/\\D/g,'')) - parseInt(b.replace(/\\D/g,''))).map(k => ({ unit: k, skills: m[k] }));
    })()`);
    /* 关键字按实际教材课时命名对齐（位置单元拆成上下左右/前后；6~10 单元拆成 6、7 / 8、9 / 连加连减） */
    const expectUp = ['数一数','左、右','1~5','认识图形（一）','6、7','11~20','认识钟表','加几'];
    ok('上册 8 个单元', upUnits.length === 8, String(upUnits.length));
    expectUp.forEach((k, i) => {
      const u = upUnits[i];
      const joined = u ? u.skills.join('/') : '';
      ok('上册第 ' + (i+1) + ' 单元含「' + k + '」', joined.indexOf(k) >= 0, u ? (u.unit + ' ' + joined) : '');
    });
    const upTotal = upUnits.reduce((a,u)=>a+u.skills.length,0);
    ok('上册按课时拆成多关（≥12）', upTotal >= 12, String(upTotal) + ' 关');

    console.log('\n[一年级下册 = 教材 7 个单元（总复习已移除）]');
    const downUnits = await evalJs(cdp, `(() => {
      const m = {};
      MFI.Data.levelsOf('g1','down').forEach(l => {
        const k = l.unit;
        (m[k] = m[k] || []).push(l.skill);
      });
      return Object.keys(m).sort((a,b) => parseInt(a.replace(/\\D/g,'')) - parseInt(b.replace(/\\D/g,''))).map(k => ({ unit: k, skills: m[k] }));
    })()`);
    const expectDown = ['认识图形（二）','退位减法','分类与整理','100 以内数的认识','人民币','100 以内加减','找规律'];
    ok('下册 7 个单元', downUnits.length === 7, String(downUnits.length));
    expectDown.forEach((k, i) => {
      const u = downUnits[i];
      const joined = u ? u.skills.join('/') : '';
      ok('下册第 ' + (i+1) + ' 单元含「' + k + '」', joined.indexOf(k) >= 0, u ? (u.unit + ' ' + joined) : '');
    });
    const downTotal = downUnits.reduce((a,u)=>a+u.skills.length,0);
    ok('下册按课时拆成多关（≥10）', downTotal >= 10, String(downTotal) + ' 关');

    console.log('\n[一年级全关出题正确性]');
    const gen = await evalJs(cdp, `(() => {
      const bad = [];
      ['up','down'].forEach(t => {
        MFI.Data.levelsOf('g1', t).forEach(lv => {
          for (let i = 0; i < 40; i++) {
            let q;
            try { q = MFI.Data.makeQuestion(lv.id, i % 4); }
            catch (e) { bad.push(lv.id + ':throw'); continue; }
            if (!q) { bad.push(lv.id + ':null'); continue; }
            const vals = q.options.map(o => String(o.v != null ? o.v : o));
            if (new Set(vals).size !== vals.length) bad.push(lv.id + ':dup');
            if (vals.indexOf(String(q.answer)) < 0) bad.push(lv.id + ':ans');
            if (q.answer == null || q.answer === '') bad.push(lv.id + ':empty');
            /* 一年级不应出现负数结果 */
            if (typeof q.answer === 'number' && q.answer < 0) bad.push(lv.id + ':negative' + q.answer);
          }
        });
      });
      return [...new Set(bad)].slice(0, 8);
    })()`);
    ok('一年级全关出题无错、无负数', gen.length === 0, gen.join(' | '));

    console.log('\n[一年级内容范围检查]');
    const range = await evalJs(cdp, `(() => {
      const out = { maxAnswer: 0, kinds: new Set() };
      ['up','down'].forEach(t => {
        MFI.Data.levelsOf('g1', t).forEach(lv => {
          for (let i = 0; i < 30; i++) {
            const q = MFI.Data.makeQuestion(lv.id, i % 4);
            out.kinds.add(q.kind);
            if (typeof q.answer === 'number') out.maxAnswer = Math.max(out.maxAnswer, q.answer);
          }
        });
      });
      return { maxAnswer: out.maxAnswer, kinds: [...out.kinds] };
    })()`);
    ok('一年级答案不超过 100', range.maxAnswer <= 100, String(range.maxAnswer));
    ok('题型只属于一年级范围', range.kinds.every(k => !['fracdiv','decmul','ratio','circle','cylinder'].includes(k)), range.kinds.join(','));

    console.log('\n[渲染检查]');
    await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'lv1', count:10, onFinish:function(){}}); true`);
    await sleep(700);
    const rend = await evalJs(cdp, `(() => {
      const bad = [];
      ['up','down'].forEach(t => {
        MFI.Data.levelsOf('g1', t).forEach(lv => {
          const q = MFI.Data.makeQuestion(lv.id, 2);
          const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
          try { s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}}); }
          catch (e) { bad.push(lv.id + ':throw'); return; }
          const btns = document.querySelectorAll('#board .g-opt, #board .candy-btn');
          if (btns.length < 2) bad.push(lv.id + ':btns');
          btns.forEach(b => { const r = b.getBoundingClientRect();
            if (r.right > window.innerWidth + 1 || r.bottom > window.innerHeight + 2) bad.push(lv.id + ':out'); });
        });
      });
      return [...new Set(bad)].slice(0, 8);
    })()`);
    ok('一年级全关渲染正常无溢出', rend.length === 0, rend.join(' | '));

    console.log('\n[截图]');
    for (const id of ['lv2','lv4','lv6','lv7','lv8']) {
      await evalJs(cdp, `(() => {
        const q = MFI.Data.makeQuestion('${id}', 2);
        const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
        document.querySelectorAll('#board .g-opt, #board .candy-btn').forEach(b=>s.buttons.push(b));
      })()`);
      await sleep(420);
      await shot(cdp, 'g1-' + id);
    }

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.slice(0,6).join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
