"use client"

import { IconClockPlus, IconPlus, IconTrash } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  onboardingMedicinesSchema,
  type OnboardingMedicineInput,
} from "@/lib/contracts/medication"

let nextMedicineDraftId = 0

type MedicationDraft = OnboardingMedicineInput & {
  id: string
}

function createId() {
  nextMedicineDraftId += 1
  return `medicine-draft-${nextMedicineDraftId}`
}

const emptyMedicine = (): MedicationDraft => ({
  id: createId(),
  name: "",
  dosage: "",
  instructions: "",
  purpose: "",
  times: ["08:00"],
  durationDays: 7,
})

export function MedicationOnboardingForm({
  uiText,
}: {
  uiText: {
    eyebrow: string
    title: string
    body: string
    addMedicine: string
    addTime: string
    save: string
    saving: string
    skip: string
    medicineName: string
    dosage: string
    purpose: string
    instructions: string
    duration: string
    times: string
  }
}) {
  const router = useRouter()
  const saveMedicines = useMutation(api.medications.saveOnboardingMedicines)
  const completeOnboarding = useMutation(api.profiles.completeOnboarding)
  const [medicines, setMedicines] = useState<MedicationDraft[]>([
    emptyMedicine(),
  ])
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateMedicine(index: number, patch: Partial<MedicationDraft>) {
    setMedicines((current) =>
      current.map((medicine, currentIndex) =>
        currentIndex === index ? { ...medicine, ...patch } : medicine
      )
    )
  }

  function updateTime(index: number, timeIndex: number, value: string) {
    setMedicines((current) =>
      current.map((medicine, currentIndex) => {
        if (currentIndex !== index) return medicine

        const times = medicine.times.map((time, currentTimeIndex) =>
          currentTimeIndex === timeIndex ? value : time
        )

        return { ...medicine, times }
      })
    )
  }

  function addMedicine() {
    setMedicines((current) => [...current, emptyMedicine()])
  }

  function removeMedicine(index: number) {
    setMedicines((current) =>
      current.length === 1
        ? [emptyMedicine()]
        : current.filter((_, i) => i !== index)
    )
  }

  function addTime(index: number) {
    setMedicines((current) =>
      current.map((medicine, currentIndex) =>
        currentIndex === index
          ? { ...medicine, times: [...medicine.times, "20:00"] }
          : medicine
      )
    )
  }

  function removeTime(index: number, timeIndex: number) {
    setMedicines((current) =>
      current.map((medicine, currentIndex) => {
        if (currentIndex !== index) return medicine

        return {
          ...medicine,
          times:
            medicine.times.length === 1
              ? medicine.times
              : medicine.times.filter((_, i) => i !== timeIndex),
        }
      })
    )
  }

  async function finalize(nextMedicines: OnboardingMedicineInput[]) {
    setError(null)
    setIsPending(true)

    try {
      onboardingMedicinesSchema.parse({ medicines: nextMedicines })
      await saveMedicines({ medicines: nextMedicines })
      await completeOnboarding({})
      router.replace("/")
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save medicines right now."
      )
    } finally {
      setIsPending(false)
    }
  }

  async function handleSubmit() {
    const normalized = medicines
      .map(({ id: _id, ...medicine }) => {
        void _id

        return {
          ...medicine,
          name: medicine.name.trim(),
          dosage: medicine.dosage?.trim() || undefined,
          purpose: medicine.purpose?.trim() || undefined,
          instructions: medicine.instructions?.trim() || undefined,
          times: medicine.times.filter(Boolean),
        }
      })
      .filter((medicine) => medicine.name.length > 0)

    await finalize(normalized)
  }

  async function handleSkip() {
    await finalize([])
  }

  return (
    <div className="w-full rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            {uiText.eyebrow}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {uiText.title}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {uiText.body}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {medicines.map((medicine, index) => (
            <article
              key={medicine.id}
              className="rounded-[1.5rem] border border-border bg-background/70 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {uiText.medicineName} {index + 1}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedicine(index)}
                >
                  <IconTrash data-icon="inline-start" />
                  Remove
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>{uiText.medicineName}</span>
                  <input
                    value={medicine.name}
                    onChange={(event) =>
                      updateMedicine(index, { name: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Metformin"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>{uiText.dosage}</span>
                  <input
                    value={medicine.dosage}
                    onChange={(event) =>
                      updateMedicine(index, { dosage: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="500 mg"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>{uiText.purpose}</span>
                  <input
                    value={medicine.purpose}
                    onChange={(event) =>
                      updateMedicine(index, { purpose: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    placeholder="Blood sugar support"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-foreground">
                  <span>{uiText.duration}</span>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={medicine.durationDays}
                    onChange={(event) =>
                      updateMedicine(index, {
                        durationDays: Number(event.target.value || 1),
                      })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </label>
              </div>

              <label className="mt-3 flex flex-col gap-2 text-sm text-foreground">
                <span>{uiText.instructions}</span>
                <textarea
                  value={medicine.instructions}
                  onChange={(event) =>
                    updateMedicine(index, { instructions: event.target.value })
                  }
                  className="min-h-24 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  placeholder="After breakfast"
                />
              </label>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {uiText.times}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTime(index)}
                  >
                    <IconClockPlus data-icon="inline-start" />
                    {uiText.addTime}
                  </Button>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                  {medicine.times.map((time, timeIndex) => (
                    <div
                      key={`${medicine.id}-${time}-${timeIndex}`}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="time"
                        value={time}
                        onChange={(event) =>
                          updateTime(index, timeIndex, event.target.value)
                        }
                        className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />
                      {medicine.times.length > 1 ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeTime(index, timeIndex)}
                        >
                          <IconTrash />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={addMedicine}
          >
            <IconPlus data-icon="inline-start" />
            {uiText.addMedicine}
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleSkip}
            >
              {uiText.skip}
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? uiText.saving : uiText.save}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
