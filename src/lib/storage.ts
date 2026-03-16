const PREFIX = 'personal-assistant'

export function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${key}`)
    if (raw == null) return defaultValue
    return JSON.parse(raw) as T
  } catch {
    return defaultValue
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value))
  } catch {}
}
