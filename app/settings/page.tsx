import Link from "next/link"

import { MedicineSettingsForm } from "@/components/settings/medicine-settings-form"
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form"
import { ReminderPreferencesCard } from "@/components/reminders/reminder-preferences-card"
import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"
import { localizedCopy } from "@/lib/copy"

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
  const settingsData = profile
    ? await fetchAuthQuery(api.medications.getSettingsData, {})
    : null

  const [
    settingsEyebrow,
    settingsTitle,
    settingsBody,
    settingsBackHome,
    settingsQuickBackBody,
    profileEyebrow,
    profileTitle,
    profileBody,
    profileSave,
    profileSaved,
    profileHelper,
    profileLanguage,
    profileAge,
    profileAllergies,
    profileConditions,
    profileRestrictions,
    profileDietaryRestrictions,
    profileReligiousRestrictions,
    profileNotes,
    profileNotesPlaceholder,
    profileAllergiesPlaceholder,
    profileConditionsPlaceholder,
    profileDietaryPlaceholder,
    profileReligiousPlaceholder,
    profileSaveError,
    medicinesEyebrow,
    medicinesTitle,
    medicinesBody,
    medicinesAdd,
    medicinesAddTime,
    medicinesSave,
    medicinesSaved,
    medicinesTracked,
    medicinesActive,
    medicinesDailyDoses,
    medicinesActiveHome,
    medicinesPausedHome,
    medicinesRemove,
    medicinesName,
    medicinesDosage,
    medicinesPurpose,
    medicinesInstructions,
    medicinesTimes,
    medicinesActiveToggle,
    medicinesDuration,
    medicinesSaveError,
    medicinesSaving,
    remindersEyebrow,
    remindersTitle,
    remindersBody,
    remindersToggleTitle,
    remindersToggleBody,
    remindersToggleLabel,
    remindersDetectedTimezone,
    remindersSavedTimezone,
    remindersSave,
    remindersSaved,
    remindersHelper,
    remindersPermissionTitle,
    remindersPermissionReady,
    remindersPermissionPrompt,
    remindersPermissionDenied,
    remindersPermissionUnsupported,
    remindersEnableAction,
    onboardingSaving,
  ] = await Promise.all([
    localizedCopy("settings.eyebrow", locale),
    localizedCopy("settings.title", locale),
    localizedCopy("settings.body", locale),
    localizedCopy("settings.backHome", locale),
    localizedCopy("settings.quick.backBody", locale),
    localizedCopy("settings.profile.eyebrow", locale),
    localizedCopy("settings.profile.title", locale),
    localizedCopy("settings.profile.body", locale),
    localizedCopy("settings.profile.save", locale),
    localizedCopy("settings.profile.saved", locale),
    localizedCopy("settings.profile.helper", locale),
    localizedCopy("settings.profile.language", locale),
    localizedCopy("settings.profile.age", locale),
    localizedCopy("settings.profile.allergies", locale),
    localizedCopy("settings.profile.conditions", locale),
    localizedCopy("settings.profile.restrictions", locale),
    localizedCopy("settings.profile.dietaryRestrictions", locale),
    localizedCopy("settings.profile.religiousRestrictions", locale),
    localizedCopy("settings.profile.notes", locale),
    localizedCopy("settings.profile.notesPlaceholder", locale),
    localizedCopy("settings.profile.allergiesPlaceholder", locale),
    localizedCopy("settings.profile.conditionsPlaceholder", locale),
    localizedCopy("settings.profile.dietaryPlaceholder", locale),
    localizedCopy("settings.profile.religiousPlaceholder", locale),
    localizedCopy("settings.profile.saveError", locale),
    localizedCopy("settings.medicines.eyebrow", locale),
    localizedCopy("settings.medicines.title", locale),
    localizedCopy("settings.medicines.body", locale),
    localizedCopy("settings.medicines.add", locale),
    localizedCopy("settings.medicines.addTime", locale),
    localizedCopy("settings.medicines.save", locale),
    localizedCopy("settings.medicines.saved", locale),
    localizedCopy("settings.medicines.tracked", locale),
    localizedCopy("settings.medicines.active", locale),
    localizedCopy("settings.medicines.dailyDoses", locale),
    localizedCopy("settings.medicines.activeHome", locale),
    localizedCopy("settings.medicines.pausedHome", locale),
    localizedCopy("settings.medicines.remove", locale),
    localizedCopy("settings.medicines.name", locale),
    localizedCopy("onboarding.medications.dosage", locale),
    localizedCopy("onboarding.medications.purpose", locale),
    localizedCopy("settings.medicines.instructions", locale),
    localizedCopy("settings.medicines.times", locale),
    localizedCopy("settings.medicines.activeToggle", locale),
    localizedCopy("settings.medicines.duration", locale),
    localizedCopy("settings.medicines.saveError", locale),
    localizedCopy("settings.medicines.saving", locale),
    localizedCopy("settings.reminders.eyebrow", locale),
    localizedCopy("settings.reminders.title", locale),
    localizedCopy("settings.reminders.body", locale),
    localizedCopy("settings.reminders.toggleTitle", locale),
    localizedCopy("settings.reminders.toggleBody", locale),
    localizedCopy("settings.reminders.toggleLabel", locale),
    localizedCopy("settings.reminders.detectedTimezone", locale),
    localizedCopy("settings.reminders.savedTimezone", locale),
    localizedCopy("settings.reminders.save", locale),
    localizedCopy("settings.reminders.saved", locale),
    localizedCopy("settings.reminders.helper", locale),
    localizedCopy("settings.reminders.permissionTitle", locale),
    localizedCopy("settings.reminders.permissionReady", locale),
    localizedCopy("settings.reminders.permissionPrompt", locale),
    localizedCopy("settings.reminders.permissionDenied", locale),
    localizedCopy("settings.reminders.permissionUnsupported", locale),
    localizedCopy("settings.reminders.enableAction", locale),
    localizedCopy("onboarding.saving", locale),
  ])

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
    <main className="min-h-svh bg-background px-6 py-8 md:py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)] lg:items-start">
            <div className="min-w-0">
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
              {!settingsData?.profile.onboardingCompleted ? (
                <QuickLink
                  href="/onboarding"
                  title="Complete onboarding"
                  body="Finish your Bridge setup or add your own medicines later."
                />
              ) : null}
              <QuickLink
                href="/"
                title={settingsBackHome}
                body={settingsQuickBackBody}
              />
            </div>
          </div>
        </section>

        {!settingsData?.profile.onboardingCompleted ? (
          <section className="rounded-[1.75rem] border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-foreground">
            Complete onboarding flow to create your own Bridge assistance and
            tracking.
          </section>
        ) : null}

        {settingsData ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
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
          <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Start onboarding to create your Bridge profile before editing
              settings.
            </p>
          </section>
        )}
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
