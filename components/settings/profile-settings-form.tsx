"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  profileSettingsSchema,
  type PreferredLanguage,
  type ProfileSettingsForm as ProfileSettingsPayload,
} from "@/lib/contracts/profile"

function stringList(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
}

type SettingsProfile = {
  preferredLanguage: PreferredLanguage
  age?: number
  allergies?: string[]
  chronicConditions?: string[]
  dietaryRestrictions?: string[]
  religiousRestrictions?: string[]
  emergencyNotes?: string
}

export function ProfileSettingsForm({
  profile,
  uiText,
}: {
  profile: SettingsProfile
  uiText: {
    eyebrow: string
    title: string
    body: string
    save: string
    saving: string
    saved: string
    helper: string
    age: string
    allergies: string
    conditions: string
    restrictions: string
    dietaryRestrictions: string
    religiousRestrictions: string
    notes: string
    notesPlaceholder: string
    allergiesPlaceholder: string
    conditionsPlaceholder: string
    dietaryPlaceholder: string
    religiousPlaceholder: string
    saveError: string
  }
}) {
  const router = useRouter()
  const updateProfileSettings = useMutation(api.profiles.updateProfileSettings)
  const [form, setForm] = useState(() => ({
    age: profile.age?.toString() ?? "",
    allergies: (profile.allergies ?? []).join(", "),
    chronicConditions: (profile.chronicConditions ?? []).join(", "),
    dietaryRestrictions: (profile.dietaryRestrictions ?? []).join(", "),
    religiousRestrictions: (profile.religiousRestrictions ?? []).join(", "),
    emergencyNotes: profile.emergencyNotes ?? "",
  }))
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const normalized = useMemo<ProfileSettingsPayload>(
    () => ({
      preferredLanguage: profile.preferredLanguage,
      age: form.age ? Number(form.age) : null,
      allergies: stringList(form.allergies),
      chronicConditions: stringList(form.chronicConditions),
      dietaryRestrictions: stringList(form.dietaryRestrictions),
      religiousRestrictions: stringList(form.religiousRestrictions),
      emergencyNotes: form.emergencyNotes.trim() || null,
    }),
    [form, profile.preferredLanguage]
  )

  async function handleSubmit() {
    setSaved(false)
    setError(null)
    setIsPending(true)

    try {
      const parsed = profileSettingsSchema.parse(normalized)
      await updateProfileSettings(parsed)
      setSaved(true)
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : uiText.saveError
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            {uiText.eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {uiText.title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {uiText.body}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label={uiText.allergies}
            value={normalized.allergies.length}
          />
          <StatCard
            label={uiText.conditions}
            value={normalized.chronicConditions.length}
          />
          <StatCard
            label={uiText.restrictions}
            value={
              normalized.dietaryRestrictions.length +
              normalized.religiousRestrictions.length
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span>{uiText.age}</span>
            <input
              type="number"
              min={1}
              max={150}
              value={form.age}
              onChange={(event) =>
                setForm((current) => ({ ...current, age: event.target.value }))
              }
              className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SettingsInput
            label={uiText.allergies}
            value={form.allergies}
            onChange={(value) =>
              setForm((current) => ({ ...current, allergies: value }))
            }
            placeholder={uiText.allergiesPlaceholder}
          />
          <SettingsInput
            label={uiText.conditions}
            value={form.chronicConditions}
            onChange={(value) =>
              setForm((current) => ({ ...current, chronicConditions: value }))
            }
            placeholder={uiText.conditionsPlaceholder}
          />
          <SettingsInput
            label={uiText.dietaryRestrictions}
            value={form.dietaryRestrictions}
            onChange={(value) =>
              setForm((current) => ({ ...current, dietaryRestrictions: value }))
            }
            placeholder={uiText.dietaryPlaceholder}
          />
          <SettingsInput
            label={uiText.religiousRestrictions}
            value={form.religiousRestrictions}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                religiousRestrictions: value,
              }))
            }
            placeholder={uiText.religiousPlaceholder}
          />
        </div>

        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span>{uiText.notes}</span>
          <textarea
            value={form.emergencyNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                emergencyNotes: event.target.value,
              }))
            }
            className="min-h-28 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder={uiText.notesPlaceholder}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm text-muted-foreground">
            {saved ? (
              uiText.saved
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              uiText.helper
            )}
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? uiText.saving : uiText.save}
          </Button>
        </div>
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        placeholder={placeholder}
      />
    </label>
  )
}
