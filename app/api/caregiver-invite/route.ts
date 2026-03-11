import { NextResponse, type NextRequest } from "next/server"

import { caregiverInviteCookieName } from "@/lib/caregiver-invite"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  const response = NextResponse.redirect(new URL("/auth?invite=1", request.url))

  if (token) {
    response.cookies.set({
      name: caregiverInviteCookieName,
      value: token,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    })
  }

  return response
}
