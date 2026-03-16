import type { FinanceEntry, FinanceSettings } from '../types'

/** 支出分类 key（存储用，展示时用 i18n 翻译） */
export const EXPENSE_CATEGORY_KEYS = [
  'food', 'transport', 'shopping', 'fun', 'housing', 'medical', 'education', 'phone', 'other_expense',
] as const
/** 收入分类 key */
export const INCOME_CATEGORY_KEYS = [
  'salary', 'bonus', 'side', 'investment', 'gift', 'other_income',
] as const

/** 旧数据里的中文/英文分类文案 → 统一 key，用于聚合与展示 */
export const LEGACY_CATEGORY_TO_KEY: Record<string, string> = {
  餐饮: 'food', Food: 'food',
  交通: 'transport', Transport: 'transport',
  购物: 'shopping', Shopping: 'shopping',
  娱乐: 'fun', Fun: 'fun',
  住房: 'housing', Housing: 'housing',
  医疗: 'medical', Medical: 'medical',
  教育: 'education', Education: 'education',
  通讯: 'phone', Phone: 'phone',
  其他支出: 'other_expense', Other: 'other_expense',
  工资: 'salary', Salary: 'salary',
  奖金: 'bonus', Bonus: 'bonus',
  兼职: 'side', Side: 'side',
  理财: 'investment', Investment: 'investment',
  礼金: 'gift', Gift: 'gift',
  其他收入: 'other_income',
}

/** 将条目的 category（可能是 key 或旧版中文/英文）转为统一 key */
export function getCategoryKey(category: string): string {
  if (!category) return 'other_expense'
  const key = LEGACY_CATEGORY_TO_KEY[category]
  if (key) return key
  const lower = category.toLowerCase()
  if (EXPENSE_CATEGORY_KEYS.includes(lower as any)) return lower
  if (INCOME_CATEGORY_KEYS.includes(lower as any)) return lower
  return category
}

export const CURRENCIES = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'MYR', name: '马来西亚林吉特', symbol: 'RM' },
]

export const CURRENCIES_EN = [
  { code: 'CNY', name: 'CNY', symbol: '¥' },
  { code: 'USD', name: 'USD', symbol: '$' },
  { code: 'EUR', name: 'EUR', symbol: '€' },
  { code: 'GBP', name: 'GBP', symbol: '£' },
  { code: 'JPY', name: 'JPY', symbol: '¥' },
  { code: 'KRW', name: 'KRW', symbol: '₩' },
  { code: 'HKD', name: 'HKD', symbol: 'HK$' },
  { code: 'AUD', name: 'AUD', symbol: 'A$' },
  { code: 'CAD', name: 'CAD', symbol: 'C$' },
  { code: 'CHF', name: 'CHF', symbol: 'CHF' },
  { code: 'SGD', name: 'SGD', symbol: 'S$' },
  { code: 'MYR', name: 'MYR', symbol: 'RM' },
]

export function getCurrencySymbol(code: string): string {
  const c = CURRENCIES.find((x) => x.code === code)
  return c?.symbol ?? code
}

/**
 * 将条目金额换算为展示货币金额（兼容旧数据无 currency/rateToRef）。
 * 换算链：条目原币种 × rateToRef → 参考货币；参考货币 × refToDisplayRate → 展示货币。
 */
export function entryToDisplayAmount(
  entry: FinanceEntry,
  settings: FinanceSettings,
): number {
  const rateToRef = entry.rateToRef ?? 1
  const amountInRef = entry.amount * rateToRef
  const rate = settings.displayCurrency === settings.referenceCurrency ? 1 : settings.refToDisplayRate
  return amountInRef * rate
}
