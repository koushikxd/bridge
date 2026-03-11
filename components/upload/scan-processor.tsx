"use client"

import { useAction } from "convex/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

export function ScanProcessor({
  uploadId,
  uploadStatus,
  hasAnalysis,
  label,
  busyLabel,
  className,
  showButton = true,
}: {
  uploadId: Id<"uploads">
  uploadStatus: string
  hasAnalysis: boolean
  label: string
  busyLabel: string
  className?: string
  showButton?: boolean
}) {
  const router = useRouter()
  const processUpload = useAction(api.uploadActions.processUpload)
  const [busy, setBusy] = useState(false)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (hasAnalysis || busy || hasStartedRef.current) {
      return
    }

    if (uploadStatus !== "uploaded" && uploadStatus !== "processing") {
      return
    }

    hasStartedRef.current = true
    setBusy(true)

    void processUpload({ uploadId })
      .catch(() => undefined)
      .finally(() => {
        setBusy(false)
        router.refresh()
      })
  }, [busy, hasAnalysis, processUpload, router, uploadId, uploadStatus])

  useEffect(() => {
    if (hasAnalysis || busy || uploadStatus !== "processing") {
      return
    }

    const timeout = window.setTimeout(() => {
      router.refresh()
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [busy, hasAnalysis, router, uploadStatus])

  async function handleRetry() {
    setBusy(true)
    try {
      await processUpload({ uploadId })
    } catch {
      // page refresh will reveal latest status / error
    } finally {
      setBusy(false)
      router.refresh()
    }
  }

  if (!showButton) {
    return null
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleRetry}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50",
        className
      )}
    >
      {busy ? busyLabel : label}
    </button>
  )
}
