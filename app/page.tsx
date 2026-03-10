import {
  IconAlertTriangle,
  IconBellRinging,
  IconPill,
  IconScanEye,
} from "@tabler/icons-react"
import type { ReactNode } from "react"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { copy } from "@/lib/copy"
import {
  preferredLanguageLabels,
  type PreferredLanguage,
} from "@/lib/contracts/profile"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { redirect } from "next/navigation"

export default async function Page() {
  const { authUser, profile } = await requireCompletedOnboarding()

  if (!profile) {
    redirect("/onboarding")
  }

  const preferredLanguage =
    profile.preferredLanguage as keyof typeof preferredLanguageLabels &
      PreferredLanguage

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="flex flex-col gap-6 rounded-[2rem] border border-border bg-card p-8 text-card-foreground shadow-sm md:flex-row md:items-end md:justify-between md:p-10">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
              {copy("home.eyebrow")}
            </p>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                Welcome back, {authUser.name}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                {copy("home.body")}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 rounded-[1.5rem] border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-foreground md:min-w-72">
            <p className="font-medium">{copy("home.language")}</p>
            <p className="text-lg font-semibold">
              {preferredLanguageLabels[preferredLanguage]}
            </p>
            <p className="text-muted-foreground">{copy("home.status")}</p>
            <SignOutButton />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          <FeatureCard
            icon={<IconPill className="size-5" />}
            title="Medicine tracking"
            body="See your medicines, understand what they do, and get reminders when it's time to take them."
            tone="teal"
          />
          <FeatureCard
            icon={<IconScanEye className="size-5" />}
            title="Upload analysis"
            body="Snap a photo of a prescription, label, or menu and get a structured safety breakdown."
            tone="amber"
          />
          <FeatureCard
            icon={<IconBellRinging className="size-5" />}
            title="Reminders"
            body="Get notified when medicines are due so nothing gets missed."
            tone="rose"
          />
          <FeatureCard
            icon={<IconAlertTriangle className="size-5" />}
            title="Safety alerts"
            body="Flagged ingredients, allergy risks, and dietary conflicts surfaced automatically."
            tone="slate"
          />
        </section>
      </div>
    </main>
  )
}

function FeatureCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: ReactNode
  title: string
  body: string
  tone: "teal" | "amber" | "rose" | "slate"
}) {
  const toneClassNames = {
    teal: "border-primary/20 bg-card text-card-foreground",
    amber: "border-border bg-card text-card-foreground",
    rose: "border-border bg-card text-card-foreground",
    slate: "border-border bg-card text-card-foreground",
  }

  const iconClassNames = {
    teal: "bg-primary/10 text-primary",
    amber: "bg-chart-4/15 text-chart-4",
    rose: "bg-chart-5/15 text-chart-5",
    slate: "bg-muted text-foreground",
  }

  return (
    <article
      className={`rounded-[1.75rem] border p-6 shadow-sm ${toneClassNames[tone]}`}
    >
      <div className={`inline-flex rounded-full p-2 ${iconClassNames[tone]}`}>
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  )
}
