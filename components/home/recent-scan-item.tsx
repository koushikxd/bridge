"use client"

import { IconTrash } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

export function RecentScanItem({
  uploadId,
  detectedItem,
  safetyStatus,
  fileName,
  uploadStatus,
  viewLabel,
  hideDelete = false,
}: {
  uploadId: string
  detectedItem?: string | null
  safetyStatus?: string | null
  fileName: string
  uploadStatus: string
  viewLabel: string
  hideDelete?: boolean
}) {
  const router = useRouter()
  const deleteUpload = useMutation(api.uploads.deleteUpload)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDeleting(true)
    try {
      await deleteUpload({ uploadId: uploadId as Id<"uploads"> })
      router.refresh()
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="rounded-[1.35rem] border border-border/80 bg-background/78 px-4 py-4 transition hover:border-primary/30 hover:bg-background">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/scan/${uploadId}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
            {detectedItem ?? fileName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {safetyStatus ?? uploadStatus}
          </p>
        </Link>
        <div className="flex flex-shrink-0 items-center gap-2">
          <Link
            href={`/scan/${uploadId}`}
            className="rounded-full bg-muted px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase"
          >
            {viewLabel}
          </Link>
          {!hideDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-full bg-muted p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              aria-label="Delete scan"
            >
              <IconTrash className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
