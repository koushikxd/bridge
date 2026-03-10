"use client"

import { IconCamera, IconLoader2, IconUpload } from "@tabler/icons-react"
import { useAction, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import type { ArtifactType } from "@/lib/contracts/analysis"
import type { UploadSource } from "@/lib/contracts/upload"

const artifactOptions: Array<{ value: ArtifactType; label: string }> = [
  { value: "prescription", label: "Prescription" },
  { value: "medicine_label", label: "Medicine label" },
  { value: "meal", label: "Meal photo" },
  { value: "food_label", label: "Food package label" },
  { value: "menu", label: "Restaurant menu" },
]

export function UploadForm() {
  const router = useRouter()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const createUploadRecord = useMutation(api.uploads.createUploadRecord)
  const processUpload = useAction(api.uploads.processUpload)
  const [artifactType, setArtifactType] = useState<ArtifactType>("prescription")
  const [status, setStatus] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleFile(file: File, source: UploadSource) {
    setIsPending(true)
    setStatus("Uploading and analyzing...")

    try {
      const postUrl = await generateUploadUrl({})
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      })

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string
      }
      const uploadId = await createUploadRecord({
        artifactType,
        source,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageId: storageId as never,
      })

      await processUpload({ uploadId })
      router.push(`/scan/${uploadId}`)
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Upload failed. Try again."
      )
      setIsPending(false)
    }
  }

  return (
    <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5">
        <div>
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Scan helper
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Understand prescriptions, labels, meals, and menus
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload a photo and Bridge will explain what it sees with a
            structured safety result.
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          <span>What are you scanning?</span>
          <select
            value={artifactType}
            onChange={(event) =>
              setArtifactType(event.target.value as ArtifactType)
            }
            className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {artifactOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <Button
            size="lg"
            onClick={() => cameraInputRef.current?.click()}
            disabled={isPending}
          >
            {isPending ? (
              <IconLoader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <IconCamera data-icon="inline-start" />
            )}
            Use camera
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => galleryInputRef.current?.click()}
            disabled={isPending}
          >
            <IconUpload data-icon="inline-start" />
            Upload image
          </Button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleFile(file, "camera")
            }
          }}
        />

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) {
              void handleFile(file, "gallery")
            }
          }}
        />

        {status ? (
          <p className="text-sm text-muted-foreground">{status}</p>
        ) : null}
      </div>
    </div>
  )
}
