/* ===== 音效：Web Audio 实时合成，无音频文件 ===== */
(function () {
  var A = { ctx: null, master: null, muted: false, _noise: null };

  A.init = function () {
    if (A.ctx) return A.ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      A.ctx = new AC();
      A.master = A.ctx.createGain();
      A.master.gain.value = 0.5;
      var comp = A.ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 22; comp.ratio.value = 8;
      comp.attack.value = 0.004; comp.release.value = 0.22;
      A.master.connect(comp); comp.connect(A.ctx.destination);
      var len = Math.floor(A.ctx.sampleRate * 1.2);
      var buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      A._noise = buf;
    } catch (e) { A.ctx = null; }
    return A.ctx;
  };

  A.unlock = function () {
    var c = A.init();
    if (c && c.state === 'suspended') c.resume();
  };

  A.setMuted = function (m) {
    A.muted = !!m;
    if (A.master && A.ctx) {
      var t = A.ctx.currentTime;
      A.master.gain.cancelScheduledValues(t);
      A.master.gain.setTargetAtTime(A.muted ? 0 : 0.5, t, 0.03);
    }
  };

  function tone(o) {
    if (!A.ctx || A.muted) return;
    var ctx = A.ctx;
    var t0 = ctx.currentTime + (o.delay || 0);
    var dur = o.dur || 0.16;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
    var peak = o.gain == null ? 0.2 : o.gain;
    var atk = o.attack == null ? 0.008 : o.attack;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var node = osc;
    if (o.filter) {
      var f = ctx.createBiquadFilter();
      f.type = o.filter; f.frequency.value = o.filterFreq || 1200; f.Q.value = o.filterQ || 1;
      node.connect(f); node = f;
    }
    node.connect(g); g.connect(A.master);
    osc.start(t0); osc.stop(t0 + dur + 0.03);
  }

  function noise(o) {
    if (!A.ctx || A.muted || !A._noise) return;
    var ctx = A.ctx;
    var t0 = ctx.currentTime + (o.delay || 0);
    var dur = o.dur || 0.2;
    var src = ctx.createBufferSource();
    src.buffer = A._noise;
    var f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1400, t0);
    if (o.slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(60, o.slideTo), t0 + dur);
    f.Q.value = o.q == null ? 1.1 : o.q;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.gain == null ? 0.18 : o.gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(A.master);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  var SFX = {
    click: function () { tone({ freq: 660, slideTo: 920, type: 'triangle', dur: 0.06, gain: 0.11 }); },
    pop:   function () { tone({ freq: 420, slideTo: 940, type: 'sine', dur: 0.09, gain: 0.15 }); },
    /* 答对：五声音阶按连击移调，永远和谐 */
    correct: function (p) {
      var scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24, 26, 28];
      var step = Math.min((p && p.combo) || 0, 12);
      var base = 523.25 * Math.pow(2, scale[step % scale.length] / 12);
      [1, 1.25, 1.5].forEach(function (m, i) {
        tone({ freq: base * m, type: 'triangle', dur: 0.19, gain: 0.17 - i * 0.03, delay: i * 0.055 });
        tone({ freq: base * m * 2, type: 'sine', dur: 0.13, gain: 0.05, delay: i * 0.055 });
      });
    },
    wrong: function () {
      tone({ freq: 392, slideTo: 262, type: 'sine', dur: 0.3, gain: 0.13, filter: 'lowpass', filterFreq: 1400 });
      tone({ freq: 196, slideTo: 150, type: 'triangle', dur: 0.3, gain: 0.07, delay: 0.03 });
    },
    coin: function () {
      tone({ freq: 1046.5, type: 'square', dur: 0.08, gain: 0.07 });
      tone({ freq: 1568, type: 'square', dur: 0.13, gain: 0.055, delay: 0.05 });
    },
    count: function (i) {
      tone({ freq: 523.25 * Math.pow(2, Math.min(i || 0, 9) / 12), type: 'sine', dur: 0.13, gain: 0.12 });
    },
    /* 咬一口 */
    eat: function () {
      noise({ dur: 0.1, freq: 2600, slideTo: 700, gain: 0.16, filter: 'bandpass', q: 1.6 });
      tone({ freq: 240, slideTo: 120, type: 'triangle', dur: 0.1, gain: 0.09 });
    },
    combo: function (n) {
      tone({ freq: 660 * Math.pow(2, Math.min(n, 12) / 12), type: 'sine', dur: 0.22, gain: 0.12 });
    },
    fever: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
        tone({ freq: f, type: 'sawtooth', dur: 0.48, gain: 0.075, delay: i * 0.07, attack: 0.02, filter: 'lowpass', filterFreq: 2600 });
      });
      noise({ dur: 0.5, freq: 900, slideTo: 4200, gain: 0.09, filter: 'highpass' });
    },
    heart: function () {
      tone({ freq: 300, slideTo: 110, type: 'triangle', dur: 0.25, gain: 0.14 });
      noise({ dur: 0.15, freq: 300, gain: 0.1, filter: 'lowpass' });
    },
    bossHit: function () {
      noise({ dur: 0.22, freq: 1600, slideTo: 200, gain: 0.2, filter: 'lowpass' });
      tone({ freq: 150, slideTo: 60, type: 'square', dur: 0.2, gain: 0.14 });
    },
    bossDown: function () {
      noise({ dur: 0.85, freq: 4000, slideTo: 120, gain: 0.18, filter: 'lowpass' });
      [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.48, gain: 0.12, delay: i * 0.06 });
      });
    },
    bossIntro: function () {
      tone({ freq: 110, slideTo: 55, type: 'sawtooth', dur: 0.85, gain: 0.14, filter: 'lowpass', filterFreq: 900 });
      noise({ dur: 0.65, freq: 300, slideTo: 1200, gain: 0.1, filter: 'bandpass', delay: 0.1 });
    },
    win: function () {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach(function (f, i) {
        tone({ freq: f, type: 'triangle', dur: 0.32, gain: 0.13, delay: i * 0.12 });
        tone({ freq: f / 2, type: 'sine', dur: 0.32, gain: 0.05, delay: i * 0.12 });
      });
    },
    lose: function () {
      [523.25, 466.16, 392, 311.13].forEach(function (f, i) { tone({ freq: f, type: 'triangle', dur: 0.38, gain: 0.1, delay: i * 0.15 }); });
    },
    whoosh: function () { noise({ dur: 0.32, freq: 500, slideTo: 3400, gain: 0.09, filter: 'bandpass', q: 0.7 }); },
    cardIn: function () {
      tone({ freq: 880, slideTo: 1760, type: 'sine', dur: 0.19, gain: 0.07 });
      noise({ dur: 0.28, freq: 2400, slideTo: 6000, gain: 0.055, filter: 'highpass', delay: 0.04 });
    },
    tick: function () { tone({ freq: 1500, type: 'square', dur: 0.04, gain: 0.04 }); },
    rescueStart: function () {
      tone({ freq: 220, slideTo: 660, type: 'sawtooth', dur: 0.38, gain: 0.12, filter: 'lowpass', filterFreq: 1800 });
      tone({ freq: 330, slideTo: 880, type: 'triangle', dur: 0.38, gain: 0.08, delay: 0.08 });
    },
    rescueSaved: function () {
      [660, 880, 1100, 1320].forEach(function (f, i) { tone({ freq: f, type: 'triangle', dur: 0.26, gain: 0.11, delay: i * 0.06 }); });
    },
    unlock: function () {
      [784, 988, 1175, 1568].forEach(function (f, i) { tone({ freq: f, type: 'sine', dur: 0.28, gain: 0.095, delay: i * 0.08 }); });
    },
    hint: function () { tone({ freq: 990, slideTo: 1480, type: 'sine', dur: 0.17, gain: 0.075 }); }
  };

  A.play = function (name, arg) {
    if (A.muted) return;
    if (!A.ctx) A.init();
    if (!A.ctx) return;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    var fn = SFX[name];
    if (fn) { try { fn(arg); } catch (e) {} }
  };

  window.MFI = window.MFI || {};
  MFI.Audio = A;
})();
