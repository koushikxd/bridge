export const caregiverInviteCookieName = "bridge-caregiver-invite"

export function buildCaregiverInvitePath(token: string) {
  return token
    ? `/api/caregiver-invite?token=${encodeURIComponent(token)}`
    : "/api/caregiver-invite?token="
}

export function buildAbsoluteCaregiverInviteUrl(token: string) {
  const baseUrl =
    process.env.SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? ""

  if (!baseUrl) {
    return buildCaregiverInvitePath(token)
  }

  return new URL(buildCaregiverInvitePath(token), baseUrl).toString()
}
