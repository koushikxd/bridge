import { z } from "zod"

import { preferredLanguageCodeSchema } from "@/lib/contracts/profile"

export const artifactTypeSchema = z.enum([
  "prescription",
  "meal",
  "food_label",
  "medicine_label",
  "menu",
])

export const safetyStatusSchema = z.enum([
  "safe",
  "caution",
  "risky",
  "unknown",
])

export const structuredAnalysisResultSchema = z.object({
  detectedItem: z.string().min(1),
  safetyStatus: safetyStatusSchema,
  whyFlagged: z.string().min(1),
  suggestedNextAction: z.string().min(1),
  confidence: z.number().min(0).max(1),
})

export const artifactAnalysisRequestSchema = z
  .object({
    artifactType: artifactTypeSchema,
    preferredLanguage: preferredLanguageCodeSchema,
    imageUrl: z.string().url().optional(),
    extractedText: z.string().trim().optional(),
  })
  .refine(
    (value) => Boolean(value.imageUrl || value.extractedText),
    "Provide an imageUrl or extractedText."
  )

export type ArtifactAnalysisRequest = z.infer<
  typeof artifactAnalysisRequestSchema
>
export type StructuredAnalysisResult = z.infer<
  typeof structuredAnalysisResultSchema
>
export type SafetyStatus = z.infer<typeof safetyStatusSchema>
