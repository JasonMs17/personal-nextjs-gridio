export interface Workspace {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    categories: number
  }
}

export interface Category {
  id: string
  workspaceId: string
  name: string
  icon: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface Entry {
  id: string
  categoryId: string
  entryDate: Date
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface GridItem {
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  entryId: string | null
  title: string
  content: string
}

export interface Account {
  id: string
  name: string
  balance: number
  createdAt: Date
  updatedAt: Date
}

export interface BudgetCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  createdAt: Date
  updatedAt: Date
}

export interface BudgetTransaction {
  id: string
  accountId: string
  toAccountId: string | null
  categoryId: string | null
  type: 'income' | 'expense' | 'transfer'
  amount: number
  description: string | null
  transactionDate: Date
  createdAt: Date
  updatedAt: Date
  account?: Account
  toAccount?: Account
  category?: BudgetCategory
}
