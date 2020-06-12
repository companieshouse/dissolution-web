export function asFormattedDate(companyIncDate: string): string {
  const d = new Date(companyIncDate)
  const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
  const mo = new Intl.DateTimeFormat('en', { month: 'short' }).format(d)
  const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
  return `${da} ${mo} ${ye}`
}