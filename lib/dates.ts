export function recordDate(date: string, includeYear = true) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "short", day: "numeric", ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(`${date}T00:00:00Z`));
}
