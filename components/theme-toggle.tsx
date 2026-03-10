"use client"

import { useEffect, useState } from "react"
import { IconMoonStars, IconSunHigh } from "@tabler/icons-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed top-4 right-4 z-50 rounded-full border-border bg-card/90 backdrop-blur"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <IconSunHigh className="size-4" />
        ) : (
          <IconMoonStars className="size-4" />
        )
      ) : (
        <IconMoonStars className="size-4" />
      )}
    </Button>
  )
}
