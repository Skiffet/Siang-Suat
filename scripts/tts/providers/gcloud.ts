import { protos, v1beta1 } from "@google-cloud/text-to-speech";
import type { SpeechPlan } from "../plan";
import {
  escapeSsml,
  estimateSegmentStarts,
  type SynthesisResult,
  type TtsProvider,
} from "./types";
import { mp3DurationSec } from "../audio";

/**
 * Google Cloud Text-to-Speech.
 *
 * The v1beta1 client is used rather than v1 because only it exposes SSML mark
 * timepoints, which is how the player knows exactly when each line starts.
 */
const DEFAULT_VOICE = "th-TH-Neural2-C";

type SynthesizeRequest =
  protos.google.cloud.texttospeech.v1beta1.ISynthesizeSpeechRequest;
type Timepoint = protos.google.cloud.texttospeech.v1beta1.ITimepoint;

const { TimepointType } =
  protos.google.cloud.texttospeech.v1beta1.SynthesizeSpeechRequest;

export const gcloudProvider: TtsProvider = {
  id: "gcloud",
  credentialHint:
    "ตั้ง GOOGLE_APPLICATION_CREDENTIALS ให้ชี้ไปที่ไฟล์ service account JSON " +
    "(หรือรัน `gcloud auth application-default login`)",

  isConfigured() {
    return Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.GCLOUD_PROJECT ||
        process.env.GOOGLE_CLOUD_PROJECT,
    );
  },

  async synthesize(plan: SpeechPlan): Promise<SynthesisResult> {
    const client = new v1beta1.TextToSpeechClient();
    const voiceName = plan.voiceName ?? DEFAULT_VOICE;

    const body = plan.segments
      .map((seg, i) => {
        const mark = `<mark name="s${i}"/>`;
        const pause =
          seg.pauseAfterMs > 0 ? `<break time="${seg.pauseAfterMs}ms"/>` : "";
        if (seg.kind === "silence") return `${mark}${pause}`;

        const rate = `${Math.round(seg.rate * 100)}%`;
        return `${mark}<prosody rate="${rate}">${escapeSsml(seg.spokenText)}</prosody>${pause}`;
      })
      .join("");

    const pitch = plan.pitch ? ` pitch="${plan.pitch}st"` : "";
    const ssml = pitch
      ? `<speak><prosody${pitch}>${body}</prosody></speak>`
      : `<speak>${body}</speak>`;

    const request: SynthesizeRequest = {
      input: { ssml },
      voice: { languageCode: "th-TH", name: voiceName },
      audioConfig: {
        audioEncoding: "MP3",
        effectsProfileId: ["headphone-class-device"],
      },
      // Only v1beta1 reports these, and they are what makes follow-along exact.
      enableTimePointing: [TimepointType.SSML_MARK],
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error("Google Cloud TTS ไม่ได้ส่งเสียงกลับมา");
    }
    const audio = Buffer.from(response.audioContent as Uint8Array);

    // Marks are returned in document order, but map by name so a dropped mark
    // shifts nothing.
    const byName = new Map(
      (response.timepoints ?? []).map((tp: Timepoint) => [
        tp.markName,
        tp.timeSeconds,
      ]),
    );
    const starts = plan.segments.map((_, i) => byName.get(`s${i}`));
    const haveAll = starts.every((t) => typeof t === "number");

    return {
      audio,
      ext: "mp3",
      segmentStarts: haveAll
        ? (starts as number[])
        : estimateSegmentStarts(plan, mp3DurationSec(audio)),
      voiceLabel: voiceName,
    };
  },
};
