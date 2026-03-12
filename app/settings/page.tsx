import Link from "next/link"

import { CompletedOnboardingExtras } from "@/components/app-shell/completed-onboarding-extras"
import { ReminderPreferencesCard } from "@/components/reminders/reminder-preferences-card"
import { MedicineSettingsForm } from "@/components/settings/medicine-settings-form"
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form"
import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopyMap } from "@/lib/copy"

type ProfileSettingsText = Parameters<typeof ProfileSettingsForm>[0]["uiText"]
type MedicineSettingsText = Parameters<typeof MedicineSettingsForm>[0]["uiText"]
type ReminderSettingsText = Parameters<
  typeof ReminderPreferencesCard
>[0]["uiText"]

export const metadata = {
  title: "Settings | Bridge",
  description: "Edit your Bridge profile and tracked medicines.",
}

export default async function SettingsPage() {
  const { profile } = await requireAuthenticatedUser()
  const locale = profile?.preferredLanguage ?? "en"
  const [settingsData, copy] = await Promise.all([
    profile ? fetchAuthQuery(api.medications.getSettingsData, {}) : null,
    localizedCopyMap(locale, [
      "settings.eyebrow",
      "settings.title",
      "settings.body",
      "settings.backHome",
      "settings.quick.backBody",
      "settings.continueOnboardingTitle",
      "settings.continueOnboardingBody",
      "settings.profile.eyebrow",
      "settings.profile.title",
      "settings.profile.body",
      "settings.profile.save",
      "settings.profile.saved",
      "settings.profile.helper",
      "settings.profile.language",
      "settings.profile.age",
      "settings.profile.allergies",
      "settings.profile.conditions",
      "settings.profile.restrictions",
      "settings.profile.dietaryRestrictions",
      "settings.profile.religiousRestrictions",
      "settings.profile.notes",
      "settings.profile.notesPlaceholder",
      "settings.profile.allergiesPlaceholder",
      "settings.profile.conditionsPlaceholder",
      "settings.profile.dietaryPlaceholder",
      "settings.profile.religiousPlaceholder",
      "settings.profile.saveError",
      "settings.medicines.eyebrow",
      "settings.medicines.title",
      "settings.medicines.body",
      "settings.medicines.add",
      "settings.medicines.addTime",
      "settings.medicines.save",
      "settings.medicines.saved",
      "settings.medicines.tracked",
      "settings.medicines.active",
      "settings.medicines.dailyDoses",
      "settings.medicines.activeHome",
      "settings.medicines.pausedHome",
      "settings.medicines.remove",
      "settings.medicines.name",
      "onboarding.medications.dosage",
      "onboarding.medications.purpose",
      "settings.medicines.instructions",
      "settings.medicines.times",
      "settings.medicines.activeToggle",
      "settings.medicines.duration",
      "settings.medicines.saveError",
      "settings.medicines.saving",
      "settings.reminders.eyebrow",
      "settings.reminders.title",
      "settings.reminders.body",
      "settings.reminders.toggleTitle",
      "settings.reminders.toggleBody",
      "settings.reminders.toggleLabel",
      "settings.reminders.detectedTimezone",
      "settings.reminders.savedTimezone",
      "settings.reminders.save",
      "settings.reminders.saved",
      "settings.reminders.helper",
      "settings.reminders.permissionTitle",
      "settings.reminders.permissionReady",
      "settings.reminders.permissionPrompt",
      "settings.reminders.permissionDenied",
      "settings.reminders.permissionUnsupported",
      "settings.reminders.enableAction",
      "onboarding.saving",
    ] as const),
  ])

  const settingsEyebrow = copy["settings.eyebrow"]
  const settingsTitle = copy["settings.title"]
  const settingsBody = copy["settings.body"]
  const settingsBackHome = copy["settings.backHome"]
  const settingsQuickBackBody = copy["settings.quick.backBody"]
  const settingsContinueOnboardingTitle =
    copy["settings.continueOnboardingTitle"]
  const settingsContinueOnboardingBody =
    copy["settings.continueOnboardingBody"]
  const profileEyebrow = copy["settings.profile.eyebrow"]
  const profileTitle = copy["settings.profile.title"]
  const profileBody = copy["settings.profile.body"]
  const profileSave = copy["settings.profile.save"]
  const profileSaved = copy["settings.profile.saved"]
  const profileHelper = copy["settings.profile.helper"]
  const profileLanguage = copy["settings.profile.language"]
  const profileAge = copy["settings.profile.age"]
  const profileAllergies = copy["settings.profile.allergies"]
  const profileConditions = copy["settings.profile.conditions"]
  const profileRestrictions = copy["settings.profile.restrictions"]
  const profileDietaryRestrictions =
    copy["settings.profile.dietaryRestrictions"]
  const profileReligiousRestrictions =
    copy["settings.profile.religiousRestrictions"]
  const profileNotes = copy["settings.profile.notes"]
  const profileNotesPlaceholder = copy["settings.profile.notesPlaceholder"]
  const profileAllergiesPlaceholder =
    copy["settings.profile.allergiesPlaceholder"]
  const profileConditionsPlaceholder =
    copy["settings.profile.conditionsPlaceholder"]
  const profileDietaryPlaceholder = copy["settings.profile.dietaryPlaceholder"]
  const profileReligiousPlaceholder =
    copy["settings.profile.religiousPlaceholder"]
  const profileSaveError = copy["settings.profile.saveError"]
  const medicinesEyebrow = copy["settings.medicines.eyebrow"]
  const medicinesTitle = copy["settings.medicines.title"]
  const medicinesBody = copy["settings.medicines.body"]
  const medicinesAdd = copy["settings.medicines.add"]
  const medicinesAddTime = copy["settings.medicines.addTime"]
  const medicinesSave = copy["settings.medicines.save"]
  const medicinesSaved = copy["settings.medicines.saved"]
  const medicinesTracked = copy["settings.medicines.tracked"]
  const medicinesActive = copy["settings.medicines.active"]
  const medicinesDailyDoses = copy["settings.medicines.dailyDoses"]
  const medicinesActiveHome = copy["settings.medicines.activeHome"]
  const medicinesPausedHome = copy["settings.medicines.pausedHome"]
  const medicinesRemove = copy["settings.medicines.remove"]
  const medicinesName = copy["settings.medicines.name"]
  const medicinesDosage = copy["onboarding.medications.dosage"]
  const medicinesPurpose = copy["onboarding.medications.purpose"]
  const medicinesInstructions = copy["settings.medicines.instructions"]
  const medicinesTimes = copy["settings.medicines.times"]
  const medicinesActiveToggle = copy["settings.medicines.activeToggle"]
  const medicinesDuration = copy["settings.medicines.duration"]
  const medicinesSaveError = copy["settings.medicines.saveError"]
  const medicinesSaving = copy["settings.medicines.saving"]
  const remindersEyebrow = copy["settings.reminders.eyebrow"]
  const remindersTitle = copy["settings.reminders.title"]
  const remindersBody = copy["settings.reminders.body"]
  const remindersToggleTitle = copy["settings.reminders.toggleTitle"]
  const remindersToggleBody = copy["settings.reminders.toggleBody"]
  const remindersToggleLabel = copy["settings.reminders.toggleLabel"]
  const remindersDetectedTimezone = copy["settings.reminders.detectedTimezone"]
  const remindersSavedTimezone = copy["settings.reminders.savedTimezone"]
  const remindersSave = copy["settings.reminders.save"]
  const remindersSaved = copy["settings.reminders.saved"]
  const remindersHelper = copy["settings.reminders.helper"]
  const remindersPermissionTitle = copy["settings.reminders.permissionTitle"]
  const remindersPermissionReady = copy["settings.reminders.permissionReady"]
  const remindersPermissionPrompt = copy["settings.reminders.permissionPrompt"]
  const remindersPermissionDenied = copy["settings.reminders.permissionDenied"]
  const remindersPermissionUnsupported =
    copy["settings.reminders.permissionUnsupported"]
  const remindersEnableAction = copy["settings.reminders.enableAction"]
  const onboardingSaving = copy["onboarding.saving"]

  const profileUiText: ProfileSettingsText = {
    eyebrow: profileEyebrow,
    title: profileTitle,
    body: profileBody,
    save: profileSave,
    saving: onboardingSaving,
    saved: profileSaved,
    helper: profileHelper,
    language: profileLanguage,
    age: profileAge,
    allergies: profileAllergies,
    conditions: profileConditions,
    restrictions: profileRestrictions,
    dietaryRestrictions: profileDietaryRestrictions,
    religiousRestrictions: profileReligiousRestrictions,
    notes: profileNotes,
    notesPlaceholder: profileNotesPlaceholder,
    allergiesPlaceholder: profileAllergiesPlaceholder,
    conditionsPlaceholder: profileConditionsPlaceholder,
    dietaryPlaceholder: profileDietaryPlaceholder,
    religiousPlaceholder: profileReligiousPlaceholder,
    saveError: profileSaveError,
  }

  const medicineUiText: MedicineSettingsText = {
    eyebrow: medicinesEyebrow,
    title: medicinesTitle,
    body: medicinesBody,
    add: medicinesAdd,
    addTime: medicinesAddTime,
    save: medicinesSave,
    saved: medicinesSaved,
    tracked: medicinesTracked,
    active: medicinesActive,
    dailyDoses: medicinesDailyDoses,
    activeHome: medicinesActiveHome,
    pausedHome: medicinesPausedHome,
    remove: medicinesRemove,
    name: medicinesName,
    dosage: medicinesDosage,
    purpose: medicinesPurpose,
    instructions: medicinesInstructions,
    times: medicinesTimes,
    activeToggle: medicinesActiveToggle,
    duration: medicinesDuration,
    saveError: medicinesSaveError,
    saving: medicinesSaving,
  }

  const reminderUiText: ReminderSettingsText = {
    eyebrow: remindersEyebrow,
    title: remindersTitle,
    body: remindersBody,
    toggleTitle: remindersToggleTitle,
    toggleBody: remindersToggleBody,
    toggleLabel: remindersToggleLabel,
    detectedTimezone: remindersDetectedTimezone,
    savedTimezone: remindersSavedTimezone,
    saved: remindersSaved,
    helper: remindersHelper,
    save: remindersSave,
    saving: onboardingSaving,
    permissionTitle: remindersPermissionTitle,
    permissionReady: remindersPermissionReady,
    permissionPrompt: remindersPermissionPrompt,
    permissionDenied: remindersPermissionDenied,
    permissionUnsupported: remindersPermissionUnsupported,
    enableAction: remindersEnableAction,
  }

  return (
    <main className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8">
      {profile?.onboardingCompleted ? (
        <CompletedOnboardingExtras includeReminders />
      ) : null}
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[1.75rem] border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
                {settingsEyebrow}
              </p>
              <h1 className="mt-2 text-[2rem] font-semibold tracking-tight sm:text-[2.4rem]">
                {settingsTitle}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[0.98rem]">
                {settingsBody}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
              {!settingsData?.profile.onboardingCompleted ? (
                <HeaderAction
                  href="/onboarding"
                  title={settingsContinueOnboardingTitle}
                  body={settingsContinueOnboardingBody}
                />
              ) : null}
              <HeaderAction
                href="/"
                title={settingsBackHome}
                body={settingsQuickBackBody}
              />
            </div>
          </div>
        </section>

        {!settingsData?.profile.onboardingCompleted ? (
          <section className="rounded-[1.25rem] border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground">
            {settingsContinueOnboardingBody}
          </section>
        ) : null}

        {settingsData ? (
          <>
            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <ProfileSettingsForm
                profile={settingsData.profile}
                uiText={profileUiText}
              />
              <MedicineSettingsForm
                medicines={settingsData.medicines}
                reminderPreferences={settingsData.reminderPreferences}
                uiText={medicineUiText}
              />
            </div>

            <ReminderPreferencesCard
              reminderPreferences={settingsData.reminderPreferences}
              uiText={reminderUiText}
            />
          </>
        ) : (
          <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">
              {settingsContinueOnboardingBody}
            </p>
          </section>
        )}
      </div>
    </main>
  )
}

function HeaderAction({
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
      className="rounded-[1.1rem] border border-border bg-background/70 px-4 py-3 transition hover:border-primary/30 hover:bg-background sm:min-w-52"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{body}</p>
    </Link>
  )
}
