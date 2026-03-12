export function ProgressChart({
  days,
  compact = false,
  fill = false,
}: {
  days: Array<{ label: string; percent: number }>
  compact?: boolean
  fill?: boolean
}) {
  return (
    <div
      className={
        compact
          ? fill
            ? "mt-4 grid h-full min-h-[18rem] grid-cols-7 gap-2"
            : "mx-auto mt-4 grid max-w-xl grid-cols-7 gap-1.5 sm:gap-2"
          : "mt-6 grid grid-cols-7 gap-2 sm:gap-3"
      }
    >
      {days.map((day) => (
        <div
          key={day.label}
          className={
            compact
              ? fill
                ? "flex min-w-0 h-full flex-col items-center gap-3"
                : "flex min-w-0 flex-col items-center gap-1.5"
              : "flex min-w-0 flex-col items-center gap-3"
          }
        >
          <div
            className={
              compact
                ? fill
                  ? "flex h-full w-full items-end rounded-[1rem] bg-muted p-1.5"
                  : "flex aspect-square w-full max-w-12 items-end rounded-[0.9rem] bg-muted p-1 sm:max-w-14"
                : "flex h-36 w-full items-end rounded-[1.25rem] bg-muted p-2 sm:h-40"
            }
          >
            <div
              className={
                compact
                  ? fill
                    ? "w-full rounded-[0.8rem] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_75%,white),var(--primary))] transition-all"
                    : "h-full w-full rounded-[0.7rem] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_75%,white),var(--primary))] transition-all"
                  : "w-full rounded-[0.9rem] bg-[linear-gradient(180deg,color-mix(in_oklch,var(--primary)_75%,white),var(--primary))] transition-all"
              }
              style={{ height: `${Math.max(day.percent, 8)}%` }}
            />
          </div>
          <div className="space-y-1 text-center">
            <p className={compact ? "text-[0.82rem] font-semibold text-foreground" : "text-sm font-semibold text-foreground"}>
              {day.percent}%
            </p>
            <p className={compact ? "text-[0.58rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase" : "text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase"}>
              {day.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
