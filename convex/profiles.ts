import type { GenericMutationCtx, GenericQueryCtx } from "convex/server"
import { v } from "convex/values"

import { authComponent } from "./better-auth/auth"
import { mutation, query } from "./_generated/server"
import type { DataModel, Doc, Id } from "./_generated/dataModel"
import {
  getAuthUserRecord,
  getCaregiverLinksForUser,
  getProfileForUserId,
  getUserDisplayName,
} from "./profile_helpers"
import { preferredLanguageValidator } from "./validators"

type MutationCtx = GenericMutationCtx<DataModel>
type QueryCtx = GenericQueryCtx<DataModel>
type ProfileCtx = MutationCtx | QueryCtx

function createInviteToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

async function findOrCreateProfile(
  ctx: MutationCtx,
  userId: string
): Promise<Doc<"profiles">> {
  const existingProfile = await getProfileForUserId(ctx, userId)

  if (existingProfile) {
    return existingProfile
  }

  const now = Date.now()
  const profileId = await ctx.db.insert("profiles", {
    userId,
    role: "patient",
    preferredLanguage: "en",
    onboardingCompleted: false,
    onboardingStage: "language",
    reminderPreferences: {
      enabled: true,
      channels: ["in_app"],
    },
    createdAt: now,
    updatedAt: now,
  })

  const profile = await ctx.db.get(profileId)

  if (!profile) {
    throw new Error("Could not create profile.")
  }

  return profile as Doc<"profiles">
}

async function getInviteByToken(ctx: ProfileCtx, token: string) {
  return await ctx.db
    .query("caregiverInvites")
    .withIndex("token", (q) => q.eq("token", token))
    .unique()
}

export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    return await getProfileForUserId(ctx, user._id)
  },
})

export const getSessionContext = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)
    const caregiverLinks = await getCaregiverLinksForUser(ctx, user._id)

    return {
      profile,
      hasCaregiverLinks: caregiverLinks.length > 0,
      linkedProfileIds: caregiverLinks.map((link) => link.patientProfileId),
    }
  },
})

export const getInviteContext = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const invite = await getInviteByToken(ctx, args.token)

    if (!invite) {
      return null
    }

    const patientProfile = await ctx.db.get(invite.patientProfileId)

    if (!patientProfile) {
      return null
    }

    const patient = patientProfile as Doc<"profiles">

    const patientUser = await getAuthUserRecord(ctx, patient.userId)

    return {
      patientName: getUserDisplayName({
        name: patientUser?.name,
        email: patientUser?.email,
      }),
      patientEmail: patientUser?.email ?? null,
    }
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
    const caregiverLinks = await getCaregiverLinksForUser(ctx, user._id)
    const shouldCompleteForCaregiver = caregiverLinks.length > 0

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        preferredLanguage: args.preferredLanguage,
        reminderPreferences: existingProfile.reminderPreferences ?? {
          enabled: true,
          channels: ["in_app"],
        },
        onboardingCompleted:
          existingProfile.onboardingCompleted || shouldCompleteForCaregiver,
        onboardingStage:
          existingProfile.onboardingCompleted || shouldCompleteForCaregiver
            ? "completed"
            : "chat",
        updatedAt: now,
      })

      return await ctx.db.get(existingProfile._id)
    }

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      role: "patient",
      preferredLanguage: args.preferredLanguage,
      onboardingCompleted: shouldCompleteForCaregiver,
      onboardingStage: shouldCompleteForCaregiver ? "completed" : "chat",
      reminderPreferences: {
        enabled: true,
        channels: ["in_app"],
      },
      createdAt: now,
      updatedAt: now,
    })

    return await ctx.db.get(profileId)
  },
})

export const acceptCaregiverInvite = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const invite = await getInviteByToken(ctx, args.token)

    if (!invite) {
      return { success: false, reason: "invalid" as const }
    }

    const patientProfile = await ctx.db.get(invite.patientProfileId)

    if (!patientProfile) {
      return { success: false, reason: "invalid" as const }
    }

    const patient = patientProfile as Doc<"profiles">

    if (patient.userId === user._id) {
      return { success: false, reason: "invalid" as const }
    }

    const profile = await findOrCreateProfile(ctx, user._id)
    const authUser = await getAuthUserRecord(ctx, user._id)
    const existingLinks = await ctx.db
      .query("caregiverLinks")
      .withIndex("patientProfileId", (q) =>
        q.eq("patientProfileId", patient._id)
      )
      .collect()

    const existingLink = existingLinks.find(
      (link) => link.caregiverUserId === user._id
    )
    const now = Date.now()

    if (existingLink) {
      await ctx.db.patch(existingLink._id, {
        caregiverEmail: authUser?.email ?? existingLink.caregiverEmail,
        status: "active",
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("caregiverLinks", {
        patientProfileId: patient._id,
        caregiverUserId: user._id,
        caregiverEmail: authUser?.email,
        permissions: ["read"],
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
    }

    if (!profile.preferredLanguage) {
      await ctx.db.patch(profile._id, {
        preferredLanguage: "en",
        updatedAt: now,
      })
    }

    return { success: true, patientProfileId: patient._id }
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
      onboardingStage: "completed",
      updatedAt: Date.now(),
    })

    return await ctx.db.get(profile._id)
  },
})

export const completeProfileQuestions = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      throw new Error("Profile not found. Complete language selection first.")
    }

    await ctx.db.patch(profile._id, {
      onboardingStage: "medications",
      updatedAt: Date.now(),
    })

    return await ctx.db.get(profile._id)
  },
})

export const updateProfileSettings = mutation({
  args: {
    preferredLanguage: preferredLanguageValidator,
    age: v.optional(v.union(v.number(), v.null())),
    allergies: v.array(v.string()),
    chronicConditions: v.array(v.string()),
    dietaryRestrictions: v.array(v.string()),
    religiousRestrictions: v.array(v.string()),
    emergencyNotes: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      throw new Error("Profile not found. Complete language selection first.")
    }

    await ctx.db.patch(profile._id, {
      preferredLanguage: args.preferredLanguage,
      age: args.age === null ? undefined : args.age,
      allergies: args.allergies,
      chronicConditions: args.chronicConditions,
      dietaryRestrictions: args.dietaryRestrictions,
      religiousRestrictions: args.religiousRestrictions,
      emergencyNotes:
        args.emergencyNotes === null ? undefined : args.emergencyNotes,
      updatedAt: Date.now(),
    })

    return await ctx.db.get(profile._id)
  },
})

export const getLinkedProfiles = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const ownProfile = await getProfileForUserId(ctx, user._id)
    const linkedAsCaregiver = await getCaregiverLinksForUser(ctx, user._id)

    const connectionsAsViewer = await Promise.all(
      linkedAsCaregiver.map(async (link) => {
        const patientProfile = await ctx.db.get(link.patientProfileId)

        if (!patientProfile) {
          return null
        }

        const patient = patientProfile as Doc<"profiles">

        const patientUser = await getAuthUserRecord(ctx, patient.userId)
        const medicines = await ctx.db
          .query("medicines")
          .withIndex("profileId_isActive", (q) =>
            q.eq("profileId", patient._id).eq("isActive", true)
          )
          .collect()

        return {
          linkId: link._id,
          userId: patient.userId,
          profileId: patient._id,
          name: getUserDisplayName({
            name: patientUser?.name,
            email: patientUser?.email,
          }),
          email: patientUser?.email ?? null,
          direction: "outbound" as const,
          canOpenProfile: true,
          activeMedicines: medicines.length,
        }
      })
    )

    const outboundConnections = connectionsAsViewer.filter(
      (item): item is NonNullable<(typeof connectionsAsViewer)[number]> =>
        item !== null
    )

    const inboundConnections = ownProfile
      ? await Promise.all(
          (
            await ctx.db
              .query("caregiverLinks")
              .withIndex("patientProfileId_status", (q) =>
                q.eq("patientProfileId", ownProfile._id).eq("status", "active")
              )
              .collect()
          ).map(async (link) => {
            const caregiverUser = await getAuthUserRecord(
              ctx,
              link.caregiverUserId
            )

            return {
              linkId: link._id,
              userId: link.caregiverUserId,
              profileId: null,
              name: getUserDisplayName({
                name: caregiverUser?.name,
                email: caregiverUser?.email ?? link.caregiverEmail,
              }),
              email: caregiverUser?.email ?? link.caregiverEmail ?? null,
              direction: "inbound" as const,
              canOpenProfile: false,
              activeMedicines: null,
            }
          })
        )
      : []

    const connections = [...inboundConnections, ...outboundConnections].sort(
      (a, b) => a.name.localeCompare(b.name)
    )

    return {
      connections,
      connectionCount: connections.length,
      ownProfileId: ownProfile?._id ?? null,
      hasOwnProfile: Boolean(ownProfile),
    }
  },
})

export const removeCareNetworkLink = mutation({
  args: {
    linkId: v.id("caregiverLinks"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const link = await ctx.db.get(args.linkId)

    if (!link) {
      throw new Error("Care link not found.")
    }

    const patientProfile = await ctx.db.get(link.patientProfileId)

    if (!patientProfile) {
      await ctx.db.delete(link._id)
      return { success: true }
    }

    const canManage =
      link.caregiverUserId === user._id || patientProfile.userId === user._id

    if (!canManage) {
      throw new Error("You do not have permission to remove this link.")
    }

    await ctx.db.delete(link._id)

    return { success: true }
  },
})

export const createCaregiverInvite = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      throw new Error("Profile not found. Complete language selection first.")
    }

    const existingInvite = await ctx.db
      .query("caregiverInvites")
      .withIndex("patientProfileId", (q) =>
        q.eq("patientProfileId", profile._id)
      )
      .unique()
    const now = Date.now()
    const token = createInviteToken()

    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, {
        token,
        updatedAt: now,
      })

      return { token }
    }

    await ctx.db.insert("caregiverInvites", {
      patientProfileId: profile._id,
      token,
      createdByUserId: user._id,
      createdAt: now,
      updatedAt: now,
    })

    return { token }
  },
})

export const getCaregiverInvite = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx)
    const profile = await getProfileForUserId(ctx, user._id)

    if (!profile) {
      return null
    }

    return await ctx.db
      .query("caregiverInvites")
      .withIndex("patientProfileId", (q) =>
        q.eq("patientProfileId", profile._id)
      )
      .unique()
  },
})

export const getAccessibleProfileSummary = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx)
    const targetProfile = await ctx.db.get(args.profileId)

    if (!targetProfile) {
      return null
    }

    const target = targetProfile as Doc<"profiles">

    if (target.userId !== user._id) {
      const caregiverLinks = await getCaregiverLinksForUser(ctx, user._id)
      const canAccess = caregiverLinks.some(
        (link) => link.patientProfileId === target._id
      )

      if (!canAccess) {
        return null
      }
    }

    const targetUser = await getAuthUserRecord(ctx, target.userId)

    return {
      profileId: target._id as Id<"profiles">,
      userName: getUserDisplayName({
        name: targetUser?.name,
        email: targetUser?.email,
      }),
      userEmail: targetUser?.email ?? null,
      preferredLanguage: target.preferredLanguage,
      onboardingCompleted: target.onboardingCompleted,
      age: target.age,
      allergies: target.allergies ?? [],
      chronicConditions: target.chronicConditions ?? [],
      dietaryRestrictions: target.dietaryRestrictions ?? [],
      religiousRestrictions: target.religiousRestrictions ?? [],
      emergencyNotes: target.emergencyNotes ?? null,
    }
  },
})
