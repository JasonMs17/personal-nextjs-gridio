import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories?workspaceId=xxx - Get categories by workspace
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    const categories = await prisma.category.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { workspaceId, name, icon, color } = body

    if (!workspaceId || !name) {
      return NextResponse.json(
        { error: 'workspaceId and name are required' },
        { status: 400 }
      )
    }

    // Validate that workspaceId is not empty or null
    if (typeof workspaceId !== 'string' || workspaceId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid workspaceId provided' },
        { status: 400 }
      )
    }

    // Verify workspace exists
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    })

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const category = await prisma.category.create({
      data: {
        workspaceId,
        name,
        icon: icon || '📝',
        color: color || '#808080'
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
