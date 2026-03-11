import type { GenericMutationCtx, GenericQueryCtx } from "convex/server"

import { authComponent } from "./better-auth/auth"
import type { DataModel, Doc, Id } from "./_generated/dataModel"

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

export async function getAuthUserRecord(ctx: ProfileCtx, userId: string) {
  return await ctx.db.get(userId as Id<"user">)
}

export function getUserDisplayName(args: {
  name?: string | null
  email?: string | null
  fallback?: string
}) {
  const trimmedName = args.name?.trim()

  if (trimmedName) {
    return trimmedName
  }

  const trimmedEmail = args.email?.trim()

  if (trimmedEmail) {
    return trimmedEmail
  }

  return args.fallback ?? "Bridge member"
}

export async function getCaregiverLinksForUser(
  ctx: ProfileCtx,
  userId: string
) {
  const links = await ctx.db
    .query("caregiverLinks")
    .withIndex("caregiverUserId", (q) => q.eq("caregiverUserId", userId))
    .collect()

  return links.filter((link) => link.status === "active")
}

export async function getActiveCaregiverLink(
  ctx: ProfileCtx,
  args: {
    patientProfileId: Id<"profiles">
    caregiverUserId: string
  }
) {
  const links = await ctx.db
    .query("caregiverLinks")
    .withIndex("patientProfileId_status", (q) =>
      q.eq("patientProfileId", args.patientProfileId).eq("status", "active")
    )
    .collect()

  return (
    links.find((link) => link.caregiverUserId === args.caregiverUserId) ?? null
  )
}

export async function ensureCanAccessProfile(
  ctx: ProfileCtx,
  targetProfileId: Id<"profiles">
) {
  const user = await authComponent.getAuthUser(ctx)
  const profile = await ctx.db.get(targetProfileId)

  if (!profile) {
    throw new Error("Profile not found.")
  }

  const isOwner = profile.userId === user._id

  if (isOwner) {
    return {
      userId: user._id,
      profile,
      access: "owner" as const,
    }
  }

  const caregiverLink = await getActiveCaregiverLink(ctx, {
    patientProfileId: profile._id,
    caregiverUserId: user._id,
  })

  if (!caregiverLink) {
    throw new Error("You do not have access to this profile.")
  }

  return {
    userId: user._id,
    profile,
    access: "caregiver" as const,
    caregiverLink,
  }
}
