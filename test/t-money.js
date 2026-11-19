/* ===== 人民币题目正确性专项 =====
   一年级下册「认识人民币」要求掌握：1 元 = 10 角。
   这里不抽查，而是用「图上实际给了多少钱」独立重算答案，
   与生成器给出的 answer 逐题比对，避免把角数多乘 10 这类错误漏过。 */
const { launch, setViewport, goto, evalJs, sleep, close } = require('./cdp');
const URL = 'http://127.0.0.1:8152/?r=' + Date.now();

(async () => {
  const cdp = await launch();
  const fails = [];
  const ok = (n, c, e) => { console.log((c ? '  ✓ ' : '  ✗ ') + n + (e ? ' — ' + e : '')); if (!c) fails.push(n); };
  const state = () => evalJs(cdp, `MFI.Game._state() ? 1 : 0`);

  try {
    await setViewport(cdp, 430, 932);
    await goto(cdp, URL);
    await evalJs(cdp, `localStorage.clear(); true`);
    await goto(cdp, URL);
    await sleep(700);
    await state();

    console.log('\n[一年级下册认识人民币]');
    const r = await evalJs(cdp, `(() => {
      const D = MFI.Data;
      const lv = D.LEVELS.find(l => (l.kinds || []).indexOf('money') >= 0 && l.grade === 'g1');
      if (!lv) return { err: 'no money level' };
      const bad = [];
      let n = 0;
      for (let i = 0; i < 500; i++) {
        const q = D.makeQuestion(lv.id, i % 4);
        if (q.kind !== 'money') continue;
        n++;
        const yuan = Number(q.mYuan) || 0;
        const jiao = Number(q.mJiao) || 0;
        /* 图上真实金额（角） */
        const realJiao = yuan * 10 + jiao;
        const vals = q.options.map(o => Number(o.v));

        if (Number(q.answer) !== realJiao) {
          bad.push('答案≠图示金额 ' + yuan + '元' + jiao + '角 应' + realJiao + ' 实际' + q.answer);
        }
        if (vals.indexOf(Number(q.answer)) < 0) bad.push('正确答案不在选项内');
        if (vals.length !== 3) bad.push('选项数不是 3: ' + vals.length);
        if (new Set(vals).size !== vals.length) bad.push('选项重复: ' + vals.join('/'));
        if (vals.some(v => !isFinite(v) || v <= 0)) bad.push('选项非正整数: ' + vals.join('/'));
        if (jiao === 0 && q.prompt.indexOf('数一数') >= 0) bad.push('只有整元却用「数一数」题面');
        if (jiao > 0 && (yuan === 0)) bad.push('有角却无元，超出一上范围');
      }
      return { n, bad: [...new Set(bad)].slice(0, 8) };
    })()`);

    ok('能找到一年级人民币关卡', !r.err, r.err);
    ok('出题量足够', r.n > 50, '共 ' + r.n + ' 题');
    ok('答案与图示金额一致', r.bad.filter(x => x.indexOf('答案') === 0).length === 0,
      r.bad.filter(x => x.indexOf('答案') === 0).join(' | '));
    ok('正确答案在选项内', r.bad.indexOf('正确答案不在选项内') < 0);
    ok('选项无重复', !r.bad.some(x => x.indexOf('选项重复') === 0));
    ok('选项均为正整数', !r.bad.some(x => x.indexOf('选项非正整数') === 0));
    ok('题面与图示匹配', !r.bad.some(x => x.indexOf('题面') === 0 || x.indexOf('超出') === 0));

    console.log('\n[渲染与标注]');
    const rr = await evalJs(cdp, `(() => {
      const D = MFI.Data;
      const lv = D.LEVELS.find(l => (l.kinds || []).indexOf('money') >= 0 && l.grade === 'g1');
      MFI.App.show('game');
      let withJiao = null, wholeYuan = null;
      for (let i = 0; i < 300 && (!withJiao || !wholeYuan); i++) {
        const c = D.makeQuestion(lv.id, i % 4);
        if (c.kind !== 'money') continue;
        if (c.mJiao > 0 && !withJiao) withJiao = c;
        if (c.mJiao === 0 && !wholeYuan) wholeYuan = c;
      }
      function render(q) {
        const host = document.getElementById('board'); host.innerHTML = '';
        MFI.Board.render(q, host, { onPick: function(){} });
        /* 数一数 SVG 里的纸币与硬币数量 */
        /* 每张 1 元纸币 = 1 外框 + 1 内框 rect；每枚 1 角 = 1 外圆 + 1 内圈 circle */
        const rects = host.querySelectorAll('.art-money rect').length;
        const coins = host.querySelectorAll('.art-money circle').length;
        return { bills: rects, coinCircles: coins,
          cap: (host.querySelector('.g-cap') || {}).textContent || '' };
      }
      const a = render(wholeYuan), b = render(withJiao);
      return {
        whole: { y: wholeYuan.mYuan, j: wholeYuan.mJiao, ans: wholeYuan.answer, bills: a.bills, coinCircles: a.coinCircles, cap: a.cap },
        mixed: { y: withJiao.mYuan, j: withJiao.mJiao, ans: withJiao.answer, bills: b.bills, coinCircles: b.coinCircles, cap: b.cap }
      };
    })()`);

    /* 每张 1 元纸币 = 1 个 rect 边框 + 1 个内框；每枚 1 角 = 2 个 circle */
    ok('整元题：纸币张数正确', rr.whole.bills === rr.whole.y * 2,
      '画了 ' + rr.whole.bills + ' 个 rect，应为 ' + (rr.whole.y * 2));
    ok('整元题：说明文字正确', rr.whole.cap.indexOf(rr.whole.y + ' 张 1 元') >= 0, rr.whole.cap);
    ok('含角题：纸币与硬币都在', rr.mixed.bills === rr.mixed.y * 2 && rr.mixed.coinCircles === rr.mixed.j * 2,
      'rect=' + rr.mixed.bills + ' circle=' + rr.mixed.coinCircles + ' 期望 ' + (rr.mixed.y * 2) + '/' + (rr.mixed.j * 2));
    ok('含角题：说明文字含元与角', rr.mixed.cap.indexOf('张 1 元') >= 0 && rr.mixed.cap.indexOf('枚 1 角') >= 0, rr.mixed.cap);

    console.log('\n[控制台]');
    const errs = cdp.console.filter(c => /EXCEPTION|Error/i.test(c));
    ok('无 JS 异常', errs.length === 0, errs.slice(0, 2).join(' | '));

    console.log('\n' + (fails.length ? '结果：失败 ' + fails.length + ' → ' + fails.join(' / ') : '结果：全部通过'));
  } catch (e) {
    console.log('异常:', e.message);
  } finally {
    await close(cdp);
  }
})();
