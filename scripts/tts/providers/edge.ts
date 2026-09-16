import { createHash, randomUUID } from "node:crypto";
import WebSocket from "ws";
import type { SpeechPlan } from "../plan";
import { escapeSsml, type SynthesisResult, type TtsProvider } from "./types";
import { mp3DurationSec } from "../audio";

/**
 * Microsoft Edge's read-aloud voices.
 *
 * Free and keyless, which makes it the fastest way to hear a draft. It is an
 * undocumented endpoint though, so it can change without notice — DESIGN.md §6
 * marks it as a drafting tool, not something to ship on.
 *
 * Its SSML support is narrower than Azure's: multiple <prosody> elements are
 * accepted, but <break> and <bookmark> are both rejected outright with
 * "SSML is invalid". Pauses are therefore produced here rather than asked for —
 * each line is synthesised on its own and the gaps are filled with silent MPEG
 * frames. That also means every line's start time is measured rather than
 * estimated, so follow-along highlighting is exact.
 */
const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const BASE_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

/**
 * The endpoint rejects clients below a moving minimum version with a 403 — as
 * of this writing anything under 133 is refused. Override with EDGE_TTS_VERSION
 * if that floor rises again.
 */
const CHROMIUM_VERSION = process.env.EDGE_TTS_VERSION ?? "145.0.3700.40";
const DEFAULT_VOICE = "th-TH-PremwadeeNeural";

/** Matches the outputFormat requested below: MPEG-2 Layer III, 24 kHz, 48 kbps, mono. */
const FRAME_BYTES = 144;
const FRAME_MS = 24; // 576 samples at 24 kHz

/**
 * Every clip comes back wrapped in silence the service adds itself — measured
 * at roughly 0.22 s before the voice and 0.95 s after, in unstretched time.
 * <prosody rate> stretches that padding along with the speech, so the amount to
 * remove scales with 1/rate.
 *
 * Left in place it would swamp the authored rhythm: a 700 ms gap between lines
 * arrives as 2.3 s. These figures are trimmed back conservatively so a soft
 * final syllable is never clipped — a little residual silence is harmless,
 * cutting a word is not.
 */
const LEAD_PAD_SEC = 0.18;
const TRAIL_PAD_SEC = 0.9;
/** Never trim a clip below this; a guard against a very short utterance. */
const MIN_KEPT_SEC = 0.2;

export const edgeProvider: TtsProvider = {
  id: "edge",
  credentialHint: "ไม่ต้องใช้ key",
  isConfigured: () => true,

  async synthesize(plan: SpeechPlan): Promise<SynthesisResult> {
    const voiceName = plan.voiceName ?? DEFAULT_VOICE;
    const parts: Buffer[] = [];
    const starts: number[] = [];
    let elapsed = 0;

    // Repeated passes speak identical text, so synthesise each distinct line
    // once and reuse the audio. A three-round chant costs three requests, not nine.
    const cache = new Map<string, Buffer>();

    for (const seg of plan.segments) {
      starts.push(elapsed);

      if (seg.kind !== "silence" && seg.spokenText.trim().length > 0) {
        const key = `${seg.spokenText}|${seg.rate}|${plan.pitch}`;
        let audio = cache.get(key);
        if (!audio) {
          const raw = await synthesizeLine(
            seg.spokenText,
            seg.rate,
            plan.pitch,
            voiceName,
          );
          audio = trimPadding(raw, seg.rate);
          cache.set(key, audio);
        }
        parts.push(audio);
        elapsed += mp3DurationSec(audio);
      }

      if (seg.pauseAfterMs > 0) {
        const silence = silentFrames(seg.pauseAfterMs);
        parts.push(silence);
        elapsed += (silence.length / FRAME_BYTES) * (FRAME_MS / 1000);
      }
    }

    return {
      audio: Buffer.concat(parts),
      ext: "mp3",
      segmentStarts: starts.map((t) => Number(t.toFixed(3))),
      voiceLabel: voiceName,
    };
  },
};

/**
 * Drop the service's own leading and trailing silence, whole frames at a time,
 * so the pauses written in the chant are the pauses you hear.
 */
export function trimPadding(audio: Buffer, rate: number): Buffer {
  const totalFrames = Math.floor(audio.length / FRAME_BYTES);
  const toFrames = (sec: number) => Math.floor(sec / rate / (FRAME_MS / 1000));

  let lead = toFrames(LEAD_PAD_SEC);
  let trail = toFrames(TRAIL_PAD_SEC);
  const minFrames = Math.ceil(MIN_KEPT_SEC / (FRAME_MS / 1000));

  if (totalFrames - lead - trail < minFrames) {
    // Scale both back proportionally rather than dropping the trim entirely.
    const spare = Math.max(0, totalFrames - minFrames);
    const wanted = lead + trail;
    lead = wanted > 0 ? Math.floor((lead / wanted) * spare) : 0;
    trail = wanted > 0 ? Math.floor((trail / wanted) * spare) : 0;
  }

  return audio.subarray(lead * FRAME_BYTES, (totalFrames - trail) * FRAME_BYTES);
}

/**
 * A run of silent MPEG frames. An all-zero frame body decodes to silence, so
 * the gap costs 144 bytes per 24 ms and needs no encoder.
 */
function silentFrames(ms: number): Buffer {
  const count = Math.max(0, Math.round(ms / FRAME_MS));
  const frame = Buffer.alloc(FRAME_BYTES);
  // FF F3 64 C0 — sync, MPEG-2, Layer III, 48 kbps, 24 kHz, mono, no CRC.
  frame[0] = 0xff;
  frame[1] = 0xf3;
  frame[2] = 0x64;
  frame[3] = 0xc0;
  return Buffer.concat(Array.from({ length: count }, () => frame));
}

function buildSsml(
  text: string,
  rate: number,
  pitchSemitones: number,
  voiceName: string,
): string {
  // Edge wants a signed delta, not an absolute rate.
  const delta = Math.round((rate - 1) * 100);
  const rateAttr = `${delta >= 0 ? "+" : ""}${delta}%`;
  const pitchAttr = `${pitchSemitones >= 0 ? "+" : ""}${pitchSemitones}st`;

  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='th-TH'>` +
    `<voice name='${voiceName}'>` +
    `<prosody rate='${rateAttr}' pitch='${pitchAttr}'>${escapeSsml(text)}</prosody>` +
    `</voice></speak>`
  );
}

/**
 * The endpoint requires a rolling signature derived from the current
 * five-minute window and the public client token.
 */
function securityToken(): string {
  const WINDOWS_EPOCH_OFFSET = 11_644_473_600; // seconds between 1601 and 1970
  const nowSec = Math.floor(Date.now() / 1000) + WINDOWS_EPOCH_OFFSET;
  const windowed = nowSec - (nowSec % 300);
  return createHash("sha256")
    .update(`${windowed * 1e7}${TRUSTED_CLIENT_TOKEN}`)
    .digest("hex")
    .toUpperCase();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * The endpoint wants a JavaScript `Date.toString()`-shaped timestamp and closes
 * the socket with 1007 on anything else — an ISO string is rejected.
 */
function edgeTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${DAYS[d.getUTCDay()]} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCDate())} ` +
    `${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:` +
    `${pad(d.getUTCSeconds())} GMT+0000 (Coordinated Universal Time)`
  );
}

export function synthesizeLine(
  text: string,
  rate: number,
  pitch: number,
  voiceName: string,
): Promise<Buffer> {
  const connectionId = randomUUID().replace(/-/g, "");
  const major = CHROMIUM_VERSION.split(".")[0];
  const url =
    `${BASE_URL}?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
    `&Sec-MS-GEC=${securityToken()}` +
    `&Sec-MS-GEC-Version=1-${CHROMIUM_VERSION}` +
    `&ConnectionId=${connectionId}`;

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url, {
      headers: {
        Pragma: "no-cache",
        "Cache-Control": "no-cache",
        Origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          `(KHTML, like Gecko) Chrome/${major}.0.0.0 Safari/537.36 Edg/${major}.0.0.0`,
      },
    });

    const chunks: Buffer[] = [];
    let settled = false;
    const timer = setTimeout(() => {
      ws.terminate();
      finish(new Error("Edge TTS ไม่ตอบกลับภายใน 60 วินาที"));
    }, 60_000);

    function finish(err?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {
        // Already closing; nothing useful to do.
      }
      if (err) reject(err);
      else resolve(Buffer.concat(chunks));
    }

    ws.on("open", () => {
      ws.send(
        `X-Timestamp:${edgeTimestamp()}\r\n` +
          "Content-Type:application/json; charset=utf-8\r\n" +
          "Path:speech.config\r\n\r\n" +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: "false",
                    wordBoundaryEnabled: "false",
                  },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3",
                },
              },
            },
          }) +
          "\r\n",
      );

      ws.send(
        `X-RequestId:${connectionId}\r\n` +
          "Content-Type:application/ssml+xml\r\n" +
          // The trailing Z is wrong but required; the server rejects it without.
          `X-Timestamp:${edgeTimestamp()}Z\r\n` +
          "Path:ssml\r\n\r\n" +
          buildSsml(text, rate, pitch, voiceName),
      );
    });

    ws.on("message", (data: Buffer, isBinary: boolean) => {
      if (isBinary) {
        // Two-byte big-endian header length, then the header, then audio.
        if (data.length < 2) return;
        const headerLength = data.readUInt16BE(0);
        if (data.toString("utf8", 2, 2 + headerLength).includes("Path:audio")) {
          chunks.push(data.subarray(2 + headerLength));
        }
        return;
      }
      if (data.toString("utf8").includes("Path:turn.end")) finish();
    });

    ws.on("error", (err) => finish(err as Error));
    ws.on("close", (code, reason) => {
      if (chunks.length > 0) finish();
      else
        finish(
          new Error(
            `Edge TTS ปิดการเชื่อมต่อก่อนส่งเสียง (code ${code}${
              reason?.length ? `: ${reason.toString()}` : ""
            })`,
          ),
        );
    });
  });
}
