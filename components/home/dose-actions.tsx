"use client"

import { IconCheck, IconClockPause, IconX } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"

export function DoseActions({
  eventId,
  disabled,
}: {
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
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
      <Button
        size="lg"
        className="w-full justify-center"
        onClick={() => save("taken")}
        disabled={disabled}
      >
        <IconCheck data-icon="inline-start" />
        Taken
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="w-full justify-center"
        onClick={() => save("snoozed")}
        disabled={disabled}
      >
        <IconClockPause data-icon="inline-start" />
        Snooze
      </Button>
      <Button
        size="lg"
        variant="ghost"
        className="w-full justify-center"
        onClick={() => save("skipped")}
        disabled={disabled}
      >
        <IconX data-icon="inline-start" />
        Skip
      </Button>
    </div>
  )
}
