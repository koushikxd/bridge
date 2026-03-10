import type { GenericMutationCtx, GenericQueryCtx } from "convex/server"

import { authComponent } from "./better-auth/auth"
import type { DataModel, Doc } from "./_generated/dataModel"

type ProfileCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

export async function getProfileForUserId(ctx: ProfileCtx, userId: string) {
  return await ctx.db
    .query("profiles")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .unique()
}

export async function requireCurrentProfile(ctx: ProfileCtx): Promise<{
  userId: string
  profile: Doc<"profiles">
}> {
  const user = await authComponent.getAuthUser(ctx)
  const profile = await getProfileForUserId(ctx, user._id)

  if (!profile) {
    throw new Error("Profile not found. Complete language selection first.")
  }

  return {
    userId: user._id,
    profile,
  }
}
