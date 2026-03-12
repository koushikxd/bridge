import { BridgeAssistant } from "@/components/assistant/bridge-assistant"
import { LocalReminderManager } from "@/components/reminders/local-reminder-manager"

export async function CompletedOnboardingExtras({
  includeReminders = false,
}: {
  includeReminders?: boolean
}) {
  return (
    <>
      {includeReminders ? <LocalReminderManager /> : null}
      <BridgeAssistant />
    </>
  )
}
