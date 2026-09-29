import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/assessments/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        submissions: {
          include: { student: { include: { programme: true } } },
          orderBy: { submittedAt: 'desc' },
        },
        grades: {
          include: { student: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!assessment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error('Error fetching assessment:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch assessment' }, { status: 500 })
  }
}

// PATCH /api/assessments/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        title: body.title,
        module: body.module,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
      },
    })
    return NextResponse.json(assessment)
  } catch (error: any) {
    console.error('Error updating assessment:', error)
    return NextResponse.json({ error: error.message || 'Failed to update assessment' }, { status: 500 })
  }
}

// DELETE /api/assessments/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.assessment.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting assessment:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete assessment' }, { status: 500 })
  }
}
