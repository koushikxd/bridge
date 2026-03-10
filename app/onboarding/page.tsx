import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { requirePendingOnboarding } from "@/lib/auth-guards"
import { localizedCopy } from "@/lib/copy"

export default async function OnboardingPage() {
  const { authUser, profile } = await requirePendingOnboarding()

  const hasLanguage = !!profile?.preferredLanguage
  const locale = profile?.preferredLanguage ?? "en"

  const [
    onboardingEyebrow,
    onboardingTitle,
    onboardingBody,
    onboardingLanguage,
    onboardingSubmit,
    onboardingSaving,
    chatEyebrow,
    chatSubtitle,
    chatPlaceholder,
    chatSkip,
    chatLoading,
    chatDone,
    chatError,
  ] = await Promise.all([
    localizedCopy("onboarding.eyebrow", locale),
    localizedCopy("onboarding.title", locale),
    localizedCopy("onboarding.body", locale),
    localizedCopy("onboarding.language", locale),
    localizedCopy("onboarding.submit", locale),
    localizedCopy("onboarding.saving", locale),
    localizedCopy("onboarding.chat.eyebrow", locale),
    localizedCopy("onboarding.chat.subtitle", locale),
    localizedCopy("onboarding.chat.placeholder", locale),
    localizedCopy("onboarding.chat.skip", locale),
    localizedCopy("onboarding.chat.loading", locale),
    localizedCopy("onboarding.chat.done", locale),
    localizedCopy("onboarding.chat.error", locale),
  ])

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl items-center justify-center">
        <OnboardingFlow
          initialStep={hasLanguage ? "chat" : "language"}
          defaultLanguage={profile?.preferredLanguage ?? "en"}
          userName={authUser.name}
          userEmail={authUser.email}
          uiText={{
            onboardingEyebrow,
            onboardingTitle,
            onboardingBody,
            onboardingLanguage,
            onboardingSubmit,
            onboardingSaving,
            chatEyebrow,
            chatSubtitle,
            chatPlaceholder,
            chatSkip,
            chatLoading,
            chatDone,
            chatError,
          }}
        />
      </div>
    </main>
  )
}
