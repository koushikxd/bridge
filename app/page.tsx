import {
  IconActivityHeartbeat,
  IconClockHour4,
  IconLanguage,
  IconLeaf,
  IconPill,
  IconShieldCheck,
} from "@tabler/icons-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { DoseActions } from "@/components/home/dose-actions"
import { ScanUploadDialog } from "@/components/upload/scan-upload-dialog"
import { api } from "@/convex/_generated/api"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"
import {
  preferredLanguageLabels,
  type PreferredLanguage,
} from "@/lib/contracts/profile"

export const metadata = {
  title: "Home | Bridge",
  description: "Track medicines and scan health information with Bridge.",
}

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, "0")
  const suffix = hours >= 12 ? "PM" : "AM"

  hours = hours % 12 || 12

  return `${hours}:${minutes} ${suffix}`
}

export default async function Page() {
  const { authUser, profile } = await requireCompletedOnboarding()

  if (!profile) {
    redirect("/onboarding")
  }

  const preferredLanguage =
    profile.preferredLanguage as keyof typeof preferredLanguageLabels &
      PreferredLanguage

  const [
    homeData,
    homeEyebrow,
    homeTitle,
    homeBody,
    homeLanguage,
    homeStatus,
    todayLabel,
    adherenceScoreLabel,
    activeMedicinesLabel,
    beingTrackedLabel,
    nextDoseLabel,
    noneLabel,
    nothingPendingLabel,
    quickSupportLabel,
    quickScanTitle,
    quickScanBody,
    openScannerLabel,
    openSettingsLabel,
    signedInLabel,
    signedInHint,
    medicineTrackingLabel,
    todayDosesLabel,
    todayDosesBody,
    completedLabel,
    noDosesLabel,
    doseMissingLabel,
    dueLabel,
    dailyProgressLabel,
    last7DaysLabel,
    recentScansLabel,
    recentScansBody,
    noScansLabel,
    viewLabel,
    signOutLabel,
    signingOutLabel,
    takenActionLabel,
    snoozeActionLabel,
    skipActionLabel,
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
    fetchAuthQuery(api.medications.getHomeData, {}),
    localizedCopy("home.eyebrow", preferredLanguage),
    localizedCopy("home.title", preferredLanguage),
    localizedCopy("home.body", preferredLanguage),
    localizedCopy("home.language", preferredLanguage),
    localizedCopy("home.status", preferredLanguage),
    localizedCopy("home.today", preferredLanguage),
    localizedCopy("home.adherenceScore", preferredLanguage),
    localizedCopy("home.activeMedicines", preferredLanguage),
    localizedCopy("home.beingTracked", preferredLanguage),
    localizedCopy("home.nextDose", preferredLanguage),
    localizedCopy("home.none", preferredLanguage),
    localizedCopy("home.nothingPending", preferredLanguage),
    localizedCopy("home.quickSupport", preferredLanguage),
    localizedCopy("home.quickScanTitle", preferredLanguage),
    localizedCopy("home.quickScanBody", preferredLanguage),
    localizedCopy("home.openScanner", preferredLanguage),
    localizedCopy("home.openSettings", preferredLanguage),
    localizedCopy("home.signedIn", preferredLanguage),
    localizedCopy("home.signedInHint", preferredLanguage),
    localizedCopy("home.medicineTracking", preferredLanguage),
    localizedCopy("home.todayDoses", preferredLanguage),
    localizedCopy("home.todayDosesBody", preferredLanguage),
    localizedCopy("home.completed", preferredLanguage),
    localizedCopy("home.noDoses", preferredLanguage),
    localizedCopy("home.doseMissing", preferredLanguage),
    localizedCopy("home.due", preferredLanguage),
    localizedCopy("home.dailyProgress", preferredLanguage),
    localizedCopy("home.last7Days", preferredLanguage),
    localizedCopy("home.recentScans", preferredLanguage),
    localizedCopy("home.recentScansBody", preferredLanguage),
    localizedCopy("home.noScans", preferredLanguage),
    localizedCopy("home.view", preferredLanguage),
    localizedCopy("home.signOut", preferredLanguage),
    localizedCopy("home.signingOut", preferredLanguage),
    localizedCopy("home.actionTaken", preferredLanguage),
    localizedCopy("home.actionSnooze", preferredLanguage),
    localizedCopy("home.actionSkip", preferredLanguage),
    localizedCopy("home.scanDialogTitle", preferredLanguage),
    localizedCopy("home.scanDialogBody", preferredLanguage),
    localizedCopy("home.scanBadge", preferredLanguage),
    localizedCopy("home.scanCamera", preferredLanguage),
    localizedCopy("home.scanUpload", preferredLanguage),
    localizedCopy("home.scanDesktopUpload", preferredLanguage),
    localizedCopy("home.scanDesktopHint", preferredLanguage),
    localizedCopy("home.scanDropHint", preferredLanguage),
    localizedCopy("home.scanDropActive", preferredLanguage),
    localizedCopy("home.scanOr", preferredLanguage),
    localizedCopy("home.scanUploading", preferredLanguage),
    localizedCopy("home.scanFailed", preferredLanguage),
  ])

  const eventLabels = {
    missed: await localizedCopy("home.event.missed", preferredLanguage),
    reminded: await localizedCopy("home.event.reminded", preferredLanguage),
    scheduled: await localizedCopy("home.event.scheduled", preferredLanguage),
    skipped: await localizedCopy("home.event.skipped", preferredLanguage),
    snoozed: await localizedCopy("home.event.snoozed", preferredLanguage),
    taken: await localizedCopy("home.event.taken", preferredLanguage),
  }

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.05),transparent_24%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,white)_0%,var(--background)_38%,color-mix(in_oklch,var(--background)_96%,var(--card))_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_26%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_86%,black)_0%,var(--background)_34%,color-mix(in_oklch,var(--background)_92%,var(--card))_100%)]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/96 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.82fr)] lg:gap-8 lg:p-9 xl:p-10">
            <div className="space-y-5 lg:space-y-6">
              <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-primary uppercase">
                {homeEyebrow}
              </p>

              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-[3rem]">
                  {homeTitle}, {authUser.name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.98rem] sm:leading-7">
                  {homeBody}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
                <MetricCard
                  detail={adherenceScoreLabel}
                  icon={<IconShieldCheck className="size-4" />}
                  label={todayLabel}
                  value={`${homeData.stats.adherence}%`}
                />
                <MetricCard
                  detail={beingTrackedLabel}
                  icon={<IconPill className="size-4" />}
                  label={activeMedicinesLabel}
                  value={String(homeData.medicines.length)}
                />
                <MetricCard
                  detail={
                    homeData.nextDose?.medicineName ?? nothingPendingLabel
                  }
                  icon={<IconClockHour4 className="size-4" />}
                  label={nextDoseLabel}
                  value={
                    homeData.nextDose
                      ? formatTime(homeData.nextDose.dueAt)
                      : noneLabel
                  }
                />
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4 rounded-[1.75rem] border border-border/80 bg-[color-mix(in_oklch,var(--card)_72%,var(--muted))] p-4 sm:p-5 lg:p-6 dark:bg-background/88">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground/70">
                      <IconLanguage className="size-5" />
                    </div>
                    <div>
                      <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                        {homeLanguage}
                      </p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                        {preferredLanguageLabels[preferredLanguage]}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {homeStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 sm:p-5">
                  <div className="space-y-2">
                    <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-primary uppercase">
                      {quickSupportLabel}
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      {quickScanTitle}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {quickScanBody}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                      triggerLabel={openScannerLabel}
                      uploadingLabel={scanUploadingLabel}
                    />
                    <SecondaryLink href="/settings">
                      {openSettingsLabel}
                    </SecondaryLink>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-dashed border-border/80 bg-card/55 px-4 py-3 dark:bg-transparent">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {signedInLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {signedInHint}
                  </p>
                </div>
                <SignOutButton
                  label={signOutLabel}
                  pendingLabel={signingOutLabel}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  {medicineTrackingLabel}
                </p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem]">
                    {todayDosesLabel}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {todayDosesBody}
                  </p>
                </div>
              </div>

              <div className="w-full rounded-[1.25rem] border border-border/80 bg-background px-4 py-3 sm:w-auto sm:min-w-44">
                <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  {completedLabel}
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {homeData.stats.taken}/{homeData.stats.total}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {homeData.todayDoses.length === 0 ? (
                <EmptyStateCard
                  body={noDosesLabel}
                  icon={<IconLeaf className="size-5" />}
                />
              ) : (
                homeData.todayDoses.map((dose) => {
                  const isDone = dose.eventType !== "scheduled"

                  return (
                    <article
                      key={dose._id}
                      className="rounded-[1.5rem] border border-border/80 bg-background p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.28)] sm:p-5 dark:shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)]"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                              {dose.medicineName}
                            </p>
                            <StatusPill label={eventLabels[dose.eventType]} />
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                            <span className="rounded-full border border-border/80 bg-background px-3 py-1 font-medium text-foreground/90 shadow-sm dark:bg-muted/80 dark:shadow-none">
                              {dose.dosage ?? doseMissingLabel}
                            </span>
                            <span>
                              {dueLabel} {formatTime(dose.dueAt)}
                            </span>
                          </div>

                          {dose.instructions ? (
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                              {dose.instructions}
                            </p>
                          ) : null}
                        </div>

                        <div className="w-full lg:w-auto lg:min-w-64">
                          <DoseActions
                            labels={{
                              skip: skipActionLabel,
                              snooze: snoozeActionLabel,
                              taken: takenActionLabel,
                            }}
                            eventId={dose._id}
                            disabled={isDone}
                          />
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  {dailyProgressLabel}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {last7DaysLabel}
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
                {homeData.progress.map((day) => (
                  <div
                    key={day.label}
                    className="flex min-w-0 flex-col items-center gap-3"
                  >
                    <div className="flex h-36 w-full items-end rounded-[1.25rem] bg-muted p-2 sm:h-40">
                      <div
                        className="w-full rounded-[0.9rem] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_75%,white),var(--primary))] transition-all"
                        style={{ height: `${Math.max(day.percent, 8)}%` }}
                      />
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-sm font-semibold text-foreground">
                        {day.percent}%
                      </p>
                      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                        {day.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  {recentScansLabel}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {recentScansBody}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {homeData.recentAnalyses.length === 0 ? (
                  <EmptyStateCard
                    body={noScansLabel}
                    icon={<IconActivityHeartbeat className="size-5" />}
                  />
                ) : (
                  homeData.recentAnalyses.map((entry) => (
                    <Link
                      key={entry.upload._id}
                      href={`/scan/${entry.upload._id}`}
                      className="rounded-[1.35rem] border border-border/80 bg-background/78 px-4 py-4 transition hover:border-primary/30 hover:bg-background"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground sm:text-base">
                            {entry.analysis?.detectedItem ??
                              entry.upload.fileName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground capitalize">
                            {entry.analysis?.safetyStatus ??
                              entry.upload.status}
                          </p>
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-[0.68rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                          {viewLabel}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function MetricCard({
  detail,
  icon,
  label,
  value,
}: {
  detail: string
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
            {value}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {detail}
          </p>
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground/65 dark:bg-muted/60">
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyStateCard({
  body,
  icon,
}: {
  body: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-card/80 px-5 py-6 dark:bg-background/55">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-background text-foreground/75 dark:bg-muted">
          {icon}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border/80 bg-background px-3 py-1 text-[0.7rem] font-semibold tracking-[0.12em] text-foreground capitalize shadow-sm dark:bg-muted dark:shadow-none">
      {label}
    </span>
  )
}

function SecondaryLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
    >
      {children}
    </Link>
  )
}
