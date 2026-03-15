import { cache } from "react"
import { redirect } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"

export const getOptionalSessionState = cache(async function getOptionalSessionState() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return null
  }

  try {
    const [sessionUser, profile] = await Promise.all([
      fetchAuthQuery(api.auth.getSessionUserState),
      fetchAuthQuery(api.profiles.getCurrentProfile),
    ])

    if (!sessionUser.hasPersistedAuthRecord) {
      return null
    }

    return { authUser: sessionUser.authUser, profile }
  } catch {
    return null
  }
})

export const getSessionContext = cache(async function getSessionContext() {
  const state = await getOptionalSessionState()

  if (!state) {
    return null
  }

  try {
    const sessionContext = await fetchAuthQuery(
      api.profiles.getSessionContext,
      {}
    )

    return {
      ...state,
      ...sessionContext,
    }
  } catch {
    return {
      ...state,
      hasCaregiverLinks: false,
      linkedProfileIds: [],
    }
  }
})

export async function redirectAuthenticatedUser() {
  const state = await getSessionContext()

  if (!state) {
    return
  }

  if (state.profile?.preferredLanguage) {
    redirect("/")
  }

  redirect("/onboarding")
}

export async function requireAuthenticatedUser() {
  const state = await getSessionContext()

  if (!state) {
    redirect("/auth")
  }

  return state
}

export async function requirePendingOnboarding() {
  const state = await requireAuthenticatedUser()

  if (state.profile?.preferredLanguage && state.profile?.onboardingCompleted) {
    redirect("/")
  }

  return state
}

export async function requireCompletedOnboarding() {
  const state = await requireAuthenticatedUser()

  if (!state.profile?.onboardingCompleted) {
    redirect("/")
  }

  return state
}
