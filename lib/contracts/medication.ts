import { z } from "zod"

import { normalizeTimeValue, normalizeTimeValues } from "@/lib/time"

export const timeOfDaySchema = z
  .string()
  .refine((value) => normalizeTimeValue(value) !== null, "Use HH:MM format")

export const browserTimeZoneSchema = z
  .string()
  .trim()
  .min(1, "Timezone is required")

export const onboardingMedicineSchema = z.object({
  name: z.string().trim().min(1, "Medicine name is required"),
  dosage: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  times: z
    .array(timeOfDaySchema)
    .min(1, "Add at least one time")
    .max(6, "Use up to 6 times per day")
    .transform((times) => normalizeTimeValues(times)),
  durationDays: z
    .number({ error: "Duration is required" })
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration must be under 1 year"),
})

export const onboardingMedicinesSchema = z.object({
  timeZone: browserTimeZoneSchema,
  medicines: z.array(onboardingMedicineSchema),
})

export const medicineSettingsSchema = z.object({
  medicineId: z.string().optional(),
  name: z.string().trim().min(1, "Medicine name is required"),
  dosage: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  purpose: z.string().trim().optional(),
  times: z
    .array(timeOfDaySchema)
    .min(1, "Add at least one time")
    .max(6, "Use up to 6 times per day")
    .transform((times) => normalizeTimeValues(times)),
  durationDays: z
    .number({ error: "Duration is required" })
    .int("Duration must be a whole number")
    .min(1, "Duration must be at least 1 day")
    .max(365, "Duration must be under 1 year"),
  isActive: z.boolean().default(true),
})

export const medicineSettingsListSchema = z.object({
  timeZone: browserTimeZoneSchema,
  medicines: z.array(medicineSettingsSchema),
})

export const reminderPreferencesSchema = z.object({
  enabled: z.boolean(),
  timezone: browserTimeZoneSchema,
})

export const doseEventTypeSchema = z.enum(["taken", "skipped", "snoozed"])

export type OnboardingMedicineInput = z.infer<typeof onboardingMedicineSchema>
export type OnboardingMedicinesInput = z.infer<typeof onboardingMedicinesSchema>
export type MedicineSettingsInput = z.infer<typeof medicineSettingsSchema>
export type MedicineSettingsListInput = z.infer<
  typeof medicineSettingsListSchema
>
export type DoseEventType = z.infer<typeof doseEventTypeSchema>
export type ReminderPreferencesInput = z.infer<typeof reminderPreferencesSchema>
