import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/fees — all fee records with computed balance
export async function GET() {
  try {
    const feeRecords = await prisma.feeRecord.findMany({
      include: {
        student: { include: { programme: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
      orderBy: { dueDate: 'asc' },
    })

    const now = new Date()

    const result = feeRecords.map((fee: { payments: { amount: unknown }[]; totalAmount: unknown; dueDate: Date }) => {
      const paid = fee.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0)
      const balance = Number(fee.totalAmount) - paid
      const isOverdue = fee.dueDate < now && balance > 0
      return { ...fee, paid, balance, isOverdue }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching fees:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch fees' }, { status: 500 })
  }
}
