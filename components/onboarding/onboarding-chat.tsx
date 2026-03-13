"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  IconAlertCircle,
  IconLoader2,
  IconMicrophone,
  IconPlayerStop,
  IconSend,
  IconVolume,
  IconVolumeOff,
} from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation } from "convex/react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/convex/_generated/api"
import { useSharedAudioPreference } from "@/hooks/use-shared-audio-preference"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { useSpeechTts } from "@/hooks/use-speech-tts"
import { extractMessageText } from "@/lib/speech"

const transport = new DefaultChatTransport({ api: "/api/onboarding/chat" })

export function OnboardingChat({
  userName,
  onComplete,
  locale,
  uiText,
}: {
  userName: string
  onComplete?: () => void
  locale: string
  uiText: {
    chatEyebrow: string
    chatSubtitle: string
    chatPlaceholder: string
    chatSkip: string
    chatLoading: string
    chatDone: string
    chatError: string
    chatKickoff: string
    voiceListen: string
    voiceStopListening: string
    voiceMute: string
    voiceUnmute: string
    voiceSpeaking: string
    voiceUnsupported: string
    voicePermissionDenied: string
    voiceMicUnavailable: string
  }
}) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasSentInitial = useRef(false)
  const spokenMessageIds = useRef(new Set<string>())
  const [input, setInput] = useState("")
  const [completed, setCompleted] = useState(false)
  const handleTranscript = useCallback((value: string) => {
    setInput(value)
  }, [])
  const { muted, setMuted } = useSharedAudioPreference()
  const { speak, speaking, stop: stopSpeaking } = useSpeechTts(locale, muted)
  const {
    error: recognitionError,
    listening,
    liveTranscript,
    start: startListening,
    stop: stopListening,
    supported: recognitionSupported,
  } = useSpeechRecognition(locale, uiText.voiceUnsupported, {
    onFinalTranscript: handleTranscript,
  })
  const completeProfileQuestions = useMutation(
    api.profiles.completeProfileQuestions
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      const hasCompletion = message.parts.some(
        (part) =>
          part.type === "tool-completeProfileQuestions" &&
          part.state === "output-available"
      )
      if (hasCompletion) {
        setCompleted(true)
      }
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Auto-send initial message to trigger AI greeting
  useEffect(() => {
    if (!hasSentInitial.current) {
      hasSentInitial.current = true
      sendMessage(
        { text: uiText.chatKickoff },
        {
          body: {
            locale,
          },
        }
      )
    }
  }, [locale, sendMessage, uiText.chatKickoff])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  // Focus input when AI finishes responding
  useEffect(() => {
    if (!isLoading) inputRef.current?.focus()
  }, [isLoading])

  useEffect(() => {
    const latestAssistantMessage = [...messages]
      .reverse()
      .find((message) => message.role === "assistant")

    if (!latestAssistantMessage || isLoading) {
      return
    }

    if (spokenMessageIds.current.has(latestAssistantMessage.id)) {
      return
    }

    const messageText = extractMessageText(latestAssistantMessage.parts)
    if (!messageText) {
      return
    }

    spokenMessageIds.current.add(latestAssistantMessage.id)
    speak(messageText)
  }, [isLoading, messages, speak])

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    stopListening()
    sendMessage({ text })
    setInput("")
  }

  async function handleSkipAll() {
    await completeProfileQuestions({})
    setCompleted(true)
  }

  function handleContinue() {
    if (onComplete) {
      onComplete()
      return
    }

    router.replace("/onboarding")
    router.refresh()
  }

  function handleMuteToggle() {
    const nextMuted = !muted
    setMuted(nextMuted)
    if (nextMuted) {
      stopSpeaking()
      stopListening()
    }
  }

  function handleMicToggle() {
    if (!recognitionSupported) {
      return
    }

    if (listening) {
      stopListening()
      return
    }

    startListening()
  }

  const voiceStatus =
    recognitionError === "permission-denied"
      ? uiText.voicePermissionDenied
      : recognitionError === "mic-unavailable"
        ? uiText.voiceMicUnavailable
        : recognitionError
          ? uiText.voiceUnsupported
          : liveTranscript
            ? liveTranscript
            : speaking
              ? uiText.voiceSpeaking
              : null

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
              {uiText.chatEyebrow}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {uiText.chatSubtitle}, {userName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleMuteToggle}
                    aria-label={muted ? uiText.voiceUnmute : uiText.voiceMute}
                  />
                }
              >
                {muted ? (
                  <IconVolumeOff className="size-4" />
                ) : (
                  <IconVolume className="size-4" />
                )}
              </TooltipTrigger>
              <TooltipContent>
                {muted ? uiText.voiceUnmute : uiText.voiceMute}
              </TooltipContent>
            </Tooltip>
            {!completed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipAll}
                disabled={isLoading}
              >
                {uiText.chatSkip}
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((message) => {
              const textParts = message.parts.filter(
                (
                  p
                ): p is Extract<
                  (typeof message.parts)[number],
                  { type: "text" }
                > => p.type === "text"
              )
              if (textParts.length === 0) return null

              const isKickoffMessage =
                message.role === "user" &&
                textParts.length === 1 &&
                textParts[0]?.text === uiText.chatKickoff

              if (isKickoffMessage) {
                return null
              }

              const isUser = message.role === "user"
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/50 text-foreground"
                    }`}
                  >
                    {textParts.map((part) => (
                      <p
                        key={part.text.slice(0, 20)}
                        className="whitespace-pre-wrap"
                      >
                        {part.text}
                      </p>
                    ))}
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <IconLoader2 className="size-4 animate-spin" />
                  {uiText.chatLoading}
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <IconAlertCircle className="size-4" />
                  {uiText.chatError}
                </div>
              </div>
            )}

            {completed && (
              <div className="flex justify-center pt-4">
                <Button size="lg" onClick={handleContinue}>
                  {uiText.chatDone}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        {!completed && (
          <div className="border-t border-border px-6 py-4">
            <div className="mx-auto flex max-w-2xl flex-col gap-2">
              {voiceStatus ? (
                <p className="px-1 text-xs text-muted-foreground">
                  {voiceStatus}
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={uiText.chatPlaceholder}
                  disabled={isLoading}
                  className="flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground transition outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50"
                />
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        type="button"
                        size="icon"
                        variant={listening ? "secondary" : "outline"}
                        disabled={isLoading || !recognitionSupported}
                        aria-label={
                          listening
                            ? uiText.voiceStopListening
                            : uiText.voiceListen
                        }
                        onClick={handleMicToggle}
                      />
                    }
                  >
                    {listening ? (
                      <IconPlayerStop className="size-4" />
                    ) : (
                      <IconMicrophone className="size-4" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {listening ? uiText.voiceStopListening : uiText.voiceListen}
                  </TooltipContent>
                </Tooltip>
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                >
                  <IconSend className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
