const { launch, setViewport, goto, shot, evalJs, sleep, close } = require('./cdp');
(async () => {
  const cdp = await launch();
  await setViewport(cdp, 430, 1000, false, 2);
  await goto(cdp, 'http://127.0.0.1:8152/test/art-preview.html');
  await sleep(600);
  await shot(cdp, 'art-preview');
  console.log(cdp.console.filter(c=>c.startsWith('EXCEPTION')));
  close(cdp);
})();
