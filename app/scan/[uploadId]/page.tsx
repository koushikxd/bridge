import { notFound } from "next/navigation"
import Image from "next/image"

import { api } from "@/convex/_generated/api"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"

function toneClass(status: string) {
  switch (status) {
    case "safe":
      return "border-primary/25 bg-primary/10 text-foreground"
    case "caution":
      return "border-chart-4/30 bg-chart-4/10 text-foreground"
    case "risky":
      return "border-destructive/30 bg-destructive/10 text-foreground"
    default:
      return "border-border bg-muted/60 text-foreground"
  }
}

export default async function ScanResultPage({
  params,
}: {
  params: Promise<{ uploadId: string }>
}) {
  await requireCompletedOnboarding()
  const { uploadId } = await params
  const result = await fetchAuthQuery(api.uploads.getUploadResult, {
    uploadId: uploadId as never,
  })

  if (!result) {
    notFound()
  }

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:grid lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Uploaded image
          </p>
          {result.fileUrl ? (
            <Image
              src={result.fileUrl}
              alt={result.upload.fileName}
              width={1200}
              height={900}
              className="mt-4 w-full rounded-[1.5rem] border border-border object-cover"
            />
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-border p-10 text-sm text-muted-foreground">
              File preview unavailable.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Structured result
          </p>

          <div
            className={`mt-4 rounded-[1.5rem] border p-4 ${toneClass(result.analysis?.safetyStatus ?? "unknown")}`}
          >
            <p className="text-sm font-medium">
              {result.analysis?.detectedItem ?? "Still processing"}
            </p>
            <p className="mt-2 text-sm capitalize">
              Safety status:{" "}
              {result.analysis?.safetyStatus ?? result.upload.status}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-4 text-sm leading-6 text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">Why flagged</p>
              <p>
                {result.analysis?.whyFlagged ??
                  result.upload.processingError ??
                  "Bridge is still reviewing this upload."}
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">
                Suggested next action
              </p>
              <p>
                {result.analysis?.suggestedNextAction ??
                  "Wait a moment or try a clearer image if the result stays incomplete."}
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">Confidence</p>
              <p>
                {result.analysis
                  ? `${Math.round(result.analysis.confidence * 100)}%`
                  : result.upload.ocrConfidence
                    ? `${Math.round(result.upload.ocrConfidence)}% OCR confidence`
                    : "Pending"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
