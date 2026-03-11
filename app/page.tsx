import {
  IconActivityHeartbeat,
  IconClockHour4,
  IconLanguage,
  IconPill,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react"
import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { ClearInviteCookie } from "@/components/auth/clear-invite-cookie"
import { CareNetworkManager } from "@/components/home/care-network-manager"
import { DoseActions } from "@/components/home/dose-actions"
import { ProgressChart } from "@/components/home/progress-chart"
import { RecentScanItem } from "@/components/home/recent-scan-item"
import { ScanUploadDialog } from "@/components/upload/scan-upload-dialog"
import { api } from "@/convex/_generated/api"
import { getSessionContext, requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"
import {
  preferredLanguageLabels,
  type PreferredLanguage,
} from "@/lib/contracts/profile"
import { formatTimestampInTimeZone } from "@/lib/time"

export const metadata = {
  title: "Home | Bridge",
  description: "Track medicines and scan health information with Bridge.",
}

export default async function Page() {
  const { authUser } = await requireAuthenticatedUser()
  const session = await getSessionContext()

  if (!session) {
    return null
  }

  const profile = session.profile
  const locale = (profile?.preferredLanguage ?? "en") as PreferredLanguage
  const linkedProfiles = await fetchAuthQuery(api.profiles.getLinkedProfiles, {})
  const homeData = profile?.onboardingCompleted
    ? await fetchAuthQuery(api.medications.getHomeData, {})
    : null

  const [
    homeEyebrow,
    homeTitle,
    homeBody,
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
    onboardingPromptLabel,
    onboardingActionLabel,
    onboardingStatusLabel,
    linkedPeopleLabel,
    linkedProfilesEmptyTitleLabel,
    linkedProfilesEmptyBodyLabel,
    linkedProfilesIncompleteBodyLabel,
    linkedProfilesActiveMedicinesLabel,
    progressEmptyLabel,
    dosesSetupPromptLabel,
    scansSetupPromptLabel,
    caregiverAccessTitle,
    caregiverAccessBody,
    caregiverAccessCopy,
    caregiverAccessCopied,
    caregiverAccessCreating,
    careNetworkInboundLabel,
    careNetworkOutboundLabel,
    careNetworkViewProfileLabel,
    careNetworkRemoveLabel,
    careNetworkTitleLabel,
    careNetworkBodyLabel,
    utilityTitleLabel,
  ] = await Promise.all([
    localizedCopy("home.eyebrow", locale),
    localizedCopy("home.title", locale),
    localizedCopy("home.body", locale),
    localizedCopy("home.status", locale),
    localizedCopy("home.today", locale),
    localizedCopy("home.adherenceScore", locale),
    localizedCopy("home.activeMedicines", locale),
    localizedCopy("home.beingTracked", locale),
    localizedCopy("home.nextDose", locale),
    localizedCopy("home.none", locale),
    localizedCopy("home.nothingPending", locale),
    localizedCopy("home.quickSupport", locale),
    localizedCopy("home.quickScanTitle", locale),
    localizedCopy("home.quickScanBody", locale),
    localizedCopy("home.openScanner", locale),
    localizedCopy("home.openSettings", locale),
    localizedCopy("home.signedIn", locale),
    localizedCopy("home.signedInHint", locale),
    localizedCopy("home.medicineTracking", locale),
    localizedCopy("home.todayDoses", locale),
    localizedCopy("home.todayDosesBody", locale),
    localizedCopy("home.completed", locale),
    localizedCopy("home.noDoses", locale),
    localizedCopy("home.doseMissing", locale),
    localizedCopy("home.due", locale),
    localizedCopy("home.dailyProgress", locale),
    localizedCopy("home.last7Days", locale),
    localizedCopy("home.recentScans", locale),
    localizedCopy("home.recentScansBody", locale),
    localizedCopy("home.noScans", locale),
    localizedCopy("home.view", locale),
    localizedCopy("home.signOut", locale),
    localizedCopy("home.signingOut", locale),
    localizedCopy("home.actionTaken", locale),
    localizedCopy("home.actionSnooze", locale),
    localizedCopy("home.actionSkip", locale),
    localizedCopy("home.scanDialogTitle", locale),
    localizedCopy("home.scanDialogBody", locale),
    localizedCopy("home.scanBadge", locale),
    localizedCopy("home.scanCamera", locale),
    localizedCopy("home.scanUpload", locale),
    localizedCopy("home.scanDesktopUpload", locale),
    localizedCopy("home.scanDesktopHint", locale),
    localizedCopy("home.scanDropHint", locale),
    localizedCopy("home.scanDropActive", locale),
    localizedCopy("home.scanOr", locale),
    localizedCopy("home.scanUploading", locale),
    localizedCopy("home.scanFailed", locale),
    localizedCopy("home.onboardingPrompt", locale),
    localizedCopy("home.onboardingAction", locale),
    localizedCopy("home.onboardingStatus", locale),
    localizedCopy("home.linkedPeople", locale),
    localizedCopy("home.linkedProfilesEmptyTitle", locale),
    localizedCopy("home.linkedProfilesEmptyBody", locale),
    localizedCopy("home.linkedProfilesIncompleteBody", locale),
    localizedCopy("home.linkedProfilesActiveMedicines", locale),
    localizedCopy("home.progressEmpty", locale),
    localizedCopy("home.dosesSetupPrompt", locale),
    localizedCopy("home.scansSetupPrompt", locale),
    localizedCopy("home.caregiverAccessTitle", locale),
    localizedCopy("home.caregiverAccessBody", locale),
    localizedCopy("home.caregiverAccessCopy", locale),
    localizedCopy("home.caregiverAccessCopied", locale),
    localizedCopy("home.caregiverAccessCreating", locale),
    localizedCopy("home.careNetworkInbound", locale),
    localizedCopy("home.careNetworkOutbound", locale),
    localizedCopy("home.careNetworkViewProfile", locale),
    localizedCopy("home.careNetworkRemove", locale),
    localizedCopy("home.careNetworkTitle", locale),
    localizedCopy("home.careNetworkBody", locale),
    localizedCopy("home.utilityTitle", locale),
  ])

  const eventLabels = {
    missed: await localizedCopy("home.event.missed", locale),
    reminded: await localizedCopy("home.event.reminded", locale),
    scheduled: await localizedCopy("home.event.scheduled", locale),
    skipped: await localizedCopy("home.event.skipped", locale),
    snoozed: await localizedCopy("home.event.snoozed", locale),
    taken: await localizedCopy("home.event.taken", locale),
  }

  const reminderTimeZone = homeTimeZone(homeData?.profile ?? profile)
  const preferredLanguage = profile?.preferredLanguage
    ? (profile.preferredLanguage as keyof typeof preferredLanguageLabels &
        PreferredLanguage)
    : "en"
  const needsOnboarding = !profile?.onboardingCompleted

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_26%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.05),transparent_24%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,white)_0%,var(--background)_38%,color-mix(in_oklch,var(--background)_96%,var(--card))_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_26%),linear-gradient(180deg,color-mix(in_oklch,var(--background)_86%,black)_0%,var(--background)_34%,color-mix(in_oklch,var(--background)_92%,var(--card))_100%)]">
      <ClearInviteCookie />
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

        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)] sm:p-7 lg:p-9">
          <div className="space-y-8">
            <div className="space-y-3">
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
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(320px,1.1fr)]">
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
              <section className="rounded-[1.5rem] border border-border/80 bg-[color-mix(in_oklch,var(--card)_74%,var(--muted))] p-5">
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

            <section className="rounded-[2rem] border border-border/80 bg-background/72 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6 lg:p-7">
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

                <div className="grid gap-3 sm:min-w-72 sm:grid-cols-2">
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

              <div className="mt-6 flex flex-col gap-4">
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
                        className="rounded-[1.5rem] border border-border/80 bg-card p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.28)] sm:p-5"
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
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.86fr)]">
              <section className="rounded-[2rem] border border-border/80 bg-background/72 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6">
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                    {dailyProgressLabel}
                  </p>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
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

              <section className="rounded-[2rem] border border-border/80 bg-background/72 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-6">
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

            <section className="rounded-[1.5rem] border border-border/80 bg-background/55 p-4 sm:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                      {utilityTitleLabel}
                    </p>
                    <p className="mt-2 text-base font-semibold text-foreground">
                      {preferredLanguageLabels[preferredLanguage]}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {profile?.onboardingCompleted
                        ? homeStatus
                        : onboardingStatusLabel}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-foreground/70">
                      <IconLanguage className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {signedInLabel}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {signedInHint}
                      </p>
                    </div>
                  </div>
                </div>

                <SignOutButton
                  label={signOutLabel}
                  pendingLabel={signingOutLabel}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background text-foreground/65">
              <IconUsers className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                {linkedPeopleLabel}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
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
                direction: item.direction,
                canOpenProfile: item.canOpenProfile,
                activeMedicines: item.activeMedicines,
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
                inbound: careNetworkInboundLabel,
                outbound: careNetworkOutboundLabel,
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
    <div className="rounded-[1.5rem] border border-border/80 bg-background/78 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-2xl border border-border bg-card text-foreground/65">
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
    <div className="rounded-[1.25rem] border border-border/80 bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
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
    <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/50 px-4 py-5">
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
