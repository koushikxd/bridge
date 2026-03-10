import { createWorker, type WorkerOptions } from "tesseract.js"

export type OcrImageInput = {
  imageUrl: string
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

  try {
    const worker = await createWorker("eng")
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
