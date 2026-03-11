import {
  IconActivityHeartbeat,
  IconClockHour4,
  IconPill,
  IconShieldCheck,
} from "@tabler/icons-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ProgressChart } from "@/components/home/progress-chart"
import { RecentScanItem } from "@/components/home/recent-scan-item"
import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"
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
  const [
    todayLabel,
    activeMedicinesLabel,
    nextDoseLabel,
    dailyProgressLabel,
    last7DaysLabel,
    recentScansLabel,
    viewLabel,
  ] = await Promise.all([
    localizedCopy("home.today", locale),
    localizedCopy("home.activeMedicines", locale),
    localizedCopy("home.nextDose", locale),
    localizedCopy("home.dailyProgress", locale),
    localizedCopy("home.last7Days", locale),
    localizedCopy("home.recentScans", locale),
    localizedCopy("home.view", locale),
  ])

  const timeZone = homeData.reminderPreferences.timezone

  return (
    <main className="min-h-svh bg-background px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[2rem] border border-border/80 bg-card/96 p-5 shadow-[0_20px_60px_-36px_rgba(15,23,42,0.22)] sm:p-7 lg:p-8">
          <Link
            href="/"
            className="inline-flex text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Back to dashboard
          </Link>

          <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
            Linked profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {summary.userName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {summary.userEmail ?? "Care recipient overview"}
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <MetricCard
              icon={<IconShieldCheck className="size-4" />}
              label={todayLabel}
              value={`${homeData.stats.adherence}%`}
              detail="Adherence"
            />
            <MetricCard
              icon={<IconPill className="size-4" />}
              label={activeMedicinesLabel}
              value={String(homeData.medicines.length)}
              detail="Active medicines"
            />
            <MetricCard
              icon={<IconClockHour4 className="size-4" />}
              label={nextDoseLabel}
              value={
                homeData.nextDose
                  ? formatTimestampInTimeZone(homeData.nextDose.dueAt, timeZone)
                  : "None"
              }
              detail={homeData.nextDose?.medicineName ?? "Nothing pending"}
            />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
              Health profile
            </p>
            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <Detail
                label="Age"
                value={summary.age ? String(summary.age) : "Not added"}
              />
              <Detail
                label="Allergies"
                value={joinOrFallback(summary.allergies)}
              />
              <Detail
                label="Conditions"
                value={joinOrFallback(summary.chronicConditions)}
              />
              <Detail
                label="Dietary restrictions"
                value={joinOrFallback(summary.dietaryRestrictions)}
              />
              <Detail
                label="Religious restrictions"
                value={joinOrFallback(summary.religiousRestrictions)}
              />
              <Detail
                label="Emergency notes"
                value={summary.emergencyNotes ?? "Not added"}
              />
            </div>
          </section>

          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
              Medicines today
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {homeData.todayDoses.length === 0 ? (
                <EmptyCard
                  body="No doses scheduled yet."
                  icon={<IconPill className="size-5" />}
                />
              ) : (
                homeData.todayDoses.map((dose) => (
                  <article
                    key={dose._id}
                    className="rounded-[1.25rem] border border-border/70 bg-background px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {dose.medicineName}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dose.dosage ?? "Dose not added"} -{" "}
                      {formatTimestampInTimeZone(dose.dueAt, timeZone)}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
              {dailyProgressLabel}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {last7DaysLabel}
            </h2>
          </div>

          <ProgressChart days={homeData.progress} />
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.24em] text-primary uppercase">
            {recentScansLabel}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {uploads.length === 0 ? (
              <EmptyCard
                body="No scans available for this profile yet."
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
    <div className="rounded-[1.5rem] border border-border/80 bg-background p-4">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-foreground/85">{value}</p>
    </div>
  )
}

function EmptyCard({ body, icon }: { body: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-border/80 bg-background px-4 py-5">
      <div className="flex items-start gap-3 text-sm text-muted-foreground">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-card text-foreground/75">
          {icon}
        </div>
        <p className="leading-6">{body}</p>
      </div>
    </div>
  )
}

function joinOrFallback(values: string[]) {
  return values.length > 0 ? values.join(", ") : "Not added"
}
