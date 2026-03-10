import type { WorkerOptions } from "tesseract.js"

export type OcrImageInput = {
  imageUrl: string
  options?: Partial<WorkerOptions>
}

export function isImageOcrReady() {
  return true
}

export async function extractImageText(input: OcrImageInput) {
  void input

  throw new Error(
    "Image OCR is scaffolded for Phase 1 but not enabled until the upload flow is built."
  )
}
