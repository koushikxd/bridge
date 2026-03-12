import { createWorker } from "tesseract.js"

import type { PreferredLanguage } from "@/lib/contracts/profile"

export type OcrImageInput = {
  imageUrl: string
  preferredLanguage?: PreferredLanguage
}

export type OcrResult = {
  text: string
  confidence: number
}

const languageMap: Record<PreferredLanguage, string[]> = {
  en: ["eng"],
  es: ["spa", "eng"],
  fr: ["fra", "eng"],
  hi: ["hin", "eng"],
  ar: ["ara", "eng"],
  ta: ["tam", "eng"],
}

/**
 * Extract text from an image using Tesseract.js.
 * Used as Tier 2 fallback when Gemini Vision fails.
 * Selects languages based on user's preferred language instead of loading all.
 */
export async function extractImageText(
  input: OcrImageInput
): Promise<OcrResult> {
  const langs = input.preferredLanguage
    ? languageMap[input.preferredLanguage]
    : ["eng", "jpn", "chi_sim", "spa", "fra"]
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null

  try {
    worker = await createWorker(langs)
    const result = await worker.recognize(input.imageUrl)

    return {
      text: result.data.text.trim(),
      confidence: Number(result.data.confidence ?? 0),
    }
  } catch {
    return {
      text: "",
      confidence: 0,
    }
  } finally {
    if (worker) {
      await worker.terminate().catch(() => undefined)
    }
  }
}
