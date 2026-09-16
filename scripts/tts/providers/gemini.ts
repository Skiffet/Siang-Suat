import { GoogleGenAI } from "@google/genai";
import type { SpeechPlan } from "../plan";
import {
  estimateSegmentStarts,
  type SynthesisResult,
  type TtsProvider,
} from "./types";
import { pcmToWav, wavDurationSec } from "../audio";

/**
 * Gemini TTS via the Google AI Studio API.
 *
 * It takes delivery direction as plain language instead of SSML, which suits
 * chanting well — "read slowly and reverently" lands better than a rate
 * percentage. The trade-off is that it reports no timings, so line starts are
 * estimated, and it returns raw PCM rather than MP3.
 */
const DEFAULT_MODEL =
  process.env.GEMINI_TTS_MODEL ?? "gemini-3.1-flash-tts-preview";
const DEFAULT_VOICE = "Kore";

/** Gemini returns signed 16-bit little-endian PCM, mono, at 24 kHz. */
const SAMPLE_RATE = 24000;

export const geminiProvider: TtsProvider = {
  id: "gemini",
  credentialHint:
    "ตั้ง GEMINI_API_KEY (ขอฟรีได้ที่ https://aistudio.google.com/apikey)",

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  },

  async synthesize(plan: SpeechPlan): Promise<SynthesisResult> {
    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    const ai = new GoogleGenAI({ apiKey });
    const voiceName = plan.voiceName ?? DEFAULT_VOICE;

    const direction =
      plan.styleHint ??
      "อ่านช้า ๆ ด้วยน้ำเสียงสงบและเคารพ แบบการสวดมนต์ เว้นจังหวะระหว่างวรรคให้ชัดเจน";

    // One line per segment. Gemini honours line breaks as breathing points,
    // and an ellipsis lengthens the pause where the chant asks for one.
    const script = plan.segments
      .filter((s) => s.kind !== "silence")
      .map((s) => (s.pauseAfterMs >= 1000 ? `${s.spokenText} ...` : s.spokenText))
      .join("\n");

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [{ role: "user", parts: [{ text: `${direction}\n\n${script}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data,
    );
    if (!part?.inlineData?.data) {
      throw new Error(
        "Gemini ไม่ได้ส่งเสียงกลับมา — ตรวจว่าโมเดลที่ตั้งไว้รองรับ TTS",
      );
    }

    const audio = pcmToWav(Buffer.from(part.inlineData.data, "base64"), {
      sampleRate: SAMPLE_RATE,
    });

    return {
      audio,
      ext: "wav",
      // Gemini reports no word or mark timings, so follow-along uses estimates.
      segmentStarts: estimateSegmentStarts(plan, wavDurationSec(audio)),
      voiceLabel: `${voiceName} (${DEFAULT_MODEL})`,
    };
  },
};
