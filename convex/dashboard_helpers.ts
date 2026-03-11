import type { GenericMutationCtx, GenericQueryCtx } from "convex/server"

import type { DataModel, Doc } from "./_generated/dataModel"
import {
  addDaysInTimeZone,
  formatWeekdayInTimeZone,
  getEndOfDayInTimeZone,
  getStartOfDayInTimeZone,
  normalizeTimeZone,
} from "../lib/time"

type ProfileCtx = GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>

export function durationDaysFromDates(startDate?: string, endDate?: string) {
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

export function getReminderTimeZone(
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

export async function getSettingsDataForProfile(
  ctx: ProfileCtx,
  profile: Doc<"profiles">
) {
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
      timezone: getReminderTimeZone(profile, schedules),
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
}

export async function getHomeDataForProfile(
  ctx: ProfileCtx,
  profile: Doc<"profiles">
) {
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
}
