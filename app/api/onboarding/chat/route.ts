import {
  type ToolSet,
  type UIMessage,
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
} from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"

import { api } from "@/convex/_generated/api"
import { fetchAuthMutation, fetchAuthQuery } from "@/lib/auth-server"
import { preferredLanguageLabels } from "@/lib/contracts/profile"

const onboardingTools = {
  updateProfile: tool({
    description:
      "Save one or more profile fields extracted from the user's response. Call this after each user answer.",
    inputSchema: z.object({
      age: z
        .number()
        .int()
        .min(1)
        .max(150)
        .optional()
        .describe("The user's age in years"),
      allergies: z
        .array(z.string())
        .optional()
        .describe("List of allergies (food, medicine, environmental)"),
      chronicConditions: z
        .array(z.string())
        .optional()
        .describe("List of chronic health conditions"),
      currentMedications: z
        .array(z.string())
        .optional()
        .describe("List of medicines the user currently takes"),
      dietaryRestrictions: z
        .array(z.string())
        .optional()
        .describe("List of dietary restrictions"),
      religiousRestrictions: z
        .array(z.string())
        .optional()
        .describe("List of religious dietary rules"),
      emergencyNotes: z
        .string()
        .optional()
        .describe("Any additional health notes"),
    }),
    execute: async (input) => {
      const updateData: Record<string, unknown> = {}

      if (input.age !== undefined) updateData.age = input.age
      if (input.allergies !== undefined) updateData.allergies = input.allergies
      if (input.chronicConditions !== undefined)
        updateData.chronicConditions = input.chronicConditions
      if (input.currentMedications !== undefined)
        updateData.currentMedications = input.currentMedications
      if (input.dietaryRestrictions !== undefined)
        updateData.dietaryRestrictions = input.dietaryRestrictions
      if (input.religiousRestrictions !== undefined)
        updateData.religiousRestrictions = input.religiousRestrictions
      if (input.emergencyNotes !== undefined)
        updateData.emergencyNotes = input.emergencyNotes

      if (Object.keys(updateData).length === 0) {
        return "No data to save."
      }

      await fetchAuthMutation(api.profiles.updateOnboardingProfile, updateData)
      return `Saved: ${Object.keys(updateData).join(", ")}`
    },
  }),
  completeOnboarding: tool({
    description:
      "Mark onboarding as complete. Call this when all topics have been covered or the user wants to finish.",
    inputSchema: z.object({}),
    execute: async () => {
      await fetchAuthMutation(api.profiles.completeOnboarding, {})
      return "Onboarding completed."
    },
  }),
} satisfies ToolSet

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const [authUser, profile] = await Promise.all([
    fetchAuthQuery(api.auth.getAuthUser),
    fetchAuthQuery(api.profiles.getCurrentProfile),
  ])

  if (!profile) {
    return new Response(
      "Profile not found. Complete language selection first.",
      {
        status: 400,
      }
    )
  }

  const lang = profile.preferredLanguage as keyof typeof preferredLanguageLabels
  const langLabel = preferredLanguageLabels[lang] ?? "English"

  const coveredTopics: string[] = []
  if (profile.age !== undefined) coveredTopics.push("age")
  if (profile.allergies?.length) coveredTopics.push("allergies")
  if (profile.chronicConditions?.length) coveredTopics.push("chronicConditions")
  if (profile.currentMedications?.length)
    coveredTopics.push("currentMedications")
  if (profile.dietaryRestrictions?.length)
    coveredTopics.push("dietaryRestrictions")
  if (profile.religiousRestrictions?.length)
    coveredTopics.push("religiousRestrictions")
  if (profile.emergencyNotes) coveredTopics.push("emergencyNotes")

  const existingData = coveredTopics.length
    ? coveredTopics.map((t) => `- ${t}: already collected`).join("\n")
    : "None yet."

  const systemPrompt = `You are Bridge, a friendly health assistant helping a new patient set up their profile. You are speaking with ${authUser.name}.

Respond ONLY in ${langLabel} (${lang}).

Your job is to collect health information through a warm, simple conversation. Ask ONE question at a time. Keep your messages short and easy to understand — this app is designed for patients, older adults, and caregivers.

Topics to cover in order (skip any that are already collected):
1. age — ask how old they are
2. allergies — ask about any allergies (food, medicine, environmental)
3. chronicConditions — ask about ongoing health conditions like diabetes, hypertension, asthma, heart disease, etc.
4. currentMedications — ask what medicines they currently take regularly
5. dietaryRestrictions — ask about dietary restrictions (vegetarian, vegan, lactose-free, gluten-free, etc.)
6. religiousRestrictions — ask about religious dietary rules (halal, kosher, fasting practices, etc.)
7. emergencyNotes — ask if there is anything else important about their health that Bridge should know

Rules:
- After each user answer, ALWAYS call the updateProfile tool with the structured data extracted from their response.
- For array fields (allergies, chronicConditions, currentMedications, dietaryRestrictions, religiousRestrictions), extract individual items into a clean string array.
- For age, extract a number.
- For emergencyNotes, capture as a single string.
- If the user says "none", "no", "nothing", "skip", or anything similar, acknowledge it warmly and move to the next uncovered topic. Do NOT call updateProfile for skipped topics.
- If the user says they want to skip all remaining questions, finish setup, or are done, call completeOnboarding immediately.
- When all 7 topics have been asked about (whether answered or skipped), give a brief warm summary of what was saved and call completeOnboarding.
- Never give medical advice or diagnose anything.
- Keep each message to 2-3 sentences maximum.
- Be encouraging, warm, and patient.

Already collected data:
${existingData}

Start by greeting ${authUser.name} briefly and asking about the first uncovered topic.`

  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: modelMessages,
    stopWhen: stepCountIs(3),
    tools: onboardingTools,
  })

  return result.toUIMessageStreamResponse()
}
