import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/payments — record a new payment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // body: { studentId, amount, paymentDate, referenceNumber, notes? }

    // Find fee record by student DB id
    const feeRecord = await prisma.feeRecord.findUnique({
      where: { studentId: body.studentId },
      include: { payments: true },
    })
    if (!feeRecord) {
      return NextResponse.json({ error: 'Fee record not found' }, { status: 404 })
    }

    // Check reference number uniqueness
    const existing = await prisma.payment.findFirst({
      where: { referenceNumber: body.referenceNumber },
    })
    if (existing) {
      return NextResponse.json({ error: 'Reference number already exists' }, { status: 409 })
    }

    const paid = feeRecord.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0)
    const balance = Number(feeRecord.totalAmount) - paid

    if (Number(body.amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }
    if (Number(body.amount) > balance) {
      return NextResponse.json({ error: `Amount exceeds outstanding balance of £${balance.toFixed(2)}` }, { status: 400 })
    }

    const payment = await prisma.payment.create({
      data: {
        feeRecordId: feeRecord.id,
        amount: body.amount,
        paymentDate: new Date(body.paymentDate),
        referenceNumber: body.referenceNumber,
        notes: body.notes ?? null,
      },
    })

    return NextResponse.json(payment, { status: 201 })
  } catch (error: any) {
    console.error('Error recording payment:', error)
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}

// GET /api/payments — list all payments
export async function GET() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        feeRecord: {
          include: { student: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    })
    return NextResponse.json(payments)
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 })
  }
}
