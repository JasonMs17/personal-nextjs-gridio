import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TYPES = ['income', 'expense', 'transfer'] as const

type TransactionType = (typeof VALID_TYPES)[number]

const parseDateOnly = (dateStr: string) => {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.toISOString().split('T')[0])
}

// PUT /api/budget/transactions/[id] - update transaction
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { accountId, toAccountId, categoryId, type, amount, description, transactionDate, exclude } = body

    // Get existing transaction
    const existing = await prisma.budgetTransaction.findUnique({
      where: { id },
      include: { account: true, toAccount: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (accountId !== undefined) {
      updateData.accountId = accountId
    }
    if (toAccountId !== undefined) {
      updateData.toAccountId = toAccountId
    }
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId
    }
    if (type !== undefined) {
      if (!VALID_TYPES.includes(type)) {
        return NextResponse.json(
          { error: "type must be 'income', 'expense', or 'transfer'" },
          { status: 400 }
        )
      }
      updateData.type = type
    }
    if (amount !== undefined) {
      const numAmount = Number(amount)
      if (Number.isNaN(numAmount) || numAmount <= 0) {
        return NextResponse.json(
          { error: 'amount must be a positive number' },
          { status: 400 }
        )
      }
      updateData.amount = numAmount
    }
    if (description !== undefined) {
      updateData.description = description || null
    }
    if (transactionDate !== undefined) {
      const date = parseDateOnly(transactionDate)
      if (!date) {
        return NextResponse.json(
          { error: 'invalid transactionDate' },
          { status: 400 }
        )
      }
      updateData.transactionDate = date
    }
    if (exclude !== undefined) {
      updateData.exclude = exclude
    }

    // Use transaction to ensure atomicity when updating balance
    const finalType = type || existing.type
    const finalAmount = Number(amount) || Number(existing.amount)
    const finalAccountId = accountId || existing.accountId
    const finalToAccountId = toAccountId || existing.toAccountId
    const oldAmount = Number(existing.amount)
    const oldAccountId = existing.accountId

    // If amount or account changed, we need to adjust balances
    if (finalAmount !== oldAmount || finalAccountId !== oldAccountId) {
      const updates: any[] = [
        prisma.budgetTransaction.update({
          where: { id },
          data: updateData,
          include: {
            account: true,
            toAccount: true,
            category: true
          }
        }),
        // Revert old account balance
        prisma.account.update({
          where: { id: oldAccountId },
          data: {
            balance: {
              increment:
                existing.type === 'income'
                  ? -oldAmount
                  : existing.type === 'expense'
                    ? oldAmount
                    : existing.type === 'transfer'
                      ? oldAmount
                      : 0
            }
          }
        }),
        // Apply new account balance
        prisma.account.update({
          where: { id: finalAccountId },
          data: {
            balance: {
              increment:
                finalType === 'income'
                  ? finalAmount
                  : finalType === 'expense'
                    ? -finalAmount
                    : finalType === 'transfer'
                      ? -finalAmount
                      : 0
            }
          }
        })
      ]

      // Add toAccount updates only if needed
      if (finalToAccountId && finalToAccountId !== oldAccountId) {
        updates.push(
          prisma.account.update({
            where: { id: finalToAccountId },
            data: {
              balance: { increment: finalAmount }
            }
          })
        )
      }

      // Revert old toAccount if transfer changed
      if (existing.toAccountId && finalToAccountId !== existing.toAccountId) {
        updates.push(
          prisma.account.update({
            where: { id: existing.toAccountId },
            data: {
              balance: { decrement: oldAmount }
            }
          })
        )
      }

      const [updated] = await prisma.$transaction(updates)

      return NextResponse.json(
        {
          ...updated,
          amount: Number(updated.amount),
          account: updated.account ? { ...updated.account, balance: Number(updated.account.balance) } : null,
          toAccount: updated.toAccount ? { ...updated.toAccount, balance: Number(updated.toAccount.balance) } : null
        },
        { status: 200 }
      )
    } else {
      // Simple update without balance changes
      const updated = await prisma.budgetTransaction.update({
        where: { id },
        data: updateData,
        include: {
          account: true,
          toAccount: true,
          category: true
        }
      })

      return NextResponse.json(
        {
          ...updated,
          amount: Number(updated.amount),
          account: updated.account ? { ...updated.account, balance: Number(updated.account.balance) } : null,
          toAccount: updated.toAccount ? { ...updated.toAccount, balance: Number(updated.toAccount.balance) } : null
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error updating budget transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/budget/transactions/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaction = await prisma.budgetTransaction.findUnique({
      where: { id },
      include: { account: true, toAccount: true }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const amount = Number(transaction.amount)

    // Revert balance changes
    const updates: any[] = [
      prisma.budgetTransaction.delete({ where: { id } }),
      // Revert from account
      prisma.account.update({
        where: { id: transaction.accountId },
        data: {
          balance: {
            increment:
              transaction.type === 'income'
                ? -amount
                : transaction.type === 'expense'
                  ? amount
                  : transaction.type === 'transfer'
                    ? amount
                    : 0
          }
        }
      })
    ]

    // Add revert to account if transfer
    if (transaction.toAccountId) {
      updates.push(
        prisma.account.update({
          where: { id: transaction.toAccountId },
          data: {
            balance: { decrement: amount }
          }
        })
      )
    }

    await prisma.$transaction(updates)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting budget transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
