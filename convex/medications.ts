import { v } from "convex/values"
import type { GenericMutationCtx } from "convex/server"

import { mutation, query } from "./_generated/server"
import type { DataModel, Id } from "./_generated/dataModel"
import { requireCurrentProfile } from "./profile_helpers"
import {
  addDaysInTimeZone,
  buildDoseTimestamp,
  formatWeekdayInTimeZone,
  getEndOfDayInTimeZone,
  getStartOfDayInTimeZone,
  normalizeTimeValues,
  normalizeTimeZone,
} from "../lib/time"

function durationDaysFromDates(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) {
    return 1
  }

  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()

  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 1
  }

  return Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1)
}

function getReminderTimeZone(
  profile: {
    reminderPreferences?: { timezone?: string }
  },
  schedules?: Array<{ timezone: string }>
) {
  return normalizeTimeZone(
    schedules?.find((schedule) => schedule.timezone)?.timezone ??
      profile.reminderPreferences?.timezone
  )
}

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
    const medicines = await ctx.db
      .query("medicines")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const schedules = await ctx.db
      .query("medicineSchedules")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const schedulesByMedicineId = new Map<string, typeof schedules>()

    for (const schedule of schedules) {
      const key = schedule.medicineId as string
      const existing = schedulesByMedicineId.get(key) ?? []
      existing.push(schedule)
      schedulesByMedicineId.set(key, existing)
    }

    return {
      profile,
      reminderPreferences: {
        enabled: profile.reminderPreferences?.enabled ?? true,
        timezone: getReminderTimeZone(profile),
      },
      medicines: medicines
        .map((medicine) => {
          const medicineSchedules =
            schedulesByMedicineId.get(medicine._id as string) ?? []
          const primarySchedule = medicineSchedules[0]

          return {
            medicineId: medicine._id,
            name: medicine.name,
            dosage: medicine.dosage ?? "",
            instructions: medicine.instructions ?? "",
            purpose: medicine.purpose ?? "",
            times: primarySchedule?.times ?? ["08:00"],
            durationDays: durationDaysFromDates(
              medicine.startDate,
              medicine.endDate
            ),
            isActive: medicine.isActive,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
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
    const now = Date.now()
    const allMedicines = await ctx.db
      .query("medicines")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const medicines = allMedicines.filter((medicine) => medicine.isActive)

    const schedules = await ctx.db
      .query("medicineSchedules")
      .withIndex("profileId", (q) => q.eq("profileId", profile._id))
      .collect()

    const timeZone = getReminderTimeZone(profile, schedules)
    const dayStart = getStartOfDayInTimeZone(now, timeZone)
    const dayEnd = getEndOfDayInTimeZone(now, timeZone)
    const weekStart = addDaysInTimeZone(dayStart, -6, timeZone)
    const events = await ctx.db
      .query("medicineEvents")
      .withIndex("profileId_dueAt", (q) =>
        q
          .eq("profileId", profile._id)
          .gte("dueAt", weekStart)
          .lte("dueAt", dayEnd)
      )
      .collect()

    const uploads = await ctx.db
      .query("uploads")
      .withIndex("profileId_createdAt", (q) => q.eq("profileId", profile._id))
      .order("desc")
      .take(5)

    const analyses = await Promise.all(
      uploads.map(async (upload) => {
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
      })
    )

    const medicineMap = new Map(
      allMedicines.map((medicine) => [medicine._id, medicine])
    )
    const scheduleMap = new Map(
      schedules.map((schedule) => [schedule._id, schedule])
    )

    const todayDoses = events
      .filter((event) => event.dueAt >= dayStart && event.dueAt <= dayEnd)
      .map((event) => {
        const medicine = medicineMap.get(event.medicineId)
        const schedule = event.scheduleId
          ? scheduleMap.get(event.scheduleId)
          : null
        return {
          _id: event._id,
          dueAt: event.dueAt,
          eventType: event.eventType,
          completedAt: event.completedAt ?? null,
          medicineName: medicine?.name ?? schedule?.label ?? "Medicine",
          dosage: medicine?.dosage ?? schedule?.dosageText ?? null,
          instructions: medicine?.instructions ?? null,
        }
      })
      .sort((a, b) => a.dueAt - b.dueAt)

    const total = todayDoses.length
    const taken = todayDoses.filter((dose) => dose.eventType === "taken").length
    const skipped = todayDoses.filter(
      (dose) => dose.eventType === "skipped"
    ).length
    const snoozed = todayDoses.filter(
      (dose) => dose.eventType === "snoozed"
    ).length
    const scheduled = todayDoses.filter(
      (dose) => dose.eventType === "scheduled"
    ).length
    const adherence = total === 0 ? 0 : Math.round((taken / total) * 100)
    const nextDose = todayDoses.find(
      (dose) => dose.dueAt >= now && dose.eventType === "scheduled"
    )

    const progress = Array.from({ length: 7 }, (_, index) => {
      const reference = addDaysInTimeZone(dayStart, index - 6, timeZone)
      const start = getStartOfDayInTimeZone(reference, timeZone)
      const end = getEndOfDayInTimeZone(reference, timeZone)

      const dailyEvents = events.filter(
        (event) => event.dueAt >= start && event.dueAt <= end
      )

      const dailyTaken = dailyEvents.filter(
        (event) => event.eventType === "taken"
      ).length

      return {
        label: formatWeekdayInTimeZone(reference, timeZone),
        percent:
          dailyEvents.length === 0
            ? 0
            : Math.round((dailyTaken / dailyEvents.length) * 100),
      }
    })

    return {
      profile,
      reminderPreferences: {
        enabled: profile.reminderPreferences?.enabled ?? true,
        timezone: timeZone,
      },
      medicines,
      todayDoses,
      stats: {
        total,
        taken,
        skipped,
        snoozed,
        scheduled,
        adherence,
      },
      nextDose,
      progress,
      recentAnalyses: analyses,
    }
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
