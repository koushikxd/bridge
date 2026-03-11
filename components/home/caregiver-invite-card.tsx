"use client"

import { IconCopy } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"

export function CaregiverInviteCard({
  invitePath,
  uiText,
}: {
  invitePath: string
  uiText: {
    title: string
    body: string
    copy: string
    copied: string
    creating: string
  }
}) {
  const createCaregiverInvite = useMutation(api.profiles.createCaregiverInvite)
  const [copied, setCopied] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleCopy() {
    setIsPending(true)

    try {
      const { token } = await createCaregiverInvite({})
      const joinUrl = new URL(
        `${invitePath}${encodeURIComponent(token)}`,
        window.location.origin
      ).toString()
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button type="button" onClick={handleCopy} disabled={isPending}>
      <IconCopy className="size-4" />
      {copied ? uiText.copied : isPending ? uiText.creating : uiText.copy}
    </Button>
  )
}
