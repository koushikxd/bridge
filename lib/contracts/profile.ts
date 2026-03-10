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

export type ProfileRole = z.infer<typeof profileRoleSchema>
export type PreferredLanguage = z.infer<typeof preferredLanguageCodeSchema>
export type PreferredLanguageForm = z.infer<typeof preferredLanguageSchema>
