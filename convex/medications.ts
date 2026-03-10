import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireCurrentProfile } from "./profile_helpers"

function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function endOfLocalDay(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

function buildDoseTimestamp(dayStart: number, time: string) {
  const [hours, minutes] = time.split(":").map(Number)
  const due = new Date(dayStart)
  due.setHours(hours, minutes, 0, 0)
  return due.getTime()
}

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

function weekdayLabel(offset: number) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  return labels[offset] ?? "Day"
}

export const saveOnboardingMedicines = mutation({
  args: {
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

    const startAt = startOfLocalDay(now)
    const medicineNames: string[] = []

    for (const medicine of args.medicines) {
      medicineNames.push(medicine.name)

      const endsAt = startAt + (medicine.durationDays - 1) * 24 * 60 * 60 * 1000
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
        times: medicine.times,
        frequencyText:
          medicine.times.length === 1
            ? "Once daily"
            : `${medicine.times.length} times daily`,
        reminderChannels: ["in_app"],
        timezone: "UTC",
        startsAt: startAt,
        endsAt,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })

      for (let day = 0; day < medicine.durationDays; day += 1) {
        const dayStart = startAt + day * 24 * 60 * 60 * 1000
        for (const time of medicine.times) {
          await ctx.db.insert("medicineEvents", {
            profileId: profile._id,
            medicineId,
            scheduleId,
            eventType: "scheduled",
            dueAt: buildDoseTimestamp(dayStart, time),
            createdAt: now,
          })
        }
      }
    }

    await ctx.db.patch(profile._id, {
      currentMedications: medicineNames,
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
    const startAt = startOfLocalDay(now)
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
      }
    }

    const medicationNames: string[] = []

    for (const medicine of args.medicines) {
      medicationNames.push(medicine.name)
      const endsAt = startAt + (medicine.durationDays - 1) * 24 * 60 * 60 * 1000

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
            times: medicine.times,
            frequencyText:
              medicine.times.length === 1
                ? "Once daily"
                : `${medicine.times.length} times daily`,
            startsAt: startAt,
            endsAt,
            status: medicine.isActive ? "active" : "paused",
            updatedAt: now,
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

      await ctx.db.insert("medicineSchedules", {
        profileId: profile._id,
        medicineId,
        label: medicine.name,
        dosageText: medicine.dosage,
        times: medicine.times,
        frequencyText:
          medicine.times.length === 1
            ? "Once daily"
            : `${medicine.times.length} times daily`,
        reminderChannels: ["in_app"],
        timezone: "UTC",
        startsAt: startAt,
        endsAt,
        status: medicine.isActive ? "active" : "paused",
        createdAt: now,
        updatedAt: now,
      })
    }

    await ctx.db.patch(profile._id, {
      currentMedications: medicationNames,
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
    const dayStart = startOfLocalDay(now)
    const dayEnd = endOfLocalDay(now)
    const weekStart = startOfLocalDay(dayStart - 6 * 24 * 60 * 60 * 1000)
    const medicines = await ctx.db
      .query("medicines")
      .withIndex("profileId_isActive", (q) =>
        q.eq("profileId", profile._id).eq("isActive", true)
      )
      .collect()

    const schedules = await ctx.db
      .query("medicineSchedules")
      .withIndex("profileId_status", (q) =>
        q.eq("profileId", profile._id).eq("status", "active")
      )
      .collect()

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
      medicines.map((medicine) => [medicine._id, medicine])
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
          medicineName: medicine?.name ?? "Medicine",
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
      const date = new Date(dayStart - (6 - index) * 24 * 60 * 60 * 1000)
      const start = startOfLocalDay(date.getTime())
      const end = endOfLocalDay(date.getTime())

      const dailyEvents = events.filter(
        (event) => event.dueAt >= start && event.dueAt <= end
      )

      const dailyTaken = dailyEvents.filter(
        (event) => event.eventType === "taken"
      ).length

      return {
        label: weekdayLabel(date.getDay()),
        percent:
          dailyEvents.length === 0
            ? 0
            : Math.round((dailyTaken / dailyEvents.length) * 100),
      }
    })

    return {
      profile,
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
