import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = ['income', 'expense', 'transfer'] as const

type TransactionType = (typeof VALID_TYPES)[number]

const parseDateOnly = (dateStr: string) => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  // Normalize to date-only to match @db.Date comparisons
  return new Date(date.toISOString().split('T')[0])
}

// GET /api/budget/transactions?date=YYYY-MM-DD
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')

    if (!dateStr) {
      return NextResponse.json(
        { error: 'date is required (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const date = parseDateOnly(dateStr)
    if (!date) {
      return NextResponse.json(
        { error: 'invalid date format' },
        { status: 400 }
      )
    }

    const transactions = await prisma.budgetTransaction.findMany({
      where: { transactionDate: date },
      orderBy: { createdAt: 'desc' },
      include: {
        account: true,
        toAccount: true,
        category: true
      }
    })

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income' && !t.exclude)
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const totalExpense = transactions
      .filter((t: any) => t.type === 'expense' && !t.exclude)
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const totalExcluded = transactions
      .filter((t: any) => t.exclude && t.type === 'expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)

    const payload = transactions.map((t: any) => ({
      ...t,
      amount: Number(t.amount),
      account: t.account ? { ...t.account, balance: Number(t.account.balance) } : null,
      toAccount: t.toAccount ? { ...t.toAccount, balance: Number(t.toAccount.balance) } : null
    }))

    return NextResponse.json({
      transactions: payload,
      totalIncome,
      totalExpense,
      totalExcluded,
      net: totalIncome - totalExpense
    })
  } catch (error) {
    console.error('Error fetching budget transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/budget/transactions - create income/expense/transfer
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, toAccountId, categoryId, type, amount, description, transactionDate, exclude } = body

    if (!accountId || !type || amount === undefined) {
      return NextResponse.json(
        { error: 'accountId, type, amount are required' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "type must be 'income', 'expense', or 'transfer'" },
        { status: 400 }
      )
    }

    // Validate based on type
    if (type === 'transfer') {
      if (!toAccountId) {
        return NextResponse.json(
          { error: 'toAccountId is required for transfer type' },
          { status: 400 }
        )
      }
      if (accountId === toAccountId) {
        return NextResponse.json(
          { error: 'Cannot transfer to the same account' },
          { status: 400 }
        )
      }
    } else {
      // income or expense
      if (!categoryId) {
        return NextResponse.json(
          { error: 'categoryId is required for income/expense type' },
          { status: 400 }
        )
      }
    }

    const numericAmount = Number(amount)
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    const date = transactionDate ? parseDateOnly(transactionDate) : new Date()
    if (!date) {
      return NextResponse.json(
        { error: 'invalid transactionDate' },
        { status: 400 }
      )
    }

    const isExcluded = typeof exclude === 'boolean' ? exclude : false

    if (type === 'transfer') {
      // Transfer: deduct from accountId, add to toAccountId
      const [created, updatedFrom, updatedTo] = await prisma.$transaction([
        prisma.budgetTransaction.create({
          data: {
            accountId,
            toAccountId,
            type: type as TransactionType,
            amount: numericAmount,
            description: description || null,
            transactionDate: date,
            categoryId: null,
            exclude: isExcluded
          },
          include: {
            account: true,
            toAccount: true,
            category: true
          }
        }),
        prisma.account.update({
          where: { id: accountId },
          data: { balance: { decrement: numericAmount } }
        }),
        prisma.account.update({
          where: { id: toAccountId },
          data: { balance: { increment: numericAmount } }
        })
      ])

      return NextResponse.json(
        {
          ...created,
          amount: Number(created.amount),
          account: updatedFrom ? { ...updatedFrom, balance: Number(updatedFrom.balance) } : null,
          toAccount: updatedTo ? { ...updatedTo, balance: Number(updatedTo.balance) } : null
        },
        { status: 201 }
      )
    } else {
      // Income/Expense
      const balanceDelta = type === 'income' ? numericAmount : -numericAmount

      const [created, updatedAccount] = await prisma.$transaction([
        prisma.budgetTransaction.create({
          data: {
            accountId,
            categoryId,
            toAccountId: null,
            type: type as TransactionType,
            amount: numericAmount,
            description: description || null,
            transactionDate: date,
            exclude: isExcluded
          },
          include: {
            account: true,
            toAccount: true,
            category: true
          }
        }),
        prisma.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceDelta
            }
          }
        })
      ])

      return NextResponse.json(
        {
          ...created,
          amount: Number(created.amount),
          account: updatedAccount ? { ...updatedAccount, balance: Number(updatedAccount.balance) } : null,
          toAccount: null
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error creating budget transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}
