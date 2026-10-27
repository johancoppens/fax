// Round-trip test of the fax core: synthesise a whole call, decode it from the audio
// and check that every frame, the training check and every scan line come back intact.
// Run: node test/roundtrip.js
'use strict';
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'faxlijn.html'), 'utf8');
const core = html.match(/<script id="core">([\s\S]*?)<\/script>/)[1];
const api = new Function(core + '; return { WIDTH, SR, FCF, buildCall, Monitor };')();
const { WIDTH, SR, FCF, buildCall, Monitor } = api;

const L = 481, rows = [];
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296;
for (let r = 0; r < L; r++) {
  const row = new Uint8Array(WIDTH);
  if (r % 3) { let x = 0; while (x < WIDTH) { const n = 1 + Math.floor(rnd() * (r % 7 ? 40 : 900)); if (rnd() < 0.4) row.fill(1, x, Math.min(WIDTH, x + n)); x += n; } }
  rows.push(row);
}
const call = buildCall(rows);
const got = [], frames = [];
let tcf = null, rtc = false;
const ui = {
  phase() {}, phaseEnd() {}, tone() {}, fskBit() {}, sym() {}, dataBit() {}, run() {}, eol() {},
  frame(f, s) { frames.push([FCF[f.fcf] ? FCF[f.fcf][0] : '?', f.ok, s.who]); },
  tcf(n, e) { tcf = [n, e]; },
  line(r, ok) { got.push([r.slice(), ok]); },
  rtc() { rtc = true; },
};
const m = new Monitor(call, ui);
for (let p = 0; p <= call.audio.length; p += 400) m.run(p);
m.run(call.audio.length);

const fail = [];
const names = frames.map(f => f[0]).join(' ');
if (names !== 'CSI DIS TSI DCS CFR EOP MCF DCN') fail.push('frames: ' + names);
if (!frames.every(f => f[1])) fail.push('a frame failed its CRC');
if (!tcf || tcf[1] !== 0) fail.push('TCF: ' + JSON.stringify(tcf));
if (!rtc) fail.push('no RTC');
if (got.length !== L) fail.push(`lines: ${got.length} of ${L}`);
const bad = got.filter(([r, ok], i) => !ok || r.some((v, j) => v !== rows[i][j])).length;
if (bad) fail.push(`${bad} lines differ`);
console.log(`call ${(call.audio.length / SR).toFixed(1)} s, image ${call.imageBits} bits, ${got.length} lines, ${bad} bad`);
if (fail.length) { console.error('FAIL\n' + fail.join('\n')); process.exit(1); }
console.log('OK');
