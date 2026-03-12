import Link from "next/link"
import { redirect } from "next/navigation"

import { CompletedOnboardingExtras } from "@/components/app-shell/completed-onboarding-extras"
import { ScanUploadDialog } from "@/components/upload/scan-upload-dialog"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { localizedCopyMap } from "@/lib/copy"

export const metadata = {
  title: "Scan | Bridge",
  description: "Upload a health-related image for Bridge to analyze.",
}

export default async function ScanPage() {
  const { profile } = await requireCompletedOnboarding()

  if (!profile) {
    redirect("/onboarding")
  }

  const copy = await localizedCopyMap(profile.preferredLanguage, [
    "settings.backHome",
    "home.scanDialogTitle",
    "home.scanDialogBody",
    "home.scanBadge",
    "home.scanCamera",
    "home.scanUpload",
    "home.scanDesktopUpload",
    "home.scanDesktopHint",
    "home.scanDropHint",
    "home.scanDropActive",
    "home.scanOr",
    "home.scanUploading",
    "home.scanFailed",
  ] as const)

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <CompletedOnboardingExtras />
      <div className="mx-auto flex max-w-2xl flex-col items-start gap-5 rounded-[2rem] border border-border/80 bg-card/95 p-6 shadow-sm">
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          {copy["settings.backHome"]}
        </Link>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {copy["home.scanDialogTitle"]}
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {copy["home.scanDialogBody"]}
          </p>
        </div>

        <ScanUploadDialog
          badge={copy["home.scanBadge"]}
          body={copy["home.scanDialogBody"]}
          cameraLabel={copy["home.scanCamera"]}
          dropActiveLabel={copy["home.scanDropActive"]}
          dropHint={copy["home.scanDropHint"]}
          desktopHint={copy["home.scanDesktopHint"]}
          desktopUploadLabel={copy["home.scanDesktopUpload"]}
          failedLabel={copy["home.scanFailed"]}
          mobileUploadLabel={copy["home.scanUpload"]}
          orLabel={copy["home.scanOr"]}
          title={copy["home.scanDialogTitle"]}
          triggerClassName="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          triggerLabel={copy["home.scanDesktopUpload"]}
          uploadingLabel={copy["home.scanUploading"]}
        />
      </div>
    </main>
  )
}
