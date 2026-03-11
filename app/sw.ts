/// <reference lib="webworker" />

import { Serwist, type PrecacheEntry } from "serwist"

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<PrecacheEntry | string>
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
})

serwist.addEventListeners()

self.addEventListener("notificationclick", (event) => {
  const targetUrl = event.notification.data?.href ?? "/"

  event.notification.close()
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const matchingClient = clients.find((client) => "focus" in client)

        if (matchingClient && "navigate" in matchingClient) {
          return matchingClient
            .navigate(targetUrl)
            .then(() => matchingClient.focus())
        }

        return self.clients.openWindow(targetUrl)
      })
  )
})
