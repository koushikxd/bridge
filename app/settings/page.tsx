import Link from "next/link"

import { MedicineSettingsForm } from "@/components/settings/medicine-settings-form"
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form"
import { api } from "@/convex/_generated/api"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"

export const metadata = {
  title: "Settings | Bridge",
  description: "Edit your Bridge profile and tracked medicines.",
}

export default async function SettingsPage() {
  const { profile } = await requireCompletedOnboarding()
  const locale = profile?.preferredLanguage ?? "en"
  const [
    settingsEyebrow,
    settingsTitle,
    settingsBody,
    settingsBackHome,
    settingsData,
  ] = await Promise.all([
    localizedCopy("settings.eyebrow", locale),
    localizedCopy("settings.title", locale),
    localizedCopy("settings.body", locale),
    localizedCopy("settings.backHome", locale),
    fetchAuthQuery(api.medications.getSettingsData, {}),
  ])

  return (
    <main className="min-h-svh bg-background px-6 py-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
                {settingsEyebrow}
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                {settingsTitle}
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
                {settingsBody}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <QuickLink
                href="/"
                title={settingsBackHome}
                body="Return to your dashboard and today's medicine view."
              />
              <QuickLink
                href="/scan"
                title="Open scanner"
                body="Analyze prescriptions, labels, meals, and menus."
              />
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <ProfileSettingsForm profile={settingsData.profile} />
          <MedicineSettingsForm medicines={settingsData.medicines} />
        </div>
      </div>
    </main>
  )
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string
  title: string
  body: string
}) {
  return (
    <Link
      href={href}
      className="rounded-[1.5rem] border border-border bg-background/70 p-4 transition hover:border-primary/30 hover:bg-background"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </Link>
  )
}
