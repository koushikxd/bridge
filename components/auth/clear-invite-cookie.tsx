"use client"

import { useEffect } from "react"

import { caregiverInviteCookieName } from "@/lib/caregiver-invite"

export function ClearInviteCookie() {
  useEffect(() => {
    document.cookie = `${caregiverInviteCookieName}=; path=/; max-age=0`
  }, [])

  return null
}
