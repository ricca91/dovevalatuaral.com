// Deterministic synth for the promo: 128 BPM, 16 bars = 30.0s BGM + SFX one-shots.
// No external samples; a seeded PRNG drives the noise so every run is identical.
import { writeFileSync } from "node:fs";
const SR = 44100, BPM = 128, BEAT = 60 / BPM, BAR = BEAT * 4;
let seed = 1234567;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
function wav(path, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(path, buf);
}
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function track(sec) { return [new Float32Array(Math.ceil(sec * SR)), new Float32Array(Math.ceil(sec * SR))]; }
function add(T, t0, fn, len, pan = 0, gain = 1) {
  const [L, R] = T, s0 = Math.floor(t0 * SR), n = Math.floor(len * SR);
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan);
  for (let i = 0; i < n && s0 + i < L.length; i++) { const v = fn(i / SR); L[s0 + i] += v * gl; R[s0 + i] += v * gr; }
}
// --- voices ---
const kick = (t) => { const f = 45 + 110 * Math.exp(-t * 28); return Math.sin(2 * Math.PI * f * t - 0) * Math.exp(-t * 7) * 0.95 + (t < 0.004 ? rnd() * 0.3 : 0); };
function kickPh() { let ph = 0, last = 0; return (t) => { const f = 45 + 120 * Math.exp(-t * 30); ph += 2 * Math.PI * f / SR; return Math.sin(ph) * Math.exp(-t * 6.5) * 0.95; }; }
const hat = (open) => (t) => rnd() * Math.exp(-t * (open ? 18 : 70)) * 0.22;
const clap = (t) => { let e = 0; for (const d of [0, 0.011, 0.022]) if (t >= d) e += Math.exp(-(t - d) * (d === 0.022 ? 14 : 90)); return rnd() * e * 0.35; };
function bassNote(m, len) { const f = mtof(m); let ph = 0; return (t) => { ph += f / SR; const saw = 2 * (ph % 1) - 1; const sq = Math.sin(2 * Math.PI * f * t); const env = Math.min(1, t * 200) * Math.exp(-t * 3.5) * (t > len - 0.02 ? Math.max(0, (len - t) / 0.02) : 1); return (saw * 0.35 + sq * 0.65) * env * 0.42; }; }
function stab(ms, len) { const fs = ms.map(mtof); return (t) => { let v = 0; for (const f of fs) for (const dt of [-0.12, 0, 0.12]) { const ff = f * Math.pow(2, dt / 12); v += 2 * ((ff * t) % 1) - 1; } const env = Math.min(1, t * 300) * Math.exp(-t * 9); return v / (fs.length * 3) * env * 0.33; }; }
function lead(m, len) { const f = mtof(m); return (t) => { const vib = 1 + 0.004 * Math.sin(2 * Math.PI * 5.5 * t); const sq = Math.sign(Math.sin(2 * Math.PI * f * vib * t)); const env = Math.min(1, t * 150) * Math.exp(-t * 2.2) * (t > len - 0.03 ? Math.max(0, (len - t) / 0.03) : 1); return sq * env * 0.07; }; }
const riser = (len) => (t) => rnd() * Math.pow(t / len, 2.2) * 0.28 + Math.sin(2 * Math.PI * (200 + 1400 * Math.pow(t / len, 2)) * t) * Math.pow(t / len, 3) * 0.05;
const crash = (t) => rnd() * Math.exp(-t * 2.4) * 0.22;
// --- BGM arrangement (16 bars) ---
const DUR = 30.0, M = track(DUR + 1.5);
// chord roots per bar: Am F C G (minor, driving)
const prog = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
const bassRoot = [45, 41, 48, 43];
for (let bar = 0; bar < 16; bar++) {
  const t0 = bar * BAR, c = bar % 4;
  const drop = bar >= 2;                 // intro 2 bars: kick + stabs only
  const breakdown = bar === 10;          // the "error" bar: half-time drop-out
  const outroFull = bar >= 12;
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * BEAT;
    if (!(breakdown && b % 2 === 1)) add(M, tb, kickPh(), 0.5, 0, breakdown ? 0.6 : 0.78);
    if (drop && !breakdown) { add(M, tb + BEAT / 2, hat(true), 0.2, 0.3, 1.5); add(M, tb + BEAT / 4, hat(false), 0.05, -0.3); add(M, tb + 3 * BEAT / 4, hat(false), 0.05, -0.3); }
    if (drop && (b === 1 || b === 3) && !breakdown) add(M, tb, clap, 0.35, 0, 1);
  }
  // bass: offbeat 8ths driving
  if (drop && !breakdown) for (let e = 0; e < 8; e++) { const m = bassRoot[c] + (e === 7 ? 12 : 0); add(M, t0 + e * BEAT / 2, bassNote(m, BEAT / 2 * 0.9), BEAT / 2 * 0.9); }
  if (breakdown) add(M, t0, bassNote(bassRoot[c] - 12 + 12, BAR * 0.9), BAR * 0.9, 0, 0.8);
  // stabs on the "and" of 1, and 3
  for (const pos of [0, 0.75, 2.5]) add(M, t0 + pos * BEAT, stab(prog[c], 0.3), 0.3, pos === 0.75 ? -0.4 : 0.4, drop ? 1 : 1.2);
  // lead hook bars 4-9 and 12-15
  if ((bar >= 4 && bar < 10) || outroFull) {
    const hook = [[0, 76, 0.5], [0.5, 79, 0.5], [1, 81, 1], [2, 79, 0.5], [2.5, 76, 0.5], [3, 74, 1]];
    for (const [p, m, l] of hook) add(M, t0 + p * BEAT, lead(m - (c === 1 ? 4 : c === 3 ? -2 : 0), l * BEAT), l * BEAT, 0.15);
  }
}
// risers into the drop (bar 2), into the error (bar 10) and into the CTA (bar 14)
add(M, 2 * BAR - BAR, riser(BAR), BAR, 0, 0.9);
add(M, 10 * BAR - BAR / 2, riser(BAR / 2), BAR / 2, 0, 0.9);
add(M, 14 * BAR - BAR, riser(BAR), BAR, 0, 1);
for (const b of [2, 6, 11, 14]) add(M, b * BAR, crash, 1.6, 0, 1);
// final hit + tail
add(M, DUR - 0.47, kickPh(), 0.8, 0, 1.1); add(M, DUR - 0.47, stab(prog[0], 1.2), 1.2, 0, 1.3);
// master: soft clip + fade out last 0.4s
for (const ch of M) for (let i = 0; i < ch.length; i++) { const t = i / SR; let v = Math.tanh(ch[i] * 1.25) * 0.9; if (t > DUR - 0.2) v *= Math.max(0, (DUR + 1.0 - t) / 1.2); ch[i] = v; }
wav(new URL("../assets/bgm/netto-beat-128.wav", import.meta.url).pathname, M[0], M[1]);
// --- SFX ---
function one(name, len, fn) { const T = track(len); add(T, 0, fn, len); for (const ch of T) for (let i = 0; i < ch.length; i++) ch[i] = Math.tanh(ch[i]); wav(new URL(`../assets/sfx/${name}.wav`, import.meta.url).pathname, T[0], T[1]); }
one("whoosh", 0.45, (t) => { const x = t / 0.45; return rnd() * Math.sin(Math.PI * x) * 0.5 * (0.5 + 0.5 * Math.sin(2 * Math.PI * (300 + 2000 * x) * t)); });
one("impact", 0.9, (t) => kick(t) * 1.1 + rnd() * Math.exp(-t * 12) * 0.25);
one("ding", 0.8, (t) => (Math.sin(2 * Math.PI * 1318.5 * t) + 0.6 * Math.sin(2 * Math.PI * 1975.5 * t) * (t > 0.08 ? 1 : 0)) * Math.exp(-t * 5) * 0.4);
one("error", 0.7, (t) => Math.sign(Math.sin(2 * Math.PI * (140 - 40 * t) * t)) * Math.exp(-t * 3) * 0.35 + Math.sign(Math.sin(2 * Math.PI * 147 * t)) * Math.exp(-t * 3) * 0.2);
one("tick", 0.08, (t) => Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 60) * 0.5);
one("pop", 0.2, (t) => Math.sin(2 * Math.PI * (900 - 2500 * t) * t) * Math.exp(-t * 25) * 0.6);
console.log("ok");
// 12 ticks on the eighths, rising pitch — the streak counter (frame 4)
{
  const E = BEAT / 2, T = track(E * 12 + 0.2);
  for (let i = 0; i < 12; i++) { const f = 1200 * Math.pow(2, i / 12); add(T, i * E, (t) => Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 45) * 0.55, 0.12); }
  for (const ch of T) for (let i = 0; i < ch.length; i++) ch[i] = Math.tanh(ch[i]);
  wav(new URL("../assets/sfx/tick-run.wav", import.meta.url).pathname, T[0], T[1]);
}
