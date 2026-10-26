import type { Account, BudgetCategory, BudgetTransaction } from '@/types'

export type TransactionType = BudgetTransaction['type']
export type CategoryType = BudgetCategory['type']

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
})

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)

export const formatCompactCurrency = (value: number) => `Rp ${compactFormatter.format(value)}`

// ---------------------------------------------------------------------------
// Dates
// Transaction dates are calendar dates (@db.Date). Work with local "YYYY-MM-DD"
// keys so a late-night entry in UTC+7 doesn't shift to the previous day.
// ---------------------------------------------------------------------------

export const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** API dates arrive as "YYYY-MM-DDT00:00:00.000Z"; the date part is the calendar date. */
export const apiDateKey = (value: Date | string) =>
  typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10)

export const keyToDate = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

export const monthRange = (month: Date) => {
  const first = startOfMonth(month)
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const days: string[] = []
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(toDateKey(new Date(first.getFullYear(), first.getMonth(), d)))
  }
  return { from: toDateKey(first), to: toDateKey(last), days }
}

export const formatMonth = (month: Date) =>
  month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

export const formatDayHeading = (key: string) => {
  const today = toDateKey(new Date())
  const yesterday = toDateKey(new Date(Date.now() - 86_400_000))
  const label = keyToDate(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (key === today) return `Today · ${label}`
  if (key === yesterday) return `Yesterday · ${label}`
  return label
}

/** Default date for a new transaction: today, clamped into the period being viewed. */
export const defaultEntryDate = (from: string, to: string) => {
  const today = toDateKey(new Date())
  if (today < from) return from
  if (today > to) return to
  return today
}

// ---------------------------------------------------------------------------
// Amounts
// ---------------------------------------------------------------------------

const MULTIPLIERS: Record<string, number> = { k: 1e3, rb: 1e3, m: 1e6, jt: 1e6, b: 1e9, bn: 1e9 }

/**
 * Parses amounts the way people type them: "20000", "20.000", "20,000", "Rp20.000",
 * "20k", "1.5m", "1,5jt". Returns NaN when the text isn't an amount.
 */
export const parseAmount = (raw: string): number => {
  let text = raw.trim().toLowerCase().replace(/^rp\.?\s*/, '')
  let multiplier = 1
  const suffix = text.match(/(k|rb|m|jt|bn|b)$/)
  if (suffix) {
    multiplier = MULTIPLIERS[suffix[1]]
    text = text.slice(0, -suffix[1].length)
  }

  if (/^\d{1,3}([.,]\d{3})+$/.test(text) && multiplier === 1) {
    // Thousand separators: 20.000 / 1,250,000
    return Number(text.replace(/[.,]/g, ''))
  }
  if (/^\d+([.,]\d+)?$/.test(text)) {
    return Number(text.replace(',', '.')) * multiplier
  }
  return NaN
}

// ---------------------------------------------------------------------------
// Quick input: "<account> <category…> <amount> [description…]"
// ---------------------------------------------------------------------------

const findByName = <T extends { name: string }>(items: T[], query: string) => {
  const q = query.toLowerCase()
  return (
    items.find((i) => i.name.toLowerCase() === q) ??
    items.find((i) => i.name.toLowerCase().startsWith(q)) ??
    items.find((i) => i.name.toLowerCase().includes(q))
  )
}

export type QuickInputResult =
  | { ok: true; accountId: string; categoryId: string; amount: number; description: string; accountName: string; categoryName: string }
  | { ok: false; error: string }

export const parseQuickInput = (
  text: string,
  type: CategoryType,
  accounts: Account[],
  categories: BudgetCategory[]
): QuickInputResult => {
  const parts = text.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 3) {
    return { ok: false, error: 'Format: account category amount [note], e.g. BCA food 20000' }
  }

  // The amount is the last number-like token after the account and category
  let amountIndex = -1
  for (let i = parts.length - 1; i >= 2; i--) {
    if (parseAmount(parts[i]) > 0) {
      amountIndex = i
      break
    }
  }
  if (amountIndex === -1) {
    return { ok: false, error: 'Add an amount, e.g. 20000, 20.000 or 20k' }
  }

  const accountName = parts[0]
  const categoryName = parts.slice(1, amountIndex).join(' ')

  const account = findByName(accounts, accountName)
  if (!account) {
    return { ok: false, error: `Account "${accountName}" not found` }
  }

  const category = findByName(categories.filter((c) => c.type === type), categoryName)
  if (!category) {
    return { ok: false, error: `No ${type} category matches "${categoryName}"` }
  }

  return {
    ok: true,
    accountId: account.id,
    categoryId: category.id,
    amount: parseAmount(parts[amountIndex]),
    description: parts.slice(amountIndex + 1).join(' '),
    accountName: account.name,
    categoryName: category.name
  }
}

// ---------------------------------------------------------------------------
// Aggregates
// ---------------------------------------------------------------------------

/** Excluded expenses and transfers don't count toward income/expense totals. */
export const countsTowardTotals = (t: BudgetTransaction) => t.type !== 'transfer' && !t.exclude

export const signedAmount = (t: BudgetTransaction) => {
  if (!countsTowardTotals(t)) return 0
  return t.type === 'income' ? Number(t.amount) : -Number(t.amount)
}
