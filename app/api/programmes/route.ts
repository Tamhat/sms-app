import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/programmes
export async function GET() {
  try {
    const programmes = await prisma.programme.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(programmes)
  } catch (error: any) {
    console.error('Error fetching programmes:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch programmes' }, { status: 500 })
  }
}

// POST /api/programmes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const programme = await prisma.programme.create({
      data: { name: body.name, code: body.code, feeAmount: body.feeAmount },
    })
    return NextResponse.json(programme, { status: 201 })
  } catch (error: any) {
    console.error('Error creating programme:', error)
    return NextResponse.json({ error: error.message || 'Failed to create programme' }, { status: 500 })
  }
}
