import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/assessments
export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      include: {
        _count: { select: { submissions: true, grades: true } },
      },
      orderBy: { deadline: 'asc' },
    })
    return NextResponse.json(assessments)
  } catch (error: any) {
    console.error('Error fetching assessments:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch assessments' }, { status: 500 })
  }
}

// POST /api/assessments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const assessment = await prisma.assessment.create({
      data: {
        title: body.title,
        module: body.module,
        deadline: new Date(body.deadline),
      },
    })
    return NextResponse.json(assessment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating assessment:', error)
    return NextResponse.json({ error: error.message || 'Failed to create assessment' }, { status: 500 })
  }
}
