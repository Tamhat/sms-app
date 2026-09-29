import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/students
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status') ?? ''
    const programme = searchParams.get('programme') ?? ''

    const students = await prisma.student.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { studentId: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { enrolmentStatus: status as any } : {},
          programme ? { programmeId: programme } : {},
        ],
      },
      include: {
        programme: true,
        feeRecord: {
          include: { payments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(students)
  } catch (error: any) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch students' }, { status: 500 })
  }
}

// POST /api/students
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Auto-generate student ID
    const count = await prisma.student.count()
    const year = new Date().getFullYear()
    const seq = String(count + 1).padStart(4, '0')
    const studentId = `SMS-${year}-${seq}`

    const student = await prisma.student.create({
      data: {
        studentId,
        fullName: body.fullName,
        email: body.email,
        dateOfBirth: new Date(body.dateOfBirth),
        programmeId: body.programmeId,
        academicYear: body.academicYear,
        enrolmentStatus: body.enrolmentStatus ?? 'ENROLLED',
      },
      include: { programme: true },
    })

    // Auto-create fee record based on programme fee
    const programme = await prisma.programme.findUnique({ where: { id: body.programmeId } })
    if (programme) {
      const dueDate = new Date()
      dueDate.setMonth(dueDate.getMonth() + 1)
      await prisma.feeRecord.create({
        data: {
          studentId: student.id,
          totalAmount: programme.feeAmount,
          dueDate,
        },
      })
    }

    return NextResponse.json(student, { status: 201 })
  } catch (error: any) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: error.message || 'Failed to create student' }, { status: 500 })
  }
}
