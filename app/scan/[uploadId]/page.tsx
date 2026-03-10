import Image from "next/image"
import { notFound, redirect } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"

export const metadata = {
  title: "Scan Result | Bridge",
  description: "View Bridge's analysis for your uploaded image.",
}

function toneClass(status: string) {
  switch (status) {
    case "safe":
      return "border-primary/20 bg-primary/8 text-foreground"
    case "caution":
      return "border-chart-4/25 bg-chart-4/10 text-foreground"
    case "risky":
      return "border-destructive/25 bg-destructive/10 text-foreground"
    default:
      return "border-border bg-muted/60 text-foreground"
  }
}

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ uploadId: string }>
}) {
  const { profile } = await requireCompletedOnboarding()

  if (!profile) {
    redirect("/onboarding")
  }

  const { uploadId } = await params
  const result = await fetchAuthQuery(api.uploads.getUploadResult, {
    uploadId: uploadId as never,
  })

  if (!result) {
    notFound()
  }

  const [
    imageLabel,
    resultLabel,
    processingLabel,
    previewUnavailableLabel,
    safetyStatusLabel,
    whyLabel,
    nextLabel,
    confidenceLabel,
    pendingLabel,
    ocrConfidenceLabel,
    reviewingLabel,
    retryLabel,
    safeStatus,
    cautionStatus,
    riskyStatus,
    unknownStatus,
    uploadedStatus,
    processingStatus,
    processedStatus,
    failedStatus,
  ] = await Promise.all([
    localizedCopy("scan.image", profile.preferredLanguage),
    localizedCopy("scan.result", profile.preferredLanguage),
    localizedCopy("scan.processing", profile.preferredLanguage),
    localizedCopy("scan.previewUnavailable", profile.preferredLanguage),
    localizedCopy("scan.safetyStatus", profile.preferredLanguage),
    localizedCopy("scan.why", profile.preferredLanguage),
    localizedCopy("scan.next", profile.preferredLanguage),
    localizedCopy("scan.confidence", profile.preferredLanguage),
    localizedCopy("scan.pending", profile.preferredLanguage),
    localizedCopy("scan.ocrConfidence", profile.preferredLanguage),
    localizedCopy("scan.reviewing", profile.preferredLanguage),
    localizedCopy("scan.retry", profile.preferredLanguage),
    localizedCopy("scan.status.safe", profile.preferredLanguage),
    localizedCopy("scan.status.caution", profile.preferredLanguage),
    localizedCopy("scan.status.risky", profile.preferredLanguage),
    localizedCopy("scan.status.unknown", profile.preferredLanguage),
    localizedCopy("scan.status.uploaded", profile.preferredLanguage),
    localizedCopy("scan.status.processing", profile.preferredLanguage),
    localizedCopy("scan.status.processed", profile.preferredLanguage),
    localizedCopy("scan.status.failed", profile.preferredLanguage),
  ])

  const statusLabels: Record<string, string> = {
    caution: cautionStatus,
    failed: failedStatus,
    processed: processedStatus,
    processing: processingStatus,
    risky: riskyStatus,
    safe: safeStatus,
    unknown: unknownStatus,
    uploaded: uploadedStatus,
  }

  const displayStatus =
    statusLabels[result.analysis?.safetyStatus ?? result.upload.status] ??
    unknownStatus

  const confidenceText = result.analysis
    ? `${Math.round(result.analysis.confidence * 100)}%`
    : result.upload.ocrConfidence
      ? `${Math.round(result.upload.ocrConfidence)}% ${ocrConfidenceLabel}`
      : pendingLabel

  return (
    <main className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            {imageLabel}
          </p>
          {result.fileUrl ? (
            <Image
              src={result.fileUrl}
              alt={result.upload.fileName}
              width={1200}
              height={900}
              className="mt-4 w-full rounded-[1.5rem] border border-border/80 object-cover"
            />
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border/80 p-10 text-sm text-muted-foreground">
              {previewUnavailableLabel}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-border/80 bg-card p-5 shadow-sm sm:p-6">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            {resultLabel}
          </p>

          <div
            className={`mt-4 rounded-[1.5rem] border px-4 py-4 ${toneClass(result.analysis?.safetyStatus ?? "unknown")}`}
          >
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {result.analysis?.detectedItem ?? processingLabel}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {safetyStatusLabel}: {displayStatus}
            </p>
          </div>

          <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground">
            <ResultItem
              label={whyLabel}
              value={
                result.analysis?.whyFlagged ??
                result.upload.processingError ??
                reviewingLabel
              }
            />
            <ResultItem
              label={nextLabel}
              value={result.analysis?.suggestedNextAction ?? retryLabel}
            />
            <ResultItem label={confidenceLabel} value={confidenceText} />
          </div>
        </section>
      </div>
    </main>
  )
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-6 text-foreground/88">{value}</p>
    </div>
  )
}
