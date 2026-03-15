"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  preferredLanguageLabels,
  type PreferredLanguage,
} from "@/lib/contracts/profile"

export function LocalizationSettingsCard({
  preferredLanguage,
  uiText,
}: {
  preferredLanguage: PreferredLanguage
  uiText: {
    eyebrow: string
    title: string
    body: string
    label: string
    helper: string
    save: string
    saving: string
    saved: string
    saveError: string
  }
}) {
  const router = useRouter()
  const updatePreferredLanguage = useMutation(
    api.profiles.updatePreferredLanguageFromSettings
  )
  const [nextLanguage, setNextLanguage] =
    useState<PreferredLanguage>(preferredLanguage)
  const [isPending, setIsPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSaved(false)
    setError(null)
    setIsPending(true)

    try {
      await updatePreferredLanguage({ preferredLanguage: nextLanguage })
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

        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span>{uiText.label}</span>
          <select
            value={nextLanguage}
            onChange={(event) =>
              setNextLanguage(event.target.value as PreferredLanguage)
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
            disabled={isPending || nextLanguage === preferredLanguage}
          >
            {isPending ? uiText.saving : uiText.save}
          </Button>
        </div>
      </div>
    </section>
  )
}
