"use client"

import { useCallback, useEffect, useState } from "react"

import { SHARED_AUDIO_MUTED_KEY } from "@/lib/speech"

function readMutedPreference() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(SHARED_AUDIO_MUTED_KEY) === "true"
}

export function useSharedAudioPreference() {
  const [muted, setMutedState] = useState(readMutedPreference)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === SHARED_AUDIO_MUTED_KEY) {
        setMutedState(event.newValue === "true")
      }
    }

    const handleCustomEvent = (event: Event) => {
      const nextMuted = (event as CustomEvent<boolean>).detail
      setMutedState(nextMuted)
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener("bridge-audio-muted-change", handleCustomEvent)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(
        "bridge-audio-muted-change",
        handleCustomEvent
      )
    }
  }, [])

  const setMuted = useCallback((nextMuted: boolean) => {
    setMutedState(nextMuted)

    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(SHARED_AUDIO_MUTED_KEY, String(nextMuted))
    window.dispatchEvent(
      new CustomEvent("bridge-audio-muted-change", { detail: nextMuted })
    )
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted(!muted)
  }, [muted, setMuted])

  return {
    muted,
    setMuted,
    toggleMuted,
  }
}
