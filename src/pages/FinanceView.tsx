import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { fetchExchangeRate, SUPPORTED_CODES } from '../lib/exchangeRates'
import { CURRENCIES, CURRENCIES_EN, entryToDisplayAmount, getCategoryKey, getCurrencySymbol } from '../lib/finance'
import { getFinanceEntries, getFinanceSettings, setFinanceSettings } from '../lib/store'
import type { FinanceEntry } from '../types'
import './FinanceView.css'

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b',
]

function getMonthKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export default function FinanceView() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const entries = getFinanceEntries()
  const locale = lang === 'zh' ? 'zh-CN' : 'en'
  const isZh = lang === 'zh'
  const currencyList = isZh ? CURRENCIES : CURRENCIES_EN

  const [selectedMonth, setSelectedMonth] = useState(() => getMonthKey(new Date()))
  const [settings, setSettingsState] = useState(() => getFinanceSettings())
  const [rateFetching, setRateFetching] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)

  const updateSettings = (patch: Partial<typeof settings>) => {
    const next = { ...settings, ...patch }
    setSettingsState(next)
    setFinanceSettings(next)
  }

  const { monthEntries, monthIncome, monthExpense, categoryBreakdown, pieGradient } = useMemo(() => {
    const list = entries.filter((e) => e.date.slice(0, 7) === selectedMonth)
    list.sort((a, b) => b.date.localeCompare(a.date))
    let income = 0
    let expense = 0
    const byCategory = new Map<string, number>()
    list.forEach((e) => {
      const displayAmt = entryToDisplayAmount(e, settings)
      if (e.type === 'income') income += displayAmt
      else {
        expense += displayAmt
        const key = getCategoryKey(e.category)
        byCategory.set(key, (byCategory.get(key) ?? 0) + displayAmt)
      }
    })
    const breakdown = Array.from(byCategory.entries())
      .map(([key, amount]) => ({ key, amount }))
      .sort((a, b) => b.amount - a.amount)
    const total = expense
    const withPercent = breakdown.map((item) => ({
      ...item,
      percent: total > 0 ? (item.amount / total) * 100 : 0,
    }))
    let acc = 0
    const gradientParts = withPercent.map((item, i) => {
      const start = acc
      acc += item.percent
      return `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} ${start}% ${acc}%`
    })
    const pieGradient = gradientParts.length > 0
      ? `conic-gradient(${gradientParts.join(', ')})`
      : 'none'
    return {
      monthEntries: list,
      monthIncome: income,
      monthExpense: expense,
      categoryBreakdown: withPercent,
      pieGradient,
    }
  }, [entries, selectedMonth, settings])

  const goPrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setSelectedMonth(getMonthKey(d))
  }

  const goNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number)
    const d = new Date(y, m, 1)
    if (d > new Date()) return
    setSelectedMonth(getMonthKey(d))
  }

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
  })

  const currentMonthKey = getMonthKey(new Date())
  const canGoNext = selectedMonth < currentMonthKey
  const symbol = getCurrencySymbol(settings.displayCurrency)
  const isDisplayRef = settings.displayCurrency === settings.referenceCurrency
  const canFetchDisplayRate =
    !isDisplayRef &&
    SUPPORTED_CODES.has(settings.referenceCurrency) &&
    SUPPORTED_CODES.has(settings.displayCurrency)

  const fetchDisplayRate = async () => {
    if (!canFetchDisplayRate) return
    setRateError(null)
    setRateFetching(true)
    try {
      // 1 参考货币 = ? 显示货币
      const rate = await fetchExchangeRate(settings.referenceCurrency, settings.displayCurrency)
      updateSettings({ refToDisplayRate: rate })
    } catch (e) {
      setRateError(e instanceof Error ? e.message : t('finance.fetchRateError'))
    } finally {
      setRateFetching(false)
    }
  }

  // 切换显示货币为非参考货币时，自动拉取汇率并写入，确保金额能正确换算
  useEffect(() => {
    if (
      settings.displayCurrency !== settings.referenceCurrency &&
      SUPPORTED_CODES.has(settings.referenceCurrency) &&
      SUPPORTED_CODES.has(settings.displayCurrency)
    ) {
      fetchExchangeRate(settings.referenceCurrency, settings.displayCurrency)
        .then((rate) => updateSettings({ refToDisplayRate: rate }))
        .catch(() => {})
    }
  }, [settings.displayCurrency, settings.referenceCurrency])

  if (entries.length === 0) {
    return (
      <section className="page finance-page">
        <h2 className="page-heading">{t('finance.heading')}</h2>
        <p className="finance-empty">{t('finance.empty')}</p>
      </section>
    )
  }

  return (
    <section className="page finance-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{t('finance.heading')}</h2>
      </div>

      <div className="finance-display-currency">
        <label className="finance-display-currency-label">
          <span>{t('finance.displayCurrency')}</span>
          <select
            className="input finance-display-currency-select"
            value={settings.displayCurrency}
            onChange={(e) => updateSettings({ displayCurrency: e.target.value })}
          >
            {currencyList.map((cur) => (
              <option key={cur.code} value={cur.code}>{cur.code} {cur.name}</option>
            ))}
          </select>
        </label>
        {!isDisplayRef && (
          <>
            <label className="finance-display-currency-rate">
              <span>{t('finance.refToDisplayRate')}</span>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={settings.refToDisplayRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value.replace(/[^\d.]/g, ''))
                  if (Number.isFinite(v)) { updateSettings({ refToDisplayRate: v > 0 ? v : 1 }); setRateError(null) }
                }}
                placeholder={`1 ${settings.referenceCurrency} = ?`}
              />
            </label>
            {canFetchDisplayRate && (
              <button
                type="button"
                className="btn btn-outline finance-fetch-rate-btn"
                onClick={fetchDisplayRate}
                disabled={rateFetching}
              >
                {rateFetching ? t('finance.fetchingRate') : t('finance.fetchRate')}
              </button>
            )}
            {rateError && <span className="finance-display-currency-error">{rateError}</span>}
          </>
        )}
      </div>

      <div className="finance-period">
        <span className="finance-period-label">{t('finance.period')}</span>
        <div className="finance-period-nav">
          <button
            type="button"
            className="finance-period-btn"
            onClick={goPrevMonth}
            aria-label={t('finance.prevMonth')}
          >
            ‹
          </button>
          <span className="finance-period-value">{monthLabel}</span>
          <button
            type="button"
            className="finance-period-btn"
            onClick={goNextMonth}
            disabled={!canGoNext}
            aria-label={t('finance.nextMonth')}
          >
            ›
          </button>
        </div>
      </div>

      <div className="finance-summary">
        <div className="finance-summary-item income">
          <span className="finance-summary-label">{t('finance.income')}</span>
          <span className="finance-summary-value">{symbol}{monthIncome.toFixed(2)}</span>
        </div>
        <div className="finance-summary-item expense">
          <span className="finance-summary-label">{t('finance.expense')}</span>
          <span className="finance-summary-value">{symbol}{monthExpense.toFixed(2)}</span>
        </div>
        <div className="finance-summary-item balance">
          <span className="finance-summary-label">{t('finance.balance')}</span>
          <span className="finance-summary-value">{symbol}{(monthIncome - monthExpense).toFixed(2)}</span>
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <div className="finance-chart-block">
          <h3 className="finance-chart-title">{t('finance.expenseByCategory')}</h3>
          <div className="finance-chart-row">
            <div
              className="finance-pie"
              style={{ background: pieGradient }}
              aria-hidden
            />
            <ul className="finance-category-list">
              {categoryBreakdown.map((item, i) => (
                <li key={item.key} className="finance-category-item">
                  <span
                    className="finance-category-dot"
                    style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                  <span className="finance-category-name">{t(`finance.category.${item.key}`)}</span>
                  <span className="finance-category-amount">{symbol}{item.amount.toFixed(2)}</span>
                  <span className="finance-category-percent">{item.percent.toFixed(1)}%</span>
                  <div className="finance-category-bar-wrap">
                    <div
                      className="finance-category-bar"
                      style={{
                        width: `${item.percent}%`,
                        background: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {categoryBreakdown.length === 0 && monthEntries.length > 0 && (
        <p className="finance-no-expense">{t('finance.noExpenseInPeriod')}</p>
      )}

      <div className="finance-list">
        <h3 className="finance-month-title">{monthLabel}</h3>
        {monthEntries.length === 0 ? (
          <p className="finance-month-empty">{t('finance.empty')}</p>
        ) : (
          <ul className="finance-entries">
            {monthEntries.map((e) => (
              <li key={e.id} className={`finance-entry finance-entry--${e.type}`}>
                <span className="finance-entry-type">{e.type === 'income' ? '+' : '−'}</span>
                <span className="finance-entry-amount">{symbol}{entryToDisplayAmount(e, settings).toFixed(2)}</span>
                <span className="finance-entry-category">{t(`finance.category.${getCategoryKey(e.category)}`)}</span>
                {e.note && <span className="finance-entry-note">{e.note}</span>}
                <span className="finance-entry-date">
                  {new Date(e.date).toLocaleDateString(locale, { month: 'numeric', day: 'numeric' })}
                </span>
                <button
                  type="button"
                  className="btn finance-entry-edit"
                  onClick={() => navigate(`/edit/finance/${e.id}`)}
                  aria-label={t('detail.edit')}
                >
                  {t('detail.edit')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
