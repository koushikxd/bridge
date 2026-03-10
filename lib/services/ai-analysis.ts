import { google } from "@ai-sdk/google"

import {
  artifactAnalysisRequestSchema,
  type ArtifactAnalysisRequest,
  type StructuredAnalysisResult,
} from "@/lib/contracts/analysis"

export const bridgeAnalysisModel = google("gemini-2.5-flash")

export function isAiAnalysisConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}

export async function analyzeArtifact(
  input: ArtifactAnalysisRequest
): Promise<StructuredAnalysisResult> {
  artifactAnalysisRequestSchema.parse(input)

  if (!isAiAnalysisConfigured()) {
    throw new Error(
      "Gemini is not configured. Add GOOGLE_GENERATIVE_AI_API_KEY before enabling analysis."
    )
  }

  void bridgeAnalysisModel

  throw new Error(
    "AI analysis is scaffolded for Phase 1 but not exposed until the upload flows are implemented."
  )
}
