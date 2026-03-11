import { google } from "@ai-sdk/google"
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai"

import { buildAssistantSystemPrompt } from "@/lib/assistant"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"
import { preferredLanguageCodeSchema } from "@/lib/contracts/profile"
import { api } from "@/convex/_generated/api"

function fallbackResponse(text: string) {
  const messageId = `assistant-fallback-${Date.now()}`
  const textId = `assistant-text-${Date.now()}`

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

function cleanMessages(messages: UIMessage[]) {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => part.type === "text"),
  }))
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: UIMessage[]
    preferredLanguage?: string
  }

  const [authUser, profile] = await Promise.all([
    fetchAuthQuery(api.auth.getAuthUser),
    fetchAuthQuery(api.profiles.getCurrentProfile),
  ])

  if (!profile?.onboardingCompleted) {
    return new Response("Complete onboarding first.", { status: 403 })
  }

  const preferredLanguage = preferredLanguageCodeSchema.parse(
    body.preferredLanguage ?? profile.preferredLanguage
  )

  const unavailable = await localizedCopy("assistant.error", preferredLanguage)

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return fallbackResponse(unavailable)
  }

  try {
    const modelMessages = await convertToModelMessages(
      cleanMessages(body.messages)
    )
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: buildAssistantSystemPrompt({
        preferredLanguage,
        userName: authUser.name,
        profile,
      }),
      messages: modelMessages,
    })

    return result.toUIMessageStreamResponse()
  } catch {
    return fallbackResponse(unavailable)
  }
}
