import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/submissions?studentId=&assessmentId=
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId') ?? ''
    const assessmentId = searchParams.get('assessmentId') ?? ''

    const submissions = await prisma.submission.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(assessmentId ? { assessmentId } : {}),
      },
      include: {
        student: { include: { programme: true } },
        assessment: true,
      },
      orderBy: { submittedAt: 'desc' },
    })

    return NextResponse.json(submissions)
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch submissions' }, { status: 500 })
  }
}

// POST /api/submissions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body: { studentId, assessmentId, fileName, fileUrl, fileSize }

    // Check assessment deadline
    const assessment = await prisma.assessment.findUnique({
      where: { id: body.assessmentId },
    })
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const now = new Date()
    const isLate = now > assessment.deadline

    // Upsert: allow resubmission before deadline, always allow (flag if late)
    const existing = await prisma.submission.findUnique({
      where: {
        studentId_assessmentId: {
          studentId: body.studentId,
          assessmentId: body.assessmentId,
        },
      },
    })

    if (existing && !isLate) {
      // Resubmission before deadline — update
      const updated = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileName: body.fileName,
          fileUrl: body.fileUrl,
          fileSize: body.fileSize,
          submittedAt: now,
          isLate: false,
        },
        include: { student: true, assessment: true },
      })
      return NextResponse.json(updated)
    }

    if (existing && isLate) {
      // Late resubmission — update and flag
      const updated = await prisma.submission.update({
        where: { id: existing.id },
        data: {
          fileName: body.fileName,
          fileUrl: body.fileUrl,
          fileSize: body.fileSize,
          submittedAt: now,
          isLate: true,
        },
        include: { student: true, assessment: true },
      })
      return NextResponse.json(updated)
    }

    const submission = await prisma.submission.create({
      data: {
        studentId: body.studentId,
        assessmentId: body.assessmentId,
        fileName: body.fileName,
        fileUrl: body.fileUrl,
        fileSize: body.fileSize,
        isLate,
      },
      include: { student: true, assessment: true },
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error: any) {
    console.error('Error creating submission:', error)
    return NextResponse.json({ error: error.message || 'Failed to submit file' }, { status: 500 })
  }
}
