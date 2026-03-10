import { z } from "zod"

export const preferredLanguageCodes = [
  "en",
  "hi",
  "es",
  "ar",
  "fr",
  "ta",
] as const

export const preferredLanguageLabels: Record<
  (typeof preferredLanguageCodes)[number],
  string
> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish",
  ar: "Arabic",
  fr: "French",
  ta: "Tamil",
}

export const profileRoleSchema = z.literal("patient")
export const preferredLanguageCodeSchema = z.enum(preferredLanguageCodes)

export const preferredLanguageSchema = z.object({
  preferredLanguage: preferredLanguageCodeSchema,
})

export const profileSettingsSchema = z.object({
  preferredLanguage: preferredLanguageCodeSchema,
  age: z.number().int().min(1).max(150).nullable(),
  allergies: z.array(z.string().trim().min(1)),
  chronicConditions: z.array(z.string().trim().min(1)),
  dietaryRestrictions: z.array(z.string().trim().min(1)),
  religiousRestrictions: z.array(z.string().trim().min(1)),
  emergencyNotes: z.string().trim().nullable(),
})

export type ProfileRole = z.infer<typeof profileRoleSchema>
export type PreferredLanguage = z.infer<typeof preferredLanguageCodeSchema>
export type PreferredLanguageForm = z.infer<typeof preferredLanguageSchema>
export type ProfileSettingsForm = z.infer<typeof profileSettingsSchema>
