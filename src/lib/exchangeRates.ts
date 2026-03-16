/**
 * 从 Frankfurter 获取实时/历史汇率，无 API Key，带内存缓存。
 * 文档: https://www.frankfurter.dev/docs/
 */

const API_BASE = 'https://api.frankfurter.dev/v1'
const CACHE_MS = 60 * 60 * 1000 // 1 小时

interface CacheEntry {
  rate: number
  at: number
}

const cache = new Map<string, CacheEntry>()

function cacheKey(from: string, to: string, date?: string): string {
  return `${from}:${to}:${date ?? 'latest'}`
}

/** 支持的币种（Frankfurter 支持列表子集，与 CURRENCIES 一致） */
export const SUPPORTED_CODES = new Set([
  'AUD', 'CAD', 'CHF', 'CNY', 'EUR', 'GBP', 'HKD', 'JPY', 'KRW', 'MYR', 'SGD', 'USD',
])

/**
 * 获取汇率：1 单位 from 币种 = 返回值 单位 to 币种。
 * @param from 源币种，如 USD
 * @param to 目标币种，如 CNY
 * @param date 可选，历史日期 YYYY-MM-DD，不传则取最新
 */
export async function fetchExchangeRate(
  from: string,
  to: string,
  date?: string,
): Promise<number> {
  const fromU = from.toUpperCase()
  const toU = to.toUpperCase()
  if (fromU === toU) return 1
  if (!SUPPORTED_CODES.has(fromU) || !SUPPORTED_CODES.has(toU)) {
    throw new Error('Unsupported currency code')
  }

  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Invalid date format')
  }

  const key = cacheKey(fromU, toU, date)
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.rate

  const url = date
    ? `${API_BASE}/${encodeURIComponent(date)}?base=${fromU}&symbols=${toU}`
    : `${API_BASE}/latest?base=${fromU}&symbols=${toU}`

  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `HTTP ${res.status}`)
  }
  const data = await res.json()
  const rate = data?.rates?.[toU]
  if (typeof rate !== 'number' || rate <= 0) throw new Error('Invalid rate in response')
  cache.set(key, { rate, at: Date.now() })
  return rate
}
