'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

interface StudentData {
  id: string
  studentId: string
  fullName: string
  email: string
  academicYear: string
  enrolmentStatus: string
  programme: {
    name: string
    code: string
  }
  feeRecord?: {
    totalAmount: string
    dueDate: string
    payments: { amount: string }[]
  }
  submissions: { id: string; assessmentId: string; submittedAt: string; isLate: boolean }[]
  grades: { id: string; assessmentId: string; score: number; classification: string; assessment: { title: string; module: string } }[]
}

export default function StudentDashboard() {
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sid = localStorage.getItem('sms_student_id') || 'SMS-2025-0001'
    fetch(`/api/students/by-student-id/${sid}`)
      .then(async r => {
        if (r.ok) {
          const data = await r.json()
          if (data && data.studentId) setStudent(data)
        }
      })
      .catch(e => console.error('Failed to load student dashboard:', e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-body">
        <div className="empty-state"><div className="spinner" /></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="page-body">
        <div className="empty-state">
          <div className="empty-state-title">Student Profile Not Found</div>
        </div>
      </div>
    )
  }

  const paidAmount = student.feeRecord ? student.feeRecord.payments.reduce((sum, p) => sum + Number(p.amount), 0) : 0
  const totalAmount = student.feeRecord ? Number(student.feeRecord.totalAmount) : 0
  const balance = totalAmount - paidAmount
  const isOverdue = student.feeRecord ? new Date(student.feeRecord.dueDate) < new Date() && balance > 0 : false

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Welcome Back
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginTop: 2 }}>
            {student.fullName}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {student.programme.name} ({student.programme.code}) · Academic Year {student.academicYear}
          </p>
        </div>
      </div>

      <div className="page-body">
        {isOverdue && (
          <div className="alert alert-danger" style={{ marginBottom: 24 }}>
            <span>⚠️</span>
            <div>
              You have an overdue fee balance of <strong>{formatCurrency(balance)}</strong> (Due: {formatDate(student.feeRecord!.dueDate)}).{' '}
              <Link href="/student/fees" style={{ color: 'inherit', textDecoration: 'underline' }}>View Payment Details →</Link>
            </div>
          </div>
        )}

        <div className="grid grid-3" style={{ gap: 16, marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-label">Enrolment Status</div>
            <div className="stat-card-value" style={{ fontSize: 20, color: 'var(--accent)' }}>
              {student.enrolmentStatus}
            </div>
            <div className="stat-card-sub">Student ID: {student.studentId}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Outstanding Balance</div>
            <div className="stat-card-value" style={{ fontSize: 22, color: balance > 0 ? (isOverdue ? 'var(--danger)' : 'var(--warning)') : 'var(--success)' }}>
              {balance === 0 ? '£0.00' : formatCurrency(balance)}
            </div>
            <div className="stat-card-sub">{balance === 0 ? 'Fee balance clear' : `Due by ${formatDate(student.feeRecord!.dueDate)}`}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Published Results</div>
            <div className="stat-card-value">{student.grades.length}</div>
            <div className="stat-card-sub">{student.submissions.length} submission(s) submitted</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Quick Access */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>My Portal Shortcuts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/student/submissions" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: 12 }}>
                <span>📤 Submit Assignments</span>
                <span>→</span>
              </Link>
              <Link href="/student/results" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: 12 }}>
                <span>📊 View Published Grades</span>
                <span>→</span>
              </Link>
              <Link href="/student/fees" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: 12 }}>
                <span>💳 Check Fee Balance & Statement</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* Recent Published Grades */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Recent Results</h3>
            {student.grades.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <div className="empty-state-sub">No results have been published yet by staff.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {student.grades.map(g => (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{g.assessment.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{g.assessment.module}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)' }}>{g.score}/100</div>
                      <span className="badge" style={{ fontSize: 10 }}>{g.classification}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
