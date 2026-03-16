import { copy, type MessageKey } from "@/lib/copy"
import type {
  MedicineEntry,
  StructuredAnalysisResult,
} from "@/lib/contracts/analysis"
import {
  preferredLanguageCodeSchema,
  type PreferredLanguage,
} from "@/lib/contracts/profile"

export const defaultLocale = "en" as const

type LingoEngine = {
  localizeText: (
    text: string,
    options: {
      sourceLocale: string | null
      targetLocale: string
      fast?: boolean
    }
  ) => Promise<string>
}

let enginePromise: Promise<LingoEngine | null> | null = null

export function getDefaultCopy(key: MessageKey) {
  return copy(key)
}

export function normalizePreferredLanguage(
  language: string
): PreferredLanguage {
  return preferredLanguageCodeSchema.parse(language)
}

async function getLingoEngine() {
  if (enginePromise) {
    return await enginePromise
  }

  enginePromise = (async () => {
    if (!process.env.LINGODOTDEV_API_KEY) {
      return null
    }

    const mod = (await import("lingo.dev/sdk")) as {
      LingoDotDevEngine: new (options: { apiKey: string }) => LingoEngine
    }

    return new mod.LingoDotDevEngine({
      apiKey: process.env.LINGODOTDEV_API_KEY,
    })
  })().catch(() => null)

  return await enginePromise
}

export async function localizePatientText(
  message: string,
  preferredLanguage: PreferredLanguage
) {
  const normalizedLanguage = normalizePreferredLanguage(preferredLanguage)

  if (normalizedLanguage === defaultLocale || !message.trim()) {
    return message
  }

  const engine = await getLingoEngine()

  if (!engine) {
    return message
  }

  try {
    return await engine.localizeText(message, {
      sourceLocale: null,
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

async function localizeStringList(
  values: string[] | undefined,
  preferredLanguage: PreferredLanguage
) {
  if (!values?.length) {
    return values
  }

  return await localizePatientMessages(values, preferredLanguage)
}

async function localizeMedicineEntries(
  values: MedicineEntry[] | undefined,
  preferredLanguage: PreferredLanguage
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

export async function localizeStructuredAnalysisResult(
  result: StructuredAnalysisResult,
  preferredLanguage: PreferredLanguage
) {
  if (normalizePreferredLanguage(preferredLanguage) === defaultLocale) {
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
