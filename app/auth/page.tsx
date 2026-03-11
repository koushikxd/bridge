import { IconHeartHandshake } from "@tabler/icons-react"
import { cookies } from "next/headers"

import { AuthCard } from "@/components/auth/auth-card"
import { redirectAuthenticatedUser } from "@/lib/auth-guards"
import { isAuthenticated } from "@/lib/auth-server"
import { caregiverInviteCookieName } from "@/lib/caregiver-invite"
import { copy } from "@/lib/copy"
import { redirect } from "next/navigation"

export default async function AuthPage() {
  const cookieStore = await cookies()
  const inviteToken = cookieStore.get(caregiverInviteCookieName)?.value

  if (inviteToken && (await isAuthenticated())) {
    redirect("/invite/resolve")
  }

  await redirectAuthenticatedUser()

  return (
    <main className="-mt-10 flex min-h-svh items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <header className="space-y-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium tracking-[0.24em] text-primary uppercase">
            <IconHeartHandshake className="size-3.5" />
            {copy("auth.eyebrow")}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {copy("auth.title")}
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
            {copy("auth.body")}
          </p>
        </header>

        <AuthCard />
        {inviteToken ? (
          <p className="text-center text-xs text-muted-foreground">
            {copy("auth.inviteHint")}
          </p>
        ) : null}
      </div>
    </main>
  )
}
