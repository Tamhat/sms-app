import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/fees/[id] — fee record for a student (by student DB id)
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const fee = await prisma.feeRecord.findUnique({
      where: { studentId: id },
      include: {
        student: { include: { programme: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    })
    if (!fee) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const paid = fee.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0)
    const balance = Number(fee.totalAmount) - paid
    const isOverdue = fee.dueDate < new Date() && balance > 0
    return NextResponse.json({ ...fee, paid, balance, isOverdue })
  } catch (error: any) {
    console.error('Error fetching fee record:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch fee record' }, { status: 500 })
  }
}

// PATCH /api/fees/[id] — update due date or total amount
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const fee = await prisma.feeRecord.update({
      where: { studentId: id },
      data: {
        ...(body.totalAmount !== undefined ? { totalAmount: body.totalAmount } : {}),
        ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
      },
      include: { payments: true },
    })
    const paid = fee.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0)
    const balance = Number(fee.totalAmount) - paid
    return NextResponse.json({ ...fee, paid, balance })
  } catch (error: any) {
    console.error('Error updating fee record:', error)
    return NextResponse.json({ error: error.message || 'Failed to update fee record' }, { status: 500 })
  }
}
