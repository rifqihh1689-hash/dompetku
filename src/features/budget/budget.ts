import type { Budget, Category, MonthKey, Transaction } from '../../types'

/** Ambang peringatan: anggaran dianggap "hampir habis" mulai 80%. */
export const WARNING_RATIO = 0.8

/**
 * Status anggaran:
 * - `safe`: terpakai < 80%
 * - `warning`: terpakai 80%–100%
 * - `over`: terpakai > 100% (melebihi anggaran)
 */
export type BudgetLevel = 'safe' | 'warning' | 'over'

export function budgetId(month: MonthKey, categoryId: string): string {
  return `${month}:${categoryId}`
}

export function budgetLevel(spent: number, limit: number): BudgetLevel {
  if (limit <= 0) return spent > 0 ? 'over' : 'safe'
  const ratio = spent / limit
  if (ratio > 1) return 'over'
  if (ratio >= WARNING_RATIO) return 'warning'
  return 'safe'
}

export interface BudgetUsage {
  budget: Budget
  category: Category
  spent: number
  /** Sisa anggaran; negatif bila melebihi. */
  remaining: number
  /** Rasio terpakai (bisa > 1). */
  ratio: number
  level: BudgetLevel
}

/** Total pengeluaran per kategori pada bulan tertentu. */
export function spendingByCategory(transactions: readonly Transaction[], month: MonthKey): Map<string, number> {
  const totals = new Map<string, number>()
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.date.startsWith(`${month}-`)) continue
    totals.set(tx.categoryId, (totals.get(tx.categoryId) ?? 0) + tx.amount)
  }
  return totals
}

/** Menghitung pemakaian setiap anggaran pada bulannya, diurutkan dari yang paling kritis. */
export function computeBudgetUsage(
  budgets: readonly Budget[],
  transactions: readonly Transaction[],
  getCategory: (id: string) => Category,
): BudgetUsage[] {
  const byMonth = new Map<MonthKey, Map<string, number>>()
  return budgets
    .map((budget) => {
      let totals = byMonth.get(budget.month)
      if (!totals) {
        totals = spendingByCategory(transactions, budget.month)
        byMonth.set(budget.month, totals)
      }
      const spent = totals.get(budget.categoryId) ?? 0
      return {
        budget,
        category: getCategory(budget.categoryId),
        spent,
        remaining: budget.amount - spent,
        ratio: budget.amount > 0 ? spent / budget.amount : spent > 0 ? Infinity : 0,
        level: budgetLevel(spent, budget.amount),
      }
    })
    .sort((a, b) => b.ratio - a.ratio || a.category.name.localeCompare(b.category.name))
}

export interface BudgetTotals {
  limit: number
  spent: number
  remaining: number
  ratio: number
  level: BudgetLevel
}

export function totalBudget(usages: readonly BudgetUsage[]): BudgetTotals {
  const limit = usages.reduce((s, u) => s + u.budget.amount, 0)
  const spent = usages.reduce((s, u) => s + u.spent, 0)
  return { limit, spent, remaining: limit - spent, ratio: limit > 0 ? spent / limit : 0, level: budgetLevel(spent, limit) }
}

/** Anggaran yang perlu diperhatikan (≥ 80% atau melebihi). */
export function budgetAlerts(usages: readonly BudgetUsage[]): BudgetUsage[] {
  return usages.filter((u) => u.level !== 'safe')
}

/** Pesan status anggaran dalam Bahasa Indonesia. */
export function budgetMessage(usage: Pick<BudgetUsage, 'level' | 'ratio' | 'remaining' | 'category'>, formatMoney: (n: number) => string): string {
  const pct = Math.round(usage.ratio * 100)
  switch (usage.level) {
    case 'over':
      return `Anggaran ${usage.category.name} terlampaui ${formatMoney(-usage.remaining)}`
    case 'warning':
      return `Anggaran ${usage.category.name} sudah ${pct}% terpakai (sisa ${formatMoney(usage.remaining)})`
    case 'safe':
      return `Sisa ${formatMoney(usage.remaining)}`
  }
}
