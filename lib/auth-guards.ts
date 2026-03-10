import { redirect } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { fetchAuthQuery, isAuthenticated } from "@/lib/auth-server"

export async function getOptionalSessionState() {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return null
  }

  try {
    const [authUser, profile] = await Promise.all([
      fetchAuthQuery(api.auth.getAuthUser),
      fetchAuthQuery(api.profiles.getCurrentProfile),
    ])

    return { authUser, profile }
  } catch {
    return null
  }
}

export async function redirectAuthenticatedUser() {
  const state = await getOptionalSessionState()

  if (!state) {
    return
  }

  if (state.profile?.onboardingCompleted) {
    redirect("/")
  }

  redirect("/onboarding")
}

export async function requireAuthenticatedUser() {
  const state = await getOptionalSessionState()

  if (!state) {
    redirect("/auth")
  }

  return state
}

export async function requirePendingOnboarding() {
  const state = await requireAuthenticatedUser()

  if (state.profile?.onboardingCompleted) {
    redirect("/")
  }

  return state
}

export async function requireCompletedOnboarding() {
  const state = await requireAuthenticatedUser()

  if (!state.profile?.onboardingCompleted) {
    redirect("/onboarding")
  }

  return state
}
