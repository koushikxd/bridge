import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { requirePendingOnboarding } from "@/lib/auth-guards"
import { localizedCopy } from "@/lib/copy"

export const metadata = {
  title: "Onboarding | Bridge",
  description: "Finish your Bridge profile and medicine setup.",
}

export default async function OnboardingPage() {
  const { authUser, profile } = await requirePendingOnboarding()

  const hasLanguage = !!profile?.preferredLanguage
  const locale = profile?.preferredLanguage ?? "en"
  const initialStep = !hasLanguage
    ? "language"
    : profile?.onboardingStage === "medications"
      ? "medications"
      : "chat"

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
    chatKickoff,
    medicationEyebrow,
    medicationTitle,
    medicationBody,
    medicationAdd,
    medicationAddTime,
    medicationSave,
    medicationSaving,
    medicationSkip,
    medicationName,
    medicationDosage,
    medicationPurpose,
    medicationInstructions,
    medicationDuration,
    medicationTimes,
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
    localizedCopy("onboarding.chat.kickoff", locale),
    localizedCopy("onboarding.medications.eyebrow", locale),
    localizedCopy("onboarding.medications.title", locale),
    localizedCopy("onboarding.medications.body", locale),
    localizedCopy("onboarding.medications.add", locale),
    localizedCopy("onboarding.medications.addTime", locale),
    localizedCopy("onboarding.medications.save", locale),
    localizedCopy("onboarding.medications.saving", locale),
    localizedCopy("onboarding.medications.skip", locale),
    localizedCopy("onboarding.medications.name", locale),
    localizedCopy("onboarding.medications.dosage", locale),
    localizedCopy("onboarding.medications.purpose", locale),
    localizedCopy("onboarding.medications.instructions", locale),
    localizedCopy("onboarding.medications.duration", locale),
    localizedCopy("onboarding.medications.times", locale),
  ])

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl items-center justify-center">
        <OnboardingFlow
          initialStep={initialStep}
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
            chatKickoff,
            medicationEyebrow,
            medicationTitle,
            medicationBody,
            medicationAdd,
            medicationAddTime,
            medicationSave,
            medicationSaving,
            medicationSkip,
            medicationName,
            medicationDosage,
            medicationPurpose,
            medicationInstructions,
            medicationDuration,
            medicationTimes,
          }}
        />
      </div>
    </main>
  )
}
