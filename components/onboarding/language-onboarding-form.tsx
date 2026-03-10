"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  preferredLanguageLabels,
  preferredLanguageSchema,
  type PreferredLanguage,
  type PreferredLanguageForm,
} from "@/lib/contracts/profile"
import { copy } from "@/lib/copy"

export function LanguageOnboardingForm({
  defaultLanguage,
  userName,
  userEmail,
}: {
  defaultLanguage: PreferredLanguage
  userName: string
  userEmail: string
}) {
  const router = useRouter()
  const upsertPreferredLanguage = useMutation(
    api.profiles.upsertPreferredLanguage
  )
  const [isPending, setIsPending] = useState(false)
  const form = useForm<PreferredLanguageForm>({
    resolver: zodResolver(preferredLanguageSchema),
    defaultValues: {
      preferredLanguage: defaultLanguage,
    },
  })

  async function onSubmit(values: PreferredLanguageForm) {
    setIsPending(true)

    try {
      await upsertPreferredLanguage(values)
      router.replace("/")
      router.refresh()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/10 p-6">
        <p className="text-sm font-medium text-foreground">{userName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
        <div className="mt-6 space-y-3 text-sm leading-6 text-muted-foreground">
          <p>
            Bridge stores your preferred language so results and alerts can be
            translated for you.
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-foreground">
            {copy("onboarding.language")}
          </span>
          <select
            className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            {...form.register("preferredLanguage")}
          >
            {Object.entries(preferredLanguageLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <p className="min-h-5 text-xs text-destructive">
          {form.formState.errors.preferredLanguage?.message ?? ""}
        </p>

        <Button size="lg" disabled={isPending}>
          {isPending ? "Saving..." : copy("onboarding.submit")}
        </Button>
      </form>
    </div>
  )
}
