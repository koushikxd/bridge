"use client"

import { IconClockPlus, IconPlus, IconTrash } from "@tabler/icons-react"
import { useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { Id } from "@/convex/_generated/dataModel"

import { TimeSelect } from "@/components/medications/time-select"
import { Button } from "@/components/ui/button"
import { api } from "@/convex/_generated/api"
import {
  medicineSettingsListSchema,
  type MedicineSettingsInput,
} from "@/lib/contracts/medication"
import { getBrowserTimeZone } from "@/lib/time"

let nextSettingsDraftId = 0

type MedicineDraft = MedicineSettingsInput & {
  draftId: string
}

type MedicineMutationInput = {
  medicineId?: Id<"medicines">
  name: string
  dosage?: string
  instructions?: string
  purpose?: string
  times: string[]
  durationDays: number
  isActive: boolean
}

function createDraftId() {
  nextSettingsDraftId += 1
  return `settings-medicine-${nextSettingsDraftId}`
}

function createEmptyMedicine(): MedicineDraft {
  return {
    draftId: createDraftId(),
    name: "",
    dosage: "",
    instructions: "",
    purpose: "",
    times: ["08:00"],
    durationDays: 7,
    isActive: true,
  }
}

function normalizeDraft(medicine: MedicineDraft): MedicineMutationInput {
  return {
    medicineId: medicine.medicineId as Id<"medicines"> | undefined,
    name: medicine.name.trim(),
    dosage: medicine.dosage?.trim() || undefined,
    instructions: medicine.instructions?.trim() || undefined,
    purpose: medicine.purpose?.trim() || undefined,
    times: medicine.times.filter(Boolean),
    durationDays: medicine.durationDays,
    isActive: medicine.isActive,
  }
}

export function MedicineSettingsForm({
  medicines,
  reminderPreferences: _reminderPreferences,
}: {
  medicines: MedicineSettingsInput[]
  reminderPreferences: {
    enabled: boolean
    timezone: string
  }
}) {
  void _reminderPreferences
  const router = useRouter()
  const updateMedicineSettings = useMutation(
    api.medications.updateMedicineSettings
  )
  const [items, setItems] = useState<MedicineDraft[]>(() =>
    medicines.length
      ? medicines.map((medicine) => ({ ...medicine, draftId: createDraftId() }))
      : [createEmptyMedicine()]
  )
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function updateMedicine(index: number, patch: Partial<MedicineDraft>) {
    setItems((current) =>
      current.map((medicine, currentIndex) =>
        currentIndex === index ? { ...medicine, ...patch } : medicine
      )
    )
  }

  function updateTime(index: number, timeIndex: number, value: string) {
    setItems((current) =>
      current.map((medicine, currentIndex) => {
        if (currentIndex !== index) return medicine

        return {
          ...medicine,
          times: medicine.times.map((time, currentTimeIndex) =>
            currentTimeIndex === timeIndex ? value : time
          ),
        }
      })
    )
  }

  function addMedicine() {
    setItems((current) => [...current, createEmptyMedicine()])
  }

  function removeMedicine(index: number) {
    setItems((current) =>
      current.length === 1
        ? [createEmptyMedicine()]
        : current.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  function addTime(index: number) {
    setItems((current) =>
      current.map((medicine, currentIndex) =>
        currentIndex === index
          ? { ...medicine, times: [...medicine.times, "20:00"] }
          : medicine
      )
    )
  }

  function removeTime(index: number, timeIndex: number) {
    setItems((current) =>
      current.map((medicine, currentIndex) => {
        if (currentIndex !== index) return medicine

        return {
          ...medicine,
          times:
            medicine.times.length === 1
              ? medicine.times
              : medicine.times.filter(
                  (_, currentTimeIndex) => currentTimeIndex !== timeIndex
                ),
        }
      })
    )
  }

  async function handleSubmit() {
    setSaved(false)
    setError(null)
    setIsPending(true)

    try {
      const timeZone = getBrowserTimeZone()
      const normalized = items
        .map(normalizeDraft)
        .filter((medicine) => medicine.name.length > 0)
      medicineSettingsListSchema.parse({ medicines: normalized, timeZone })

      await updateMedicineSettings({ medicines: normalized, timeZone })
      setSaved(true)
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not save medicines."
      )
    } finally {
      setIsPending(false)
    }
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium tracking-[0.24em] text-primary uppercase">
            Medicines
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Edit tracked medicines and schedules
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Adjust names, dosage notes, daily times, duration, and whether a
            medicine stays active on your dashboard.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Tracked" value={items.length} />
          <StatCard
            label="Active"
            value={items.filter((medicine) => medicine.isActive).length}
          />
          <StatCard
            label="Daily doses"
            value={items.reduce(
              (sum, medicine) => sum + medicine.times.length,
              0
            )}
          />
        </div>

        <div className="flex flex-col gap-4">
          {items.map((medicine, index) => (
            <article
              key={medicine.draftId}
              className="rounded-[1.75rem] border border-border bg-background/70 p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {medicine.name.trim() || `Medicine ${index + 1}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {medicine.isActive ? "Active on home" : "Paused from home"}
                  </p>
                </div>
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
                <Field label="Medicine name">
                  <input
                    value={medicine.name}
                    onChange={(event) =>
                      updateMedicine(index, { name: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </Field>

                <Field label="Dosage">
                  <input
                    value={medicine.dosage}
                    onChange={(event) =>
                      updateMedicine(index, { dosage: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </Field>

                <Field label="Purpose">
                  <input
                    value={medicine.purpose}
                    onChange={(event) =>
                      updateMedicine(index, { purpose: event.target.value })
                    }
                    className="rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </Field>

                <Field label="Days to take">
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
                </Field>
              </div>

              <Field label="Instructions" className="mt-3">
                <textarea
                  value={medicine.instructions}
                  onChange={(event) =>
                    updateMedicine(index, { instructions: event.target.value })
                  }
                  className="min-h-24 rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </Field>

              <label className="mt-3 inline-flex items-center gap-3 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={medicine.isActive}
                  onChange={(event) =>
                    updateMedicine(index, { isActive: event.target.checked })
                  }
                  className="size-4 rounded border border-input"
                />
                Keep this medicine active on the home dashboard
              </label>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Times each day
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addTime(index)}
                  >
                    <IconClockPlus data-icon="inline-start" />
                    Add time
                  </Button>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
                  {medicine.times.map((time, timeIndex) => (
                    <div
                      key={`${medicine.draftId}-${time}-${timeIndex}`}
                      className="flex items-center gap-2"
                    >
                      <TimeSelect
                        value={time}
                        onChange={(nextTime) =>
                          updateTime(index, timeIndex, nextTime)
                        }
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={addMedicine}
          >
            <IconPlus data-icon="inline-start" />
            Add medicine
          </Button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-h-5 text-sm text-muted-foreground">
              {saved ? (
                "Medicine settings saved."
              ) : error ? (
                <span className="text-destructive">{error}</span>
              ) : null}
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save medicines"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col gap-2 text-sm text-foreground ${className ?? ""}`}
    >
      <span>{label}</span>
      {children}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-background/70 p-4">
      <p className="text-xs tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
