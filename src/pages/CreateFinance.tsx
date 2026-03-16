import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../lib/i18n'
import { CURRENCIES, CURRENCIES_EN, EXPENSE_CATEGORY_KEYS, INCOME_CATEGORY_KEYS } from '../lib/finance'
import { fetchExchangeRate, SUPPORTED_CODES } from '../lib/exchangeRates'
import { getFinanceEntries, getFinanceSettings, setFinanceEntries } from '../lib/store'
import type { FinanceEntry, FinanceType } from '../types'
import './CreateFinance.css'

export default function CreateFinance() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const isZh = lang === 'zh'
  const settings = getFinanceSettings()
  const refCurrency = settings.referenceCurrency
  const currencyList = isZh ? CURRENCIES : CURRENCIES_EN
  const existing = editId ? getFinanceEntries().find((e) => e.id === editId) : undefined

  const [type, setType] = useState<FinanceType>(existing?.type ?? 'expense')
  const [amount, setAmount] = useState(existing ? String(existing.amount) : '')
  const [currency, setCurrency] = useState(existing?.currency ?? refCurrency)
  const [rateToRefInput, setRateToRefInput] = useState(
    existing?.rateToRef != null ? String(existing.rateToRef) : '1'
  )
  const [category, setCategory] = useState(existing?.category ?? '')
  const [date, setDate] = useState(
    existing?.date ? existing.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [note, setNote] = useState(existing?.note ?? '')
  const [account, setAccount] = useState(existing?.account ?? '')
  const [rateFetching, setRateFetching] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)

  const categoryKeys = type === 'income' ? INCOME_CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS

  const isRefCurrency = currency === refCurrency
  const rateToRef = isRefCurrency ? 1 : (parseFloat(rateToRefInput.replace(/,/g, '')) || 1)
  const canFetchRate = !isRefCurrency && SUPPORTED_CODES.has(currency) && SUPPORTED_CODES.has(refCurrency)

  useEffect(() => {
    const keys: readonly string[] = type === 'income' ? INCOME_CATEGORY_KEYS : EXPENSE_CATEGORY_KEYS
    if (category && !keys.includes(category)) setCategory(keys[0])
  }, [type])

  const fetchRate = async () => {
    if (!canFetchRate) return
    setRateError(null)
    setRateFetching(true)
    try {
      // 1 本币 = ? 参考货币，使用交易日期获取当日汇率
      const rate = await fetchExchangeRate(currency, refCurrency, date)
      setRateToRefInput(String(rate))
    } catch (e) {
      setRateError(e instanceof Error ? e.message : t('finance.fetchRateError'))
    } finally {
      setRateFetching(false)
    }
  }

  const submit = () => {
    const num = parseFloat(amount.replace(/,/g, ''))
    if (!Number.isFinite(num) || num <= 0) return
    if (!isRefCurrency && (!Number.isFinite(rateToRef) || rateToRef <= 0)) return
    const c = (category && (categoryKeys as readonly string[]).includes(category)) ? category : categoryKeys[0]
    const now = new Date().toISOString()
    const list = getFinanceEntries()
    if (editId && existing) {
      const updated: FinanceEntry = {
        ...existing,
        type,
        amount: num,
        currency,
        rateToRef: isRefCurrency ? 1 : rateToRef,
        category: c,
        date: new Date(date).toISOString().slice(0, 10),
        note: note.trim(),
        account: account.trim() || undefined,
      }
      setFinanceEntries(list.map((e) => (e.id === editId ? updated : e)))
      navigate('/finance')
    } else {
      const entry: FinanceEntry = {
        id: crypto.randomUUID(),
        type,
        amount: num,
        currency,
        rateToRef: isRefCurrency ? 1 : rateToRef,
        category: c,
        date: new Date(date).toISOString().slice(0, 10),
        note: note.trim(),
        account: account.trim() || undefined,
        createdAt: now,
      }
      setFinanceEntries([entry, ...list])
      navigate('/finance')
    }
  }

  return (
    <section className="page create-finance-page">
      <div className="page-heading-row">
        <h2 className="page-heading">{editId ? t('detail.edit') : t('createFinance.heading')}</h2>
        <button type="button" className="btn btn-primary" onClick={submit}>
          {t('common.save')}
        </button>
      </div>
      <form className="form-block" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <div className="finance-type-toggle">
          <button
            type="button"
            className={type === 'income' ? 'active income' : ''}
            onClick={() => setType('income')}
          >
            {t('finance.income')}
          </button>
          <button
            type="button"
            className={type === 'expense' ? 'active expense' : ''}
            onClick={() => setType('expense')}
          >
            {t('finance.expense')}
          </button>
        </div>
        <label className="field">
          <span className="field-label">{t('createFinance.amount')}</span>
          <input
            type="text"
            inputMode="decimal"
            className="input input-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            placeholder="0.00"
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createFinance.currency')}</span>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencyList.map((cur) => (
              <option key={cur.code} value={cur.code}>{cur.code} {cur.name}</option>
            ))}
          </select>
        </label>
        {!isRefCurrency && (
          <label className="field">
            <span className="field-label">{t('createFinance.rateToRef')}</span>
            <div className="field-rate-row">
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={rateToRefInput}
                onChange={(e) => { setRateToRefInput(e.target.value.replace(/[^\d.]/g, '')); setRateError(null) }}
                placeholder={`1 ${currency} = ? ${refCurrency}`}
              />
              {canFetchRate && (
                <button
                  type="button"
                  className="btn btn-outline btn-fetch-rate"
                  onClick={fetchRate}
                  disabled={rateFetching}
                >
                  {rateFetching ? t('finance.fetchingRate') : t('finance.fetchRate')}
                </button>
              )}
            </div>
            {rateError && <span className="field-error">{rateError}</span>}
          </label>
        )}
        <label className="field">
          <span className="field-label">{t('createFinance.category')}</span>
          <select
            className="input"
            value={category || categoryKeys[0]}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categoryKeys.map((key) => (
              <option key={key} value={key}>{t(`finance.category.${key}`)}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">{t('createFinance.date')}</span>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createFinance.account')}</span>
          <input
            type="text"
            className="input"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder={isZh ? '微信/支付宝/现金' : 'WeChat/Cash'}
          />
        </label>
        <label className="field">
          <span className="field-label">{t('createFinance.note')}</span>
          <input
            type="text"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isZh ? '备注' : 'Note'}
          />
        </label>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => navigate(-1)}>{t('common.cancel')}</button>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </section>
  )
}
