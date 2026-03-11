import { google } from "@ai-sdk/google"
import { generateObject } from "ai"

import {
  artifactAnalysisRequestSchema,
  structuredAnalysisResultSchema,
  type MedicineEntry,
  type ArtifactAnalysisRequest,
  type PatientProfileContext,
  type StructuredAnalysisResult,
} from "@/lib/contracts/analysis"
import { extractImageText } from "@/lib/services/ocr"
import {
  localizePatientMessages,
  localizePatientText,
} from "@/lib/services/localization"

export const bridgeAnalysisModel = google("gemini-2.5-flash")

export function isAiAnalysisConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

function buildProfileSummary(profile?: PatientProfileContext): string {
  if (!profile) return "No patient profile data available."

  return [
    `Allergies: ${profile.allergies?.join(", ") || "none recorded"}`,
    `Chronic conditions: ${profile.chronicConditions?.join(", ") || "none recorded"}`,
    `Dietary restrictions: ${profile.dietaryRestrictions?.join(", ") || "none recorded"}`,
    `Religious restrictions: ${profile.religiousRestrictions?.join(", ") || "none recorded"}`,
    `Current medications: ${profile.currentMedications?.join(", ") || "none recorded"}`,
  ].join("\n")
}

function buildSystemPrompt(input: ArtifactAnalysisRequest): string {
  return `You are Bridge, a multilingual health safety companion. Analyze uploaded health images and return concise, structured results.

TASK:
1. Identify what type of health item this is: meal, food_label, medicine_label, prescription, menu, or general.
2. Extract all relevant information from the image.
3. Check against the patient's profile for safety concerns.
4. Return a structured safety result.

TYPE-SPECIFIC ANALYSIS:
- meal: Identify visible food items, estimate key nutrition, list likely allergens.
- food_label: Extract product name, list ingredients, key nutrition facts, allergens from the label.
- medicine_label: Extract medicine name, what it treats (purpose), dosage, warnings. Note interactions with current medications.
- prescription: Identify all prescribed medicines with names, dosages, instructions, and what each medicine is for.
- menu: Identify dishes, flag potential allergen risks for the patient.
- general: Analyze as best you can and classify appropriately.

PATIENT PROFILE:
${buildProfileSummary(input.patientProfile)}

RULES:
- Always do the analysis and final structured output in English.
- If the image text is in another language, translate it into English before reasoning.
- Flag any ingredients, allergens, or medicines that conflict with the patient's profile in flaggedAllergens, flaggedIngredients, and matchedProfileRules.
- Keep wording concise and patient-friendly. No long paragraphs.
- Never claim to replace medical advice.
- When confidence is low, say so honestly.`
}

function buildUserPrompt(input: ArtifactAnalysisRequest): string {
  const parts = [
    "Analyze this health-related image and return the structured result in English.",
  ]

  if (input.extractedText) {
    parts.push(
      `\nOCR extracted text (may contain errors):\n${input.extractedText}`
    )
  }

  return parts.join("")
}

function buildFallbackAnalysis(
  input: ArtifactAnalysisRequest
): StructuredAnalysisResult {
  const text = input.extractedText?.trim()

  if (!text) {
    return {
      detectedItem: input.artifactType.replaceAll("_", " "),
      detectedType: input.artifactType,
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
    detectedType: input.artifactType,
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

  return { ...result, detectedItem, whyFlagged, suggestedNextAction }
}

async function localizeStringList(
  values: string[] | undefined,
  preferredLanguage: ArtifactAnalysisRequest["preferredLanguage"]
) {
  if (!values?.length) {
    return values
  }

  return await localizePatientMessages(values, preferredLanguage)
}

async function localizeMedicineEntries(
  values: MedicineEntry[] | undefined,
  preferredLanguage: ArtifactAnalysisRequest["preferredLanguage"]
) {
  if (!values?.length) {
    return values
  }

  return await Promise.all(
    values.map(async (value) => ({
      name: await localizePatientText(value.name, preferredLanguage),
      dosage: value.dosage
        ? await localizePatientText(value.dosage, preferredLanguage)
        : undefined,
      purpose: value.purpose
        ? await localizePatientText(value.purpose, preferredLanguage)
        : undefined,
      instructions: value.instructions
        ? await localizePatientText(value.instructions, preferredLanguage)
        : undefined,
    }))
  )
}

async function localizeAnalysisResult(
  result: StructuredAnalysisResult,
  preferredLanguage: ArtifactAnalysisRequest["preferredLanguage"]
) {
  if (preferredLanguage === "en") {
    return result
  }

  const [
    detectedItem,
    whyFlagged,
    suggestedNextAction,
    ingredients,
    allergens,
    nutritionHighlights,
    medicines,
    flaggedAllergens,
    flaggedIngredients,
    matchedProfileRules,
  ] = await Promise.all([
    localizePatientText(result.detectedItem, preferredLanguage),
    localizePatientText(result.whyFlagged, preferredLanguage),
    localizePatientText(result.suggestedNextAction, preferredLanguage),
    localizeStringList(result.ingredients, preferredLanguage),
    localizeStringList(result.allergens, preferredLanguage),
    localizeStringList(result.nutritionHighlights, preferredLanguage),
    localizeMedicineEntries(result.medicines, preferredLanguage),
    localizeStringList(result.flaggedAllergens, preferredLanguage),
    localizeStringList(result.flaggedIngredients, preferredLanguage),
    localizeStringList(result.matchedProfileRules, preferredLanguage),
  ])

  return {
    ...result,
    detectedItem,
    whyFlagged,
    suggestedNextAction,
    ingredients,
    allergens,
    nutritionHighlights,
    medicines,
    flaggedAllergens,
    flaggedIngredients,
    matchedProfileRules,
  }
}

/**
 * Tier 1: Send image directly to Gemini 2.5 Flash for vision analysis.
 * The model reads text in any language from the image and returns English output.
 */
async function analyzeWithVision(
  input: ArtifactAnalysisRequest
): Promise<StructuredAnalysisResult> {
  if (!input.imageUrl) {
    throw new Error("No image URL for vision analysis.")
  }

  const result = await generateObject({
    model: bridgeAnalysisModel,
    schema: structuredAnalysisResultSchema,
    system: buildSystemPrompt(input),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(input) },
          { type: "image", image: new URL(input.imageUrl) },
        ],
      },
    ],
  })

  return result.object
}

/**
 * Tier 2: Run Tesseract OCR then pass extracted text to Gemini for parsing.
 * Gemini still returns English output, which can be localized afterward.
 * Used when vision analysis fails (rate limit, timeout, etc.).
 */
async function analyzeWithOcrFallback(
  input: ArtifactAnalysisRequest
): Promise<
  StructuredAnalysisResult & { ocrText: string; ocrConfidence: number }
> {
  if (!input.imageUrl) {
    throw new Error("No image URL for OCR fallback.")
  }

  const ocr = await extractImageText({
    imageUrl: input.imageUrl,
    preferredLanguage: input.preferredLanguage,
  })

  if (!ocr.text.trim()) {
    throw new Error("OCR produced no usable text.")
  }

  const result = await generateObject({
    model: bridgeAnalysisModel,
    schema: structuredAnalysisResultSchema,
    system: buildSystemPrompt(input),
    prompt: buildUserPrompt({ ...input, extractedText: ocr.text }),
  })

  return { ...result.object, ocrText: ocr.text, ocrConfidence: ocr.confidence }
}

/**
 * Main entry point. Two-tier approach:
 * 1. Gemini 2.5 Flash Vision (returns English)
 * 2. Tesseract OCR + Gemini text parsing (returns English)
 * 3. Keyword heuristic (English last resort when AI is unavailable)
 * 4. Lingo localization for non-English users
 */
export async function analyzeArtifact(input: ArtifactAnalysisRequest): Promise<
  StructuredAnalysisResult & {
    ocrText?: string
    ocrConfidence?: number
    tier: string
  }
> {
  artifactAnalysisRequestSchema.parse(input)

  if (!isAiAnalysisConfigured()) {
    const fallback = await localizeFallbackAnalysis(
      buildFallbackAnalysis(input),
      input.preferredLanguage
    )
    return { ...fallback, tier: "heuristic" }
  }

  // Tier 1: Gemini Vision
  if (input.imageUrl) {
    try {
      const result = await analyzeWithVision(input)
      const localizedResult = await localizeAnalysisResult(
        result,
        input.preferredLanguage
      )
      return { ...localizedResult, tier: "vision" }
    } catch {
      // Fall through to Tier 2
    }
  }

  // Tier 2: OCR + Gemini text parsing
  try {
    const result = await analyzeWithOcrFallback(input)
    const localizedResult = await localizeAnalysisResult(
      result,
      input.preferredLanguage
    )
    return { ...localizedResult, tier: "ocr_fallback" }
  } catch {
    // Fall through to heuristic
  }

  // Last resort: keyword heuristic
  const fallback = await localizeFallbackAnalysis(
    buildFallbackAnalysis(input),
    input.preferredLanguage
  )
  return { ...fallback, tier: "heuristic" }
}
