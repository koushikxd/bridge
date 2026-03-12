import {
  IconActivityHeartbeat,
  IconArrowLeft,
  IconClockHour4,
  IconPill,
  IconShieldCheck,
} from "@tabler/icons-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CompletedOnboardingExtras } from "@/components/app-shell/completed-onboarding-extras"
import { ProgressChart } from "@/components/home/progress-chart"
import { RecentScanItem } from "@/components/home/recent-scan-item"
import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopyMap } from "@/lib/copy"
import { formatTimestampInTimeZone } from "@/lib/time"

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>
}) {
  await requireAuthenticatedUser()

  const { profileId } = await params
  const [summary, homeData, uploads] = await Promise.all([
    fetchAuthQuery(api.profiles.getAccessibleProfileSummary, {
      profileId: profileId as never,
    }),
    fetchAuthQuery(api.medications.getAccessibleHomeData, {
      profileId: profileId as never,
    }).catch(() => null),
    fetchAuthQuery(api.uploads.listAccessibleUploads, {
      profileId: profileId as never,
    }).catch(() => []),
  ])

  if (!summary || !homeData) {
    notFound()
  }

  const locale = summary.preferredLanguage
  const copy = await localizedCopyMap(locale, [
    "profile.backDashboard",
    "profile.eyebrow",
    "profile.overview",
    "profile.incompleteTitle",
    "profile.incompleteBody",
    "home.today",
    "home.activeMedicines",
    "home.nextDose",
    "home.dailyProgress",
    "home.last7Days",
    "home.recentScans",
    "home.view",
    "profile.healthProfile",
    "profile.medicinesToday",
    "profile.noDoses",
    "profile.noScans",
    "profile.notAdded",
    "profile.age",
    "profile.allergies",
    "profile.conditions",
    "profile.dietaryRestrictions",
    "profile.religiousRestrictions",
    "profile.emergencyNotes",
    "profile.adherence",
    "profile.activeMedicinesDetail",
    "home.none",
    "home.nothingPending",
    "home.doseMissing",
  ] as const)

  const backDashboardLabel = copy["profile.backDashboard"]
  const profileEyebrow = copy["profile.eyebrow"]
  const profileOverview = copy["profile.overview"]
  const profileIncompleteTitle = copy["profile.incompleteTitle"]
  const profileIncompleteBody = copy["profile.incompleteBody"]
  const todayLabel = copy["home.today"]
  const activeMedicinesLabel = copy["home.activeMedicines"]
  const nextDoseLabel = copy["home.nextDose"]
  const dailyProgressLabel = copy["home.dailyProgress"]
  const last7DaysLabel = copy["home.last7Days"]
  const recentScansLabel = copy["home.recentScans"]
  const viewLabel = copy["home.view"]
  const profileHealthLabel = copy["profile.healthProfile"]
  const profileMedicinesTodayLabel = copy["profile.medicinesToday"]
  const profileNoDosesLabel = copy["profile.noDoses"]
  const profileNoScansLabel = copy["profile.noScans"]
  const profileNotAddedLabel = copy["profile.notAdded"]
  const profileAgeLabel = copy["profile.age"]
  const profileAllergiesLabel = copy["profile.allergies"]
  const profileConditionsLabel = copy["profile.conditions"]
  const profileDietaryRestrictionsLabel = copy["profile.dietaryRestrictions"]
  const profileReligiousRestrictionsLabel =
    copy["profile.religiousRestrictions"]
  const profileEmergencyNotesLabel = copy["profile.emergencyNotes"]
  const profileAdherenceLabel = copy["profile.adherence"]
  const profileActiveMedicinesDetailLabel =
    copy["profile.activeMedicinesDetail"]
  const noneLabel = copy["home.none"]
  const nothingPendingLabel = copy["home.nothingPending"]
  const doseMissingLabel = copy["home.doseMissing"]

  const timeZone = homeData.reminderPreferences.timezone

  return (
    <main className="min-h-svh bg-background px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <CompletedOnboardingExtras />
      <div className="mx-auto max-w-6xl space-y-5">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          <IconArrowLeft className="size-4" />
          {backDashboardLabel}
        </Link>

        <section className="rounded-[1.75rem] border border-border/80 bg-card/96 p-4 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)] sm:p-6 lg:p-7">
          <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">
            {profileEyebrow}
          </p>
          <h1 className="mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.4rem]">
            {summary.userName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {summary.userEmail ?? profileOverview}
          </p>

          {!summary.onboardingCompleted ? (
            <div className="mt-4 rounded-[1.25rem] border border-primary/20 bg-primary/10 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">
                {profileIncompleteTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {profileIncompleteBody}
              </p>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={<IconShieldCheck className="size-4" />}
              label={todayLabel}
              value={`${homeData.stats.adherence}%`}
              detail={profileAdherenceLabel}
            />
            <MetricCard
              icon={<IconPill className="size-4" />}
              label={activeMedicinesLabel}
              value={String(homeData.medicines.length)}
              detail={profileActiveMedicinesDetailLabel}
            />
            <MetricCard
              icon={<IconClockHour4 className="size-4" />}
              label={nextDoseLabel}
              value={
                homeData.nextDose
                  ? formatTimestampInTimeZone(homeData.nextDose.dueAt, timeZone)
                  : noneLabel
              }
              detail={homeData.nextDose?.medicineName ?? nothingPendingLabel}
            />
          </div>
        </section>

        <div className="grid gap-5 lg:items-start lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">
              {profileHealthLabel}
            </p>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <Detail
                label={profileAgeLabel}
                value={summary.age ? String(summary.age) : profileNotAddedLabel}
              />
              <Detail
                label={profileAllergiesLabel}
                value={joinOrFallback(summary.allergies, profileNotAddedLabel)}
              />
              <Detail
                label={profileConditionsLabel}
                value={joinOrFallback(
                  summary.chronicConditions,
                  profileNotAddedLabel
                )}
              />
              <Detail
                label={profileDietaryRestrictionsLabel}
                value={joinOrFallback(
                  summary.dietaryRestrictions,
                  profileNotAddedLabel
                )}
              />
              <Detail
                label={profileReligiousRestrictionsLabel}
                value={joinOrFallback(
                  summary.religiousRestrictions,
                  profileNotAddedLabel
                )}
              />
              <Detail
                label={profileEmergencyNotesLabel}
                value={summary.emergencyNotes ?? profileNotAddedLabel}
              />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm lg:self-stretch">
            <div className="space-y-2">
              <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">
                {dailyProgressLabel}
              </p>
              <h2 className="text-[1.45rem] font-semibold tracking-tight text-foreground">
                {last7DaysLabel}
              </h2>
            </div>

            <div className="mt-4 h-[calc(100%-4.5rem)] min-h-[18rem]">
              <ProgressChart days={homeData.progress} compact fill />
            </div>
          </section>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">
              {profileMedicinesTodayLabel}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {homeData.todayDoses.length === 0 ? (
                <EmptyCard
                  body={profileNoDosesLabel}
                  icon={<IconPill className="size-5" />}
                />
              ) : (
                homeData.todayDoses.map((dose) => (
                  <article
                    key={dose._id}
                    className="rounded-[1.1rem] border border-border/70 bg-background px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {dose.medicineName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dose.dosage ?? doseMissingLabel} ·{" "}
                      {formatTimestampInTimeZone(dose.dueAt, timeZone)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-[0.7rem] font-semibold tracking-[0.24em] text-primary uppercase">
              {recentScansLabel}
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {uploads.length === 0 ? (
                <EmptyCard
                  body={profileNoScansLabel}
                  icon={<IconActivityHeartbeat className="size-5" />}
                />
              ) : (
                uploads.map((entry) => (
                  <RecentScanItem
                    key={entry.upload._id}
                    uploadId={entry.upload._id}
                    detectedItem={entry.analysis?.detectedItem}
                    safetyStatus={entry.analysis?.safetyStatus}
                    fileName={entry.upload.fileName}
                    uploadStatus={entry.upload.status}
                    viewLabel={viewLabel}
                    hideDelete
                  />
                ))
              )}
            </div>
          </section>
        </div>
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
    <div className="rounded-[1.25rem] border border-border/80 bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.66rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 text-[2rem] font-semibold tracking-tight text-foreground">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground/85">{value}</p>
    </div>
  )
}

function EmptyCard({ body, icon }: { body: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.1rem] border border-dashed border-border/80 bg-background px-4 py-5">
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-card text-foreground/75">
          {icon}
        </div>
        <p className="leading-6">{body}</p>
      </div>
    </div>
  )
}

function joinOrFallback(values: string[], fallback: string) {
  return values.length > 0 ? values.join(", ") : fallback
}
