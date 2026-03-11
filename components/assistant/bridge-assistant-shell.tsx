"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  IconAlertCircle,
  IconLoader2,
  IconMessageCircle2,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react"
import { useEffect, useMemo, useRef, useState, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"

const transport = new DefaultChatTransport({ api: "/api/chat" })

type AssistantText = {
  triggerLabel: string
  eyebrow: string
  title: string
  body: string
  placeholder: string
  send: string
  loading: string
  error: string
  empty: string
}

export function BridgeAssistantShell({
  preferredLanguage,
  uiText,
}: {
  preferredLanguage: string
  uiText: AssistantText
}) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setOpen(true)
    }
  }

  const { messages, sendMessage, status, error } = useChat({
    transport,
  })

  const isLoading = status === "streaming" || status === "submitted"
  const content = useMemo(
    () => (
      <AssistantPanel
        error={error}
        input={input}
        isLoading={isLoading}
        messages={messages}
        preferredLanguage={preferredLanguage}
        scrollRef={scrollRef}
        setInput={setInput}
        sendMessage={sendMessage}
        textareaRef={textareaRef}
        uiText={uiText}
      />
    ),
    [error, input, isLoading, messages, preferredLanguage, sendMessage, uiText]
  )

  return isMobile ? (
    <Sheet open={open} onOpenChange={handleOpenChange} modal={false}>
      <AssistantFab
        label={uiText.triggerLabel}
        onClick={() => setOpen((current) => !current)}
      />
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-transparent backdrop-blur-none"
        className="bottom-22 h-[min(88svh,760px)] rounded-[2rem_2rem_0_0] border-x border-t border-b-0 border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--card)_92%,white)_0%,color-mix(in_oklch,var(--card)_98%,var(--background))_100%)] p-0 shadow-[0_-26px_70px_-38px_rgba(15,23,42,0.34)]"
      >
        <SheetHeader className="border-b border-border/70 px-5 py-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-foreground/75 uppercase shadow-sm">
            <IconSparkles className="size-3.5" />
            {uiText.eyebrow}
          </div>
          <SheetTitle className="mt-3 text-[1.7rem] font-semibold tracking-[-0.04em] text-foreground">
            {uiText.title}
          </SheetTitle>
          <SheetDescription className="max-w-xl text-[0.96rem] leading-7 text-muted-foreground">
            {uiText.body}
          </SheetDescription>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  ) : (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
      <AssistantFab
        label={uiText.triggerLabel}
        onClick={() => setOpen((current) => !current)}
      />
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-transparent backdrop-blur-none"
        className="top-auto right-6 bottom-24 left-auto grid h-[min(78svh,840px)] w-[min(30rem,calc(100vw-3rem))] translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-[2rem] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_oklch,var(--card)_94%,white)_0%,color-mix(in_oklch,var(--card)_98%,var(--background))_100%)] p-0 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.32)]"
      >
        <DialogHeader className="border-b border-border/70 px-6 py-5">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/80 bg-background px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-foreground/75 uppercase shadow-sm">
            <IconSparkles className="size-3.5" />
            {uiText.eyebrow}
          </div>
          <DialogTitle className="mt-3 text-[2rem] font-semibold tracking-[-0.05em] text-foreground">
            {uiText.title}
          </DialogTitle>
          <DialogDescription className="max-w-xl text-[0.98rem] leading-7 text-muted-foreground">
            {uiText.body}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

function AssistantFab({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="icon-lg"
      onClick={onClick}
      className="fixed right-4 bottom-4 z-50 size-14 rounded-full border border-primary/18 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_94%,white)_0%,var(--primary)_100%)] text-primary-foreground shadow-[0_16px_40px_-18px_rgba(16,185,129,0.72)] transition hover:scale-[1.03] hover:shadow-[0_20px_52px_-22px_rgba(16,185,129,0.82)] sm:right-6 sm:bottom-6"
      aria-label={label}
    >
      <IconMessageCircle2 className="size-6" />
    </Button>
  )
}

function AssistantPanel({
  error,
  input,
  isLoading,
  messages,
  preferredLanguage,
  scrollRef,
  sendMessage,
  setInput,
  textareaRef,
  uiText,
}: {
  error: Error | undefined
  input: string
  isLoading: boolean
  messages: Awaited<ReturnType<typeof useChat>>["messages"]
  preferredLanguage: string
  scrollRef: RefObject<HTMLDivElement | null>
  sendMessage: Awaited<ReturnType<typeof useChat>>["sendMessage"]
  setInput: (value: string) => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
  uiText: AssistantText
}) {
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  })

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading, textareaRef])

  function handleSend() {
    const text = input.trim()
    if (!text || isLoading) {
      return
    }

    sendMessage(
      { text },
      {
        body: {
          preferredLanguage,
        },
      }
    )
    setInput("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-border/80 bg-background/70 px-5 py-6 text-sm leading-7 text-muted-foreground shadow-sm">
              {uiText.empty}
            </div>
          ) : null}

          {messages.map((message) => {
            const textParts = message.parts.filter(
              (
                part
              ): part is Extract<
                (typeof message.parts)[number],
                { type: "text" }
              > => part.type === "text"
            )

            if (textParts.length === 0) {
              return null
            }

            const isUser = message.role === "user"

            return (
              <div
                key={message.id}
                className={isUser ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    isUser
                      ? "max-w-[84%] rounded-[1.55rem] rounded-br-md bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground shadow-[0_12px_30px_-18px_rgba(16,185,129,0.7)]"
                      : "max-w-[86%] rounded-[1.55rem] rounded-bl-md border border-border/70 bg-background/92 px-4 py-3 text-sm leading-7 text-foreground shadow-sm"
                  }
                >
                  {textParts.map((part) => (
                    <p
                      key={`${message.id}-${part.text.slice(0, 24)}`}
                      className="whitespace-pre-wrap"
                    >
                      {part.text}
                    </p>
                  ))}
                </div>
              </div>
            )
          })}

          {isLoading ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                <IconLoader2 className="size-4 animate-spin" />
                {uiText.loading}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="inline-flex items-center gap-2 rounded-[1rem] border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <IconAlertCircle className="size-4" />
              {uiText.error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/70 bg-[color-mix(in_oklch,var(--background)_72%,var(--card))] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-end gap-3">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                handleSend()
              }
            }}
            placeholder={uiText.placeholder}
            disabled={isLoading}
            className="min-h-26 rounded-[1.6rem] border-border/80 bg-background px-4 py-3.5 text-sm leading-7 shadow-sm"
          />
          <Button
            type="button"
            size="icon-lg"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="mb-1 shrink-0 rounded-full shadow-[0_12px_24px_-16px_rgba(16,185,129,0.72)]"
            aria-label={uiText.send}
          >
            <IconSend className="size-4.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
