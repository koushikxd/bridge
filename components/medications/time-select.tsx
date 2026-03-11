"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  fromTwelveHourTime,
  formatTimeValue,
  toTwelveHourTime,
} from "@/lib/time"

const hourOptions = Array.from({ length: 12 }, (_, index) => String(index + 1))
const minuteOptions = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
]
const periodOptions = ["AM", "PM"] as const

export function TimeSelect({
  value,
  onChange,
  className,
}: {
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const timeParts = toTwelveHourTime(value)

  function update(partial: Partial<typeof timeParts>) {
    const nextParts = { ...timeParts, ...partial }
    onChange(
      fromTwelveHourTime(nextParts.hour, nextParts.minute, nextParts.period)
    )
  }

  return (
    <div
      className={cn(
        "flex min-w-[17rem] items-center gap-2 rounded-2xl border border-input bg-background px-3 py-2.5",
        className
      )}
    >
      <TimePartSelect
        ariaLabel="Hour"
        value={timeParts.hour}
        onChange={(nextValue) => update({ hour: nextValue })}
      >
        {hourOptions.map((hour) => (
          <SelectItem key={hour} value={hour}>
            {hour}
          </SelectItem>
        ))}
      </TimePartSelect>
      <span className="text-sm font-semibold text-muted-foreground">:</span>
      <TimePartSelect
        ariaLabel="Minute"
        value={timeParts.minute}
        onChange={(nextValue) => update({ minute: nextValue })}
      >
        {minuteOptions.map((minute) => (
          <SelectItem key={minute} value={minute}>
            {minute}
          </SelectItem>
        ))}
      </TimePartSelect>
      <TimePartSelect
        ariaLabel="Period"
        value={timeParts.period}
        onChange={(nextValue) => update({ period: nextValue as "AM" | "PM" })}
        className="w-[4.75rem]"
      >
        {periodOptions.map((period) => (
          <SelectItem key={period} value={period}>
            {period}
          </SelectItem>
        ))}
      </TimePartSelect>
      <span className="ml-auto text-xs font-medium text-muted-foreground">
        {formatTimeValue(value)}
      </span>
    </div>
  )
}

function TimePartSelect({
  value,
  onChange,
  children,
  className,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  className?: string
  ariaLabel: string
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) {
          onChange(nextValue)
        }
      }}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-10 w-[4.5rem] rounded-xl border-0 bg-muted px-3 text-sm font-semibold shadow-none focus-visible:ring-2",
          className
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[60]">{children}</SelectContent>
    </Select>
  )
}
