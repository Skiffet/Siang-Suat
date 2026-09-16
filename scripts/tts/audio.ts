/**
 * Minimal audio helpers. ffmpeg is not assumed to be installed, so duration is
 * read straight out of the container and Gemini's raw PCM is wrapped by hand.
 */

const MPEG1_L3_BITRATES = [
  0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0,
];
const MPEG2_L3_BITRATES = [
  0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0,
];
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG 1
  2: [22050, 24000, 16000], // MPEG 2
  0: [11025, 12000, 8000], // MPEG 2.5
};

/**
 * Walk the MPEG frame headers and total up the frame durations.
 *
 * Summing frames rather than dividing file size by a nominal bitrate is what
 * keeps variable-bitrate output honest — and every provider here returns VBR.
 */
export function mp3DurationSec(buf: Buffer): number {
  let offset = skipId3(buf);
  let seconds = 0;
  let frames = 0;

  while (offset + 4 <= buf.length) {
    // Frame sync: eleven set bits.
    if (buf[offset] !== 0xff || (buf[offset + 1] & 0xe0) !== 0xe0) {
      offset += 1;
      continue;
    }

    const versionBits = (buf[offset + 1] >> 3) & 0x03;
    const layerBits = (buf[offset + 1] >> 1) & 0x03;
    const bitrateIndex = (buf[offset + 2] >> 4) & 0x0f;
    const sampleRateIndex = (buf[offset + 2] >> 2) & 0x03;
    const padding = (buf[offset + 2] >> 1) & 0x01;

    // Layer III only (layerBits === 1); anything else is not what we generate.
    if (versionBits === 1 || layerBits !== 1 || sampleRateIndex === 3) {
      offset += 1;
      continue;
    }

    const isMpeg1 = versionBits === 3;
    const bitrate =
      (isMpeg1 ? MPEG1_L3_BITRATES : MPEG2_L3_BITRATES)[bitrateIndex] * 1000;
    const sampleRate = SAMPLE_RATES[versionBits]?.[sampleRateIndex];
    if (!bitrate || !sampleRate) {
      offset += 1;
      continue;
    }

    const samplesPerFrame = isMpeg1 ? 1152 : 576;
    const frameLength =
      Math.floor((samplesPerFrame / 8) * (bitrate / sampleRate)) + padding;
    if (frameLength <= 0) {
      offset += 1;
      continue;
    }

    seconds += samplesPerFrame / sampleRate;
    frames += 1;
    offset += frameLength;
  }

  if (frames === 0) throw new Error("ไม่พบเฟรม MP3 ที่อ่านได้ในไฟล์เสียง");
  return seconds;
}

/** ID3v2 tags sit before the first frame and would otherwise look like garbage. */
function skipId3(buf: Buffer): number {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "ID3") return 0;
  // Size is four seven-bit bytes.
  const size =
    ((buf[6] & 0x7f) << 21) |
    ((buf[7] & 0x7f) << 14) |
    ((buf[8] & 0x7f) << 7) |
    (buf[9] & 0x7f);
  return 10 + size;
}

export function wavDurationSec(buf: Buffer): number {
  const byteRate = buf.readUInt32LE(28);
  const dataSize = buf.readUInt32LE(40);
  return dataSize / byteRate;
}

export function durationSec(buf: Buffer, ext: "mp3" | "wav"): number {
  return ext === "mp3" ? mp3DurationSec(buf) : wavDurationSec(buf);
}

/** Wrap raw little-endian PCM in a 44-byte RIFF header so browsers will play it. */
export function pcmToWav(
  pcm: Buffer,
  { sampleRate = 24000, channels = 1, bitsPerSample = 16 } = {},
): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;

  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}
