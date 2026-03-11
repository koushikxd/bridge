import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { ConvexClientProvider } from "@/components/convex-client-provider"
import { LocalReminderManager } from "@/components/reminders/local-reminder-manager"
import { cn } from "@/lib/utils"
import { Nunito_Sans } from "next/font/google"

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Bridge",
  description: "A multilingual health companion for patients and caregivers.",
  applicationName: "Bridge",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
      { url: "/icons/icon-512.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", nunitoSans.variable)}
    >
      <body className="bg-background text-foreground">
        <ConvexClientProvider>
          <ThemeProvider>
            <ThemeToggle />
            <LocalReminderManager />
            {children}
          </ThemeProvider>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
