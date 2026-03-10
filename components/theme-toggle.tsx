"use client"

import { IconMoonStars, IconSunHigh } from "@tabler/icons-react"
import { useMounted } from "@/hooks/use-mounted"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()
  const isDark = mounted && resolvedTheme === "dark"
  const ariaLabel = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle theme"

  if (!mounted) {
    return null
  }

  return (
    <Button
      variant="outline"
      size="icon"
      type="button"
      aria-label={ariaLabel}
      className="fixed top-4 right-4 z-50 rounded-full border-border bg-card/90 backdrop-blur"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <IconSunHigh className="size-4" />
      ) : (
        <IconMoonStars className="size-4" />
      )}
    </Button>
  )
}
