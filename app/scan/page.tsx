import Link from "next/link"
import { redirect } from "next/navigation"

import { ScanUploadDialog } from "@/components/upload/scan-upload-dialog"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { localizedCopy } from "@/lib/copy"

export const metadata = {
  title: "Scan | Bridge",
  description: "Upload a health-related image for Bridge to analyze.",
}

export default async function ScanPage() {
  const { profile } = await requireCompletedOnboarding()

  if (!profile) {
    redirect("/onboarding")
  }

  const [
    backHomeLabel,
    scanDialogTitle,
    scanDialogBody,
    scanBadge,
    scanCameraLabel,
    scanUploadLabel,
    scanDesktopUploadLabel,
    scanDesktopHint,
    scanDropHint,
    scanDropActiveLabel,
    scanOrLabel,
    scanUploadingLabel,
    scanFailedLabel,
  ] = await Promise.all([
    localizedCopy("settings.backHome", profile.preferredLanguage),
    localizedCopy("home.scanDialogTitle", profile.preferredLanguage),
    localizedCopy("home.scanDialogBody", profile.preferredLanguage),
    localizedCopy("home.scanBadge", profile.preferredLanguage),
    localizedCopy("home.scanCamera", profile.preferredLanguage),
    localizedCopy("home.scanUpload", profile.preferredLanguage),
    localizedCopy("home.scanDesktopUpload", profile.preferredLanguage),
    localizedCopy("home.scanDesktopHint", profile.preferredLanguage),
    localizedCopy("home.scanDropHint", profile.preferredLanguage),
    localizedCopy("home.scanDropActive", profile.preferredLanguage),
    localizedCopy("home.scanOr", profile.preferredLanguage),
    localizedCopy("home.scanUploading", profile.preferredLanguage),
    localizedCopy("home.scanFailed", profile.preferredLanguage),
  ])

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 rounded-[2rem] border border-border/80 bg-card/95 p-6 shadow-sm">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {backHomeLabel}
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {scanDialogTitle}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {scanDialogBody}
          </p>
        </div>

        <ScanUploadDialog
          badge={scanBadge}
          body={scanDialogBody}
          cameraLabel={scanCameraLabel}
          dropActiveLabel={scanDropActiveLabel}
          dropHint={scanDropHint}
          desktopHint={scanDesktopHint}
          desktopUploadLabel={scanDesktopUploadLabel}
          failedLabel={scanFailedLabel}
          mobileUploadLabel={scanUploadLabel}
          orLabel={scanOrLabel}
          title={scanDialogTitle}
          triggerClassName="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          triggerLabel={scanDesktopUploadLabel}
          uploadingLabel={scanUploadingLabel}
        />
      </div>
    </main>
  )
}
