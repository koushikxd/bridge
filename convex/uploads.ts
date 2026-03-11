import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireCurrentProfile } from "./profile_helpers"
import {
  artifactTypeValidator,
  preferredLanguageValidator,
  uploadSourceValidator,
} from "./validators"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireCurrentProfile(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

export const createUploadRecord = mutation({
  args: {
    artifactType: artifactTypeValidator,
    source: uploadSourceValidator,
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.number(),
    storageId: v.id("_storage"),
    sourceLanguage: v.optional(preferredLanguageValidator),
  },
  handler: async (ctx, args) => {
    const { profile, userId } = await requireCurrentProfile(ctx)
    const now = Date.now()

    return await ctx.db.insert("uploads", {
      profileId: profile._id,
      uploadedByUserId: userId,
      artifactType: args.artifactType,
      status: "uploaded",
      source: args.source,
      fileName: args.fileName,
      mimeType: args.mimeType,
      fileSize: args.fileSize,
      storageId: args.storageId,
      sourceLanguage: args.sourceLanguage,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const getUploadResult = query({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      return null
    }

    const analysis = await ctx.db
      .query("analysisResults")
      .withIndex("uploadId", (q) => q.eq("uploadId", upload._id))
      .unique()

    return {
      upload,
      analysis,
      fileUrl: upload.storageId
        ? await ctx.storage.getUrl(upload.storageId)
        : null,
    }
  },
})

export const getUploadForProcessing = query({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      return null
    }

    const fileUrl = upload.storageId
      ? await ctx.storage.getUrl(upload.storageId)
      : null

    return {
      artifactType: upload.artifactType,
      preferredLanguage: profile.preferredLanguage,
      fileUrl,
      patientProfile: {
        allergies: profile.allergies,
        chronicConditions: profile.chronicConditions,
        dietaryRestrictions: profile.dietaryRestrictions,
        religiousRestrictions: profile.religiousRestrictions,
        currentMedications: profile.currentMedications,
      },
    }
  },
})

export const markUploadStatus = mutation({
  args: {
    uploadId: v.id("uploads"),
    status: v.union(
      v.literal("uploaded"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      throw new Error("Upload not found.")
    }

    await ctx.db.patch(upload._id, {
      status: args.status,
      updatedAt: Date.now(),
    })
  },
})

export const markUploadFailed = mutation({
  args: {
    uploadId: v.id("uploads"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      throw new Error("Upload not found.")
    }

    await ctx.db.patch(upload._id, {
      status: "failed",
      processingError: args.error,
      updatedAt: Date.now(),
    })
  },
})

export const deleteUpload = mutation({
  args: {
    uploadId: v.id("uploads"),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      throw new Error("Upload not found.")
    }

    // Delete associated analysis result if it exists
    const analysis = await ctx.db
      .query("analysisResults")
      .withIndex("uploadId", (q) => q.eq("uploadId", upload._id))
      .unique()

    if (analysis) {
      await ctx.db.delete(analysis._id)
    }

    // Delete the storage file
    if (upload.storageId) {
      await ctx.storage.delete(upload.storageId)
    }

    await ctx.db.delete(upload._id)
  },
})

export const storeAnalysisResult = mutation({
  args: {
    uploadId: v.id("uploads"),
    artifactType: artifactTypeValidator,
    preferredLanguage: preferredLanguageValidator,
    ocrText: v.string(),
    ocrConfidence: v.number(),
    detectedItem: v.string(),
    safetyStatus: v.union(
      v.literal("safe"),
      v.literal("caution"),
      v.literal("risky"),
      v.literal("unknown")
    ),
    whyFlagged: v.string(),
    suggestedNextAction: v.string(),
    confidence: v.number(),
    flaggedAllergens: v.optional(v.array(v.string())),
    flaggedIngredients: v.optional(v.array(v.string())),
    matchedProfileRules: v.optional(v.array(v.string())),
    aiModel: v.optional(v.string()),
    rawSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const upload = await ctx.db.get(args.uploadId)

    if (!upload || upload.profileId !== profile._id) {
      throw new Error("Upload not found.")
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("analysisResults")
      .withIndex("uploadId", (q) => q.eq("uploadId", upload._id))
      .unique()

    const analysisData = {
      artifactType: args.artifactType,
      preferredLanguage: args.preferredLanguage,
      detectedItem: args.detectedItem,
      safetyStatus: args.safetyStatus,
      whyFlagged: args.whyFlagged,
      suggestedNextAction: args.suggestedNextAction,
      confidence: args.confidence,
      flaggedAllergens: args.flaggedAllergens,
      flaggedIngredients: args.flaggedIngredients,
      matchedProfileRules: args.matchedProfileRules,
      aiModel: args.aiModel,
      rawSummary: args.rawSummary,
      updatedAt: now,
    }

    if (existing) {
      await ctx.db.patch(existing._id, analysisData)
    } else {
      await ctx.db.insert("analysisResults", {
        profileId: upload.profileId,
        uploadId: upload._id,
        ...analysisData,
        createdAt: now,
      })
    }

    await ctx.db.patch(upload._id, {
      status: "processed",
      ocrText: args.ocrText || undefined,
      ocrConfidence:
        args.ocrConfidence != null ? args.ocrConfidence : undefined,
      processingError: undefined,
      updatedAt: now,
    })
  },
})
