import { NextResponse } from "next/server"

import { api } from "@/convex/_generated/api"
import { requireCompletedOnboarding } from "@/lib/auth-guards"
import { fetchAuthQuery } from "@/lib/auth-server"

export async function GET() {
  await requireCompletedOnboarding()

  const homeData = await fetchAuthQuery(api.medications.getHomeData, {})

  return NextResponse.json({
    locale: homeData.profile.preferredLanguage,
    reminderPreferences: homeData.reminderPreferences,
    todayDoses: homeData.todayDoses,
  })
}
