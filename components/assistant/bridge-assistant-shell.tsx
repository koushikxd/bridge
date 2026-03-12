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
import { useEffect, useRef, useState, type RefObject } from "react"

import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent
            overlayClassName="bg-black/20 backdrop-blur-none"
            className="h-[88svh] rounded-t-[1.9rem] border-t border-border/80 bg-card p-0"
          >
            <DrawerHeader className="border-b border-border/70 px-5 pt-3 pb-4 text-left">
              <MobileHeader uiText={uiText} />
            </DrawerHeader>
            {open ? (
              <AssistantChatSession
                preferredLanguage={preferredLanguage}
                uiText={uiText}
              />
            ) : null}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="right"
            showCloseButton={false}
            overlayClassName="bg-black/0 backdrop-blur-none"
            className="w-[28rem] border-l border-border/80 bg-card p-0 shadow-[0_16px_48px_-28px_rgba(15,23,42,0.22)] sm:max-w-[28rem]"
          >
            <SheetHeader className="border-b border-border/70 px-5 py-4">
              <DesktopHeader uiText={uiText} />
            </SheetHeader>
            {open ? (
              <AssistantChatSession
                preferredLanguage={preferredLanguage}
                uiText={uiText}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      )}

      {!open ? (
        <AssistantFab
          isOpen={open}
          label={uiText.triggerLabel}
          onClick={() => setOpen((current) => !current)}
        />
      ) : null}
    </>
  )
}

function AssistantChatSession({
  preferredLanguage,
  uiText,
}: {
  preferredLanguage: string
  uiText: AssistantText
}) {
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { messages, sendMessage, status, error } = useChat({ transport })
  const isLoading = status === "streaming" || status === "submitted"

  return (
    <AssistantPanel
      error={error}
      input={input}
      isLoading={isLoading}
      messages={messages}
      preferredLanguage={preferredLanguage}
      scrollRef={scrollRef}
      sendMessage={sendMessage}
      setInput={setInput}
      textareaRef={textareaRef}
      uiText={uiText}
    />
  )
}

function MobileHeader({ uiText }: { uiText: AssistantText }) {
  return (
    <div className="space-y-3 text-left">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-foreground/70 uppercase">
        <IconSparkles className="size-3.5 text-primary" />
        {uiText.eyebrow}
      </div>
      <DrawerTitle className="text-[1.8rem] font-semibold tracking-[-0.05em] text-foreground">
        {uiText.title}
      </DrawerTitle>
      <DrawerDescription className="text-sm leading-7 text-muted-foreground">
        {uiText.body}
      </DrawerDescription>
    </div>
  )
}

function DesktopHeader({ uiText }: { uiText: AssistantText }) {
  return (
    <div className="space-y-3 text-left">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[0.72rem] font-semibold tracking-[0.18em] text-foreground/70 uppercase">
        <IconSparkles className="size-3.5 text-primary" />
        {uiText.eyebrow}
      </div>
      <SheetTitle className="text-[1.65rem] font-semibold tracking-[-0.05em] text-foreground">
        {uiText.title}
      </SheetTitle>
      <SheetDescription className="text-sm leading-7 text-muted-foreground">
        {uiText.body}
      </SheetDescription>
    </div>
  )
}

function AssistantFab({
  isOpen,
  label,
  onClick,
}: {
  isOpen: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      size="icon-lg"
      onClick={onClick}
      aria-label={label}
      aria-pressed={isOpen}
      className="fixed right-4 bottom-4 z-[60] size-14 rounded-full border border-primary/15 bg-primary text-primary-foreground shadow-[0_16px_40px_-18px_rgba(16,185,129,0.72)] transition hover:scale-[1.03] sm:right-6 sm:bottom-6"
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
  }, [messages, scrollRef])

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3">
          {messages.length === 0 ? (
            <div className="rounded-[1.15rem] border border-border bg-background px-4 py-4 text-sm leading-7 text-muted-foreground">
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
                      ? "max-w-[82%] rounded-[1.2rem] rounded-br-sm bg-primary px-4 py-3 text-sm leading-7 text-primary-foreground"
                      : "max-w-[88%] rounded-[1.2rem] rounded-bl-sm border border-border bg-background px-4 py-3 text-sm leading-7 text-foreground"
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
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <IconLoader2 className="size-4 animate-spin" />
                {uiText.loading}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="inline-flex items-center gap-2 rounded-[1rem] border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <IconAlertCircle className="size-4" />
              {uiText.error}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border/70 bg-card px-4 py-4 sm:px-5">
        <div className="flex items-end gap-3">
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
            className="min-h-24 rounded-[1.2rem] border-border bg-background px-4 py-3 text-sm leading-7 shadow-none"
          />
          <Button
            type="button"
            size="icon-lg"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="mb-1 shrink-0 rounded-full"
            aria-label={uiText.send}
          >
            <IconSend className="size-4.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
