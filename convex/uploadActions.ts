"use node"

import { v } from "convex/values"

import { analyzeArtifact } from "../lib/services/ai-analysis"
import { api } from "./_generated/api"
import { action } from "./_generated/server"

export const processUpload = action({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const upload = await ctx.runQuery(api.uploads.getUploadForProcessing, {
      uploadId: args.uploadId,
    })

    if (!upload) {
      throw new Error("Upload not found.")
    }

    await ctx.runMutation(api.uploads.markUploadStatus, {
      uploadId: args.uploadId,
      status: "processing",
    })

    try {
      const fileUrl = upload.fileUrl

      if (!fileUrl) {
        throw new Error("Uploaded file is no longer available.")
      }

      const analysis = await analyzeArtifact({
        artifactType: upload.artifactType,
        preferredLanguage: upload.preferredLanguage,
        imageUrl: fileUrl,
        patientProfile: upload.patientProfile,
      })

      // Serialize type-specific rich data to rawSummary
      const richData: Record<string, unknown> = {}
      if (analysis.ingredients?.length)
        richData.ingredients = analysis.ingredients
      if (analysis.allergens?.length) richData.allergens = analysis.allergens
      if (analysis.nutritionHighlights?.length)
        richData.nutritionHighlights = analysis.nutritionHighlights
      if (analysis.medicines?.length) richData.medicines = analysis.medicines
      const rawSummary = Object.keys(richData).length
        ? JSON.stringify(richData)
        : undefined

      await ctx.runMutation(api.uploads.storeAnalysisResult, {
        uploadId: args.uploadId,
        artifactType: analysis.detectedType ?? upload.artifactType,
        preferredLanguage: upload.preferredLanguage,
        ocrText: analysis.ocrText ?? "",
        ocrConfidence: analysis.ocrConfidence ?? 0,
        detectedItem: analysis.detectedItem,
        safetyStatus: analysis.safetyStatus,
        whyFlagged: analysis.whyFlagged,
        suggestedNextAction: analysis.suggestedNextAction,
        confidence: analysis.confidence,
        flaggedAllergens: analysis.flaggedAllergens,
        flaggedIngredients: analysis.flaggedIngredients,
        matchedProfileRules: analysis.matchedProfileRules,
        aiModel: analysis.tier,
        rawSummary,
      })

      return { success: true }
    } catch (error) {
      await ctx.runMutation(api.uploads.markUploadFailed, {
        uploadId: args.uploadId,
        error:
          error instanceof Error
            ? error.message
            : "Bridge could not analyze this upload.",
      })

      throw error
    }
  },
})
