import { google } from "@ai-sdk/google"
import { generateObject } from "ai"

import {
  artifactAnalysisRequestSchema,
  structuredAnalysisResultSchema,
  type ArtifactAnalysisRequest,
  type StructuredAnalysisResult,
} from "@/lib/contracts/analysis"
import { preferredLanguageLabels } from "@/lib/contracts/profile"

export const bridgeAnalysisModel = google("gemini-2.5-flash")

export function isAiAnalysisConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

function buildFallbackAnalysis(
  input: ArtifactAnalysisRequest
): StructuredAnalysisResult {
  const text = input.extractedText?.trim()

  if (!text) {
    return {
      detectedItem: input.artifactType.replaceAll("_", " "),
      safetyStatus: "unknown",
      whyFlagged:
        "Bridge could not read enough text from this image yet, so the result is limited.",
      suggestedNextAction:
        "Retake the photo in brighter light or upload a clearer image for a better explanation.",
      confidence: 0.26,
    }
  }

  const hasRiskKeyword =
    /allergy|warning|avoid|sugar|salt|expired|interaction/i.test(text)

  return {
    detectedItem: text.split(/\n|\./)[0]?.slice(0, 80) || "Scanned item",
    safetyStatus: hasRiskKeyword ? "caution" : "unknown",
    whyFlagged: hasRiskKeyword
      ? "Bridge found words that may point to warnings, ingredients, or medicine instructions that need a closer look."
      : "Bridge extracted some text, but the result still needs a clearer image or AI analysis for a stronger safety verdict.",
    suggestedNextAction: hasRiskKeyword
      ? "Review the highlighted text carefully and confirm any unclear instructions with a doctor, pharmacist, or caregiver."
      : "Use this as a quick summary only and upload a clearer image if you need a more confident explanation.",
    confidence: hasRiskKeyword ? 0.52 : 0.38,
  }
}

export async function analyzeArtifact(
  input: ArtifactAnalysisRequest
): Promise<StructuredAnalysisResult> {
  artifactAnalysisRequestSchema.parse(input)

  if (!isAiAnalysisConfigured()) {
    return buildFallbackAnalysis(input)
  }

  try {
    const result = await generateObject({
      model: bridgeAnalysisModel,
      schema: structuredAnalysisResultSchema,
      system:
        "You are Bridge, a multilingual health companion. Return short, patient-friendly structured results. Mention uncertainty when text is unclear. Avoid long paragraphs and keep every field concise.",
      prompt: `Analyze this ${input.artifactType.replaceAll("_", " ")} for a patient-facing health assistant. Return a short structured safety result. Keep wording practical, concise, and never act as a replacement for medical advice.${
        input.imageUrl ? `\n\nImage URL: ${input.imageUrl}` : ""
      }${input.extractedText ? `\n\nOCR text:\n${input.extractedText}` : ""}\n\nWrite the response in ${preferredLanguageLabels[input.preferredLanguage]}. Use that language for detected item, why flagged, and suggested next action.`,
    })

    return result.object
  } catch {
    return buildFallbackAnalysis(input)
  }
}
