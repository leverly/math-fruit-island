/* 极简 CDP 驱动：截图 + 求值 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/* 端口可随机，避免并发跑测试时互相抢占 */
const BASE_PORT = Number(process.env.CDP_PORT || 9241);
const PORT = BASE_PORT + Math.floor(Math.random() * 200);
const OUT = path.join(__dirname, 'shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map();
    this.listeners = new Map(); this.console = [];
    ws.addEventListener('message', ev => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
      } else if (m.method) {
        if (m.method === 'Runtime.consoleAPICalled')
          this.console.push((m.params.args || []).map(a => a.value !== undefined ? a.value : a.description).join(' '));
        if (m.method === 'Runtime.exceptionThrown') {
          const d = m.params.exceptionDetails;
          this.console.push('EXCEPTION: ' + ((d.exception && (d.exception.description || d.exception.value)) || d.text));
        }
        (this.listeners.get(m.method) || []).forEach(f => { try { f(m.params); } catch (e) {} });
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      setTimeout(() => {
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error('timeout ' + method)); }
      }, 30000);
    });
  }
  on(m, f) { if (!this.listeners.has(m)) this.listeners.set(m, []); this.listeners.get(m).push(f); }
}

async function launch() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mfi-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + dir,
    '--no-first-run', '--no-default-browser-check', '--disable-background-networking',
    '--disable-component-update', '--disable-sync', '--hide-scrollbars',
    '--autoplay-policy=no-user-gesture-required', '--window-size=430,932', 'about:blank'
  ], { stdio: 'ignore' });
  let target = null;
  for (let i = 0; i < 80; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find(t => t.type === 'page');
      if (target) break;
    } catch (e) {}
    await sleep(180);
  }
  if (!target) throw new Error('chrome not ready');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  const cdp = new CDP(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  cdp.proc = proc; cdp.userDir = dir;
  return cdp;
}

async function setViewport(cdp, w, h, mobile = true, dpr = 2) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: w, height: h, deviceScaleFactor: dpr, mobile, screenWidth: w, screenHeight: h
  });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
}

async function goto(cdp, url) {
  const loaded = new Promise(r => cdp.on('Page.loadEventFired', r));
  await cdp.send('Page.navigate', { url });
  await Promise.race([loaded, sleep(8000)]);
  await sleep(450);
}

async function evalJs(cdp, expr, awaitPromise = false) {
  const r = await cdp.send('Runtime.evaluate', {
    expression: expr, returnByValue: true, awaitPromise, userGesture: true
  });
  if (r.exceptionDetails) {
    const ex = r.exceptionDetails;
    throw new Error('JS: ' + ((ex.exception && (ex.exception.description || ex.exception.value)) || ex.text));
  }
  return r.result.value;
}

async function shot(cdp, name) {
  const r = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const p = path.join(OUT, name + '.png');
  fs.writeFileSync(p, Buffer.from(r.data, 'base64'));
  return p;
}

async function clickSel(cdp, sel) {
  const box = await evalJs(cdp, `(() => {
    const el = document.querySelector(${JSON.stringify(sel)});
    if (!el) return null;
    el.scrollIntoView({block:'center'});
    const r = el.getBoundingClientRect();
    return {x:r.left+r.width/2, y:r.top+r.height/2, w:r.width, h:r.height};
  })()`);
  if (!box) throw new Error('not found: ' + sel);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp.send('Input.dispatchMouseEvent', {
      type, x: Math.round(box.x), y: Math.round(box.y), button: 'left', clickCount: 1, pointerType: 'mouse'
    });
  }
  return box;
}

function close(cdp) {
  try { cdp.ws.close(); } catch (e) {}
  try { cdp.proc.kill(); } catch (e) {}
  try { fs.rmSync(cdp.userDir, { recursive: true, force: true }); } catch (e) {}
}

module.exports = { launch, setViewport, goto, evalJs, shot, clickSel, sleep, close, OUT };
