import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { DoseActions } from "@/components/home/dose-actions"
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

  const [homeBody, homeEyebrow, homeLanguage, homeStatus, homeTitle, homeData] =
    await Promise.all([
      localizedCopy("home.body", preferredLanguage),
      localizedCopy("home.eyebrow", preferredLanguage),
      localizedCopy("home.language", preferredLanguage),
      localizedCopy("home.status", preferredLanguage),
      localizedCopy("home.title", preferredLanguage),
      fetchAuthQuery(api.medications.getHomeData, {}),
    ])

  return (
    <main className="min-h-svh bg-[linear-gradient(180deg,color-mix(in_oklch,var(--background)_92%,white)_0%,var(--background)_28%,color-mix(in_oklch,var(--background)_96%,var(--card))_100%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card/95 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="grid gap-6 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.06),transparent_28%)] p-5 sm:p-7 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.8fr)] lg:gap-8 lg:p-9 xl:p-10">
            <div className="space-y-5 lg:space-y-6">
              <p className="text-[0.68rem] font-semibold tracking-[0.28em] text-primary uppercase">
                {homeEyebrow}
              </p>
              <div className="max-w-3xl space-y-3">
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-[2.9rem]">
                  {homeTitle}, {authUser.name}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground sm:text-[0.98rem] sm:leading-7">
                  {homeBody}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:gap-4">
                <MetricCard
                  label="Today"
                  value={`${homeData.stats.adherence}%`}
                  detail="adherence score"
                />
                <MetricCard
                  label="Active medicines"
                  value={String(homeData.medicines.length)}
                  detail="being tracked"
                />
                <MetricCard
                  label="Next dose"
                  value={
                    homeData.nextDose
                      ? formatTime(homeData.nextDose.dueAt)
                      : "None"
                  }
                  detail={homeData.nextDose?.medicineName ?? "Nothing pending"}
                />
              </div>
            </div>

            <div className="flex h-full flex-col justify-between gap-4 rounded-[1.75rem] border border-border/80 bg-background/88 p-4 sm:p-5 lg:p-6">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-border/80 bg-card/80 p-4 sm:p-5">
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

                <div className="rounded-[1.5rem] border border-primary/15 bg-[linear-gradient(135deg,rgba(16,185,129,0.11),rgba(255,255,255,0.08))] p-4 sm:p-5">
                  <div className="space-y-2">
                    <p className="text-[0.72rem] font-semibold tracking-[0.22em] text-primary uppercase">
                      Quick support
                    </p>
                    <p className="text-lg font-semibold tracking-tight text-foreground">
                      Quick scan helper
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      Understand prescriptions, medicine labels, meal photos,
                      food package labels, and menus in one place.
                    </p>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <ButtonLink href="/scan">Open scanner</ButtonLink>
                    <SecondaryLink href="/settings">
                      Open settings
                    </SecondaryLink>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-dashed border-border/80 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Signed in
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep your profile private on shared devices.
                  </p>
                </div>
                <SignOutButton />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="rounded-[2rem] border border-border/80 bg-card/95 p-5 shadow-sm sm:p-6 lg:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  Medicine tracking
                </p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem]">
                    Today&apos;s doses
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Stay on top of upcoming medicines and quickly log each dose.
                  </p>
                </div>
              </div>

              <div className="w-full rounded-[1.25rem] border border-border/80 bg-background/80 px-4 py-3 sm:w-auto sm:min-w-40">
                <p className="text-[0.7rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                  Completed
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                  {homeData.stats.taken}/{homeData.stats.total}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {homeData.todayDoses.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/80 bg-background/55 px-5 py-6 text-sm leading-6 text-muted-foreground">
                  No doses scheduled yet. Add medicines in onboarding or later
                  from a settings flow.
                </div>
              ) : (
                homeData.todayDoses.map((dose) => {
                  const isDone = dose.eventType !== "scheduled"

                  return (
                    <article
                      key={dose._id}
                      className="rounded-[1.5rem] border border-border/80 bg-background/78 p-4 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.7)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                              {dose.medicineName}
                            </p>
                            <StatusPill label={dose.eventType} />
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                            <span className="rounded-full bg-muted/80 px-3 py-1 font-medium text-foreground/90">
                              {dose.dosage ?? "Dose not added"}
                            </span>
                            <span>Due {formatTime(dose.dueAt)}</span>
                          </div>

                          {dose.instructions ? (
                            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                              {dose.instructions}
                            </p>
                          ) : null}
                        </div>

                        <div className="w-full lg:w-auto lg:min-w-64">
                          <DoseActions eventId={dose._id} disabled={isDone} />
                        </div>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-[2rem] border border-border/80 bg-card/95 p-5 shadow-sm sm:p-6">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  Daily progress
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Last 7 days
                </h2>
              </div>

              <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
                {homeData.progress.map((day) => (
                  <div
                    key={day.label}
                    className="flex min-w-0 flex-col items-center gap-3"
                  >
                    <div className="flex h-36 w-full items-end rounded-[1.25rem] bg-muted/80 p-2 sm:h-40">
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

            <section className="rounded-[2rem] border border-border/80 bg-card/95 p-5 shadow-sm sm:p-6">
              <div className="space-y-2">
                <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-primary uppercase">
                  Recent scans
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Revisit the latest prescription, label, meal, and menu checks.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3">
                {homeData.recentAnalyses.length === 0 ? (
                  <p className="rounded-[1.25rem] border border-dashed border-border/80 bg-background/55 px-4 py-5 text-sm leading-6 text-muted-foreground">
                    No scans yet. Use the scanner to understand a prescription,
                    medicine label, meal, food label, or menu.
                  </p>
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
                          View
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
  label,
  value,
}: {
  detail: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.5rem] border border-border/80 bg-background/82 p-4 sm:p-5">
      <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
        {value}
      </p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  )
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-[0.7rem] font-semibold tracking-[0.12em] text-foreground capitalize">
      {label}
    </span>
  )
}

function ButtonLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      {children}
    </Link>
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
