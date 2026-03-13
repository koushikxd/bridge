"use client"

import { useState } from "react"

import { LanguageOnboardingForm } from "@/components/onboarding/language-onboarding-form"
import { MedicationOnboardingForm } from "@/components/onboarding/medication-onboarding-form"
import { OnboardingChat } from "@/components/onboarding/onboarding-chat"
import type { PreferredLanguage } from "@/lib/contracts/profile"

type OnboardingStep = "language" | "chat" | "medications"

export function OnboardingFlow({
  initialStep,
  defaultLanguage,
  userName,
  userEmail,
  uiText,
}: {
  initialStep: OnboardingStep
  defaultLanguage: PreferredLanguage
  userName: string
  userEmail: string
  uiText: {
    onboardingEyebrow: string
    onboardingTitle: string
    onboardingBody: string
    onboardingLanguage: string
    onboardingSubmit: string
    onboardingSaving: string
    chatEyebrow: string
    chatSubtitle: string
    chatPlaceholder: string
    chatSkip: string
    chatLoading: string
    chatDone: string
    chatError: string
    chatKickoff: string
    voiceListen: string
    voiceStopListening: string
    voiceMute: string
    voiceUnmute: string
    voiceSpeaking: string
    voiceUnsupported: string
    voicePermissionDenied: string
    voiceMicUnavailable: string
    medicationEyebrow: string
    medicationTitle: string
    medicationBody: string
    medicationAdd: string
    medicationAddTime: string
    medicationSave: string
    medicationSaving: string
    medicationSkip: string
    medicationName: string
    medicationDosage: string
    medicationPurpose: string
    medicationInstructions: string
    medicationDuration: string
    medicationTimes: string
    hasCaregiverLinks?: boolean
  }
}) {
  const [stepOverride, setStepOverride] = useState<OnboardingStep | null>(null)
  const [currentLanguage, setCurrentLanguage] =
    useState<PreferredLanguage>(defaultLanguage)
  const step = stepOverride ?? initialStep

  if (step === "language") {
    return (
      <div className="grid w-full gap-6 rounded-[2rem] border border-border bg-card p-8 text-card-foreground shadow-sm md:p-10">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            {uiText.onboardingEyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {uiText.onboardingTitle}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            {uiText.onboardingBody}
          </p>
        </div>

        <LanguageOnboardingForm
          defaultLanguage={defaultLanguage}
          userName={userName}
          userEmail={userEmail}
          uiText={{
            onboardingLanguage: uiText.onboardingLanguage,
            onboardingSubmit: uiText.onboardingSubmit,
            onboardingSaving: uiText.onboardingSaving,
            onboardingBody: uiText.onboardingBody,
          }}
          onComplete={(preferredLanguage) => {
            setCurrentLanguage(preferredLanguage)
            setStepOverride(
              uiText.hasCaregiverLinks ? "medications" : "chat"
            )
          }}
        />
      </div>
    )
  }

  if (uiText.hasCaregiverLinks) {
    return (
      <MedicationOnboardingForm
        isCaregiverShortcut
        uiText={{
          eyebrow: uiText.medicationEyebrow,
          title: uiText.medicationTitle,
          body: uiText.medicationBody,
          addMedicine: uiText.medicationAdd,
          addTime: uiText.medicationAddTime,
          save: uiText.medicationSave,
          saving: uiText.medicationSaving,
          skip: uiText.medicationSkip,
          medicineName: uiText.medicationName,
          dosage: uiText.medicationDosage,
          purpose: uiText.medicationPurpose,
          instructions: uiText.medicationInstructions,
          duration: uiText.medicationDuration,
          times: uiText.medicationTimes,
        }}
      />
    )
  }

  if (step === "chat") {
    return (
      <div className="flex h-[calc(100svh-5rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-border bg-card text-card-foreground shadow-sm">
        <OnboardingChat
          userName={userName}
          onComplete={() => setStepOverride("medications")}
          locale={currentLanguage}
          uiText={{
            chatEyebrow: uiText.chatEyebrow,
            chatSubtitle: uiText.chatSubtitle,
            chatPlaceholder: uiText.chatPlaceholder,
            chatSkip: uiText.chatSkip,
            chatLoading: uiText.chatLoading,
            chatDone: uiText.chatDone,
            chatError: uiText.chatError,
            chatKickoff: uiText.chatKickoff,
            voiceListen: uiText.voiceListen,
            voiceStopListening: uiText.voiceStopListening,
            voiceMute: uiText.voiceMute,
            voiceUnmute: uiText.voiceUnmute,
            voiceSpeaking: uiText.voiceSpeaking,
            voiceUnsupported: uiText.voiceUnsupported,
            voicePermissionDenied: uiText.voicePermissionDenied,
            voiceMicUnavailable: uiText.voiceMicUnavailable,
          }}
        />
      </div>
    )
  }

  return (
    <MedicationOnboardingForm
      uiText={{
        eyebrow: uiText.medicationEyebrow,
        title: uiText.medicationTitle,
        body: uiText.medicationBody,
        addMedicine: uiText.medicationAdd,
        addTime: uiText.medicationAddTime,
        save: uiText.medicationSave,
        saving: uiText.medicationSaving,
        skip: uiText.medicationSkip,
        medicineName: uiText.medicationName,
        dosage: uiText.medicationDosage,
        purpose: uiText.medicationPurpose,
        instructions: uiText.medicationInstructions,
        duration: uiText.medicationDuration,
        times: uiText.medicationTimes,
      }}
    />
  )
}
