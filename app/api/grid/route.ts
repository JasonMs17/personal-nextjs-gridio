import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/grid?workspaceId=xxx&date=2024-01-01 - Get grid data for date
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const dateStr = searchParams.get('date')

    if (!workspaceId || !dateStr) {
      return NextResponse.json(
        { error: 'workspaceId and date are required' },
        { status: 400 }
      )
    }

    const date = new Date(dateStr)

    // Get all categories with their entries for the specified date
    const categories = await prisma.category.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
      include: {
        entries: {
          where: {
            entryDate: date
          }
        }
      }
    })

    // Transform to grid format
    const gridData = categories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      entryId: cat.entries[0]?.id || null,
      title: cat.entries[0]?.title || '',
      content: cat.entries[0]?.content || ''
    }))

    return NextResponse.json(gridData)
  } catch (error) {
    console.error('Error fetching grid data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grid data' },
      { status: 500 }
    )
  }
}
