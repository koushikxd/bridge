import messages from "@/locales/en.json"

export type MessageKey = keyof typeof messages

export function copy(key: MessageKey) {
  return messages[key]
}
