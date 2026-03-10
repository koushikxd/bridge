"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  preferredLanguageLabels,
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

export function ProfileSettingsForm({ profile }: { profile: SettingsProfile }) {
  const router = useRouter()
  const updateProfileSettings = useMutation(api.profiles.updateProfileSettings)
  const [form, setForm] = useState(() => ({
    preferredLanguage: profile.preferredLanguage,
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
      preferredLanguage: form.preferredLanguage,
      age: form.age ? Number(form.age) : null,
      allergies: stringList(form.allergies),
      chronicConditions: stringList(form.chronicConditions),
      dietaryRestrictions: stringList(form.dietaryRestrictions),
      religiousRestrictions: stringList(form.religiousRestrictions),
      emergencyNotes: form.emergencyNotes.trim() || null,
    }),
    [form]
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
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save profile settings."
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
            Profile info
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Review what Bridge knows about you
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Update the health details collected during onboarding so future
            analysis stays relevant.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Allergies" value={normalized.allergies.length} />
          <StatCard
            label="Conditions"
            value={normalized.chronicConditions.length}
          />
          <StatCard
            label="Restrictions"
            value={
              normalized.dietaryRestrictions.length +
              normalized.religiousRestrictions.length
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span>Preferred language</span>
            <select
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  preferredLanguage: event.target.value as PreferredLanguage,
                }))
              }
              className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              {Object.entries(preferredLanguageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span>Age</span>
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
            label="Allergies"
            value={form.allergies}
            onChange={(value) =>
              setForm((current) => ({ ...current, allergies: value }))
            }
            placeholder="Peanuts, penicillin"
          />
          <SettingsInput
            label="Chronic conditions"
            value={form.chronicConditions}
            onChange={(value) =>
              setForm((current) => ({ ...current, chronicConditions: value }))
            }
            placeholder="Diabetes, asthma"
          />
          <SettingsInput
            label="Dietary restrictions"
            value={form.dietaryRestrictions}
            onChange={(value) =>
              setForm((current) => ({ ...current, dietaryRestrictions: value }))
            }
            placeholder="Vegetarian, low sodium"
          />
          <SettingsInput
            label="Religious restrictions"
            value={form.religiousRestrictions}
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                religiousRestrictions: value,
              }))
            }
            placeholder="Halal, fasting"
          />
        </div>

        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span>Emergency notes</span>
          <textarea
            value={form.emergencyNotes}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                emergencyNotes: event.target.value,
              }))
            }
            className="min-h-28 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Any extra details Bridge should remember"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-h-5 text-sm text-muted-foreground">
            {saved ? (
              "Profile saved."
            ) : error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              "Use commas to separate multiple items."
            )}
          </div>
          <Button
            type="button"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save profile"}
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
