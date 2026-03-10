"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  IconArrowRight,
  IconLock,
  IconMail,
  IconUser,
} from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import {
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from "@/lib/contracts/auth"
import { copy } from "@/lib/copy"
import { cn } from "@/lib/utils"

type AuthMode = "signIn" | "signUp"

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("signIn")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  function navigateToResolvedSession() {
    window.location.assign("/auth")
  }

  async function submitSignIn(values: SignInInput) {
    setErrorMessage(null)
    setIsPending(true)

    try {
      const result = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: "/auth",
      })

      if (result.error) {
        setErrorMessage(result.error.message ?? "Unable to sign in right now.")
        return
      }

      navigateToResolvedSession()
    } finally {
      setIsPending(false)
    }
  }

  async function submitSignUp(values: SignUpInput) {
    setErrorMessage(null)
    setIsPending(true)

    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/auth",
      })

      if (result.error) {
        setErrorMessage(
          result.error.message ?? "Unable to create your account right now."
        )
        return
      }

      navigateToResolvedSession()
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-border bg-muted p-1">
          <ModeButton
            active={mode === "signIn"}
            onClick={() => {
              setErrorMessage(null)
              setMode("signIn")
            }}
          >
            {copy("auth.signIn")}
          </ModeButton>
          <ModeButton
            active={mode === "signUp"}
            onClick={() => {
              setErrorMessage(null)
              setMode("signUp")
            }}
          >
            {copy("auth.signUp")}
          </ModeButton>
        </div>
      </div>

      {mode === "signIn" ? (
        <form
          className="space-y-4"
          onSubmit={signInForm.handleSubmit(submitSignIn)}
        >
          <Field
            id="signIn-email"
            icon={<IconMail className="size-4" />}
            label={copy("auth.email")}
            error={signInForm.formState.errors.email?.message}
          >
            <input
              id="signIn-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClassName}
              {...signInForm.register("email")}
            />
          </Field>
          <Field
            id="signIn-password"
            icon={<IconLock className="size-4" />}
            label={copy("auth.password")}
            error={signInForm.formState.errors.password?.message}
          >
            <input
              id="signIn-password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className={inputClassName}
              {...signInForm.register("password")}
            />
          </Field>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? copy("auth.pending") : copy("auth.submitSignIn")}
            <IconArrowRight className="size-4" />
          </Button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={signUpForm.handleSubmit(submitSignUp)}
        >
          <Field
            id="signUp-name"
            icon={<IconUser className="size-4" />}
            label={copy("auth.name")}
            error={signUpForm.formState.errors.name?.message}
          >
            <input
              id="signUp-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className={inputClassName}
              {...signUpForm.register("name")}
            />
          </Field>
          <Field
            id="signUp-email"
            icon={<IconMail className="size-4" />}
            label={copy("auth.email")}
            error={signUpForm.formState.errors.email?.message}
          >
            <input
              id="signUp-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={inputClassName}
              {...signUpForm.register("email")}
            />
          </Field>
          <Field
            id="signUp-password"
            icon={<IconLock className="size-4" />}
            label={copy("auth.password")}
            error={signUpForm.formState.errors.password?.message}
          >
            <input
              id="signUp-password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              className={inputClassName}
              {...signUpForm.register("password")}
            />
          </Field>
          <Field
            id="signUp-confirmPassword"
            icon={<IconLock className="size-4" />}
            label={copy("auth.confirmPassword")}
            error={signUpForm.formState.errors.confirmPassword?.message}
          >
            <input
              id="signUp-confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              className={inputClassName}
              {...signUpForm.register("confirmPassword")}
            />
          </Field>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? copy("auth.pending") : copy("auth.submitSignUp")}
            <IconArrowRight className="size-4" />
          </Button>
        </form>
      )}

      {errorMessage && (
        <p className="text-center text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  )
}

function ModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}

function Field({
  id,
  icon,
  label,
  error,
  children,
}: {
  id: string
  icon: ReactNode
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
      >
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

const inputClassName =
  "w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
