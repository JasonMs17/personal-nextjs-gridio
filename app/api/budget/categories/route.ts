import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/budget/categories - list budget categories
export async function GET() {
  try {
    const categories = await prisma.budgetCategory.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching budget categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget categories' },
      { status: 500 }
    )
  }
}

// POST /api/budget/categories - create new budget category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: "type must be 'income' or 'expense'" },
        { status: 400 }
      )
    }

    const category = await prisma.budgetCategory.create({
      data: { name, type }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating budget category:', error)
    return NextResponse.json(
      { error: 'Failed to create budget category' },
      { status: 500 }
    )
  }
}
