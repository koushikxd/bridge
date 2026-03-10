import { LanguageOnboardingForm } from "@/components/onboarding/language-onboarding-form"
import { copy } from "@/lib/copy"
import { requirePendingOnboarding } from "@/lib/auth-guards"

export default async function OnboardingPage() {
  const { authUser, profile } = await requirePendingOnboarding()

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-border bg-card p-8 text-card-foreground shadow-sm md:p-10">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary">
              {copy("onboarding.eyebrow")}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {copy("onboarding.title")}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground">
              {copy("onboarding.body")}
            </p>
          </div>

          <LanguageOnboardingForm
            defaultLanguage={profile?.preferredLanguage ?? "en"}
            userName={authUser.name}
            userEmail={authUser.email}
          />
        </div>
      </div>
    </main>
  )
}
