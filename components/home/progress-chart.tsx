export function ProgressChart({
  days,
}: {
  days: Array<{ label: string; percent: number }>
}) {
  return (
    <div className="mt-6 grid grid-cols-7 gap-2 sm:gap-3">
      {days.map((day) => (
        <div
          key={day.label}
          className="flex min-w-0 flex-col items-center gap-3"
        >
          <div className="flex h-36 w-full items-end rounded-[1.25rem] bg-muted p-2 sm:h-40">
            <div
              className="w-full rounded-[0.9rem] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_75%,white),var(--primary))] transition-all"
              style={{ height: `${Math.max(day.percent, 8)}%` }}
            />
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-foreground">
              {day.percent}%
            </p>
            <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {day.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
