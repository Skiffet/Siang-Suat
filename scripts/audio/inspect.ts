/**
 * Scan a WAV for where the real audio stops.
 *
 * Gemini's streaming TTS sometimes keeps emitting empty PCM after the last
 * spoken word, leaving a file that is minutes longer than the take. This
 * prints an RMS profile so the tail can be cut at the right place.
 */
import { readFileSync } from "node:fs";
import { decodeWav } from "../tts/dsp";

const path = process.argv[2];
const { samples, sampleRate } = decodeWav(readFileSync(path));
const win = sampleRate; // one second per bucket

const rms: number[] = [];
for (let i = 0; i < samples.length; i += win) {
  let sum = 0;
  const end = Math.min(i + win, samples.length);
  for (let j = i; j < end; j++) sum += samples[j] * samples[j];
  rms.push(Math.sqrt(sum / (end - i)));
}

const peak = Math.max(...rms);
const floor = peak * 0.01; // 1% of peak = silence for our purposes

let lastLoud = -1;
for (let i = 0; i < rms.length; i++) if (rms[i] > floor) lastLoud = i;

console.log(`file            ${path}`);
console.log(`duration        ${(samples.length / sampleRate).toFixed(1)}s`);
console.log(`peak rms        ${peak.toFixed(5)}`);
console.log(`last audible    ${lastLoud}s`);
console.log(`silent tail     ${(samples.length / sampleRate - lastLoud).toFixed(1)}s`);
console.log("");
console.log("per-second rms (· silent, ▁▂▃▅▇ loud):");
const glyph = (v: number) => {
  if (v <= floor) return "·";
  const r = v / peak;
  return r < 0.15 ? "▁" : r < 0.3 ? "▂" : r < 0.5 ? "▃" : r < 0.75 ? "▅" : "▇";
};
for (let i = 0; i < rms.length; i += 60) {
  const mins = String(Math.floor(i / 60)).padStart(3, " ");
  console.log(`${mins}m ${rms.slice(i, i + 60).map(glyph).join("")}`);
}
