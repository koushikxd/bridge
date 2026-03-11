import { addDays, compareAsc, format, isValid, parse } from "date-fns"

const TIME_VALUE_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

type DayPeriod = "AM" | "PM"

type ZonedDateParts = {
  year: number
  month: number
  day: number
}

type ZonedDateTimeParts = ZonedDateParts & {
  hours: number
  minutes: number
  seconds?: number
  milliseconds?: number
}

const formatterCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
) {
  const cacheKey = `${locale}:${timeZone}:${JSON.stringify(options)}`
  const cached = formatterCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    ...options,
  })

  formatterCache.set(cacheKey, formatter)
  return formatter
}

export function getBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
  } catch {
    return "UTC"
  }
}

export function normalizeTimeZone(timeZone?: string | null) {
  if (!timeZone) {
    return "UTC"
  }

  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date())
    return timeZone
  } catch {
    return "UTC"
  }
}

export function normalizeTimeValue(value: string) {
  if (!TIME_VALUE_REGEX.test(value)) {
    return null
  }

  const parsed = parse(value, "HH:mm", new Date())

  if (!isValid(parsed)) {
    return null
  }

  return format(parsed, "HH:mm")
}

export function formatTimeValue(value: string) {
  const normalized = normalizeTimeValue(value)

  if (!normalized) {
    return value
  }

  return format(parse(normalized, "HH:mm", new Date()), "h:mm aa")
}

export function normalizeTimeValues(values: string[]) {
  const uniqueValues = new Set<string>()

  for (const value of values) {
    const normalized = normalizeTimeValue(value)

    if (normalized) {
      uniqueValues.add(normalized)
    }
  }

  return Array.from(uniqueValues).sort((left, right) => {
    const leftDate = parse(left, "HH:mm", new Date())
    const rightDate = parse(right, "HH:mm", new Date())
    return compareAsc(leftDate, rightDate)
  })
}

export function fromTwelveHourTime(
  hourValue: string,
  minuteValue: string,
  period: DayPeriod
) {
  const hour = Number(hourValue)
  const minutes = Number(minuteValue)

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minutes) ||
    hour < 1 ||
    hour > 12 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return "08:00"
  }

  const normalizedHours = period === "AM" ? hour % 12 : (hour % 12) + 12

  return `${String(normalizedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function toTwelveHourTime(value: string): {
  hour: string
  minute: string
  period: DayPeriod
} {
  const normalized = normalizeTimeValue(value) ?? "08:00"
  const [hourText, minute] = normalized.split(":")
  const hour = Number(hourText)
  const period: DayPeriod = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12

  return {
    hour: String(displayHour),
    minute,
    period,
  }
}

function getZonedDateTimeParts(timestamp: number, timeZone: string) {
  const formatter = getFormatter("en-US", normalizeTimeZone(timeZone), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })

  const formatted = formatter.formatToParts(new Date(timestamp))
  const lookup = Object.fromEntries(
    formatted
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hours: Number(lookup.hour),
    minutes: Number(lookup.minute),
    seconds: Number(lookup.second),
  }
}

function getTimeZoneOffsetMilliseconds(timeZone: string, timestamp: number) {
  const parts = getZonedDateTimeParts(timestamp, timeZone)
  const utcTimestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hours,
    parts.minutes,
    parts.seconds,
    0
  )

  return utcTimestamp - timestamp
}

export function zonedDateTimeToTimestamp(
  timeZone: string,
  {
    year,
    month,
    day,
    hours,
    minutes,
    seconds = 0,
    milliseconds = 0,
  }: ZonedDateTimeParts
) {
  const normalizedTimeZone = normalizeTimeZone(timeZone)
  const guess = Date.UTC(
    year,
    month - 1,
    day,
    hours,
    minutes,
    seconds,
    milliseconds
  )
  const firstOffset = getTimeZoneOffsetMilliseconds(normalizedTimeZone, guess)
  const firstPass = guess - firstOffset
  const secondOffset = getTimeZoneOffsetMilliseconds(
    normalizedTimeZone,
    firstPass
  )

  return guess - secondOffset
}

export function getZonedDateParts(
  timestamp: number,
  timeZone: string
): ZonedDateParts {
  const { year, month, day } = getZonedDateTimeParts(timestamp, timeZone)
  return { year, month, day }
}

export function addDaysInTimeZone(
  timestamp: number,
  amount: number,
  timeZone: string,
  timeValue = "00:00"
) {
  const normalizedTime = normalizeTimeValue(timeValue) ?? "00:00"
  const [hours, minutes] = normalizedTime.split(":").map(Number)
  const { year, month, day } = getZonedDateParts(timestamp, timeZone)
  const shifted = addDays(new Date(Date.UTC(year, month - 1, day)), amount)

  return zonedDateTimeToTimestamp(timeZone, {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours,
    minutes,
  })
}

export function getStartOfDayInTimeZone(timestamp: number, timeZone: string) {
  return addDaysInTimeZone(timestamp, 0, timeZone, "00:00")
}

export function getEndOfDayInTimeZone(timestamp: number, timeZone: string) {
  return addDaysInTimeZone(timestamp, 1, timeZone, "00:00") - 1
}

export function buildDoseTimestamp(
  dayTimestamp: number,
  timeValue: string,
  timeZone: string
) {
  return addDaysInTimeZone(dayTimestamp, 0, timeZone, timeValue)
}

export function formatTimestampInTimeZone(
  timestamp: number,
  timeZone: string,
  locale = "en-US"
) {
  return getFormatter(locale, normalizeTimeZone(timeZone), {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(timestamp))
}

export function formatWeekdayInTimeZone(
  timestamp: number,
  timeZone: string,
  locale = "en-US"
) {
  return getFormatter(locale, normalizeTimeZone(timeZone), {
    weekday: "short",
  }).format(new Date(timestamp))
}
