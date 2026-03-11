import { v } from "convex/values"
import type { GenericMutationCtx } from "convex/server"

import { mutation, query } from "./_generated/server"
import type { DataModel, Id } from "./_generated/dataModel"
import {
  getHomeDataForProfile,
  getSettingsDataForProfile,
} from "./dashboard_helpers"
import {
  ensureCanAccessProfile,
  requireCurrentProfile,
} from "./profile_helpers"
import {
  addDaysInTimeZone,
  buildDoseTimestamp,
  getStartOfDayInTimeZone,
  normalizeTimeValues,
  normalizeTimeZone,
} from "../lib/time"

async function replaceMedicineEventsForSchedule(
  ctx: GenericMutationCtx<DataModel>,
  args: {
    profileId: Id<"profiles">
    medicineId: Id<"medicines">
    scheduleId: Id<"medicineSchedules">
    durationDays: number
    startAt: number
    timeZone: string
    times: string[]
  }
) {
  const existingEvents = await ctx.db
    .query("medicineEvents")
    .withIndex("scheduleId_dueAt", (q) => q.eq("scheduleId", args.scheduleId))
    .collect()

  await Promise.all(existingEvents.map((event) => ctx.db.delete(event._id)))

  for (let day = 0; day < args.durationDays; day += 1) {
    const dayStart = addDaysInTimeZone(args.startAt, day, args.timeZone)

    for (const time of args.times) {
      await ctx.db.insert("medicineEvents", {
        profileId: args.profileId,
        medicineId: args.medicineId,
        scheduleId: args.scheduleId,
        eventType: "scheduled",
        dueAt: buildDoseTimestamp(dayStart, time, args.timeZone),
        createdAt: Date.now(),
      })
    }
  }
}

export const saveOnboardingMedicines = mutation({
  args: {
    timeZone: v.string(),
    medicines: v.array(
      v.object({
        name: v.string(),
        dosage: v.optional(v.string()),
        instructions: v.optional(v.string()),
        purpose: v.optional(v.string()),
        times: v.array(v.string()),
        durationDays: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const now = Date.now()
    const timeZone = normalizeTimeZone(args.timeZone)
    const existingMedicines = await ctx.db
      .query("medicines")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const existingSchedules = await ctx.db
      .query("medicineSchedules")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const existingEvents = await ctx.db
      .query("medicineEvents")
      .withIndex("profileId_dueAt", (q) => q.eq("profileId", profile._id))
      .collect()

    await Promise.all(existingEvents.map((event) => ctx.db.delete(event._id)))
    await Promise.all(
      existingSchedules.map((schedule) => ctx.db.delete(schedule._id))
    )
    await Promise.all(
      existingMedicines.map((medicine) => ctx.db.delete(medicine._id))
    )

    const startAt = getStartOfDayInTimeZone(now, timeZone)
    const medicineNames: string[] = []

    for (const medicine of args.medicines) {
      const times = normalizeTimeValues(medicine.times)
      medicineNames.push(medicine.name)

      const endsAt =
        addDaysInTimeZone(startAt, medicine.durationDays, timeZone) - 1
      const medicineId = await ctx.db.insert("medicines", {
        profileId: profile._id,
        name: medicine.name,
        dosage: medicine.dosage,
        instructions: medicine.instructions,
        purpose: medicine.purpose,
        isActive: true,
        startDate: new Date(startAt).toISOString(),
        endDate: new Date(endsAt).toISOString(),
        createdAt: now,
        updatedAt: now,
      })

      const scheduleId = await ctx.db.insert("medicineSchedules", {
        profileId: profile._id,
        medicineId,
        label: medicine.name,
        dosageText: medicine.dosage,
        times,
        frequencyText:
          times.length === 1 ? "Once daily" : `${times.length} times daily`,
        reminderChannels: ["in_app"],
        timezone: timeZone,
        startsAt: startAt,
        endsAt,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })

      await replaceMedicineEventsForSchedule(ctx, {
        profileId: profile._id,
        medicineId,
        scheduleId,
        durationDays: medicine.durationDays,
        startAt,
        timeZone,
        times,
      })
    }

    await ctx.db.patch(profile._id, {
      currentMedications: medicineNames,
      reminderPreferences: {
        enabled: profile.reminderPreferences?.enabled ?? true,
        channels: profile.reminderPreferences?.channels ?? ["in_app"],
        timezone: timeZone,
        quietHoursStart: profile.reminderPreferences?.quietHoursStart,
        quietHoursEnd: profile.reminderPreferences?.quietHoursEnd,
      },
      updatedAt: now,
    })

    return { success: true, count: medicineNames.length }
  },
})

export const getSettingsData = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireCurrentProfile(ctx)
    return await getSettingsDataForProfile(ctx, profile)
  },
})

export const updateMedicineSettings = mutation({
  args: {
    timeZone: v.string(),
    medicines: v.array(
      v.object({
        medicineId: v.optional(v.id("medicines")),
        name: v.string(),
        dosage: v.optional(v.string()),
        instructions: v.optional(v.string()),
        purpose: v.optional(v.string()),
        times: v.array(v.string()),
        durationDays: v.number(),
        isActive: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const now = Date.now()
    const timeZone = normalizeTimeZone(args.timeZone)
    const startAt = getStartOfDayInTimeZone(now, timeZone)
    const existingMedicines = await ctx.db
      .query("medicines")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()
    const existingSchedules = await ctx.db
      .query("medicineSchedules")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const scheduleByMedicineId = new Map(
      existingSchedules.map((schedule) => [
        schedule.medicineId as string,
        schedule,
      ])
    )
    const keepIds = new Set(
      args.medicines
        .map((medicine) => medicine.medicineId)
        .filter((medicineId): medicineId is NonNullable<typeof medicineId> =>
          Boolean(medicineId)
        )
        .map((medicineId) => medicineId as string)
    )

    for (const medicine of existingMedicines) {
      if (keepIds.has(medicine._id as string)) {
        continue
      }

      await ctx.db.patch(medicine._id, {
        isActive: false,
        updatedAt: now,
      })

      const schedule = scheduleByMedicineId.get(medicine._id as string)
      if (schedule) {
        await ctx.db.patch(schedule._id, {
          status: "paused",
          updatedAt: now,
        })

        await replaceMedicineEventsForSchedule(ctx, {
          profileId: profile._id,
          medicineId: medicine._id,
          scheduleId: schedule._id,
          durationDays: 0,
          startAt,
          timeZone,
          times: [],
        })
      }
    }

    const medicationNames: string[] = []

    for (const medicine of args.medicines) {
      const times = normalizeTimeValues(medicine.times)
      medicationNames.push(medicine.name)
      const endsAt =
        addDaysInTimeZone(startAt, medicine.durationDays, timeZone) - 1

      if (medicine.medicineId) {
        const existingMedicine = await ctx.db.get(medicine.medicineId)

        if (!existingMedicine || existingMedicine.profileId !== profile._id) {
          throw new Error("Medicine not found.")
        }

        await ctx.db.patch(existingMedicine._id, {
          name: medicine.name,
          dosage: medicine.dosage,
          instructions: medicine.instructions,
          purpose: medicine.purpose,
          isActive: medicine.isActive,
          startDate: new Date(startAt).toISOString(),
          endDate: new Date(endsAt).toISOString(),
          updatedAt: now,
        })

        const existingSchedule = scheduleByMedicineId.get(
          existingMedicine._id as string
        )
        if (existingSchedule) {
          await ctx.db.patch(existingSchedule._id, {
            label: medicine.name,
            dosageText: medicine.dosage,
            times,
            frequencyText:
              times.length === 1 ? "Once daily" : `${times.length} times daily`,
            timezone: timeZone,
            startsAt: startAt,
            endsAt,
            status: medicine.isActive ? "active" : "paused",
            updatedAt: now,
          })

          await replaceMedicineEventsForSchedule(ctx, {
            profileId: profile._id,
            medicineId: existingMedicine._id,
            scheduleId: existingSchedule._id,
            durationDays: medicine.durationDays,
            startAt,
            timeZone,
            times,
          })
        }

        continue
      }

      const medicineId = await ctx.db.insert("medicines", {
        profileId: profile._id,
        name: medicine.name,
        dosage: medicine.dosage,
        instructions: medicine.instructions,
        purpose: medicine.purpose,
        isActive: medicine.isActive,
        startDate: new Date(startAt).toISOString(),
        endDate: new Date(endsAt).toISOString(),
        createdAt: now,
        updatedAt: now,
      })

      const scheduleId = await ctx.db.insert("medicineSchedules", {
        profileId: profile._id,
        medicineId,
        label: medicine.name,
        dosageText: medicine.dosage,
        times,
        frequencyText:
          times.length === 1 ? "Once daily" : `${times.length} times daily`,
        reminderChannels: ["in_app"],
        timezone: timeZone,
        startsAt: startAt,
        endsAt,
        status: medicine.isActive ? "active" : "paused",
        createdAt: now,
        updatedAt: now,
      })

      await replaceMedicineEventsForSchedule(ctx, {
        profileId: profile._id,
        medicineId,
        scheduleId,
        durationDays: medicine.durationDays,
        startAt,
        timeZone,
        times,
      })
    }

    await ctx.db.patch(profile._id, {
      currentMedications: medicationNames,
      reminderPreferences: {
        enabled: profile.reminderPreferences?.enabled ?? true,
        channels: profile.reminderPreferences?.channels ?? ["in_app"],
        timezone: timeZone,
        quietHoursStart: profile.reminderPreferences?.quietHoursStart,
        quietHoursEnd: profile.reminderPreferences?.quietHoursEnd,
      },
      updatedAt: now,
    })

    return { success: true }
  },
})

export const getHomeData = query({
  args: {},
  handler: async (ctx) => {
    const { profile } = await requireCurrentProfile(ctx)
    return await getHomeDataForProfile(ctx, profile)
  },
})

export const getAccessibleHomeData = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { profile } = await ensureCanAccessProfile(ctx, args.profileId)
    return await getHomeDataForProfile(ctx, profile)
  },
})

export const getAccessibleSettingsData = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const { profile } = await ensureCanAccessProfile(ctx, args.profileId)
    return await getSettingsDataForProfile(ctx, profile)
  },
})

export const logDoseEvent = mutation({
  args: {
    eventId: v.id("medicineEvents"),
    eventType: v.union(
      v.literal("taken"),
      v.literal("skipped"),
      v.literal("snoozed")
    ),
  },
  handler: async (ctx, args) => {
    const { profile, userId } = await requireCurrentProfile(ctx)
    const event = await ctx.db.get(args.eventId)

    if (!event || event.profileId !== profile._id) {
      throw new Error("Dose event not found.")
    }

    await ctx.db.patch(event._id, {
      eventType: args.eventType,
      completedAt: Date.now(),
      createdByUserId: userId,
    })

    return await ctx.db.get(event._id)
  },
})

export const updateReminderPreferences = mutation({
  args: {
    enabled: v.boolean(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const { profile } = await requireCurrentProfile(ctx)
    const now = Date.now()
    const timezone = normalizeTimeZone(args.timezone)

    await ctx.db.patch(profile._id, {
      reminderPreferences: {
        enabled: args.enabled,
        channels: ["in_app"],
        timezone,
        quietHoursStart: profile.reminderPreferences?.quietHoursStart,
        quietHoursEnd: profile.reminderPreferences?.quietHoursEnd,
      },
      updatedAt: now,
    })

    return await ctx.db.get(profile._id)
  },
})
