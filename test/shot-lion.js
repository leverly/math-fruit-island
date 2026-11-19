const { launch, setViewport, goto, shot, sleep, close } = require('./cdp');
(async () => {
  const cdp = await launch();
  await setViewport(cdp, 900, 620, false, 2);
  await goto(cdp, 'http://127.0.0.1:8152/test/lion.html');
  await sleep(600);
  await shot(cdp, 'art-lion');
  console.log(cdp.console.filter(c=>c.startsWith('EXCEPTION')));
  close(cdp);
})();
