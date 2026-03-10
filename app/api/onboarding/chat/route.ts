import {
  createUIMessageStream,
  createUIMessageStreamResponse,
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
import { localizedCopy } from "@/lib/copy"
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
  completeProfileQuestions: tool({
    description:
      "Move the user to the medication setup step after profile questions are done or skipped.",
    inputSchema: z.object({}),
    execute: async () => {
      await fetchAuthMutation(api.profiles.completeProfileQuestions, {})
      return "Profile questions completed."
    },
  }),
} satisfies ToolSet

function createFallbackChatResponse(text: string) {
  const messageId = `fallback-${Date.now()}`
  const textId = `text-${Date.now()}`

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start", messageId })
        writer.write({ type: "text-start", id: textId })
        writer.write({ type: "text-delta", id: textId, delta: text })
        writer.write({ type: "text-end", id: textId })
        writer.write({ type: "finish" })
      },
    }),
  })
}

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
  const unavailableMessage = await localizedCopy(
    "onboarding.chat.unavailable",
    lang
  )

  const coveredTopics: string[] = []
  if (profile.age !== undefined) coveredTopics.push("age")
  if (profile.allergies?.length) coveredTopics.push("allergies")
  if (profile.chronicConditions?.length) coveredTopics.push("chronicConditions")
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
4. dietaryRestrictions — ask about dietary restrictions (vegetarian, vegan, lactose-free, gluten-free, etc.)
5. religiousRestrictions — ask about religious dietary rules (halal, kosher, fasting practices, etc.)
6. emergencyNotes — ask if there is anything else important about their health that Bridge should know

Rules:
- After each user answer, ALWAYS call the updateProfile tool with the structured data extracted from their response.
- For array fields (allergies, chronicConditions, dietaryRestrictions, religiousRestrictions), extract individual items into a clean string array.
- For age, extract a number.
- For emergencyNotes, capture as a single string.
- If the user says "none", "no", "nothing", "skip", or anything similar, acknowledge it warmly and move to the next uncovered topic. Do NOT call updateProfile for skipped topics.
- If the user says they want to skip all remaining questions or are done, call completeProfileQuestions immediately.
- When all 6 topics have been asked about (whether answered or skipped), give a brief warm summary of what was saved and call completeProfileQuestions.
- Never give medical advice or diagnose anything.
- Keep each message to 2-3 sentences maximum.
- Be encouraging, warm, and patient.

Already collected data:
${existingData}

Start by greeting ${authUser.name} briefly and asking about the first uncovered topic.`

  const modelMessages = await convertToModelMessages(messages)

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return createFallbackChatResponse(unavailableMessage)
  }

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      stopWhen: stepCountIs(3),
      tools: onboardingTools,
    })

    return result.toUIMessageStreamResponse()
  } catch {
    return createFallbackChatResponse(unavailableMessage)
  }
}
