"use client"

import { IconChevronRight, IconTrash } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { CaregiverInviteCard } from "./caregiver-invite-card"

type CareNetworkConnection = {
  linkId: string
  userId: string
  profileId: string | null
  name: string
  email: string | null
  canOpenProfile: boolean
  activeMedicines: number
  onboardingCompleted: boolean
}

export function CareNetworkManager({
  connections,
  invitePath,
  emptyTitle,
  emptyBody,
  activeMedicinesLabel,
  connectionLabels,
  inviteUiText,
  inviteAction,
}: {
  connections: CareNetworkConnection[]
  invitePath: string
  emptyTitle: string
  emptyBody: string
  activeMedicinesLabel: string
  connectionLabels: {
    available: string
    pending: string
    viewProfile: string
    remove: string
  }
  inviteUiText: {
    title: string
    body: string
    copy: string
    copied: string
    creating: string
  }
  inviteAction?: {
    href: string
    label: string
  } | null
}) {
  const router = useRouter()
  const removeCareNetworkLink = useMutation(api.profiles.removeCareNetworkLink)
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null)

  async function handleRemove(linkId: string) {
    setPendingLinkId(linkId)

    try {
      await removeCareNetworkLink({ linkId: linkId as Id<"caregiverLinks"> })
      router.refresh()
    } finally {
      setPendingLinkId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-[1.25rem] border border-border/70 bg-background/75 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {inviteUiText.title}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {inviteUiText.body}
          </p>
        </div>
        {inviteAction ? (
          <Link
            href={inviteAction.href}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            {inviteAction.label}
          </Link>
        ) : (
          <CaregiverInviteCard invitePath={invitePath} uiText={inviteUiText} />
        )}
      </div>

      {connections.length === 0 ? (
        <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/45 px-4 py-4">
          <p className="text-sm font-semibold text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {emptyBody}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {connections.map((connection) => {
            const helperText = connection.onboardingCompleted
              ? `${connectionLabels.available} · ${connection.activeMedicines} ${activeMedicinesLabel}`
              : connectionLabels.pending

            return (
              <article
                key={connection.linkId}
                className="rounded-[1.25rem] border border-border/70 bg-background/80 p-3"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-[0.98rem] font-semibold text-foreground">
                      {connection.name}
                    </p>
                    {connection.email ? (
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {connection.email}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {helperText}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    {connection.canOpenProfile && connection.profileId ? (
                      <Link
                        href={`/profiles/${connection.profileId}`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-[color,box-shadow] outline-none hover:bg-accent hover:text-accent-foreground"
                      >
                        {connectionLabels.viewProfile}
                        <IconChevronRight className="size-4" />
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(connection.linkId)}
                      disabled={pendingLinkId === connection.linkId}
                    >
                      <IconTrash className="size-4" />
                      {connectionLabels.remove}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
