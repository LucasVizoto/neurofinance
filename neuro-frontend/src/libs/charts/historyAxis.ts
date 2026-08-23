const MAX_TICKS = 7

export function parseHistoryTimestamp(label: string, index: number, total: number): number {
  if (/^\d{4}-\d{2}-\d{2}/.test(label)) {
    return Date.parse(`${label.slice(0, 10)}T12:00:00`)
  }

  if (/^\d{4}-\d{2}$/.test(label)) {
    return Date.parse(`${label}-01T12:00:00`)
  }

  if (/^\d{2}:\d{2}$/.test(label)) {
    const [hours, minutes] = label.split(':').map(Number)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    return date.getTime()
  }

  const dayTime = label.match(/^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?(?:\s+(\d{2}):(\d{2}))?$/)

  if (dayTime) {
    const day = Number(dayTime[1])
    const month = Number(dayTime[2]) - 1
    const yearPart = dayTime[3]
    const year = yearPart ? (yearPart.length === 2 ? 2000 + Number(yearPart) : Number(yearPart)) : new Date().getFullYear()
    const hours = dayTime[4] ? Number(dayTime[4]) : 12
    const minutes = dayTime[5] ? Number(dayTime[5]) : 0

    return new Date(year, month, day, hours, minutes).getTime()
  }

  const monthYear = label.match(/^(\d{2})\/(\d{4})$/)

  if (monthYear) {
    return new Date(Number(monthYear[2]), Number(monthYear[1]) - 1, 1).getTime()
  }

  return Date.now() - (total - index) * 86_400_000
}

export function historyXAxisFormat(period?: string) {
  if (period === '1D') return 'HH:mm'
  if (period === '1Y') return 'MM/yyyy'

  return 'dd/MM'
}

export function toHistorySeries(points: Array<{ date: string; value: number }>) {
  return points.map((point, index) => ({
    x: parseHistoryTimestamp(point.date, index, points.length),
    y: point.value
  }))
}

export function historyTickAmount(pointCount: number) {
  if (pointCount <= MAX_TICKS) return undefined

  return MAX_TICKS
}
