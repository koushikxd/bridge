import type { PreferredLanguage } from "@/lib/contracts/profile"

export const SHARED_AUDIO_MUTED_KEY = "bridge:audio-muted"

const localeToSpeechLanguage: Record<PreferredLanguage, string> = {
  en: "en-US",
  hi: "hi-IN",
  es: "es-ES",
  ar: "ar-SA",
  fr: "fr-FR",
  ta: "ta-IN",
}

export function getSpeechLanguage(locale: PreferredLanguage | string) {
  if (locale in localeToSpeechLanguage) {
    return localeToSpeechLanguage[locale as PreferredLanguage]
  }

  return "en-US"
}

export function normalizeVoiceName(name: string) {
  return name.trim().toLowerCase()
}

export function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  locale: PreferredLanguage | string
) {
  const targetLang = getSpeechLanguage(locale).toLowerCase()
  const targetBase = targetLang.split("-")[0]

  const exactMatches = voices.filter(
    (voice) => voice.lang.toLowerCase() === targetLang
  )
  const baseMatches = voices.filter((voice) =>
    voice.lang.toLowerCase().startsWith(`${targetBase}-`)
  )
  const pool = exactMatches.length > 0 ? exactMatches : baseMatches

  const preferredKeywords = [
    "natural",
    "premium",
    "enhanced",
    "neural",
    "google",
    "samantha",
    "daniel",
    "serena",
  ]

  const rankedPool = [...(pool.length > 0 ? pool : voices)].sort((a, b) => {
    const aName = normalizeVoiceName(a.name)
    const bName = normalizeVoiceName(b.name)
    const aScore = preferredKeywords.reduce(
      (score, keyword) => score + (aName.includes(keyword) ? 1 : 0),
      0
    )
    const bScore = preferredKeywords.reduce(
      (score, keyword) => score + (bName.includes(keyword) ? 1 : 0),
      0
    )

    if (a.default !== b.default) {
      return a.default ? -1 : 1
    }

    return bScore - aScore
  })

  return rankedPool[0] ?? null
}

export function extractMessageText(
  parts: Array<{ type: string; text?: string }>
) {
  return parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n\n")
}
