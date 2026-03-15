import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/entries?categoryId=xxx - Get entries by category
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'categoryId is required' },
        { status: 400 }
      )
    }

    const entries = await prisma.entry.findMany({
      where: { categoryId },
      orderBy: { entryDate: 'desc' },
      take: 30
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}

// POST /api/entries - Create or update entry
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { categoryId, entryDate, title, content } = body

    if (!categoryId || !entryDate) {
      return NextResponse.json(
        { error: 'categoryId and entryDate are required' },
        { status: 400 }
      )
    }

    const entry = await prisma.entry.upsert({
      where: {
        categoryId_entryDate: {
          categoryId,
          entryDate: new Date(entryDate)
        }
      },
      update: {
        title,
        content
      },
      create: {
        categoryId,
        entryDate: new Date(entryDate),
        title,
        content
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error creating/updating entry:', error)
    return NextResponse.json(
      { error: 'Failed to save entry' },
      { status: 500 }
    )
  }
}
