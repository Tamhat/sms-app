import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/grades/[id] — publish/unpublish or update feedback
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const data: Record<string, unknown> = {}
    if (body.isPublished !== undefined) {
      data.isPublished = body.isPublished
      data.publishedAt = body.isPublished ? new Date() : null
    }
    if (body.feedback !== undefined) data.feedback = body.feedback
    if (body.score !== undefined) {
      if (body.score < 0 || body.score > 100) {
        return NextResponse.json({ error: 'Score must be 0–100' }, { status: 400 })
      }
      const { getClassification } = await import('@/lib/utils')
      data.score = body.score
      data.classification = getClassification(body.score)
      // Reset publish when score changes
      data.isPublished = false
      data.publishedAt = null
    }

    const grade = await prisma.grade.update({
      where: { id },
      data,
      include: { student: true, assessment: true },
    })
    return NextResponse.json(grade)
  } catch (error: any) {
    console.error('Error updating grade:', error)
    return NextResponse.json({ error: error.message || 'Failed to update grade' }, { status: 500 })
  }
}

// DELETE /api/grades/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.grade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting grade:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete grade' }, { status: 500 })
  }
}
