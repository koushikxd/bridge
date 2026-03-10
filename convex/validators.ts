import { v } from "convex/values"

export const preferredLanguageValidator = v.union(
  v.literal("en"),
  v.literal("hi"),
  v.literal("es"),
  v.literal("ar"),
  v.literal("fr"),
  v.literal("ta")
)

export const reminderChannelValidator = v.union(
  v.literal("in_app"),
  v.literal("push"),
  v.literal("email"),
  v.literal("sms")
)

export const artifactTypeValidator = v.union(
  v.literal("prescription"),
  v.literal("meal"),
  v.literal("food_label"),
  v.literal("medicine_label"),
  v.literal("menu"),
  v.literal("general")
)

export const uploadStatusValidator = v.union(
  v.literal("uploaded"),
  v.literal("processing"),
  v.literal("processed"),
  v.literal("failed")
)

export const uploadSourceValidator = v.union(
  v.literal("camera"),
  v.literal("gallery"),
  v.literal("file"),
  v.literal("share")
)

export const safetyStatusValidator = v.union(
  v.literal("safe"),
  v.literal("caution"),
  v.literal("risky"),
  v.literal("unknown")
)

export const medicineRouteValidator = v.union(
  v.literal("oral"),
  v.literal("topical"),
  v.literal("injection"),
  v.literal("inhaled"),
  v.literal("other")
)

export const scheduleStatusValidator = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("completed")
)

export const dayOfWeekValidator = v.union(
  v.literal("sun"),
  v.literal("mon"),
  v.literal("tue"),
  v.literal("wed"),
  v.literal("thu"),
  v.literal("fri"),
  v.literal("sat")
)

export const adherenceEventTypeValidator = v.union(
  v.literal("scheduled"),
  v.literal("reminded"),
  v.literal("taken"),
  v.literal("skipped"),
  v.literal("missed"),
  v.literal("snoozed")
)

export const caregiverLinkStatusValidator = v.union(
  v.literal("pending"),
  v.literal("active"),
  v.literal("revoked")
)
