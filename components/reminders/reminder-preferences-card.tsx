"use client"

import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { api } from "@/convex/_generated/api"
import {
  reminderPreferencesSchema,
  type ReminderPreferencesInput,
} from "@/lib/contracts/medication"
import { getBrowserTimeZone } from "@/lib/time"

export function ReminderPreferencesCard({
  reminderPreferences,
  uiText,
}: {
  reminderPreferences: ReminderPreferencesInput
  uiText: {
    eyebrow: string
    title: string
    body: string
    toggleTitle: string
    toggleBody: string
    toggleLabel: string
    detectedTimezone: string
    savedTimezone: string
    saved: string
    helper: string
    save: string
    saving: string
    permissionTitle: string
    permissionReady: string
    permissionPrompt: string
    permissionDenied: string
    permissionUnsupported: string
    enableAction: string
  }
}) {
  const router = useRouter()
  const updateReminderPreferences = useMutation(
    api.medications.updateReminderPreferences
  )
  const [enabled, setEnabled] = useState(reminderPreferences.enabled)
  const [isPending, setIsPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | null>(
    typeof Notification === "undefined" ? null : Notification.permission
  )

  const currentTimeZone = useMemo(() => getBrowserTimeZone(), [])

  async function requestPermission() {
    if (typeof Notification === "undefined") {
      setPermission(null)
      return
    }

    const nextPermission = await Notification.requestPermission()
    setPermission(nextPermission)
  }

  async function handleSave() {
    setSaved(false)
    setError(null)
    setIsPending(true)

    try {
      const payload = reminderPreferencesSchema.parse({
        enabled,
        timezone: currentTimeZone,
      })

      await updateReminderPreferences(payload)
      setSaved(true)
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save reminder settings."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-5">
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

        <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {uiText.permissionTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {typeof Notification === "undefined"
                  ? uiText.permissionUnsupported
                  : permission === "granted"
                    ? uiText.permissionReady
                    : permission === "denied"
                      ? uiText.permissionDenied
                      : uiText.permissionPrompt}
              </p>
            </div>
            {typeof Notification !== "undefined" && permission === "default" ? (
              <Button
                type="button"
                variant="outline"
                onClick={requestPermission}
              >
                {uiText.enableAction}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {uiText.toggleTitle}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {uiText.toggleBody}
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label={uiText.toggleLabel}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoCard label={uiText.detectedTimezone} value={currentTimeZone} />
          <InfoCard
            label={uiText.savedTimezone}
            value={reminderPreferences.timezone}
          />
        </div>

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
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? uiText.saving : uiText.save}
          </Button>
        </div>
      </div>
    </section>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold break-all text-foreground">
        {value}
      </p>
    </div>
  )
}
