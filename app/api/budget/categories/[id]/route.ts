import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/budget/categories/:id - Update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, type } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (type && type !== 'income' && type !== 'expense') {
      return NextResponse.json(
        { error: "type must be 'income' or 'expense'" },
        { status: 400 }
      )
    }

    const category = await prisma.budgetCategory.update({
      where: { id },
      data: {
        name,
        ...(type && { type })
      }
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating budget category:', error)
    return NextResponse.json(
      { error: 'Failed to update budget category' },
      { status: 500 }
    )
  }
}

// DELETE /api/budget/categories/:id - Delete category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.budgetCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting budget category:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget category' },
      { status: 500 }
    )
  }
}
