"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { copy } from "@/lib/copy"

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        setIsPending(true)

        try {
          await authClient.signOut()
          window.location.assign("/auth")
        } finally {
          setIsPending(false)
        }
      }}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : copy("home.signOut")}
    </Button>
  )
}
