import { copy, type MessageKey } from "@/lib/copy"
import {
  preferredLanguageCodeSchema,
  type PreferredLanguage,
} from "@/lib/contracts/profile"

export const defaultLocale = "en" as const

type LingoEngine = {
  localizeText: (
    text: string,
    options: {
      sourceLocale: string
      targetLocale: string
      fast?: boolean
    }
  ) => Promise<string>
}

export function getDefaultCopy(key: MessageKey) {
  return copy(key)
}

export function normalizePreferredLanguage(
  language: string
): PreferredLanguage {
  return preferredLanguageCodeSchema.parse(language)
}

export async function localizePatientText(
  message: string,
  preferredLanguage: PreferredLanguage
) {
  const normalizedLanguage = normalizePreferredLanguage(preferredLanguage)

  if (normalizedLanguage === defaultLocale || !message.trim()) {
    return message
  }

  if (!process.env.LINGODOTDEV_API_KEY) {
    return message
  }

  try {
    const mod = (await import("lingo.dev/sdk")) as {
      LingoDotDevEngine: new (options: { apiKey: string }) => LingoEngine
    }
    const engine = new mod.LingoDotDevEngine({
      apiKey: process.env.LINGODOTDEV_API_KEY,
    })

    return await engine.localizeText(message, {
      sourceLocale: defaultLocale,
      targetLocale: normalizedLanguage,
      fast: true,
    })
  } catch {
    return message
  }
}

export async function localizePatientMessages(
  messages: string[],
  preferredLanguage: PreferredLanguage
) {
  return await Promise.all(
    messages.map((message) => localizePatientText(message, preferredLanguage))
  )
}
