import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/budget/accounts - list all accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'asc' }
    })

    const payload = accounts.map((a) => ({
      ...a,
      balance: Number(a.balance)
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}

// POST /api/budget/accounts - create account
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, initialBalance } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const balance = typeof initialBalance === 'number' ? initialBalance : 0

    const account = await prisma.account.create({
      data: {
        name,
        balance
      }
    })

    return NextResponse.json({
      ...account,
      balance: Number(account.balance)
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
