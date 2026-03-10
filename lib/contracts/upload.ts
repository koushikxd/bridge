import { z } from "zod"

import { artifactTypeSchema } from "@/lib/contracts/analysis"
import { preferredLanguageCodeSchema } from "@/lib/contracts/profile"

export const uploadSourceSchema = z.enum(["camera", "gallery", "file", "share"])

export const createUploadRecordSchema = z.object({
  artifactType: artifactTypeSchema,
  source: uploadSourceSchema,
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(25 * 1024 * 1024),
  storageId: z.string().trim().min(1),
  sourceLanguage: preferredLanguageCodeSchema.optional(),
})

export type UploadSource = z.infer<typeof uploadSourceSchema>
export type CreateUploadRecordInput = z.infer<typeof createUploadRecordSchema>
