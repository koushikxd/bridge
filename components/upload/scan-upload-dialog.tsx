"use client"

import {
  IconCamera,
  IconInbox,
  IconLoader2,
  IconSparkles,
  IconUpload,
} from "@tabler/icons-react"
import { useAction, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useRef, useState, type DragEvent } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import { useIsMobile } from "@/hooks/use-mobile"
import type { ArtifactType } from "@/lib/contracts/analysis"
import type { UploadSource } from "@/lib/contracts/upload"
import { compressImage } from "@/lib/image"
import { cn } from "@/lib/utils"

const defaultArtifactType: ArtifactType = "general"

export function ScanUploadDialog({
  badge,
  body,
  cameraLabel,
  dropActiveLabel,
  dropHint,
  desktopHint,
  desktopUploadLabel,
  failedLabel,
  mobileUploadLabel,
  orLabel,
  title,
  triggerClassName,
  triggerLabel,
  uploadingLabel,
}: {
  badge: string
  body: string
  cameraLabel: string
  dropActiveLabel: string
  dropHint: string
  desktopHint: string
  desktopUploadLabel: string
  failedLabel: string
  mobileUploadLabel: string
  orLabel: string
  title: string
  triggerClassName?: string
  triggerLabel: string
  uploadingLabel: string
}) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl)
  const createUploadRecord = useMutation(api.uploads.createUploadRecord)
  const processUpload = useAction(api.uploadActions.processUpload)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleFile(file: File, source: UploadSource) {
    setIsPending(true)
    setStatus(uploadingLabel)

    try {
      const compressed = await compressImage(file)
      const postUrl = await generateUploadUrl({})
      const uploadResponse = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": compressed.type },
        body: compressed,
      })

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string
      }

      const uploadId = await createUploadRecord({
        artifactType: defaultArtifactType,
        source,
        fileName: compressed.name,
        mimeType: compressed.type,
        fileSize: compressed.size,
        storageId: storageId as never,
      })

      setOpen(false)
      router.push(`/scan/${uploadId}`)
      void processUpload({ uploadId })
    } catch (error) {
      setStatus(error instanceof Error ? error.message : failedLabel)
      setIsPending(false)
    }
  }

  function handleDesktopDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      void handleFile(file, "file")
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen) {
      setStatus(null)
      setIsDragging(false)
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(triggerClassName)}
        render={<button type="button" />}
      >
        {triggerLabel}
      </DialogTrigger>

      <DialogContent
        className="max-w-[calc(100%-1.5rem)] rounded-[1.75rem] border border-border/80 bg-card p-0 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.35)] sm:max-w-lg"
        showCloseButton
      >
        <div className="overflow-hidden rounded-[1.75rem] bg-card">
          <DialogHeader className="space-y-3 px-5 pt-5 sm:px-6 sm:pt-6">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[0.72rem] font-semibold tracking-[0.16em] text-foreground/75 uppercase">
              <IconSparkles className="size-3.5" />
              {badge}
            </div>
            <div className="space-y-2">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm leading-6 text-muted-foreground">
                {body}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="rounded-[1.5rem] border border-border/80 bg-[color-mix(in_oklch,var(--card)_72%,var(--muted))] p-4 sm:p-5 dark:bg-background">
              {isMobile ? (
                <div className="space-y-4">
                  <Button
                    size="lg"
                    className="h-12 w-full justify-center rounded-2xl text-sm font-semibold"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <IconLoader2
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <IconCamera data-icon="inline-start" />
                    )}
                    {cameraLabel}
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/80" />
                    <span className="text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      {orLabel}
                    </span>
                    <div className="h-px flex-1 bg-border/80" />
                  </div>

                  <Button
                    size="lg"
                    variant="outline"
                    className="mx-auto h-12 min-w-44 rounded-full px-6 text-sm font-semibold"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isPending}
                  >
                    <IconUpload data-icon="inline-start" />
                    {mobileUploadLabel}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-[1.5rem] border border-dashed px-5 py-8 text-center transition",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background hover:border-primary/40 hover:bg-muted/50 dark:bg-muted/25 dark:hover:bg-muted/40"
                    )}
                    onClick={() => galleryInputRef.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={(event) => {
                      event.preventDefault()
                      const related = event.relatedTarget as Node | null
                      if (!related || !event.currentTarget.contains(related)) {
                        setIsDragging(false)
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDrop={handleDesktopDrop}
                    disabled={isPending}
                  >
                    <div className="mx-auto flex size-11 items-center justify-center rounded-2xl border border-border bg-card text-foreground/70 dark:bg-background">
                      {isPending ? (
                        <IconLoader2 className="size-5 animate-spin" />
                      ) : (
                        <IconInbox className="size-5" />
                      )}
                    </div>
                    <p className="mt-4 text-base font-semibold text-foreground">
                      {isDragging ? dropActiveLabel : desktopUploadLabel}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {isDragging ? dropHint : desktopHint}
                    </p>
                    <span className="mt-5 inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
                      <IconUpload className="size-4" />
                      {desktopUploadLabel}
                    </span>
                  </button>
                </div>
              )}

              {status ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {status}
                </p>
              ) : null}
            </div>
          </div>
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
            event.currentTarget.value = ""
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
              void handleFile(file, isMobile ? "gallery" : "file")
            }
            event.currentTarget.value = ""
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
