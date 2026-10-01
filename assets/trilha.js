/* Trilha do atlas: uma gravação escolhida pela autora e quatro músicas
   originais, compostas para o Neko no Hitai.

   A primeira faixa, a padrão do jogo, é gravação externa: Uccidere in
   silenzio 3, de Stelvio Cipriani, em assets/audio, tocada em loop por um
   elemento de áudio. Licença de uso não registrada [VERIFICAR antes de
   tornar a página pública].
   As outras quatro não usam gravação nenhuma. Cada nota é sintetizada no
   navegador com Web Audio: piano elétrico em FM, pad, baixo, caixinha de
   música, kalimba, vibrafone, bateria de escovinha e um chiado de vinil bem
   baixo. Harmonia, melodias e arranjo foram escritos para esta página;
   nenhuma melodia reproduz música existente.

   Uso: const m = NekoTrilha.create(ctx, destino); m.play(); m.pause();
   m.next(); m.prev(); m.setVolume(0..1); m.playFile(arquivo); m.onChange(fn).
   Um arquivo escolhido pela pessoa toca só no navegador dela e não é
   enviado a lugar nenhum. */

(function () {
  "use strict";

  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function midi(s) {
    const m = /^([A-G])(#|b)?(-?\d)$/.exec(s);
    if (!m) throw new Error("nota inválida: " + s);
    return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  }
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  /* "r/1 A5/.5 C6/.5 | ..." vira [{ b: tempo em batidas, m, d }] */
  function line(str) {
    const notes = [];
    let b = 0;
    for (const tok of str.trim().split(/\s+/)) {
      if (!tok || tok === "|") continue;
      const [n, d] = tok.split("/");
      const dur = Number(d);
      if (n !== "r") notes.push({ b, m: midi(n), d: dur });
      b += dur;
    }
    return { notes, beats: b };
  }
  const chord = (bass, ...v) => ({ bass: midi(bass), v: v.map(midi) });

  /* ---------------------------------------------------------------------
     as músicas
     --------------------------------------------------------------------- */
  const TRACKS = [
    /* a padrão: gravação, não partitura */
    {
      id: "uccidere-in-silenzio",
      title: "Uccidere in silenzio 3",
      author: "Stelvio Cipriani",
      src: "assets/audio/uccidere-in-silenzio-3.mp3",
    },
    {
      id: "sete-lajes",
      title: "Sete lajes",
      bpm: 74, meter: 4, swing: 0.08, lead: "box", comp: "lofi", bassStyle: "lofi", drums: "lofi", crackle: 0.9,
      chords: [
        chord("Bb2", "D4", "F4", "A4", "C5"),
        chord("A2", "C4", "E4", "G4", "B4"),
        chord("G2", "Bb3", "D4", "F4", "A4"),
        chord("C3", "Bb3", "D4", "F4", "G4"),
        chord("Bb2", "D4", "F4", "A4", "C5"),
        [chord("A2", "C4", "E4", "G4", "B4"), chord("D3", "C4", "Eb4", "F#4", "A4")],
        chord("G2", "Bb3", "D4", "F4", "A4"),
        chord("C3", "Bb3", "D4", "F4", "A4"),
      ],
      melody: [
        line("r/1 A5/.5 C6/.5 D6/1.5 C6/.5 | A5/2 G5/1 E5/1 | F5/.5 G5/.5 A5/2 r/.5 D5/.5 | F5/3 r/1 | r/.5 A5/.5 C6/1 F6/1.5 E6/.5 | D6/1 C6/1 A5/1 F#5/1 | G5/.5 A5/.5 Bb5/1 A5/1 G5/1 | F5/2 r/2"),
        line("C6/1 A5/.5 G5/.5 A5/2 | r/1 E5/.5 G5/.5 C6/1 B5/1 | A5/1.5 G5/.5 F5/1 D5/1 | D5/.5 F5/.5 G5/3 | r/1 D6/.5 C6/.5 A5/2 | C6/1.5 A5/.5 F#5/1 A5/1 | G5/1 F5/1 D5/1 E5/1 | F5/4"),
      ],
      form: [["pad", "ep"], ["pad", "ep", "bass", "drums"], ["pad", "ep", "bass", "drums", "lead0"], ["ep", "bass", "drums", "lead1"], ["pad", "ep", "lead0"]],
    },
    {
      id: "testa-de-gato",
      title: "Testa de gato",
      bpm: 88, meter: 3, swing: 0, lead: "kalimba", comp: "waltz", bassStyle: "waltz", drums: "shaker", crackle: 0.7,
      chords: [
        chord("G2", "B3", "D4", "F#4", "A4"),
        chord("A2", "C#4", "E4", "F#4", "A4"),
        chord("F#2", "A3", "C#4", "E4", "G#4"),
        chord("B2", "D4", "F#4", "A4", "C#5"),
        chord("E2", "G3", "B3", "D4", "F#4"),
        chord("A2", "G3", "B3", "D4", "E4"),
        chord("D2", "F#3", "A3", "C#4", "E4"),
        chord("A2", "G3", "B3", "D4", "F#4"),
      ],
      melody: [
        line("F#5/1 A5/1 B5/1 | A5/2 E5/1 | G#5/1 A5/.5 G#5/.5 E5/1 | F#5/3 | r/1 G5/1 B5/1 | A5/1.5 G5/.5 E5/1 | F#5/1 E5/1 C#5/1 | D5/2 E5/1"),
        line("B5/1 A5/1 F#5/1 | E5/1 F#5/1 A5/1 | C#6/2 B5/1 | A5/1 F#5/2 | G5/1 F#5/1 E5/1 | D5/1.5 E5/.5 G5/1 | F#5/3 | r/1 A4/1 D5/1"),
      ],
      form: [["pad", "ep"], ["pad", "ep", "bass"], ["pad", "ep", "bass", "drums", "lead0"], ["pad", "ep", "bass", "drums", "lead1"], ["ep", "bass", "drums", "lead0"], ["pad", "lead1"]],
    },
    {
      id: "terreno-vazio",
      title: "Terreno vazio",
      bpm: 80, meter: 4, swing: 0.1, lead: "vibe", comp: "lofi", bassStyle: "lofi", drums: "brush", crackle: 0.8,
      chords: [
        chord("Ab2", "C4", "Eb4", "G4", "Bb4"),
        chord("G2", "Bb3", "D4", "F4", "C5"),
        chord("F2", "Ab3", "C4", "Eb4", "G4"),
        chord("Bb2", "Ab3", "C4", "D4", "G4"),
        chord("Eb2", "G3", "Bb3", "D4", "F4"),
        chord("C3", "G3", "Bb3", "D4", "Eb4"),
        chord("F2", "Ab3", "C4", "Eb4", "G4"),
        chord("Bb2", "Ab3", "C4", "Eb4", "F4"),
      ],
      melody: [
        line("r/.5 Eb5/.5 G5/.5 Bb5/.5 C6/1.5 Bb5/.5 | G5/2 F5/1 D5/1 | Eb5/.5 F5/.5 Ab5/1.5 G5/.5 F5/1 | D5/3 r/1 | r/1 Bb5/.5 D6/.5 F6/1.5 D6/.5 | Eb6/1 D6/1 Bb5/1 G5/1 | Ab5/.5 G5/.5 F5/1 Eb5/1 C5/1 | Eb5/2 F5/2"),
        line("C6/1 Bb5/.5 G5/.5 Eb5/2 | r/.5 D5/.5 F5/.5 G5/.5 Bb5/2 | Ab5/1 G5/.5 F5/.5 Eb5/1 C5/1 | D5/.5 Eb5/.5 F5/3 | G5/1.5 F5/.5 D5/1 Bb4/1 | C5/.5 D5/.5 Eb5/1 G5/2 | F5/1 Ab5/1 C6/1 Bb5/1 | Ab5/2 r/2"),
      ],
      form: [["pad", "ep"], ["pad", "ep", "bass", "drums"], ["pad", "ep", "bass", "drums", "lead0"], ["ep", "bass", "drums", "lead1"], ["pad", "ep", "bass", "lead0"]],
    },
    {
      id: "luz-do-norte",
      title: "Luz do norte",
      bpm: 64, meter: 4, swing: 0, lead: "kalimba", comp: "ambient", bassStyle: "ambient", drums: null, crackle: 1.2,
      chords: [
        chord("D2", "F#3", "A3", "C#4", "E4"),
        chord("C#2", "E3", "G#3", "B3", "E4"),
        chord("B1", "D3", "A3", "C#4", "E4"),
        chord("E2", "D3", "F#3", "A3", "C#4"),
        chord("F#2", "A3", "C#4", "E4", "G#4"),
        chord("D2", "F#3", "A3", "C#4", "G#4"),
        chord("C#2", "A3", "B3", "E4", "G#4"),
        chord("E2", "D3", "E3", "A3", "B3"),
      ],
      melody: [
        line("r/1 F#5/1 A5/1 E5/1 | r/2 G#5/1 E5/1 | F#5/1 D5/1 r/2 | C#5/2 r/2 | r/1 A5/1 C#6/1 G#5/1 | F#5/2 r/2 | E5/1 G#5/1 B5/2 | A5/2 r/2"),
        line("r/2 C#6/1 B5/1 | G#5/2 r/2 | A5/1 F#5/1 D5/2 | E5/1 C#5/1 r/2 | r/1 G#5/1 E5/1 C#5/1 | A5/2 G#5/2 | r/1 B5/1 G#5/1 E5/1 | A5/4"),
      ],
      form: [["pad", "ep"], ["pad", "ep", "bass", "lead0"], ["pad", "ep", "bass", "lead1"], ["pad", "ep", "lead0"], ["pad", "lead1"]],
    },
  ];
  for (const t of TRACKS) {
    if (t.src) continue;
    t.author = "trilha original do atlas";
    for (const m of t.melody) if (Math.abs(m.beats - t.meter * t.chords.length) > 1e-6) throw new Error(`melodia fora do compasso em ${t.id}`);
  }

  /* padrões de acompanhamento: [batida, duração, intensidade] */
  const COMP = {
    lofi: [[0, 1.4, 0.8], [1.5, 0.9, 0.5], [2.5, 1.3, 0.66]],
    lofiSplit: [[0, 1.8, 0.78], [2, 1.8, 0.7]],
    waltz: [[1, 0.8, 0.5], [2, 0.8, 0.42]],
    ambient: [[0, 3.6, 0.5], [2.5, 1.4, 0.3]],
  };

  /* ---------------------------------------------------------------------
     o motor: agenda compasso por compasso, com folga de meio segundo
     --------------------------------------------------------------------- */
  function noiseBuffer(ctx, sec) {
    const n = Math.floor(ctx.sampleRate * sec);
    const b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < n; i += 1) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function impulse(ctx, sec) {
    const rate = ctx.sampleRate, len = Math.floor(rate * sec);
    const b = ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c += 1) {
      const d = b.getChannelData(c);
      let lp = 0;
      for (let i = 0; i < len; i += 1) {
        const t = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.18 + 0.5 * (1 - t) * (1 - t));
        d[i] = lp * Math.pow(1 - t, 2.6) * Math.min(1, i / (rate * 0.012));
      }
    }
    return b;
  }
  function crackleBuffer(ctx, sec) {
    const rate = ctx.sampleRate, len = Math.floor(rate * sec);
    const b = ctx.createBuffer(1, len, rate);
    const d = b.getChannelData(0);
    const n = Math.round(sec * 7);
    for (let k = 0; k < n; k += 1) {
      const at = Math.floor(Math.random() * (len - 200));
      const amp = 0.2 + Math.random() * 0.8;
      const w = 6 + Math.floor(Math.random() * 40);
      for (let i = 0; i < w; i += 1) d[at + i] += (Math.random() * 2 - 1) * amp * Math.exp(-i / (w * 0.3));
    }
    return b;
  }

  function create(ctx, dest) {
    const listeners = [];
    const out = dest || ctx.destination;
    /* saída: aquece o agudo, segura os picos, e o volume por último */
    const mix = ctx.createGain();
    const warm = ctx.createBiquadFilter();
    warm.type = "highshelf"; warm.frequency.value = 5200; warm.gain.value = -6;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = 0.012; comp.release.value = 0.3;
    const vol = ctx.createGain();
    vol.gain.value = 0;
    mix.connect(warm).connect(comp).connect(vol).connect(out);
    const reverb = ctx.createConvolver();
    reverb.buffer = impulse(ctx, 2.6);
    const revOut = ctx.createGain();
    revOut.gain.value = 0.55;
    reverb.connect(revOut).connect(mix);
    const NOISE = noiseBuffer(ctx, 1.2);
    const CRACKLE = crackleBuffer(ctx, 6);

    /* tremolo do piano elétrico e do vibrafone */
    const lfoEp = ctx.createOscillator(); lfoEp.frequency.value = 4.6;
    const lfoLead = ctx.createOscillator(); lfoLead.frequency.value = 5.3;
    lfoEp.start(); lfoLead.start();

    const S = { playing: false, idx: 0, sess: null, bar: 0, nextBar: 0, timer: null, volume: 0.3, file: null, fileName: "", pausedByUser: false };

    function session(tr) {
      const s = { out: ctx.createGain(), rev: ctx.createGain(), tr };
      s.out.gain.value = 0;
      s.rev.gain.value = 0;
      s.out.connect(mix);
      s.rev.connect(reverb);
      const bus = (name, send, g) => {
        const b = ctx.createGain();
        b.gain.value = g;
        b.connect(s.out);
        const r = ctx.createGain();
        r.gain.value = send;
        b.connect(r).connect(s.rev);
        s[name] = b;
      };
      bus("ep", 0.28, 1);
      bus("pad", 0.55, 1);
      bus("bass", 0.04, 1);
      bus("lead", 0.5, 1);
      bus("drums", 0.12, 1);
      bus("vinyl", 0, 1);
      const te = ctx.createGain(); te.gain.value = 0.1; lfoEp.connect(te).connect(s.ep.gain);
      const tl = ctx.createGain(); tl.gain.value = tr.lead === "vibe" ? 0.22 : 0; lfoLead.connect(tl).connect(s.lead.gain);
      s.lfos = [te, tl];
      return s;
    }
    function fade(s, to, t, sec) {
      for (const g of [s.out.gain, s.rev.gain]) {
        g.cancelScheduledValues(t);
        g.setValueAtTime(g.value, t);
        g.linearRampToValueAtTime(to, t + sec);
      }
    }
    function drop(s, t) {
      fade(s, 0, t, 0.6);
      setTimeout(() => { try { s.out.disconnect(); s.rev.disconnect(); for (const l of s.lfos) l.disconnect(); } catch (e) { /* já desligado */ } }, (t - ctx.currentTime + 3.5) * 1000);
    }

    /* instrumentos */
    function env(g, t, a, peak, dec, sus, end) {
      const d = Math.min(dec, Math.max(0.01, (end - t - a) * 0.6));
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * sus), t + a + d);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
    }
    function pan(s, v) {
      if (!ctx.createStereoPanner) return null;
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-0.8, Math.min(0.8, v));
      return p;
    }
    function ep(s, t, m, dur, vel, bus) {
      const f = hz(m);
      const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain();
      car.frequency.value = f;
      mod.frequency.value = f;
      mg.gain.setValueAtTime(f * (0.5 + vel * 1.3), t);
      mg.gain.exponentialRampToValueAtTime(f * 0.06 + 0.5, t + 0.8);
      mod.connect(mg).connect(car.frequency);
      const end = t + dur + 0.5;
      env(g, t, 0.006, 0.11 * vel, 0.7, 0.4, end);
      const p = pan(s, (m - 64) / 30);
      car.connect(g);
      if (p) g.connect(p).connect(bus || s.ep); else g.connect(bus || s.ep);
      car.start(t); mod.start(t);
      car.stop(end + 0.05); mod.stop(end + 0.05);
    }
    function pad(s, t, notes, dur) {
      const f = ctx.createBiquadFilter(), g = ctx.createGain();
      f.type = "lowpass";
      f.Q.value = 0.6;
      f.frequency.setValueAtTime(520, t);
      f.frequency.linearRampToValueAtTime(1150, t + dur * 0.55);
      f.frequency.linearRampToValueAtTime(720, t + dur + 1);
      const end = t + dur + 1.4;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.04, t + Math.min(1.1, dur * 0.4));
      g.gain.setValueAtTime(0.04, t + dur);
      g.gain.linearRampToValueAtTime(0.0001, end);
      f.connect(g).connect(s.pad);
      for (const m of notes) {
        for (const [type, det, k] of [["triangle", -7, 1], ["triangle", 6, 1]]) {
          const o = ctx.createOscillator(), og = ctx.createGain();
          o.type = type;
          o.frequency.value = hz(m);
          o.detune.value = det;
          og.gain.value = k / notes.length;
          o.connect(og).connect(f);
          o.start(t);
          o.stop(end + 0.05);
        }
      }
    }
    function bass(s, t, m, dur, vel) {
      const f = hz(m);
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
      o.frequency.value = f;
      o2.type = "triangle";
      o2.frequency.value = f * 2;
      const g2 = ctx.createGain(); g2.gain.value = 0.18;
      lp.type = "lowpass"; lp.frequency.value = 520;
      o.connect(lp); o2.connect(g2).connect(lp);
      const end = t + dur + 0.12;
      env(g, t, 0.01, 0.34 * vel, 0.3, 0.55, end);
      lp.connect(g).connect(s.bass);
      o.start(t); o2.start(t);
      o.stop(end + 0.05); o2.stop(end + 0.05);
    }
    function lead(s, t, m, dur, vel, kind) {
      const f = hz(m);
      const g = ctx.createGain();
      const parts = kind === "box" ? [[1, 1, 1.4], [2, 0.26, 0.5], [3.004, 0.1, 0.3], [5.04, 0.04, 0.16]]
        : kind === "vibe" ? [[1, 1, 2.2], [4, 0.2, 0.25], [10.2, 0.03, 0.08]]
        : [[1, 1, 1.1], [3.9, 0.16, 0.09], [6.3, 0.05, 0.05]];
      const peak = (kind === "vibe" ? 0.085 : kind === "box" ? 0.07 : 0.1) * vel;
      const tail = kind === "vibe" ? Math.max(1.6, dur + 0.8) : kind === "box" ? 1.6 : 1.2;
      const end = t + tail;
      g.gain.setValueAtTime(1, t);
      const p = pan(s, (m - 76) / 24);
      if (p) g.connect(p).connect(s.lead); else g.connect(s.lead);
      for (const [r, k, dec] of parts) {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.setValueAtTime(f * r * (kind === "kalimba" && r === 1 ? 1.012 : 1), t);
        if (kind === "kalimba" && r === 1) o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(peak * k, t + 0.003);
        og.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(tail, dec * 4));
        o.connect(og).connect(g);
        o.start(t);
        o.stop(end + 0.05);
      }
      if (kind !== "vibe") {
        const n = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), ng = ctx.createGain();
        n.buffer = NOISE;
        hp.type = "highpass"; hp.frequency.value = 4000;
        ng.gain.setValueAtTime(0.012 * vel, t);
        ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
        n.connect(hp).connect(ng).connect(g);
        n.start(t, Math.random() * 0.8);
        n.stop(t + 0.03);
      }
    }
    function hit(s, t, kind, vel) {
      if (kind === "kick") {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.setValueAtTime(115, t);
        o.frequency.exponentialRampToValueAtTime(46, t + 0.11);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.5 * vel, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
        o.connect(g).connect(s.drums);
        o.start(t); o.stop(t + 0.36);
        return;
      }
      const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      n.buffer = NOISE;
      let len = 0.05, peak = 0.1;
      if (kind === "hat") { f.type = "highpass"; f.frequency.value = 7200; len = 0.035; peak = 0.05; }
      else if (kind === "rim") { f.type = "bandpass"; f.frequency.value = 1900; f.Q.value = 1.6; len = 0.07; peak = 0.12; }
      else if (kind === "brush") { f.type = "bandpass"; f.frequency.value = 3200; f.Q.value = 0.7; len = 0.16; peak = 0.05; }
      else { f.type = "bandpass"; f.frequency.value = 5600; f.Q.value = 0.8; len = 0.08; peak = 0.045; }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * vel, t + (kind === "brush" ? 0.03 : 0.003));
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      n.connect(f).connect(g).connect(s.drums);
      n.start(t, Math.random() * 0.9);
      n.stop(t + len + 0.02);
      if (kind === "rim") {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.frequency.value = 410;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.002);
        og.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.connect(og).connect(s.drums);
        o.start(t); o.stop(t + 0.06);
      }
    }
    function vinyl(s, t, sec, amount) {
      const end = t + sec + 0.05;
      const shape = (g, v) => {
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(v, t + 0.05);
        g.gain.setValueAtTime(v, end - 0.05);
        g.gain.linearRampToValueAtTime(0.0001, end);
      };
      const c = ctx.createBufferSource(), cg = ctx.createGain(), hp = ctx.createBiquadFilter();
      c.buffer = CRACKLE;
      c.loop = true;
      hp.type = "highpass"; hp.frequency.value = 1400;
      shape(cg, 0.05 * amount);
      c.connect(hp).connect(cg).connect(s.vinyl);
      const h = ctx.createBufferSource(), hg = ctx.createGain(), bp = ctx.createBiquadFilter();
      h.buffer = NOISE;
      h.loop = true;
      bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 0.4;
      shape(hg, 0.0045 * amount);
      h.connect(bp).connect(hg).connect(s.vinyl);
      c.start(t, Math.random() * 5); h.start(t, Math.random());
      c.stop(end + 0.02); h.stop(end + 0.02);
    }

    const rnd = (a) => (Math.random() - 0.5) * a;
    const swingAt = (b, sw) => (sw && Math.abs(b % 1 - 0.5) < 1e-6 ? b + sw : b);

    /* um compasso inteiro de uma música, a partir do tempo t */
    function scheduleBar(s, n, t) {
      const tr = s.tr;
      const nb = tr.chords.length;
      const loop = Math.floor(n / nb), k = n % nb;
      const layers = tr.form[loop % tr.form.length];
      const beat = 60 / tr.bpm;
      const at = (b) => t + swingAt(b, tr.swing) * beat + rnd(0.012);
      const barLen = tr.meter * beat;
      const ch = tr.chords[k];
      const parts = Array.isArray(ch) ? ch : [ch];
      const partLen = tr.meter / parts.length;
      vinyl(s, t, barLen, tr.crackle);
      parts.forEach((c, i) => {
        const b0 = i * partLen;
        if (layers.includes("pad")) pad(s, at(b0), c.v.map((m) => m - 12).concat(c.v.slice(1, 3)), partLen * beat);
        if (layers.includes("ep")) {
          const pat = parts.length > 1 ? [[0, partLen - 0.2, 0.74]] : COMP[tr.comp];
          for (const [pb, pd, pv] of pat) {
            if (pb >= partLen && parts.length > 1) continue;
            c.v.forEach((m, j) => ep(s, at(b0 + pb) + j * 0.011, m, pd * beat, pv * (0.9 + Math.random() * 0.2)));
          }
        }
        if (layers.includes("bass")) {
          const next = tr.chords[(k + 1) % nb];
          const nextBass = (Array.isArray(next) ? next[0] : next).bass;
          if (tr.bassStyle === "lofi" && parts.length === 1) {
            bass(s, at(0), c.bass, 1.5 * beat, 0.9);
            bass(s, at(2.5), c.bass + (loop % 2 ? 12 : 7), 0.8 * beat, 0.68);
            bass(s, at(3.5), nextBass + (nextBass > c.bass ? -1 : 2), 0.42 * beat, 0.5);
          } else if (tr.bassStyle === "waltz") {
            bass(s, at(b0), c.bass, 1.2 * beat, 0.85);
            if (k % 2) bass(s, at(2), c.bass + 7, 0.8 * beat, 0.5);
          } else {
            bass(s, at(b0), c.bass, (partLen - 0.2) * beat, parts.length > 1 ? 0.8 : 0.7);
          }
        }
      });
      if (layers.includes("drums") && tr.drums) {
        const fill = k === nb - 1;
        for (let i = 0; i < tr.meter * 2; i += 1) {
          const b = i / 2;
          if (tr.drums === "lofi") {
            if (i === 0 || i === 5 || (i === 3 && k % 2)) hit(s, at(b), "kick", i === 0 ? 1 : 0.7);
            if (i === 2 || i === 6) hit(s, at(b), "rim", 0.8);
            hit(s, at(b), "hat", i % 2 ? 0.55 : 0.85);
            if (fill && i === 7) hit(s, at(3.75), "hat", 0.5);
          } else if (tr.drums === "brush") {
            if (i === 0 || i === 4) hit(s, at(b), "kick", 0.6);
            if (i === 2 || i === 6) hit(s, at(b - 0.08), "brush", 1);
            hit(s, at(b), "hat", i % 2 ? 0.4 : 0.6);
          } else if (tr.drums === "shaker" && i % 2 === 0 && i > 0) {
            hit(s, at(b), "shaker", 0.8);
          }
        }
      }
      for (const L of [0, 1]) {
        if (!layers.includes("lead" + L)) continue;
        const mel = tr.melody[L];
        const b0 = k * tr.meter, b1 = b0 + tr.meter;
        for (const nt of mel.notes) {
          if (nt.b < b0 - 1e-6 || nt.b >= b1 - 1e-6) continue;
          lead(s, at(nt.b - b0), nt.m, nt.d * beat, 0.8 + Math.random() * 0.2, tr.lead);
        }
      }
    }

    /* agenda: a folga é de meio segundo; cada compasso sai inteiro */
    function pump() {
      if (!S.playing || S.file || !S.sess) return;
      const tr = S.sess.tr;
      const barDur = (tr.meter * 60) / tr.bpm;
      const total = tr.chords.length * tr.form.length;
      while (S.nextBar < ctx.currentTime + 0.5) {
        if (S.bar >= total) {
          /* fim da música: a próxima entra no compasso seguinte */
          const t = S.nextBar;
          drop(S.sess, t);
          S.idx = (S.idx + 1) % TRACKS.length;
          if (TRACKS[S.idx].src) {
            S.sess = null;
            S.bar = 0;
            setTimeout(() => { if (S.playing && !S.file && TRACKS[S.idx].src) { startRec(true); emit(); } }, Math.max(0, (t - ctx.currentTime) * 1000));
            return;
          }
          S.sess = session(TRACKS[S.idx]);
          fade(S.sess, 1, t, 0.05);
          S.bar = 0;
          setTimeout(emit, Math.max(0, (t - ctx.currentTime) * 1000));
          continue;
        }
        scheduleBar(S.sess, S.bar, S.nextBar);
        S.nextBar += barDur;
        S.bar += 1;
      }
    }
    function startTrack(i, fromStart) {
      const t = ctx.currentTime + 0.12;
      if (S.sess) drop(S.sess, ctx.currentTime);
      S.idx = (i + TRACKS.length) % TRACKS.length;
      if (TRACKS[S.idx].src) { S.sess = null; startRec(fromStart); return; }
      stopRec();
      S.sess = session(TRACKS[S.idx]);
      fade(S.sess, 1, t, fromStart ? 0.05 : 1.2);
      S.nextBar = t;
      if (fromStart) S.bar = 0;
    }
    function applyVolume(sec) {
      const t = ctx.currentTime;
      const target = S.playing ? Math.pow(S.volume, 1.6) * 0.9 : 0;
      vol.gain.cancelScheduledValues(t);
      vol.gain.setValueAtTime(vol.gain.value, t);
      vol.gain.linearRampToValueAtTime(target, t + (sec == null ? 0.08 : sec));
      if (recEl) fadeRec(Math.min(1, target), sec == null ? 0.08 : sec);
    }
    /* o elemento de áudio não tem rampa própria: sobe e desce em passos */
    let recFade = null;
    function fadeRec(target, sec) {
      if (recFade) clearInterval(recFade);
      const from = recEl.volume, steps = Math.max(1, Math.round(sec / 0.05));
      let i = 0;
      recFade = setInterval(() => {
        i += 1;
        recEl.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
        if (i >= steps) { clearInterval(recFade); recFade = null; }
      }, 50);
    }

    /* a gravação padrão: um elemento de áudio próprio, fora do grafo do Web
       Audio, para tocar mesmo se o arquivo vier de outra origem; o volume
       segue a mesma curva das músicas sintetizadas */
    let recEl = null;
    function startRec(fromStart) {
      const tr = TRACKS[S.idx];
      if (!recEl) {
        recEl = new Audio();
        recEl.loop = true;
        recEl.preload = "auto";
      }
      if (recEl.dataset.src !== tr.src) { recEl.src = tr.src; recEl.dataset.src = tr.src; }
      else if (fromStart) recEl.currentTime = 0;
      recEl.volume = 0;
      recEl.play().catch(() => {});
    }
    function stopRec() { if (recEl) recEl.pause(); }

    /* arquivo escolhido pela pessoa: toca aqui mesmo, em loop */
    let audioEl = null, audioNode = null;
    function stopFile() {
      if (audioEl) { audioEl.pause(); }
    }

    function emit() { const st = api.state; for (const fn of listeners) fn(st); }

    const api = {
      tracks: TRACKS,
      get state() {
        const tr = TRACKS[S.idx];
        return {
          playing: S.playing,
          index: S.idx,
          count: TRACKS.length,
          file: !!S.file,
          title: S.file ? S.fileName : tr.title,
          author: S.file ? "arquivo seu · toca só neste navegador" : tr.src ? tr.author : `${tr.author} · composta em código`,
          volume: S.volume,
          pausedByUser: S.pausedByUser,
        };
      },
      onChange(fn) { listeners.push(fn); },
      /* fade: segundos de entrada do volume; sem ele, meio segundo */
      play(fade) {
        if (ctx.state === "suspended") ctx.resume();
        S.pausedByUser = false;
        if (S.playing) return;
        S.playing = true;
        if (S.file) {
          audioEl.play().catch(() => {});
        } else {
          startTrack(S.idx, false);
          if (!S.timer) S.timer = setInterval(pump, 90);
          pump();
        }
        applyVolume(fade || 0.6);
        emit();
      },
      pause(byUser) {
        if (!S.playing) return;
        S.playing = false;
        if (byUser !== false) S.pausedByUser = true;
        applyVolume(0.25);
        const s = S.sess;
        if (s) { setTimeout(() => { if (!S.playing && S.sess === s) { drop(s, ctx.currentTime); S.sess = null; } }, 300); }
        if (S.file) setTimeout(() => { if (!S.playing) stopFile(); }, 260);
        stopRec();
        emit();
      },
      toggle() { if (S.playing) api.pause(true); else api.play(); },
      next() {
        stopRec();
        if (S.file) { S.file = null; stopFile(); S.idx = (S.idx + TRACKS.length - 1) % TRACKS.length; }
        S.idx = (S.idx + 1) % TRACKS.length;
        S.bar = 0;
        if (S.playing) { startTrack(S.idx, true); pump(); if (!S.timer) S.timer = setInterval(pump, 90); }
        emit();
      },
      prev() {
        stopRec();
        if (S.file) { S.file = null; stopFile(); S.idx = (S.idx + 1) % TRACKS.length; }
        S.idx = (S.idx + TRACKS.length - 1) % TRACKS.length;
        S.bar = 0;
        if (S.playing) { startTrack(S.idx, true); pump(); if (!S.timer) S.timer = setInterval(pump, 90); }
        emit();
      },
      setVolume(v) { S.volume = Math.max(0, Math.min(1, v)); applyVolume(); emit(); },
      playFile(file) {
        if (!file) return;
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.loop = true;
          audioEl.preload = "auto";
          try { audioNode = ctx.createMediaElementSource(audioEl); audioNode.connect(vol); } catch (e) { audioNode = null; }
        }
        if (audioEl.src) URL.revokeObjectURL(audioEl.src);
        audioEl.src = URL.createObjectURL(file);
        if (S.sess) { drop(S.sess, ctx.currentTime); S.sess = null; }
        stopRec();
        S.file = file;
        S.fileName = file.name.replace(/\.[a-z0-9]+$/i, "");
        S.playing = false;
        api.play();
      },
      /* só para testes: agenda sem relógio, para renderizar fora do tempo real */
      renderInto(i, seconds, startBar) {
        if (TRACKS[i].src) return 0;
        const s = session(TRACKS[i]);
        fade(s, 1, 0, 0.01);
        const tr = TRACKS[i];
        const barDur = (tr.meter * 60) / tr.bpm;
        let n = startBar || 0;
        for (let t = 0.05; t < seconds; t += barDur) { scheduleBar(s, n, t); n += 1; }
        vol.gain.cancelScheduledValues(0);
        vol.gain.setValueAtTime(Math.pow(S.volume, 1.6) * 0.9, 0);
        return n;
      },
    };
    return api;
  }

  window.NekoTrilha = { create, TRACKS };
})();
