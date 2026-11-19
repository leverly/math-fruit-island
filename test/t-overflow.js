/* 全量溢出扫描：所有关卡 × 所有数量，检查图案是否溢出容器 */
const { launch, setViewport, goto, evalJs, shot, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();;
(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n,c,e)=>{console.log((c?'  ✓ ':'  ✗ ')+n+(e?' — '+e:'')); if(!c)fails.push(n);};
  try {
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(500);

    const sweep = async (w, h) => {
      await setViewport(cdp, w, h);
      await sleep(250);
      await evalJs(cdp, `MFI.App.show('game'); MFI.Game.start({mode:'level',level:'lv1',onFinish:function(){}}); true`);
      await sleep(500);

      const bad = [];
      /* 数数 / 减法：1..20 个水果 */
      for (let n = 1; n <= 20; n++) {
        for (const layout of ['count','sub']) {
          const kindArg = JSON.stringify(layout);
          await evalJs(cdp, `(() => {
            const kind = ${kindArg};
            const q = { kind: kind, level:'lv1', fruit:'berry', a:${n}, b:0,
                        answer:${n}, options:[0,0,0], prompt:'x', layout: kind };
            if (kind === 'sub') { q.b = Math.max(1, Math.floor(${n}/3)); q.answer = q.a - q.b; }
            q.options = [q.answer, q.answer+1, q.answer+2];
            if (!MFI.Game._state()) MFI.Game.start({mode:'level', level:'lv1', onFinish:function(){}});
            const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
            s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
            document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
          })()`);
          await sleep(480);
          const r = await evalJs(cdp, `(() => {
            const card = document.querySelector('#board .fcard');
            if (!card) return { err: 'no-card' };
            const cr = card.getBoundingClientRect();
            const cells = [...document.querySelectorAll('#board .fcell')];
            let over = 0, maxOut = 0;
            cells.forEach(c => {
              const b = c.getBoundingClientRect();
              const dx = Math.max(0, cr.left - b.left, b.right - cr.right);
              const dy = Math.max(0, cr.top - b.top, b.bottom - cr.bottom);
              if (dx > 1 || dy > 1) { over++; maxOut = Math.max(maxOut, Math.round(Math.max(dx,dy))); }
            });
            const candies = [...document.querySelectorAll('#board .candy-btn')];
            const cOut = candies.filter(c => {
              const b = c.getBoundingClientRect();
              return b.bottom > window.innerHeight + 1 || b.top < 0 || b.left < 0 || b.right > window.innerWidth + 1;
            }).length;
            return { cells: cells.length, over, maxOut, cOut,
                     docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
          })()`);
          if (r.err || r.over > 0 || r.cOut > 0 || r.docW > 0) {
            bad.push(layout + '/' + n + ' → ' + JSON.stringify(r));
          }
        }
      }

      /* 加法：礼物最多 20 个 */
      for (const a of [1, 5, 9, 10]) {
        for (const b of [1, 5, 9, 10]) {
          await evalJs(cdp, `(() => {
            const q = { kind:'add', level:'lv4', fruit:'apple', a:${a}, b:${b}, answer:${a+b},
                        options:[${a+b},${a+b}+1,${a+b}+2], prompt:'x', layout:'add' };
            if (!MFI.Game._state()) MFI.Game.start({mode:'level', level:'lv1', onFinish:function(){}});
            const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
            s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
            document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
          })()`);
          await sleep(520);
          const r = await evalJs(cdp, `(() => {
            const boxes = [...document.querySelectorAll('#board .gift-box')];
            let over = 0, maxOut = 0;
            boxes.forEach(bx => {
              const br = bx.getBoundingClientRect();
              [...bx.querySelectorAll('.gcell')].forEach(c => {
                const b = c.getBoundingClientRect();
                const dx = Math.max(0, br.left - b.left, b.right - br.right);
                const dy = Math.max(0, br.top - b.top, b.bottom - br.bottom);
                if (dx > 1 || dy > 1) { over++; maxOut = Math.max(maxOut, Math.round(Math.max(dx,dy))); }
              });
            });
            const board = document.querySelector('#board .bb-board');
            if (!board) return { err: 'no-board', gifts: document.querySelectorAll('#board .gcell').length };
            const candies = [...document.querySelectorAll('#board .candy-btn')];
            const cOut = candies.filter(c => {
              const b = c.getBoundingClientRect();
              return b.bottom > window.innerHeight + 1 || b.top < 0;
            }).length;
            return { gifts: document.querySelectorAll('#board .gcell').length, over, maxOut, cOut,
                     docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
          })()`);
          if (r.err) { bad.push('add/' + a + '+' + b + ' → ' + r.err); continue; }
          if (r.over > 0 || r.cOut > 0 || r.docW > 0 || r.gifts !== a + b) {
            bad.push('add/' + a + '+' + b + ' → ' + JSON.stringify(r));
          }
        }
      }

      /* 比大小：两边最多 20 */
      for (const n of [1, 10, 20]) {
        await evalJs(cdp, `(() => {
          const q = { kind:'compare', level:'lv8', fruit:'melon', a:${n}, b:${n-1>0?n-1:1},
                      answer:${n}, options:[${n},${n-1},${n}+1], prompt:'x', layout:'compare' };
          const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
          s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
          document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
        })()`);
        await sleep(520);
        const r = await evalJs(cdp, `(() => {
          const cards = [...document.querySelectorAll('#board .fcard')];
          let over = 0;
          cards.forEach(card => {
            const cr = card.getBoundingClientRect();
            [...card.querySelectorAll('.fcell')].forEach(c => {
              const b = c.getBoundingClientRect();
              if (b.left < cr.left -1 || b.right > cr.right +1 || b.top < cr.top -1 || b.bottom > cr.bottom +1) over++;
            });
          });
          return { cells: document.querySelectorAll('#board .fcell').length, over,
                   docW: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        })()`);
        if (r.over > 0 || r.docW > 0) bad.push('compare/' + n + ' → ' + JSON.stringify(r));
      }

      return bad;
    };

    console.log('\n[430×932]');
    const b1 = await sweep(430, 932);
    ok('430px 无任何溢出', b1.length === 0, b1.slice(0,6).join(' | '));

    await evalJs(cdp, `(() => {
      const q = { kind:'sub', level:'lv8', fruit:'melon', a:18, b:6, answer:12, options:[12,9,15], prompt:'x', layout:'sub' };
      const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
      s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(400); await shot(cdp, 'of-430-18');

    console.log('\n[375×812]');
    const b2 = await sweep(375, 812);
    ok('375px 无任何溢出', b2.length === 0, b2.slice(0,6).join(' | '));

    console.log('\n[320×780]');
    const b3 = await sweep(320, 780);
    ok('320px 无任何溢出', b3.length === 0, b3.slice(0,6).join(' | '));

    await evalJs(cdp, `(() => {
      const q = { kind:'add', level:'lv8', fruit:'apple', a:10, b:10, answer:20, options:[20,15,18], prompt:'x', layout:'add' };
      const s = MFI.Game._state(); s.cur=q; s.phase='ask'; s.buttons=[];
      s.wrap = MFI.Board.render(q, document.getElementById('board'), {onPick:function(){}});
      document.querySelectorAll('#board .candy-btn').forEach(b=>s.buttons.push(b));
    })()`);
    await sleep(500); await shot(cdp, 'of-320-add20');

    const errs = cdp.console.filter(c=>c.startsWith('EXCEPTION'));
    ok('无 JS 异常', errs.length===0, errs.slice(0,2).join(' | '));
  } catch(e){ fails.push('异常 '+e.message); console.error('!!', e.message); }
  finally { console.log('\n结果：'+(fails.length?'失败 '+fails.length+' → '+fails.join(' / '):'全部通过')); close(cdp); process.exit(fails.length?1:0); }
})();
