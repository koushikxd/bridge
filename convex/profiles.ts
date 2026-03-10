import { v } from "convex/values"

import { authComponent } from "./better-auth/auth"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"

const preferredLanguageValidator = v.union(
  v.literal("en"),
  v.literal("hi"),
  v.literal("es"),
  v.literal("ar"),
  v.literal("fr"),
  v.literal("ta")
)

async function getProfileForUserId(ctx: QueryCtx | MutationCtx, userId: string) {
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
        onboardingCompleted: true,
        updatedAt: now,
      })

      return await ctx.db.get(existingProfile._id)
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      role: "patient",
      preferredLanguage: args.preferredLanguage,
      onboardingCompleted: true,
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(profileId)
  },
})
