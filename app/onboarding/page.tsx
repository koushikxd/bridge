import { OnboardingFlow } from "@/components/onboarding/onboarding-flow"
import { requirePendingOnboarding } from "@/lib/auth-guards"
import { localizedCopyMap } from "@/lib/copy"

export const metadata = {
  title: "Onboarding | Bridge",
  description: "Finish your Bridge profile and medicine setup.",
}

export default async function OnboardingPage() {
  const { authUser, profile, hasCaregiverLinks } =
    await requirePendingOnboarding()

  const hasLanguage = !!profile?.preferredLanguage
  const locale = profile?.preferredLanguage ?? "en"
  const initialStep =
    !profile || profile.onboardingStage === "language" || !hasLanguage
      ? "language"
      : hasCaregiverLinks
        ? "medications"
        : profile?.onboardingStage === "medications"
          ? "medications"
          : "chat"

  const copy = await localizedCopyMap(locale, [
    "onboarding.eyebrow",
    "onboarding.title",
    "onboarding.body",
    "onboarding.language",
    "onboarding.submit",
    "onboarding.saving",
    "onboarding.chat.eyebrow",
    "onboarding.chat.subtitle",
    "onboarding.chat.placeholder",
    "onboarding.chat.skip",
    "onboarding.chat.loading",
    "onboarding.chat.done",
    "onboarding.chat.error",
    "onboarding.chat.kickoff",
    "voice.listen",
    "voice.stopListening",
    "voice.mute",
    "voice.unmute",
    "voice.speaking",
    "voice.unsupported",
    "voice.permissionDenied",
    "voice.micUnavailable",
    "onboarding.medications.eyebrow",
    "onboarding.medications.title",
    "onboarding.medications.body",
    "onboarding.medications.add",
    "onboarding.medications.addTime",
    "onboarding.medications.save",
    "onboarding.medications.saving",
    "onboarding.medications.skip",
    "onboarding.medications.name",
    "onboarding.medications.dosage",
    "onboarding.medications.purpose",
    "onboarding.medications.instructions",
    "onboarding.medications.duration",
    "onboarding.medications.times",
  ] as const)

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100svh-5rem)] max-w-4xl items-center justify-center">
        <OnboardingFlow
          initialStep={initialStep}
          defaultLanguage={profile?.preferredLanguage ?? "en"}
          userName={authUser.name}
          userEmail={authUser.email}
          uiText={{
            onboardingEyebrow: copy["onboarding.eyebrow"],
            onboardingTitle: copy["onboarding.title"],
            onboardingBody: copy["onboarding.body"],
            onboardingLanguage: copy["onboarding.language"],
            onboardingSubmit: copy["onboarding.submit"],
            onboardingSaving: copy["onboarding.saving"],
            chatEyebrow: copy["onboarding.chat.eyebrow"],
            chatSubtitle: copy["onboarding.chat.subtitle"],
            chatPlaceholder: copy["onboarding.chat.placeholder"],
            chatSkip: copy["onboarding.chat.skip"],
            chatLoading: copy["onboarding.chat.loading"],
            chatDone: copy["onboarding.chat.done"],
            chatError: copy["onboarding.chat.error"],
            chatKickoff: copy["onboarding.chat.kickoff"],
            voiceListen: copy["voice.listen"],
            voiceStopListening: copy["voice.stopListening"],
            voiceMute: copy["voice.mute"],
            voiceUnmute: copy["voice.unmute"],
            voiceSpeaking: copy["voice.speaking"],
            voiceUnsupported: copy["voice.unsupported"],
            voicePermissionDenied: copy["voice.permissionDenied"],
            voiceMicUnavailable: copy["voice.micUnavailable"],
            medicationEyebrow: copy["onboarding.medications.eyebrow"],
            medicationTitle: copy["onboarding.medications.title"],
            medicationBody: copy["onboarding.medications.body"],
            medicationAdd: copy["onboarding.medications.add"],
            medicationAddTime: copy["onboarding.medications.addTime"],
            medicationSave: copy["onboarding.medications.save"],
            medicationSaving: copy["onboarding.medications.saving"],
            medicationSkip: copy["onboarding.medications.skip"],
            medicationName: copy["onboarding.medications.name"],
            medicationDosage: copy["onboarding.medications.dosage"],
            medicationPurpose: copy["onboarding.medications.purpose"],
            medicationInstructions:
              copy["onboarding.medications.instructions"],
            medicationDuration: copy["onboarding.medications.duration"],
            medicationTimes: copy["onboarding.medications.times"],
            hasCaregiverLinks,
          }}
        />
      </div>
    </main>
  )
}
