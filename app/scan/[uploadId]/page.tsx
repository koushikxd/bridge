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
      return "border-primary/20 bg-primary/10 text-primary"
    case "caution":
      return "border-chart-4/25 bg-chart-4/12 text-chart-4"
    case "risky":
    case "failed":
      return "border-destructive/25 bg-destructive/10 text-destructive"
    default:
      return "border-border/80 bg-muted/70 text-muted-foreground"
  }
}

function statusDotClass(status: string) {
  switch (status) {
    case "safe":
      return "bg-primary"
    case "caution":
      return "bg-chart-4"
    case "risky":
    case "failed":
      return "bg-destructive"
    default:
      return "bg-muted-foreground/60"
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
  const matchedRules = analysis?.matchedProfileRules ?? []
  const flaggedAllergens = analysis?.flaggedAllergens ?? []
  const flaggedIngredients = analysis?.flaggedIngredients ?? []
  const summaryText = isProcessing
    ? reviewingLabel
    : (analysis?.whyFlagged ?? result.upload.processingError ?? reviewingLabel)
  const nextAction = analysis?.suggestedNextAction ?? retryLabel

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_10%,transparent),transparent_32%),linear-gradient(to_bottom,_color-mix(in_oklch,var(--muted)_42%,transparent),transparent_24%)] px-4 py-4 sm:px-6 sm:py-8">
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

        <div className="mt-5 grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <section className="order-2 h-fit rounded-[2rem] border border-border/70 bg-card/95 p-4 shadow-sm sm:p-5 xl:sticky xl:top-6 xl:order-1">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                {imageLabel}
              </p>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.16em] uppercase ${pillClass(isProcessing ? result.upload.status : safetyStatus)}`}
              >
                <span
                  className={`size-2 rounded-full ${statusDotClass(isProcessing ? result.upload.status : safetyStatus)}`}
                />
                {isProcessing ? previewStatus : displayStatus}
              </span>
            </div>

            {result.fileUrl ? (
              <div className="relative mt-4 aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-border/80 bg-[radial-gradient(circle_at_top,_color-mix(in_oklch,var(--primary)_8%,transparent),transparent_48%),color-mix(in_oklch,var(--muted)_58%,var(--background))]">
                <Image
                  src={result.fileUrl}
                  alt={result.upload.fileName}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1279px) 100vw, 320px"
                />
              </div>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-border/80 p-10 text-sm text-muted-foreground">
                {previewUnavailableLabel}
              </div>
            )}

            <div className="mt-4 rounded-[1.4rem] border border-border/70 bg-background/80 p-4">
              <p className="truncate text-sm font-semibold text-foreground">
                {result.upload.fileName}
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{safetyStatusLabel}</dt>
                  <dd className="font-medium text-foreground">
                    {isProcessing ? previewStatus : displayStatus}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">{confidenceLabel}</dt>
                  <dd className="font-medium text-foreground">
                    {confidenceText}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="order-1 rounded-[2rem] border border-border/70 bg-card/95 p-5 shadow-sm sm:p-6 xl:order-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                  {resultLabel}
                </p>
                <div>
                  <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                    {summaryText}
                  </p>
                </div>
              </div>
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.72rem] font-semibold tracking-[0.16em] uppercase ${pillClass(isProcessing ? result.upload.status : safetyStatus)}`}
              >
                <span
                  className={`size-2 rounded-full ${statusDotClass(isProcessing ? result.upload.status : safetyStatus)}`}
                />
                {isProcessing ? previewStatus : displayStatus}
              </div>
            </div>

            {isProcessing ? (
              <>
                <div className="mt-7 rounded-[1.75rem] border border-border/70 bg-background/85 p-5 sm:p-6">
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
                  className={`mt-7 rounded-[1.75rem] border p-5 sm:p-6 ${toneClass(safetyStatus)}`}
                >
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <div className="flex flex-col items-start justify-center">
                      <p className="text-sm font-medium text-muted-foreground">
                        {safetyStatusLabel}
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {displayStatus}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-72">
                      <MetricTile
                        label={confidenceLabel}
                        value={confidenceText}
                      />
                      <MetricTile
                        label={profileMatchesLabel}
                        value={matchedRules.length.toString()}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <ResultItem
                    label={whyLabel}
                    value={summaryText}
                    className="h-full"
                  />
                  <ResultItem
                    label={nextLabel}
                    value={nextAction}
                    className="h-full"
                  />
                </div>

                <div className="mt-5 grid gap-4">
                  {flaggedAllergens.length > 0 && (
                    <div>
                      <TagList
                        label={flaggedAllergensLabel}
                        items={flaggedAllergens}
                        variant="danger"
                      />
                    </div>
                  )}

                  {flaggedIngredients.length > 0 && (
                    <div>
                      <TagList
                        label={flaggedIngredientsLabel}
                        items={flaggedIngredients}
                        variant="warning"
                      />
                    </div>
                  )}

                  {matchedRules.length > 0 && (
                    <div>
                      <ResultItem
                        label={profileMatchesLabel}
                        value={matchedRules.join(" · ")}
                      />
                    </div>
                  )}
                </div>

                {richData?.medicines && richData.medicines.length > 0 && (
                  <SectionBlock label={medicinesLabel} className="mt-6">
                    <div className="grid gap-3">
                      {richData.medicines.map((med) => (
                        <div
                          key={med.name}
                          className="rounded-[1.25rem] border border-border/70 bg-background/90 p-4"
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
                  </SectionBlock>
                )}

                <div className="mt-4 grid gap-4">
                  {richData?.ingredients && richData.ingredients.length > 0 && (
                    <div>
                      <TagList
                        label={ingredientsLabel}
                        items={richData.ingredients}
                        variant="neutral"
                      />
                    </div>
                  )}

                  {richData?.allergens && richData.allergens.length > 0 && (
                    <div>
                      <TagList
                        label={allergensLabel}
                        items={richData.allergens}
                        variant="warning"
                      />
                    </div>
                  )}

                  {richData?.nutritionHighlights &&
                    richData.nutritionHighlights.length > 0 && (
                      <div>
                        <ResultItem
                          label={nutritionLabel}
                          value={richData.nutritionHighlights.join(" · ")}
                        />
                      </div>
                    )}
                </div>

                <div className="mt-8 flex flex-wrap gap-3 border-t border-border/60 pt-5">
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

function ResultItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={`rounded-[1.35rem] border border-border/70 bg-background/90 p-4 sm:p-5 ${className ?? ""}`}
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-foreground/88">{value}</p>
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-border/60 bg-background/70 px-4 py-3">
      <p className="text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}

function SectionBlock({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={`rounded-[1.5rem] border border-border/70 bg-background/65 p-4 sm:p-5 ${className ?? ""}`}
    >
      <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </section>
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
    danger: "border-destructive/20 bg-destructive/12 text-destructive",
    warning: "border-chart-4/20 bg-chart-4/12 text-chart-4",
    neutral: "border-border/70 bg-muted text-muted-foreground",
  }

  return (
    <div className="rounded-[1.35rem] border border-border/70 bg-background/90 p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${tagColors[variant]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
