import { UploadForm } from "@/components/upload/upload-form"
import { requireCompletedOnboarding } from "@/lib/auth-guards"

export default async function ScanPage() {
  await requireCompletedOnboarding()

  return (
    <main className="min-h-svh bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <UploadForm />
      </div>
    </main>
  )
}
