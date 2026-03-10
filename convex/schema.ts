import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import { tables as authTables } from "./better-auth/schema"
import {
  adherenceEventTypeValidator,
  artifactTypeValidator,
  caregiverLinkStatusValidator,
  dayOfWeekValidator,
  medicineRouteValidator,
  preferredLanguageValidator,
  reminderChannelValidator,
  safetyStatusValidator,
  scheduleStatusValidator,
  uploadSourceValidator,
  uploadStatusValidator,
} from "./validators"

export default defineSchema({
  ...authTables,
  profiles: defineTable({
    userId: v.string(),
    role: v.literal("patient"),
    preferredLanguage: preferredLanguageValidator,
    onboardingCompleted: v.boolean(),
    onboardingStage: v.optional(
      v.union(
        v.literal("language"),
        v.literal("chat"),
        v.literal("medications"),
        v.literal("completed")
      )
    ),
    age: v.optional(v.number()),
    allergies: v.optional(v.array(v.string())),
    chronicConditions: v.optional(v.array(v.string())),
    dietaryRestrictions: v.optional(v.array(v.string())),
    religiousRestrictions: v.optional(v.array(v.string())),
    currentMedications: v.optional(v.array(v.string())),
    mealPreferences: v.optional(v.array(v.string())),
    reminderPreferences: v.optional(
      v.object({
        enabled: v.boolean(),
        channels: v.array(reminderChannelValidator),
        timezone: v.optional(v.string()),
        quietHoursStart: v.optional(v.string()),
        quietHoursEnd: v.optional(v.string()),
      })
    ),
    caregiverContact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
      })
    ),
    emergencyNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("preferredLanguage", ["preferredLanguage"]),
  uploads: defineTable({
    profileId: v.id("profiles"),
    uploadedByUserId: v.string(),
    artifactType: artifactTypeValidator,
    status: uploadStatusValidator,
    source: uploadSourceValidator,
    fileName: v.string(),
    mimeType: v.string(),
    fileSize: v.optional(v.number()),
    storageId: v.optional(v.id("_storage")),
    sourceLanguage: v.optional(preferredLanguageValidator),
    ocrText: v.optional(v.string()),
    ocrConfidence: v.optional(v.number()),
    processingError: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("profileId", ["profileId"])
    .index("profileId_createdAt", ["profileId", "createdAt"])
    .index("uploadedByUserId", ["uploadedByUserId"])
    .index("status", ["status"]),
  analysisResults: defineTable({
    profileId: v.id("profiles"),
    uploadId: v.id("uploads"),
    artifactType: artifactTypeValidator,
    preferredLanguage: preferredLanguageValidator,
    detectedItem: v.string(),
    safetyStatus: safetyStatusValidator,
    whyFlagged: v.string(),
    suggestedNextAction: v.string(),
    confidence: v.number(),
    flaggedAllergens: v.optional(v.array(v.string())),
    flaggedIngredients: v.optional(v.array(v.string())),
    matchedProfileRules: v.optional(v.array(v.string())),
    aiModel: v.optional(v.string()),
    rawSummary: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("profileId", ["profileId"])
    .index("uploadId", ["uploadId"])
    .index("safetyStatus", ["safetyStatus"]),
  medicines: defineTable({
    profileId: v.id("profiles"),
    sourceUploadId: v.optional(v.id("uploads")),
    sourceAnalysisId: v.optional(v.id("analysisResults")),
    name: v.string(),
    normalizedName: v.optional(v.string()),
    dosage: v.optional(v.string()),
    unit: v.optional(v.string()),
    route: v.optional(medicineRouteValidator),
    instructions: v.optional(v.string()),
    purpose: v.optional(v.string()),
    safetyNotes: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("profileId", ["profileId"])
    .index("profileId_isActive", ["profileId", "isActive"]),
  medicineSchedules: defineTable({
    profileId: v.id("profiles"),
    medicineId: v.id("medicines"),
    label: v.optional(v.string()),
    dosageText: v.optional(v.string()),
    times: v.array(v.string()),
    daysOfWeek: v.optional(v.array(dayOfWeekValidator)),
    frequencyText: v.optional(v.string()),
    reminderChannels: v.array(reminderChannelValidator),
    timezone: v.string(),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    status: scheduleStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("profileId", ["profileId"])
    .index("medicineId", ["medicineId"])
    .index("profileId_status", ["profileId", "status"]),
  medicineEvents: defineTable({
    profileId: v.id("profiles"),
    medicineId: v.id("medicines"),
    scheduleId: v.optional(v.id("medicineSchedules")),
    eventType: adherenceEventTypeValidator,
    dueAt: v.number(),
    completedAt: v.optional(v.number()),
    note: v.optional(v.string()),
    createdByUserId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("profileId_dueAt", ["profileId", "dueAt"])
    .index("medicineId_dueAt", ["medicineId", "dueAt"])
    .index("scheduleId_dueAt", ["scheduleId", "dueAt"]),
  caregiverLinks: defineTable({
    patientProfileId: v.id("profiles"),
    caregiverUserId: v.string(),
    caregiverEmail: v.optional(v.string()),
    relationship: v.optional(v.string()),
    permissions: v.array(v.string()),
    status: caregiverLinkStatusValidator,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("patientProfileId", ["patientProfileId"])
    .index("caregiverUserId", ["caregiverUserId"])
    .index("patientProfileId_status", ["patientProfileId", "status"]),
})
