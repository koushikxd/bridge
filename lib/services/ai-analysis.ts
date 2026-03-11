import { google } from "@ai-sdk/google"
import { generateObject, generateText } from "ai"

import { createLanguageRule } from "@/lib/assistant"
import {
  artifactAnalysisRequestSchema,
  structuredAnalysisResultSchema,
  type ArtifactAnalysisRequest,
  type StructuredAnalysisResult,
} from "@/lib/contracts/analysis"
import { preferredLanguageLabels } from "@/lib/contracts/profile"
import { localizePatientMessages } from "@/lib/services/localization"

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

async function localizeFallbackAnalysis(
  result: StructuredAnalysisResult,
  preferredLanguage: ArtifactAnalysisRequest["preferredLanguage"]
) {
  if (preferredLanguage === "en") {
    return result
  }

  const [detectedItem, whyFlagged, suggestedNextAction] =
    await localizePatientMessages(
      [result.detectedItem, result.whyFlagged, result.suggestedNextAction],
      preferredLanguage
    )

  return {
    ...result,
    detectedItem,
    whyFlagged,
    suggestedNextAction,
  }
}

async function summarizeImageLanguage(args: {
  imageUrl?: string
  extractedText?: string
  preferredLanguage: ArtifactAnalysisRequest["preferredLanguage"]
}) {
  if (!args.imageUrl || !isAiAnalysisConfigured()) {
    return null
  }

  try {
    const { text } = await generateText({
      model: bridgeAnalysisModel,
      maxOutputTokens: 120,
      system:
        "Identify the most likely source language of the uploaded text and briefly summarize what kind of health-related item it is. Keep the response short.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Inspect this upload. OCR text (may be noisy): ${args.extractedText || "none"}. ${createLanguageRule(args.preferredLanguage)}`,
            },
            {
              type: "image",
              image: args.imageUrl,
            },
          ],
        },
      ],
    })

    return text.trim()
  } catch {
    return null
  }
}

export async function analyzeArtifact(
  input: ArtifactAnalysisRequest
): Promise<StructuredAnalysisResult> {
  artifactAnalysisRequestSchema.parse(input)

  if (!isAiAnalysisConfigured()) {
    return await localizeFallbackAnalysis(
      buildFallbackAnalysis(input),
      input.preferredLanguage
    )
  }

  try {
    const inferredContext = await summarizeImageLanguage({
      imageUrl: input.imageUrl,
      extractedText: input.extractedText,
      preferredLanguage: input.preferredLanguage,
    })

    const result = await generateObject({
      model: bridgeAnalysisModel,
      schema: structuredAnalysisResultSchema,
      system: `You are Bridge, a multilingual health companion. Return short, patient-friendly structured results. Mention uncertainty when text is unclear. Avoid long paragraphs and keep every field concise. ${createLanguageRule(input.preferredLanguage)}`,
      prompt: `Analyze this uploaded health-related image for a patient-facing health assistant. Infer whether it is a prescription, medicine label, food label, meal, menu, or a general document. If the original text is in another language, translate and explain it in ${preferredLanguageLabels[input.preferredLanguage]}. Return a short structured safety result. Keep wording practical, concise, and never act as a replacement for medical advice.${
        input.imageUrl ? `\n\nImage URL: ${input.imageUrl}` : ""
      }${input.extractedText ? `\n\nOCR text:\n${input.extractedText}` : ""}${inferredContext ? `\n\nInferred context:\n${inferredContext}` : ""}\n\nWrite the response in ${preferredLanguageLabels[input.preferredLanguage]}. Use that language for detected item, why flagged, and suggested next action.`,
    })

    return result.object
  } catch {
    return await localizeFallbackAnalysis(
      buildFallbackAnalysis(input),
      input.preferredLanguage
    )
  }
}
