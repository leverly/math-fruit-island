/* 难度体系：档位梯度、局内自适应、各关难度分布 */
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

    console.log('\n[档位体系]');
    const tier = await evalJs(cdp, `[0,1,2,3].map(d => MFI.Diff.tier(d))`);
    ok('0..3 映射到 1..4 档', JSON.stringify(tier) === '[1,2,3,4]', JSON.stringify(tier));
    ok('四档都有名称', await evalJs(cdp, `MFI.Diff.TIERS.length === 4 && MFI.Diff.TIERS.every(t => t.name)`));

    console.log('\n[一局内难度梯度]');
    const plans = await evalJs(cdp, `({
      t1: MFI.Data.planTiers(10, 1),
      t2: MFI.Data.planTiers(10, 2),
      t3: MFI.Data.planTiers(10, 3)
    })`);
    ok('T1 局：以最易为主', plans.t1.filter(x=>x===1).length >= 6, JSON.stringify(plans.t1));
    ok('T2 局：含 1/2/3 三档', [1,2,3].every(x => plans.t2.includes(x)), JSON.stringify(plans.t2));
    ok('T3 局：能到第 4 档', plans.t3.includes(4), JSON.stringify(plans.t3));
    ok('梯度单调不降（前易后难）', plans.t2.every((v,i,a) => i===0 || a[i-1] <= v), JSON.stringify(plans.t2));

    console.log('\n[题目真的带档位]');
    const rounds = await evalJs(cdp, `(() => {
      const out = {};
      [0,2].forEach(d => {
        const r = MFI.Data.makeRound('g2', 10, d);
        out['d'+d] = { tiers: r.map(q => q.tier), n: r.length };
      });
      return out;
    })()`);
    ok('d=0 一局 10 题且都标了档位', rounds.d0.n === 10 && rounds.d0.tiers.every(t => t >= 1), JSON.stringify(rounds.d0));
    ok('d=2 一局难度更高', Math.max(...rounds.d2.tiers) > Math.max(...rounds.d0.tiers),
       rounds.d0.tiers.join(',') + ' vs ' + rounds.d2.tiers.join(','));

    console.log('\n[同一档位内数值范围确实不同]');
    const spread = await evalJs(cdp, `(() => {
      const pickMax = (id, d) => {
        let m = 0;
        for (let i = 0; i < 30; i++) {
          const q = MFI.Data.makeQuestion(id, d);
          if (typeof q.answer === 'number') m = Math.max(m, q.answer);
        }
        return m;
      };
      return {
        mul1: [pickMax('g6',0), pickMax('g6',3)],
        addbig: [pickMax('g2',0), pickMax('g2',3)],
        carry: [pickMax('lv8',0), pickMax('lv8',3)]
      };
    })()`);
    Object.keys(spread).forEach(k => {
      const [lo, hi] = spread[k];
      /* carry10 上限固定 18（20 以内），用「高档更接近上限」判断 */
      const good = k === 'carry' ? (hi >= 17 && lo <= 15) : hi > lo * 1.4;
      ok(k + ' 高档难度确实更高', good, 'T1 最大 ' + lo + ' → T4 最大 ' + hi);
    });

    console.log('\n[局内自适应]');
    await evalJs(cdp, `document.getElementById('btnContinue').click(); true`);
    await sleep(900);
    const before = await evalJs(cdp, `MFI.Game._state().liveDiff`);
    /* 连答 4 题对 */
    for (let i = 0; i < 4; i++) {
      const st = await evalJs(cdp, `(() => {
        const s = MFI.Game._state();
        return { ph: s ? s.phase : 'none', ev: !document.getElementById('ovEvent').classList.contains('hidden') };
      })()`);
      if (st.ev) { await evalJs(cdp, `document.getElementById('evOk').click(); true`); await sleep(400); continue; }
      if (st.ph !== 'ask') { await sleep(500); continue; }
      await evalJs(cdp, `(() => {
        const b=[...document.querySelectorAll('#board .candy-btn, #board .g-opt')];
        const c=MFI.Game._cur();
        const t=b.find(x=>String(x.dataset.val)===String(c.answer));
        if(t) t.click();
      })()`);
      await sleep(1500);
    }
    const after = await evalJs(cdp, `MFI.Game._state() ? MFI.Game._state().liveDiff : -1`);
    ok('连对后局内难度提升', after > before, 'liveDiff ' + before + ' → ' + after);

    console.log('\n[全 92 关难度可用]');
    const all = await evalJs(cdp, `(() => {
      const bad = [];
      MFI.Data.LEVELS.forEach(lv => {
        for (let d = 0; d <= 3; d++) {
          for (let i = 0; i < 6; i++) {
            let q;
            try { q = MFI.Data.makeQuestion(lv.id, d); } catch (e) { bad.push(lv.id + ':throw'); continue; }
            const vals = q.options.map(o => String(o.v != null ? o.v : o));
            if (vals.indexOf(String(q.answer)) < 0 || new Set(vals).size !== vals.length) bad.push(lv.id + ':opt');
          }
        }
      });
      return [...new Set(bad)].slice(0, 6);
    })()`);
    ok('全部关卡 × 四档出题正常', all.length === 0, all.join(' | '));

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.slice(0,6).join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
