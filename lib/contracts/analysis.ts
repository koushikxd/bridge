import { z } from "zod"

import { preferredLanguageCodeSchema } from "@/lib/contracts/profile"

export const artifactTypeSchema = z.enum([
  "prescription",
  "meal",
  "food_label",
  "medicine_label",
  "menu",
  "general",
])

export const safetyStatusSchema = z.enum([
  "safe",
  "caution",
  "risky",
  "unknown",
])

export const medicineEntrySchema = z.object({
  name: z.string(),
  dosage: z.string().optional(),
  purpose: z.string().optional(),
  instructions: z.string().optional(),
})

export const structuredAnalysisResultSchema = z.object({
  detectedItem: z.string().min(1),
  detectedType: artifactTypeSchema,
  safetyStatus: safetyStatusSchema,
  whyFlagged: z.string().min(1),
  suggestedNextAction: z.string().min(1),
  confidence: z.number().min(0).max(1),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  nutritionHighlights: z.array(z.string()).optional(),
  medicines: z.array(medicineEntrySchema).optional(),
  flaggedAllergens: z.array(z.string()).optional(),
  flaggedIngredients: z.array(z.string()).optional(),
  matchedProfileRules: z.array(z.string()).optional(),
})

export const patientProfileContextSchema = z.object({
  allergies: z.array(z.string()).optional(),
  chronicConditions: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  religiousRestrictions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
})

export const artifactAnalysisRequestSchema = z
  .object({
    artifactType: artifactTypeSchema,
    preferredLanguage: preferredLanguageCodeSchema,
    imageUrl: z.string().url().optional(),
    extractedText: z.string().trim().optional(),
    patientProfile: patientProfileContextSchema.optional(),
  })
  .refine(
    (value) => Boolean(value.imageUrl || value.extractedText),
    "Provide an imageUrl or extractedText."
  )

export type ArtifactAnalysisRequest = z.infer<
  typeof artifactAnalysisRequestSchema
>
export type ArtifactType = z.infer<typeof artifactTypeSchema>
export type StructuredAnalysisResult = z.infer<
  typeof structuredAnalysisResultSchema
>
export type SafetyStatus = z.infer<typeof safetyStatusSchema>
export type MedicineEntry = z.infer<typeof medicineEntrySchema>
export type PatientProfileContext = z.infer<typeof patientProfileContextSchema>
