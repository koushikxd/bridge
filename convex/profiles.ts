import { v } from "convex/values"

import { authComponent } from "./better-auth/auth"
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"

const preferredLanguageValidator = v.union(
  v.literal("en"),
  v.literal("hi"),
  v.literal("es"),
  v.literal("ar"),
  v.literal("fr"),
  v.literal("ta")
)

async function getProfileForUserId(
  ctx: QueryCtx | MutationCtx,
  userId: string
) {
  return await ctx.db
    .query("profiles")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .unique()
}

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    return await getProfileForUserId(ctx, user._id)
  },
})

export const upsertPreferredLanguage = mutation({
  args: {
    preferredLanguage: preferredLanguageValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const now = Date.now()
    const existingProfile = await getProfileForUserId(ctx, user._id)

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        preferredLanguage: args.preferredLanguage,
        updatedAt: now,
      })

      return await ctx.db.get(existingProfile._id)
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      role: "patient",
      preferredLanguage: args.preferredLanguage,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(profileId)
  },
})

export const updateOnboardingProfile = mutation({
  args: {
    age: v.optional(v.number()),
    allergies: v.optional(v.array(v.string())),
    chronicConditions: v.optional(v.array(v.string())),
    currentMedications: v.optional(v.array(v.string())),
    dietaryRestrictions: v.optional(v.array(v.string())),
    religiousRestrictions: v.optional(v.array(v.string())),
    emergencyNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      throw new Error("Profile not found. Complete language selection first.")
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() }

    if (args.age !== undefined) updates.age = args.age
    if (args.allergies !== undefined) updates.allergies = args.allergies
    if (args.chronicConditions !== undefined)
      updates.chronicConditions = args.chronicConditions
    if (args.currentMedications !== undefined)
      updates.currentMedications = args.currentMedications
    if (args.dietaryRestrictions !== undefined)
      updates.dietaryRestrictions = args.dietaryRestrictions
    if (args.religiousRestrictions !== undefined)
      updates.religiousRestrictions = args.religiousRestrictions
    if (args.emergencyNotes !== undefined)
      updates.emergencyNotes = args.emergencyNotes

    await ctx.db.patch(profile._id, updates)

    return await ctx.db.get(profile._id)
  },
})

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      throw new Error("Profile not found. Complete language selection first.")
    }

    await ctx.db.patch(profile._id, {
      onboardingCompleted: true,
      updatedAt: Date.now(),
    })

    return await ctx.db.get(profile._id)
  },
})
