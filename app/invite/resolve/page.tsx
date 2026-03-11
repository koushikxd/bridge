import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { api } from "@/convex/_generated/api"
import { requireAuthenticatedUser } from "@/lib/auth-guards"
import { fetchAuthMutation } from "@/lib/auth-server"
import { caregiverInviteCookieName } from "@/lib/caregiver-invite"

export default async function ResolveInvitePage() {
  await requireAuthenticatedUser()

  const cookieStore = await cookies()
  const inviteToken = cookieStore.get(caregiverInviteCookieName)?.value

  if (inviteToken) {
    await fetchAuthMutation(api.profiles.acceptCaregiverInvite, {
      token: inviteToken,
    }).catch(() => null)
  }

  redirect("/")
}
