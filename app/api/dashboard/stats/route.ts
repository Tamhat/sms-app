import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/stats
export async function GET() {
  try {
    const [
      totalStudents,
      enrolledStudents,
      totalAssessments,
      feeRecords,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { enrolmentStatus: 'ENROLLED' } }),
      prisma.assessment.count(),
      prisma.feeRecord.findMany({ include: { payments: true } }),
    ])

    const now = new Date()
    let overdueCount = 0
    let totalOutstanding = 0

    for (const fee of feeRecords) {
      const paid = fee.payments.reduce((sum: number, p: { amount: unknown }) => sum + Number(p.amount), 0)
      const balance = Number(fee.totalAmount) - paid
      if (balance > 0) {
        totalOutstanding += balance
        if (fee.dueDate < now) overdueCount++
      }
    }

    const recentSubmissions = await prisma.submission.count({
      where: {
        submittedAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    })

    const unpublishedGrades = await prisma.grade.count({
      where: { isPublished: false },
    })

    return NextResponse.json({
      totalStudents,
      enrolledStudents,
      totalAssessments,
      overdueCount,
      totalOutstanding,
      recentSubmissions,
      unpublishedGrades,
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      {
        totalStudents: 0,
        enrolledStudents: 0,
        totalAssessments: 0,
        overdueCount: 0,
        totalOutstanding: 0,
        recentSubmissions: 0,
        unpublishedGrades: 0,
        error: error.message || 'Database unavailable',
      },
      { status: 500 }
    )
  }
}
