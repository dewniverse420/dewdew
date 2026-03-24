/**
 * 将 ISO 时间字符串转为 <input type="datetime-local"> 所需的本地时间格式 "yyyy-MM-ddThh:mm"。
 * 存的是 UTC（toISOString），表盘显示必须用本地时间，否则会出现“选 14:30 却变成 06:30”等问题。
 */
export function isoToLocalDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

/** 本地日历日 YYYY-MM-DD */
export function localDateStrFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 某日本地 23:59:59.999 对应的 UTC ISO 字符串 */
export function localEndOfDayIsoFromDateStr(dateStr: string): string {
  const [y, mo, da] = dateStr.split('-').map((x) => Number(x))
  if (!y || !mo || !da) return new Date().toISOString()
  const dt = new Date(y, mo - 1, da, 23, 59, 59, 999)
  return dt.toISOString()
}

/** 本地某日 + 可选 HH:mm；未指定时间则为该日 23:59:59.999 */
export function localDateAndOptionalTimeToIso(dateStr: string, timeHm: string | ''): string {
  const [y, mo, da] = dateStr.split('-').map((x) => Number(x))
  if (!y || !mo || !da) return new Date().toISOString()
  if (!timeHm || !/^\d{2}:\d{2}$/.test(timeHm)) {
    return localEndOfDayIsoFromDateStr(dateStr)
  }
  const [h, min] = timeHm.split(':').map((x) => Number(x))
  if (!Number.isFinite(h) || !Number.isFinite(min)) return localEndOfDayIsoFromDateStr(dateStr)
  return new Date(y, mo - 1, da, h, min, 0, 0).toISOString()
}

/** 是否为「仅日期」语义：本地 23:59 且秒为 59（与 localEndOfDay 一致） */
export function isLocalEndOfDayIso(iso: string): boolean {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d.getHours() === 23 && d.getMinutes() === 59 && d.getSeconds() >= 59
}

/** 用于创建页：拆成日期、是否指定时刻、时刻 HH:mm（仅日期时 time 为占位，不展示） */
export function parseIsoToDdlParts(iso: string): {
  ddlDate: string
  useSpecificTime: boolean
  timeStr: string
} {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const today = localDateStrFromDate(new Date())
    return { ddlDate: today, useSpecificTime: false, timeStr: '09:00' }
  }
  const ddlDate = localDateStrFromDate(d)
  if (isLocalEndOfDayIso(iso)) {
    return { ddlDate, useSpecificTime: false, timeStr: '09:00' }
  }
  const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { ddlDate, useSpecificTime: true, timeStr }
}
