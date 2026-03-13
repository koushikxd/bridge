import type { GenericMutationCtx, GenericQueryCtx } from "convex/server"

import { authComponent } from "./better-auth/auth"
import { components } from "./_generated/api"
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
  const componentRecord = await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "user",
    where: [{ field: "_id", value: userId }],
  })

  if (componentRecord) {
    return componentRecord
  }

  const directRecord = await ctx.db.get(userId as Id<"user">)

  if (directRecord) {
    return directRecord
  }

  return await ctx.db
    .query("user")
    .withIndex("userId", (q) => q.eq("userId", userId))
    .unique()
}

function formatEmailLocalPart(email: string) {
  const [localPart] = email.trim().split("@")

  if (!localPart) {
    return email.trim()
  }

  const readableName = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

  return readableName || localPart
}

export function getUserDisplayName(args: {
  name?: string | null
  username?: string | null
  displayUsername?: string | null
  email?: string | null
  fallback?: string
}) {
  const trimmedName = args.name?.trim()

  if (trimmedName) {
    return trimmedName
  }

  const trimmedDisplayUsername = args.displayUsername?.trim()

  if (trimmedDisplayUsername) {
    return trimmedDisplayUsername
  }

  const trimmedUsername = args.username?.trim()

  if (trimmedUsername) {
    return trimmedUsername
  }

  const trimmedEmail = args.email?.trim()

  if (trimmedEmail) {
    return formatEmailLocalPart(trimmedEmail)
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

export async function getActiveConnectionBetweenUsers(
  ctx: ProfileCtx,
  args: {
    userId: string
    connectedUserId: string
  }
) {
  const [userProfile, connectedProfile] = await Promise.all([
    getProfileForUserId(ctx, args.userId),
    getProfileForUserId(ctx, args.connectedUserId),
  ])

  if (connectedProfile) {
    const asInvitedUser = await getActiveCaregiverLink(ctx, {
      patientProfileId: connectedProfile._id,
      caregiverUserId: args.userId,
    })

    if (asInvitedUser) {
      return {
        link: asInvitedUser,
        targetProfile: connectedProfile,
      }
    }
  }

  if (userProfile) {
    const asProfileOwner = await getActiveCaregiverLink(ctx, {
      patientProfileId: userProfile._id,
      caregiverUserId: args.connectedUserId,
    })

    if (asProfileOwner && connectedProfile) {
      return {
        link: asProfileOwner,
        targetProfile: connectedProfile,
      }
    }
  }

  return null
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

  const connection = await getActiveConnectionBetweenUsers(ctx, {
    userId: user._id,
    connectedUserId: profile.userId,
  })

  if (!connection) {
    throw new Error("You do not have access to this profile.")
  }

  return {
    userId: user._id,
    profile,
    access: "connected" as const,
    caregiverLink: connection.link,
  }
}
