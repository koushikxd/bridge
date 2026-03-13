"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { pickBestVoice, getSpeechLanguage } from "@/lib/speech"
import type { PreferredLanguage } from "@/lib/contracts/profile"

export function useSpeechTts(locale: PreferredLanguage | string, muted: boolean) {
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return []
    }

    return window.speechSynthesis.getVoices()
  })
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window

  useEffect(() => {
    if (!supported) {
      return
    }

    const synth = window.speechSynthesis
    const updateVoices = () => {
      setVoices(synth.getVoices())
    }

    synth.addEventListener("voiceschanged", updateVoices)

    return () => {
      synth.removeEventListener("voiceschanged", updateVoices)
    }
  }, [supported])

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return
    }

    activeUtteranceRef.current = null
    setSpeaking(false)
    window.speechSynthesis.cancel()
  }, [])

  useEffect(() => {
    if (muted && supported) {
      activeUtteranceRef.current = null
      window.speechSynthesis.cancel()
    }
  }, [muted, supported])

  useEffect(() => stop, [stop])

  const speak = useCallback(
    (text: string) => {
      if (
        muted ||
        !text.trim() ||
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return false
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = getSpeechLanguage(locale)

      const voice = pickBestVoice(window.speechSynthesis.getVoices(), locale)
      if (voice) {
        utterance.voice = voice
      }

      utterance.rate = 1
      utterance.pitch = 1

      utterance.onstart = () => {
        activeUtteranceRef.current = utterance
        setSpeaking(true)
      }

      utterance.onend = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null
        }
        setSpeaking(false)
      }

      utterance.onerror = () => {
        if (activeUtteranceRef.current === utterance) {
          activeUtteranceRef.current = null
        }
        setSpeaking(false)
      }

      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
      return true
    },
    [locale, muted]
  )

  return {
    speak,
    speaking,
    stop,
    supported,
    hasVoices: voices.length > 0,
  }
}
