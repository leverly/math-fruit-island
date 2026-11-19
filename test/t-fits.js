/* 检查各种数量下：水果/礼物/糖果是否都完整可见、不溢出 */
const { launch, setViewport, goto, evalJs, shot, sleep, close } = require('./cdp');
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
    await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level', level:'lv7', count:10, onFinish:function(){}}); true`);
    await sleep(600);

    for (const n of [1,2,3,4,6,9,12]) {
      const info = await evalJs(cdp, `(() => {
        const q = { kind:'count', level:'lv7', fruit:'berry', a:${n}, answer:${n},
                    options:[${n}, ${n}+1, ${n}+2], prompt:'数一数', layout:'count' };
        const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
        document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
        return true;
      })()`);
      await sleep(500);
      const g = await evalJs(cdp, `(() => {
        const card = document.querySelector('#board .fcard');
        const cells = [...document.querySelectorAll('#board .fcell')];
        const cr = card.getBoundingClientRect();
        const out = cells.filter(c => {
          const r = c.getBoundingClientRect();
          return r.left < cr.left - 1 || r.right > cr.right + 1 || r.top < cr.top - 1 || r.bottom > cr.bottom + 1;
        });
        const candies = [...document.querySelectorAll('#board .candy-btn')];
        const cout = candies.filter(c => {
          const r = c.getBoundingClientRect();
          return r.bottom > window.innerHeight + 2 || r.top < 0 || r.width < 44 || r.height < 44;
        });
        return { cells: cells.length, overflow: out.length, candyOut: cout.length,
                 docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      })()`);
      ok(n + ' 个水果全部在卡内', g.cells === n && g.overflow === 0, JSON.stringify(g));
      ok(n + ' 个水果时选项可见且≥44', g.candyOut === 0, JSON.stringify(g));
      ok(n + ' 个水果时无横向滚动', g.docW <= 0, String(g.docW));
      if (n === 12) await shot(cdp, 't-fit-12');
      if (n === 9) await shot(cdp, 't-fit-9');
    }

    // 加法：大数字礼物
    for (const pair of [[3,2],[6,4],[8,7],[9,9]]) {
      await evalJs(cdp, `(() => {
        const q = { kind:'add', level:'lv7', fruit:'apple', a:${pair[0]}, b:${pair[1]},
                    answer:${pair[0]+pair[1]}, options:[${pair[0]+pair[1]}, 5, 9], prompt:'算一算', layout:'add' };
        const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
        s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
        document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
      })()`);
      await sleep(600);
      const g = await evalJs(cdp, `(() => {
        const boxes = [...document.querySelectorAll('#board .gift-box')];
        let overflow = 0;
        boxes.forEach(b => {
          const br = b.getBoundingClientRect();
          [...b.querySelectorAll('.gcell')].forEach(c => {
            const r = c.getBoundingClientRect();
            if (r.left < br.left - 1 || r.right > br.right + 1 || r.top < br.top - 1 || r.bottom > br.bottom + 1) overflow++;
          });
        });
        const gifts = document.querySelectorAll('#board .gcell').length;
        return { gifts, overflow, docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      })()`);
      ok(pair[0]+'+'+pair[1]+' 礼物齐全', g.gifts === pair[0]+pair[1], JSON.stringify(g));
      ok(pair[0]+'+'+pair[1]+' 礼物不溢出', g.overflow === 0, JSON.stringify(g));
      if (pair[0] === 9) await shot(cdp, 't-fit-add18');
    }
    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
