"use client"

import { IconCheck, IconClockPause, IconX } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"

export function DoseActions({
  labels,
  eventId,
  disabled,
}: {
  labels: {
    skip: string
    snooze: string
    taken: string
  }
  eventId: string
  disabled: boolean
}) {
  const router = useRouter()
  const logDoseEvent = useMutation(api.medications.logDoseEvent)

  async function save(type: "taken" | "skipped" | "snoozed") {
    await logDoseEvent({
      eventId: eventId as never,
      eventType: type,
    })
    router.refresh()
  }

  return (
    <div className="flex flex-wrap gap-2 lg:justify-end">
      <Button
        size="lg"
        className="min-w-28 justify-center"
        onClick={() => save("taken")}
        disabled={disabled}
      >
        <IconCheck data-icon="inline-start" />
        {labels.taken}
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="min-w-28 justify-center"
        onClick={() => save("snoozed")}
        disabled={disabled}
      >
        <IconClockPause data-icon="inline-start" />
        {labels.snooze}
      </Button>
      <Button
        size="lg"
        variant="ghost"
        className="min-w-24 justify-center"
        onClick={() => save("skipped")}
        disabled={disabled}
      >
        <IconX data-icon="inline-start" />
        {labels.skip}
      </Button>
    </div>
  )
}
