import { IconArrowLeft, IconSparkles } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CompletedOnboardingExtras } from "@/components/app-shell/completed-onboarding-extras"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ScanProcessor } from "@/components/upload/scan-processor"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopyMap } from "@/lib/copy"

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

function pillClass(status: string) {
  switch (status) {
    case "safe":
      return "border-primary/20 bg-primary/10 text-foreground"
    case "caution":
      return "border-chart-4/25 bg-chart-4/12 text-foreground"
    case "risky":
    case "failed":
      return "border-destructive/25 bg-destructive/10 text-foreground"
    default:
      return "border-border/80 bg-muted/70 text-muted-foreground"
  }
}

interface RichData {
  ingredients?: string[]
  allergens?: string[]
  nutritionHighlights?: string[]
  medicines?: {
    name: string
    dosage?: string
    purpose?: string
    instructions?: string
  }[]
}

function parseRichData(raw: string | undefined): RichData | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as RichData
  } catch {
    return null
  }
}

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ uploadId: string }>
}) {
  await requireAuthenticatedUser()

  const { uploadId } = await params
  const result = await fetchAuthQuery(api.uploads.getUploadResult, {
    uploadId: uploadId as never,
  })

  if (!result) {
    notFound()
  }

  const lang = result.profile.preferredLanguage

  const copy = await localizedCopyMap(lang, [
    "settings.backHome",
    "scan.image",
    "scan.result",
    "scan.processing",
    "scan.previewUnavailable",
    "scan.safetyStatus",
    "scan.why",
    "scan.next",
    "scan.confidence",
    "scan.pending",
    "scan.ocrConfidence",
    "scan.reviewing",
    "scan.retry",
    "scan.status.safe",
    "scan.status.caution",
    "scan.status.risky",
    "scan.status.unknown",
    "scan.status.uploaded",
    "scan.status.processing",
    "scan.status.processed",
    "scan.status.failed",
    "scan.ingredients",
    "scan.allergens",
    "scan.nutrition",
    "scan.medicines",
    "scan.dosage",
    "scan.purpose",
    "scan.instructions",
    "scan.flaggedAllergens",
    "scan.flaggedIngredients",
    "scan.profileMatches",
    "scan.retryButton",
    "scan.retrying",
    "scan.scanMore",
    "scan.processingHint",
  ] as const)

  const backHomeLabel = copy["settings.backHome"]
  const imageLabel = copy["scan.image"]
  const resultLabel = copy["scan.result"]
  const processingLabel = copy["scan.processing"]
  const previewUnavailableLabel = copy["scan.previewUnavailable"]
  const safetyStatusLabel = copy["scan.safetyStatus"]
  const whyLabel = copy["scan.why"]
  const nextLabel = copy["scan.next"]
  const confidenceLabel = copy["scan.confidence"]
  const pendingLabel = copy["scan.pending"]
  const ocrConfidenceLabel = copy["scan.ocrConfidence"]
  const reviewingLabel = copy["scan.reviewing"]
  const retryLabel = copy["scan.retry"]
  const safeStatus = copy["scan.status.safe"]
  const cautionStatus = copy["scan.status.caution"]
  const riskyStatus = copy["scan.status.risky"]
  const unknownStatus = copy["scan.status.unknown"]
  const uploadedStatus = copy["scan.status.uploaded"]
  const processingStatus = copy["scan.status.processing"]
  const processedStatus = copy["scan.status.processed"]
  const failedStatus = copy["scan.status.failed"]
  const ingredientsLabel = copy["scan.ingredients"]
  const allergensLabel = copy["scan.allergens"]
  const nutritionLabel = copy["scan.nutrition"]
  const medicinesLabel = copy["scan.medicines"]
  const dosageLabel = copy["scan.dosage"]
  const purposeLabel = copy["scan.purpose"]
  const instructionsLabel = copy["scan.instructions"]
  const flaggedAllergensLabel = copy["scan.flaggedAllergens"]
  const flaggedIngredientsLabel = copy["scan.flaggedIngredients"]
  const profileMatchesLabel = copy["scan.profileMatches"]
  const retryButtonLabel = copy["scan.retryButton"]
  const retryingLabel = copy["scan.retrying"]
  const scanMoreLabel = copy["scan.scanMore"]
  const processingHintLabel = copy["scan.processingHint"]

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

  const analysis = result.analysis
  const safetyStatus = analysis?.safetyStatus ?? "unknown"
  const isProcessing =
    !analysis &&
    (result.upload.status === "uploaded" ||
      result.upload.status === "processing")
  const displayStatus =
    statusLabels[analysis?.safetyStatus ?? result.upload.status] ??
    unknownStatus
  const previewStatus = statusLabels[result.upload.status] ?? processingLabel
  const title =
    analysis?.detectedItem ??
    (result.upload.status === "failed" ? failedStatus : processingLabel)

  const confidenceText = analysis
    ? `${Math.round(analysis.confidence * 100)}%`
    : result.upload.ocrConfidence
      ? `${Math.round(result.upload.ocrConfidence)}% ${ocrConfidenceLabel}`
      : pendingLabel

  const richData = parseRichData(analysis?.rawSummary)
  const showRetry =
    result.upload.status === "failed" ||
    (!!analysis &&
      (safetyStatus === "unknown" || (analysis.confidence ?? 0) < 0.4))

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_10%,transparent),transparent_34%),linear-gradient(to_bottom,_color-mix(in_oklch,var(--muted)_42%,transparent),transparent_24%)] px-4 py-5 sm:px-6 sm:py-8">
      <CompletedOnboardingExtras />
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-4 text-sm font-medium text-muted-foreground backdrop-blur transition hover:text-foreground"
          >
            <IconArrowLeft className="size-4" />
            {backHomeLabel}
          </Link>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <section className="order-2 h-fit rounded-[2rem] border border-border/80 bg-card/95 p-4 shadow-sm sm:p-5 xl:sticky xl:top-6 xl:order-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                {imageLabel}
              </p>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.16em] uppercase ${pillClass(isProcessing ? result.upload.status : safetyStatus)}`}
              >
                {isProcessing ? previewStatus : displayStatus}
              </span>
            </div>

            {result.fileUrl ? (
              <div className="relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-border/80 bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_10%,transparent),transparent_48%),color-mix(in_oklch,var(--muted)_58%,var(--background))]">
                <Image
                  src={result.fileUrl}
                  alt={result.upload.fileName}
                  fill
                  className="object-contain p-3"
                  sizes="(max-width: 1279px) 100vw, 320px"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-border/80 p-10 text-sm text-muted-foreground">
                {previewUnavailableLabel}
              </div>
            )}

            <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-background/80 px-4 py-3">
              <p className="truncate text-sm font-semibold text-foreground">
                {result.upload.fileName}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {safetyStatusLabel}:{" "}
                {isProcessing ? previewStatus : displayStatus}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {confidenceLabel}: {confidenceText}
              </p>
            </div>
          </section>

          <section className="order-1 rounded-[2rem] border border-border/80 bg-card/95 p-5 shadow-sm sm:p-6 xl:order-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                  {resultLabel}
                </p>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {title}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {isProcessing
                      ? reviewingLabel
                      : (analysis?.whyFlagged ??
                        result.upload.processingError ??
                        reviewingLabel)}
                  </p>
                </div>
              </div>
              <div
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.16em] uppercase ${pillClass(isProcessing ? result.upload.status : safetyStatus)}`}
              >
                {isProcessing ? previewStatus : displayStatus}
              </div>
            </div>

            {isProcessing ? (
              <>
                <div className="mt-6 rounded-[1.75rem] border border-border/70 bg-background/85 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Spinner className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <span>{processingLabel}</span>
                        <span className="size-2 animate-pulse rounded-full bg-primary" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {processingHintLabel}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    <ProcessingCard label={safetyStatusLabel} />
                    <ProcessingCard label={confidenceLabel} />
                    <ProcessingCard label={nextLabel} />
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-border/70 bg-card/80 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      <IconSparkles className="size-3.5" />
                      {reviewingLabel}
                    </div>
                    <div className="mt-4 space-y-3">
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-9/12" />
                      <Skeleton className="h-4 w-10/12" />
                    </div>
                  </div>
                </div>

                <ScanProcessor
                  uploadId={result.upload._id as Id<"uploads">}
                  uploadStatus={result.upload.status}
                  hasAnalysis={Boolean(analysis)}
                  label={retryButtonLabel}
                  busyLabel={processingLabel}
                  showButton={false}
                />
              </>
            ) : (
              <>
                <div
                  className={`mt-6 rounded-[1.5rem] border px-4 py-4 ${toneClass(safetyStatus)}`}
                >
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    {title}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {safetyStatusLabel}: {displayStatus}
                  </p>
                </div>

                <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground sm:grid-cols-3">
                  <ResultItem
                    label={whyLabel}
                    value={
                      analysis?.whyFlagged ??
                      result.upload.processingError ??
                      reviewingLabel
                    }
                  />
                  <ResultItem
                    label={nextLabel}
                    value={analysis?.suggestedNextAction ?? retryLabel}
                  />
                  <ResultItem label={confidenceLabel} value={confidenceText} />
                </div>

                {analysis?.flaggedAllergens &&
                  analysis.flaggedAllergens.length > 0 && (
                    <div className="mt-4">
                      <TagList
                        label={flaggedAllergensLabel}
                        items={analysis.flaggedAllergens}
                        variant="danger"
                      />
                    </div>
                  )}

                {analysis?.flaggedIngredients &&
                  analysis.flaggedIngredients.length > 0 && (
                    <div className="mt-4">
                      <TagList
                        label={flaggedIngredientsLabel}
                        items={analysis.flaggedIngredients}
                        variant="warning"
                      />
                    </div>
                  )}

                {analysis?.matchedProfileRules &&
                  analysis.matchedProfileRules.length > 0 && (
                    <div className="mt-4">
                      <ResultItem
                        label={profileMatchesLabel}
                        value={analysis.matchedProfileRules.join(" · ")}
                      />
                    </div>
                  )}

                {richData?.medicines && richData.medicines.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                      {medicinesLabel}
                    </p>
                    <div className="grid gap-3">
                      {richData.medicines.map((med) => (
                        <div
                          key={med.name}
                          className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-3"
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {med.name}
                          </p>
                          {med.dosage && (
                            <Detail label={dosageLabel} value={med.dosage} />
                          )}
                          {med.purpose && (
                            <Detail label={purposeLabel} value={med.purpose} />
                          )}
                          {med.instructions && (
                            <Detail
                              label={instructionsLabel}
                              value={med.instructions}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {richData?.ingredients && richData.ingredients.length > 0 && (
                  <div className="mt-4">
                    <TagList
                      label={ingredientsLabel}
                      items={richData.ingredients}
                      variant="neutral"
                    />
                  </div>
                )}

                {richData?.allergens && richData.allergens.length > 0 && (
                  <div className="mt-4">
                    <TagList
                      label={allergensLabel}
                      items={richData.allergens}
                      variant="warning"
                    />
                  </div>
                )}

                {richData?.nutritionHighlights &&
                  richData.nutritionHighlights.length > 0 && (
                    <div className="mt-4">
                      <ResultItem
                        label={nutritionLabel}
                        value={richData.nutritionHighlights.join(" · ")}
                      />
                    </div>
                  )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/scan"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    {scanMoreLabel}
                  </Link>
                  {showRetry && (
                    <ScanProcessor
                      uploadId={result.upload._id as Id<"uploads">}
                      uploadStatus={result.upload.status}
                      hasAnalysis={Boolean(analysis)}
                      label={retryButtonLabel}
                      busyLabel={retryingLabel}
                      className="h-11 rounded-xl"
                    />
                  )}
                </div>
              </>
            )}
          </section>
        </div>
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

function ProcessingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-card/80 px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      <span className="font-medium">{label}:</span> {value}
    </p>
  )
}

function TagList({
  label,
  items,
  variant,
}: {
  label: string
  items: string[]
  variant: "danger" | "warning" | "neutral"
}) {
  const tagColors = {
    danger: "bg-destructive/12 text-destructive border-destructive/20",
    warning: "bg-chart-4/12 text-chart-4 border-chart-4/20",
    neutral: "bg-muted text-muted-foreground border-border/70",
  }

  return (
    <div className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-3">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${tagColors[variant]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
