import { getOptionalSessionState } from "@/lib/auth-guards"
import { localizedCopy } from "@/lib/copy"

import { BridgeAssistantShell } from "./bridge-assistant-shell"

export async function BridgeAssistant() {
  const state = await getOptionalSessionState()
  const profile = state?.profile

  if (!profile?.onboardingCompleted) {
    return null
  }

  const locale = profile.preferredLanguage
  const [
    triggerLabel,
    eyebrow,
    title,
    body,
    placeholder,
    send,
    loading,
    error,
    empty,
  ] = await Promise.all([
    localizedCopy("assistant.trigger", locale),
    localizedCopy("assistant.eyebrow", locale),
    localizedCopy("assistant.title", locale),
    localizedCopy("assistant.body", locale),
    localizedCopy("assistant.placeholder", locale),
    localizedCopy("assistant.send", locale),
    localizedCopy("assistant.loading", locale),
    localizedCopy("assistant.error", locale),
    localizedCopy("assistant.empty", locale),
  ])

  return (
    <BridgeAssistantShell
      preferredLanguage={locale}
      uiText={{
        triggerLabel,
        eyebrow,
        title,
        body,
        placeholder,
        send,
        loading,
        error,
        empty,
      }}
    />
  )
}
