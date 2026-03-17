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
