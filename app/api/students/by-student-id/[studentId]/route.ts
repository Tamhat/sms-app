import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students/by-student-id/[studentId]
export async function GET(_: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  try {
    const { studentId } = await params
    const student = await prisma.student.findUnique({
      where: { studentId },
      include: {
        programme: true,
        feeRecord: { include: { payments: true } },
        grades: {
          where: { isPublished: true },
          include: { assessment: true },
        },
        submissions: { include: { assessment: true } },
      },
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (error: any) {
    console.error('Error fetching student by ID:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch student' }, { status: 500 })
  }
}
