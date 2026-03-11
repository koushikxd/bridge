import { localizePatientText } from "@/lib/services/localization"
import {
  preferredLanguageLabels,
  type PreferredLanguage,
} from "@/lib/contracts/profile"

type PatientProfileContext = {
  age?: number
  allergies?: string[]
  chronicConditions?: string[]
  dietaryRestrictions?: string[]
  religiousRestrictions?: string[]
  currentMedications?: string[]
  emergencyNotes?: string
}

function buildProfileSummary(profile: PatientProfileContext) {
  const lines = [
    `Age: ${profile.age ?? "unknown"}`,
    `Allergies: ${profile.allergies?.join(", ") || "none recorded"}`,
    `Chronic conditions: ${profile.chronicConditions?.join(", ") || "none recorded"}`,
    `Dietary restrictions: ${profile.dietaryRestrictions?.join(", ") || "none recorded"}`,
    `Religious restrictions: ${profile.religiousRestrictions?.join(", ") || "none recorded"}`,
    `Current medications: ${profile.currentMedications?.join(", ") || "none recorded"}`,
    `Emergency notes: ${profile.emergencyNotes?.trim() || "none recorded"}`,
  ]

  return lines.join("\n")
}

export function createLanguageRule(preferredLanguage: PreferredLanguage) {
  return `Respond only in ${preferredLanguageLabels[preferredLanguage]} (${preferredLanguage}). Do not switch languages even if the user writes in another language. If the user shares text from another language, explain it in ${preferredLanguageLabels[preferredLanguage]}.`
}

export function buildAssistantSystemPrompt(args: {
  preferredLanguage: PreferredLanguage
  userName: string
  profile: PatientProfileContext
}) {
  return `You are Bridge, a calm health companion for patients and caregivers. You are helping ${args.userName}.

${createLanguageRule(args.preferredLanguage)}

Keep responses concise, practical, and patient-friendly.
- Use short paragraphs or bullets.
- Never claim to replace a doctor or pharmacist.
- If the user asks about medicines, food, labels, meals, prescriptions, or symptoms, be careful and mention uncertainty when appropriate.
- If the user shares foreign-language text, translate and explain it in the preferred language.
- Prefer actionable next steps over long explanations.

Known patient profile:
${buildProfileSummary(args.profile)}`
}

export async function enforcePreferredLanguage(
  text: string,
  preferredLanguage: PreferredLanguage
) {
  return await localizePatientText(text, preferredLanguage)
}
