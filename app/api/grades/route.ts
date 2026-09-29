import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getClassification } from '@/lib/utils'

// GET /api/grades?studentId=&assessmentId=&published=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') ?? ''
    const assessmentId = searchParams.get('assessmentId') ?? ''
    const published = searchParams.get('published')

    const grades = await prisma.grade.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(assessmentId ? { assessmentId } : {}),
        ...(published !== null ? { isPublished: published === 'true' } : {}),
      },
      include: {
        student: { include: { programme: true } },
        assessment: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(grades)
  } catch (error: any) {
    console.error('Error fetching grades:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch grades' }, { status: 500 })
  }
}

// POST /api/grades — enter or update a grade
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body: { studentId, assessmentId, score, feedback? }

    if (body.score < 0 || body.score > 100) {
      return NextResponse.json({ error: 'Score must be 0–100' }, { status: 400 })
    }

    const classification = getClassification(body.score)

    const existing = await prisma.grade.findUnique({
      where: {
        studentId_assessmentId: {
          studentId: body.studentId,
          assessmentId: body.assessmentId,
        },
      },
    })

    if (existing) {
      const updated = await prisma.grade.update({
        where: { id: existing.id },
        data: {
          score: body.score,
          classification,
          feedback: body.feedback ?? existing.feedback,
          // Reset publication if grade changes
          isPublished: false,
          publishedAt: null,
        },
        include: { student: true, assessment: true },
      })
      return NextResponse.json(updated)
    }

    const grade = await prisma.grade.create({
      data: {
        studentId: body.studentId,
        assessmentId: body.assessmentId,
        score: body.score,
        classification,
        feedback: body.feedback ?? null,
        isPublished: false,
      },
      include: { student: true, assessment: true },
    })

    return NextResponse.json(grade, { status: 201 })
  } catch (error: any) {
    console.error('Error recording grade:', error)
    return NextResponse.json({ error: error.message || 'Failed to save grade' }, { status: 500 })
  }
}
