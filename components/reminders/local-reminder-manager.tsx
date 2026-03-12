"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import { copy } from "@/lib/copy"
import { formatTimestampInTimeZone, getBrowserTimeZone } from "@/lib/time"

const LOOKAHEAD_WINDOW_MS = 60 * 60 * 1000
const CHECK_INTERVAL_MS = 30 * 1000

type ReminderHomeData = {
  locale: string
  reminderPreferences: {
    enabled: boolean
    timezone: string
  }
  todayDoses: Array<{
    _id: string
    dueAt: number
    eventType:
      | "scheduled"
      | "reminded"
      | "taken"
      | "skipped"
      | "missed"
      | "snoozed"
    medicineName: string
    dosage: string | null
  }>
}

export function LocalReminderManager() {
  const [homeData, setHomeData] = useState<ReminderHomeData | null>(null)
  const [permission, setPermission] = useState<NotificationPermission | null>(
    typeof Notification === "undefined" ? null : Notification.permission
  )
  const firedEventIdsRef = useRef<Set<string>>(new Set())
  const browserTimeZone = useMemo(() => getBrowserTimeZone(), [])
  const remindersEnabled = homeData?.reminderPreferences.enabled ?? false
  const canPoll =
    remindersEnabled &&
    permission === "granted" &&
    typeof document !== "undefined" &&
    document.visibilityState === "visible"

  useEffect(() => {
    let cancelled = false

    async function loadHomeData() {
      const response = await fetch("/api/reminders/local", {
        cache: "no-store",
      })

      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as ReminderHomeData

      if (!cancelled) {
        setHomeData(payload)
      }
    }

    void loadHomeData()

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadHomeData()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (!canPoll) {
      return
    }

    const refreshId = window.setInterval(() => {
      void fetch("/api/reminders/local", { cache: "no-store" })
        .then((response) => {
          if (!response.ok) {
            return null
          }

          return response.json() as Promise<ReminderHomeData>
        })
        .then((payload) => {
          if (payload) {
            setHomeData(payload)
          }
        })
        .catch(() => undefined)
    }, CHECK_INTERVAL_MS)

    return () => {
      window.clearInterval(refreshId)
    }
  }, [canPoll])

  useEffect(() => {
    if (
      !remindersEnabled ||
      !("Notification" in window) ||
      Notification.permission !== "default"
    ) {
      return
    }

    let cancelled = false

    async function requestPermission() {
      const nextPermission = await Notification.requestPermission()

      if (!cancelled) {
        setPermission(nextPermission)
      }
    }

    void requestPermission()

    return () => {
      cancelled = true
    }
  }, [remindersEnabled])

  useEffect(() => {
    if (
      !homeData ||
      !remindersEnabled ||
      !("Notification" in window) ||
      permission !== "granted" ||
      !("serviceWorker" in navigator) ||
      document.visibilityState !== "visible"
    ) {
      return
    }

    let cancelled = false
    const todayDoses = homeData.todayDoses

    async function tick() {
      const registration = await navigator.serviceWorker.ready
      const now = Date.now()
      const dueSoon = todayDoses.filter((dose) => {
        if (dose.eventType !== "scheduled") {
          return false
        }

        if (dose.dueAt < now || dose.dueAt > now + LOOKAHEAD_WINDOW_MS) {
          return false
        }

        return !firedEventIdsRef.current.has(String(dose._id))
      })

      for (const dose of dueSoon) {
        if (cancelled) {
          return
        }

        const eventId = String(dose._id)
        firedEventIdsRef.current.add(eventId)

        await registration.showNotification(
          `${copy("reminders.notification.titlePrefix")} ${dose.medicineName}`,
          {
            body: dose.dosage
              ? `${dose.dosage} ${copy("reminders.notification.doseDue").toLowerCase()} ${formatTimestampInTimeZone(dose.dueAt, browserTimeZone)}`
              : `${copy("reminders.notification.doseDue")} ${formatTimestampInTimeZone(dose.dueAt, browserTimeZone)}`,
            tag: `bridge-dose-${eventId}`,
            icon: "/icons/icon-192.svg",
            badge: "/icons/icon-192.svg",
            data: {
              eventId,
              href: "/",
              dueAt: dose.dueAt,
            },
          }
        )
      }
    }

    void tick()

    return () => {
      cancelled = true
    }
  }, [browserTimeZone, homeData, permission, remindersEnabled])

  return null
}
