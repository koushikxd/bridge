import { copy, type MessageKey } from "@/lib/copy"
import { preferredLanguageCodeSchema, type PreferredLanguage } from "@/lib/contracts/profile"

export const defaultLocale = "en" as const

export function getDefaultCopy(key: MessageKey) {
  return copy(key)
}

export function normalizePreferredLanguage(language: string): PreferredLanguage {
  return preferredLanguageCodeSchema.parse(language)
}

export async function localizePatientText(
  message: string,
  preferredLanguage: PreferredLanguage
) {
  if (preferredLanguage === defaultLocale) {
    return message
  }

  throw new Error(
    "Lingo.dev integration is scaffolded in Phase 1, but runtime translation will be wired in a later feature pass."
  )
}
