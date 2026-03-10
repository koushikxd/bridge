import { z } from "zod"

export const onboardingProfileUpdateSchema = z.object({
  age: z.number().int().min(1).max(150).optional(),
  allergies: z.array(z.string().min(1)).optional(),
  chronicConditions: z.array(z.string().min(1)).optional(),
  currentMedications: z.array(z.string().min(1)).optional(),
  dietaryRestrictions: z.array(z.string().min(1)).optional(),
  religiousRestrictions: z.array(z.string().min(1)).optional(),
  emergencyNotes: z.string().min(1).optional(),
})

export type OnboardingProfileUpdate = z.infer<
  typeof onboardingProfileUpdateSchema
>

export const onboardingTopics = [
  "age",
  "allergies",
  "chronicConditions",
  "dietaryRestrictions",
  "religiousRestrictions",
  "emergencyNotes",
] as const

export type OnboardingTopic = (typeof onboardingTopics)[number]
