"use client"

import { useSyncExternalStore } from "react"

function subscribe() {
  return () => undefined
}

function getServerSnapshot() {
  return false
}

function getSnapshot() {
  return true
}

export function useMounted() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
