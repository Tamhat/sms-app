import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        programme: true,
        feeRecord: { include: { payments: { orderBy: { paymentDate: 'desc' } } } },
        submissions: { include: { assessment: true }, orderBy: { submittedAt: 'desc' } },
        grades: {
          include: { assessment: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(student)
  } catch (error: any) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch student' }, { status: 500 })
  }
}

// PATCH /api/students/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    const student = await prisma.student.update({
      where: { id },
      data: {
        fullName: body.fullName,
        email: body.email,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        programmeId: body.programmeId,
        academicYear: body.academicYear,
        enrolmentStatus: body.enrolmentStatus,
      },
      include: { programme: true },
    })
    return NextResponse.json(student)
  } catch (error: any) {
    console.error('Error updating student:', error)
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status: 500 })
  }
}

// DELETE /api/students/[id]
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.student.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete student' }, { status: 500 })
  }
}
