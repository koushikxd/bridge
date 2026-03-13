"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { getSpeechLanguage } from "@/lib/speech"
import type { PreferredLanguage } from "@/lib/contracts/profile"

type SpeechRecognitionAlternative = {
  transcript: string
}

type SpeechRecognitionResult = {
  isFinal: boolean
  0: SpeechRecognitionAlternative
  length: number
}

type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult
  length: number
}

type SpeechRecognitionEvent = Event & {
  resultIndex: number
  results: SpeechRecognitionResultList
}

type SpeechRecognitionErrorEvent = Event & {
  error: string
}

type BrowserSpeechRecognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  onend: (() => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionCtor
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor
  }
}

function getRecognitionConstructor() {
  if (typeof window === "undefined") {
    return null
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function getRecognitionErrorMessage(error: string, fallback: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "permission-denied"
    case "audio-capture":
      return "mic-unavailable"
    default:
      return fallback
  }
}

export function useSpeechRecognition(
  locale: PreferredLanguage | string,
  fallbackError: string,
  options?: {
    onFinalTranscript?: (value: string) => void
  }
) {
  const onFinalTranscript = options?.onFinalTranscript
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [interimTranscript, setInterimTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const supported = getRecognitionConstructor() !== null

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor()
    if (!Recognition) {
      setError(fallbackError)
      return false
    }

    recognitionRef.current?.stop()

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = getSpeechLanguage(locale)

    recognition.onresult = (event) => {
      let finalText = ""
      let interimText = ""

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const value = result[0]?.transcript?.trim() ?? ""
        if (!value) {
          continue
        }

        if (result.isFinal) {
          finalText += `${value} `
        } else {
          interimText += `${value} `
        }
      }

      if (finalText.trim()) {
        const nextTranscript = finalText.trim()
        setTranscript((current) =>
          [current, nextTranscript].filter(Boolean).join(" ").trim()
        )
        onFinalTranscript?.(nextTranscript)
      }

      setInterimTranscript(interimText.trim())
    }

    recognition.onerror = (event) => {
      setListening(false)
      setInterimTranscript("")
      setError(getRecognitionErrorMessage(event.error, fallbackError))
    }

    recognition.onend = () => {
      setListening(false)
      setInterimTranscript("")
    }

    try {
      setTranscript("")
      setInterimTranscript("")
      setError(null)
      setListening(true)
      recognition.start()
      recognitionRef.current = recognition
      return true
    } catch {
      setListening(false)
      setError(fallbackError)
      return false
    }
  }, [fallbackError, locale, onFinalTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    setInterimTranscript("")
  }, [])

  const combinedTranscript = useMemo(() => {
    return [transcript, interimTranscript].filter(Boolean).join(" ").trim()
  }, [interimTranscript, transcript])

  return {
    error,
    listening,
    start,
    stop,
    supported,
    transcript,
    liveTranscript: combinedTranscript,
    clearTranscript: () => {
      setTranscript("")
      setInterimTranscript("")
      setError(null)
    },
  }
}
