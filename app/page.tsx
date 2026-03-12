import {
  IconActivityHeartbeat,
  IconClockHour4,
  IconPill,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react"
import Link from "next/link"

import { ClearInviteCookie } from "@/components/auth/clear-invite-cookie"
import { CompletedOnboardingExtras } from "@/components/app-shell/completed-onboarding-extras"
import { CareNetworkManager } from "@/components/home/care-network-manager"
import { DoseActions } from "@/components/home/dose-actions"
import { ProgressChart } from "@/components/home/progress-chart"
import { RecentScanItem } from "@/components/home/recent-scan-item"
import { ScanUploadDialog } from "@/components/upload/scan-upload-dialog"
import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopyMap } from "@/lib/copy"
import { type PreferredLanguage } from "@/lib/contracts/profile"
import { formatTimestampInTimeZone } from "@/lib/time"

export const metadata = {
  title: "Home | Bridge",
  description: "Track medicines and scan health information with Bridge.",
}

export default async function Page() {
  const session = await requireAuthenticatedUser()

  const { authUser } = session
  const profile = session.profile
  const locale = (profile?.preferredLanguage ?? "en") as PreferredLanguage
  const [linkedProfiles, homeData, copy] = await Promise.all([
    fetchAuthQuery(api.profiles.getLinkedProfiles, {}),
    profile?.onboardingCompleted
      ? fetchAuthQuery(api.medications.getHomeData, {})
      : Promise.resolve(null),
    localizedCopyMap(locale, [
      "home.eyebrow",
      "home.title",
      "home.body",
      "home.today",
      "home.adherenceScore",
      "home.activeMedicines",
      "home.beingTracked",
      "home.nextDose",
      "home.none",
      "home.nothingPending",
      "home.quickSupport",
      "home.quickScanTitle",
      "home.quickScanBody",
      "home.openScanner",
      "home.openSettings",
      "home.medicineTracking",
      "home.todayDoses",
      "home.todayDosesBody",
      "home.completed",
      "home.noDoses",
      "home.doseMissing",
      "home.due",
      "home.dailyProgress",
      "home.last7Days",
      "home.recentScans",
      "home.recentScansBody",
      "home.noScans",
      "home.view",
      "home.actionTaken",
      "home.actionSnooze",
      "home.actionSkip",
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
      "home.onboardingPrompt",
      "home.onboardingAction",
      "home.linkedPeople",
      "home.linkedProfilesEmptyTitle",
      "home.linkedProfilesEmptyBody",
      "home.linkedProfilesIncompleteBody",
      "home.linkedProfilesActiveMedicines",
      "home.progressEmpty",
      "home.dosesSetupPrompt",
      "home.scansSetupPrompt",
      "home.caregiverAccessTitle",
      "home.caregiverAccessBody",
      "home.caregiverAccessCopy",
      "home.caregiverAccessCopied",
      "home.caregiverAccessCreating",
      "home.careNetworkAvailable",
      "home.careNetworkPending",
      "home.careNetworkViewProfile",
      "home.careNetworkRemove",
      "home.careNetworkTitle",
      "home.careNetworkBody",
      "home.event.missed",
      "home.event.reminded",
      "home.event.scheduled",
      "home.event.skipped",
      "home.event.snoozed",
      "home.event.taken",
    ] as const),
  ])

  const homeEyebrow = copy["home.eyebrow"]
  const homeTitle = copy["home.title"]
  const homeBody = copy["home.body"]
  const todayLabel = copy["home.today"]
  const adherenceScoreLabel = copy["home.adherenceScore"]
  const activeMedicinesLabel = copy["home.activeMedicines"]
  const beingTrackedLabel = copy["home.beingTracked"]
  const nextDoseLabel = copy["home.nextDose"]
  const noneLabel = copy["home.none"]
  const nothingPendingLabel = copy["home.nothingPending"]
  const quickSupportLabel = copy["home.quickSupport"]
  const quickScanTitle = copy["home.quickScanTitle"]
  const quickScanBody = copy["home.quickScanBody"]
  const openScannerLabel = copy["home.openScanner"]
  const openSettingsLabel = copy["home.openSettings"]
  const medicineTrackingLabel = copy["home.medicineTracking"]
  const todayDosesLabel = copy["home.todayDoses"]
  const todayDosesBody = copy["home.todayDosesBody"]
  const completedLabel = copy["home.completed"]
  const noDosesLabel = copy["home.noDoses"]
  const doseMissingLabel = copy["home.doseMissing"]
  const dueLabel = copy["home.due"]
  const dailyProgressLabel = copy["home.dailyProgress"]
  const last7DaysLabel = copy["home.last7Days"]
  const recentScansLabel = copy["home.recentScans"]
  const recentScansBody = copy["home.recentScansBody"]
  const noScansLabel = copy["home.noScans"]
  const viewLabel = copy["home.view"]
  const takenActionLabel = copy["home.actionTaken"]
  const snoozeActionLabel = copy["home.actionSnooze"]
  const skipActionLabel = copy["home.actionSkip"]
  const scanDialogTitle = copy["home.scanDialogTitle"]
  const scanDialogBody = copy["home.scanDialogBody"]
  const scanBadge = copy["home.scanBadge"]
  const scanCameraLabel = copy["home.scanCamera"]
  const scanUploadLabel = copy["home.scanUpload"]
  const scanDesktopUploadLabel = copy["home.scanDesktopUpload"]
  const scanDesktopHint = copy["home.scanDesktopHint"]
  const scanDropHint = copy["home.scanDropHint"]
  const scanDropActiveLabel = copy["home.scanDropActive"]
  const scanOrLabel = copy["home.scanOr"]
  const scanUploadingLabel = copy["home.scanUploading"]
  const scanFailedLabel = copy["home.scanFailed"]
  const onboardingPromptLabel = copy["home.onboardingPrompt"]
  const onboardingActionLabel = copy["home.onboardingAction"]
  const linkedPeopleLabel = copy["home.linkedPeople"]
  const linkedProfilesEmptyTitleLabel = copy["home.linkedProfilesEmptyTitle"]
  const linkedProfilesEmptyBodyLabel = copy["home.linkedProfilesEmptyBody"]
  const linkedProfilesIncompleteBodyLabel =
    copy["home.linkedProfilesIncompleteBody"]
  const linkedProfilesActiveMedicinesLabel =
    copy["home.linkedProfilesActiveMedicines"]
  const progressEmptyLabel = copy["home.progressEmpty"]
  const dosesSetupPromptLabel = copy["home.dosesSetupPrompt"]
  const scansSetupPromptLabel = copy["home.scansSetupPrompt"]
  const caregiverAccessTitle = copy["home.caregiverAccessTitle"]
  const caregiverAccessBody = copy["home.caregiverAccessBody"]
  const caregiverAccessCopy = copy["home.caregiverAccessCopy"]
  const caregiverAccessCopied = copy["home.caregiverAccessCopied"]
  const caregiverAccessCreating = copy["home.caregiverAccessCreating"]
  const careNetworkAvailableLabel = copy["home.careNetworkAvailable"]
  const careNetworkPendingLabel = copy["home.careNetworkPending"]
  const careNetworkViewProfileLabel = copy["home.careNetworkViewProfile"]
  const careNetworkRemoveLabel = copy["home.careNetworkRemove"]
  const careNetworkTitleLabel = copy["home.careNetworkTitle"]
  const careNetworkBodyLabel = copy["home.careNetworkBody"]

  const eventLabels = {
    missed: copy["home.event.missed"],
    reminded: copy["home.event.reminded"],
    scheduled: copy["home.event.scheduled"],
    skipped: copy["home.event.skipped"],
    snoozed: copy["home.event.snoozed"],
    taken: copy["home.event.taken"],
  }

  const reminderTimeZone = homeTimeZone(homeData?.profile ?? profile)
  const needsOnboarding = !profile?.onboardingCompleted

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.05),transparent_24%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,white)_0%,var(--background)_38%,color-mix(in_oklch,var(--background)_96%,var(--card))_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_26%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_86%,black)_0%,var(--background)_34%,color-mix(in_oklch,var(--background)_92%,var(--card))_100%)]">
      <ClearInviteCookie />
      {profile?.onboardingCompleted ? (
        <CompletedOnboardingExtras includeReminders />
      ) : null}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-8">
        {needsOnboarding ? (
          <section className="rounded-[1.75rem] border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-foreground">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{onboardingPromptLabel}</p>
              <Link
                href="/onboarding"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                {onboardingActionLabel}
              </Link>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-card/96 p-4 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)] sm:p-6 lg:p-7">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-primary uppercase">
                {homeEyebrow}
              </p>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-balance sm:text-[2.45rem] lg:text-[2.75rem]">
                  {homeTitle}, {authUser.name}
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
                  {homeBody}
                </p>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(300px,1.05fr)]">
              <MetricCard
                detail={adherenceScoreLabel}
                icon={<IconShieldCheck className="size-4" />}
                label={todayLabel}
                value={`${homeData?.stats.adherence ?? 0}%`}
              />
              <MetricCard
                detail={homeData?.nextDose?.medicineName ?? nothingPendingLabel}
                icon={<IconClockHour4 className="size-4" />}
                label={nextDoseLabel}
                value={
                  homeData?.nextDose
                    ? formatTimestampInTimeZone(
                        homeData.nextDose.dueAt,
                        reminderTimeZone
                      )
                    : noneLabel
                }
              />
              <section className="rounded-[1.25rem] border border-border/80 bg-[color-mix(in_oklch,var(--card)_74%,var(--muted))] p-4">
                <div className="space-y-2">
                  <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-primary uppercase">
                    {quickSupportLabel}
                  </p>
                  <p className="text-base font-semibold tracking-tight text-foreground">
                    {quickScanTitle}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {quickScanBody}
                  </p>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {profile?.onboardingCompleted ? (
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
                  ) : (
                    <SecondaryLink href="/onboarding">
                      {onboardingActionLabel}
                    </SecondaryLink>
                  )}
                  <SecondaryLink href="/settings">
                    {openSettingsLabel}
                  </SecondaryLink>
                </div>
              </section>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.86fr)]">
              <section className="rounded-[1.75rem] border border-border/80 bg-background/72 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-5">
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                    {dailyProgressLabel}
                  </p>
                  <h2 className="text-[1.8rem] font-semibold tracking-tight text-foreground">
                    {last7DaysLabel}
                  </h2>
                </div>

                {!homeData ? (
                  <EmptyStateCard
                    body={progressEmptyLabel}
                    icon={<IconShieldCheck className="size-5" />}
                  />
                ) : (
                  <ProgressChart days={homeData.progress} />
                )}
              </section>

              <section className="rounded-[1.75rem] border border-border/80 bg-background/72 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-5">
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                    {recentScansLabel}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {recentScansBody}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  {!homeData || homeData.recentAnalyses.length === 0 ? (
                    <EmptyStateCard
                      body={needsOnboarding ? scansSetupPromptLabel : noScansLabel}
                      icon={<IconActivityHeartbeat className="size-5" />}
                    />
                  ) : (
                    homeData.recentAnalyses.map((entry) => (
                      <RecentScanItem
                        key={entry.upload._id}
                        uploadId={String(entry.upload._id)}
                        detectedItem={entry.analysis?.detectedItem}
                        safetyStatus={entry.analysis?.safetyStatus}
                        fileName={entry.upload.fileName}
                        uploadStatus={entry.upload.status}
                        viewLabel={viewLabel}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            <section className="rounded-[1.75rem] border border-border/80 bg-background/72 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-5 lg:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                    {medicineTrackingLabel}
                  </p>
                  <div className="space-y-1">
                    <h2 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
                      {todayDosesLabel}
                    </h2>
                    <p className="max-w-xl text-sm leading-6 text-muted-foreground">
                      {todayDosesBody}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-80">
                  <CompactMetricCard
                    icon={<IconPill className="size-4" />}
                    label={activeMedicinesLabel}
                    value={String(homeData?.medicines.length ?? 0)}
                    detail={beingTrackedLabel}
                  />
                  <CompactMetricCard
                    icon={<IconShieldCheck className="size-4" />}
                    label={completedLabel}
                    value={`${homeData?.stats.taken ?? 0}/${homeData?.stats.total ?? 0}`}
                    detail={todayLabel}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {!homeData || homeData.todayDoses.length === 0 ? (
                  <EmptyStateCard
                    body={needsOnboarding ? dosesSetupPromptLabel : noDosesLabel}
                    icon={<IconPill className="size-5" />}
                  />
                ) : (
                  homeData.todayDoses.map((dose) => {
                    const isDone = dose.eventType !== "scheduled"

                    return (
                      <article
                        key={dose._id}
                        className="rounded-[1.25rem] border border-border/80 bg-card p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.28)] lg:p-5"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <p className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                                {dose.medicineName}
                              </p>
                              <StatusPill label={eventLabels[dose.eventType]} />
                            </div>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                              <span className="rounded-full border border-border/80 bg-background px-3 py-1 font-medium text-foreground/90 shadow-sm">
                                {dose.dosage ?? doseMissingLabel}
                              </span>
                              <span>
                                {dueLabel}{" "}
                                {formatTimestampInTimeZone(
                                  dose.dueAt,
                                  reminderTimeZone
                                )}
                              </span>
                            </div>

                            {dose.instructions ? (
                              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                                {dose.instructions}
                              </p>
                            ) : null}
                          </div>

                          <div className="lg:shrink-0">
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
            </section>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border/80 bg-card/96 p-4 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground/65">
              <IconUsers className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                {linkedPeopleLabel}
              </p>
              <h2 className="mt-2 text-[1.8rem] font-semibold tracking-tight text-foreground">
                {careNetworkTitleLabel}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                {careNetworkBodyLabel}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <CareNetworkManager
              connections={linkedProfiles.connections.map((item) => ({
                linkId: String(item.linkId),
                userId: item.userId,
                profileId: item.profileId ? String(item.profileId) : null,
                name: item.name,
                email: item.email,
                canOpenProfile: item.canOpenProfile,
                activeMedicines: item.activeMedicines ?? 0,
                onboardingCompleted: item.onboardingCompleted,
              }))}
              invitePath="/api/caregiver-invite?token="
              emptyTitle={
                profile ? linkedProfilesEmptyTitleLabel : caregiverAccessTitle
              }
              emptyBody={
                profile
                  ? linkedProfilesEmptyBodyLabel
                  : linkedProfilesIncompleteBodyLabel
              }
              activeMedicinesLabel={linkedProfilesActiveMedicinesLabel}
              connectionLabels={{
                available: careNetworkAvailableLabel,
                pending: careNetworkPendingLabel,
                viewProfile: careNetworkViewProfileLabel,
                remove: careNetworkRemoveLabel,
              }}
              inviteUiText={{
                title: caregiverAccessTitle,
                body: caregiverAccessBody,
                copy: caregiverAccessCopy,
                copied: caregiverAccessCopied,
                creating: caregiverAccessCreating,
              }}
              inviteAction={
                needsOnboarding
                  ? {
                      href: "/onboarding",
                      label: onboardingActionLabel,
                    }
                  : null
              }
            />
          </div>
        </section>
      </div>
    </main>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[1.25rem] border border-border/80 bg-background/78 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2.5 text-[2.2rem] font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-2xl border border-border bg-card text-foreground/65">
          {icon}
        </div>
      </div>
    </div>
  )
}

function CompactMetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[1.1rem] border border-border/80 bg-card px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-1.5 text-[1.8rem] font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-2xl border border-border bg-background text-foreground/65">
          {icon}
        </div>
      </div>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border/80 bg-background px-3 py-1 text-[0.68rem] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
      {label}
    </span>
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
    <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/50 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground/70">
          {icon}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
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

function homeTimeZone(
  profile:
    | {
        reminderPreferences?: {
          timezone?: string
        }
      }
    | null
    | undefined
) {
  return profile?.reminderPreferences?.timezone ?? "UTC"
}
