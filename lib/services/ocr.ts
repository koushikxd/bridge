import { createWorker, type WorkerOptions } from "tesseract.js"

export type OcrImageInput = {
  imageUrl: string
  languages?: string[]
  options?: Partial<WorkerOptions>
}

export type OcrResult = {
  text: string
  confidence: number
}

export function isImageOcrReady() {
  return true
}

export async function extractImageText(
  input: OcrImageInput
): Promise<OcrResult> {
  void input.options
  const languages = input.languages?.length
    ? input.languages
    : ["eng", "spa", "fra", "deu", "ita", "por", "jpn", "chi_sim"]

  try {
    const worker = await createWorker(languages)
    const result = await worker.recognize(input.imageUrl)
    await worker.terminate()

    return {
      text: result.data.text.trim(),
      confidence: Number(result.data.confidence ?? 0),
    }
  } catch {
    return {
      text: "",
      confidence: 0,
    }
  }
}
