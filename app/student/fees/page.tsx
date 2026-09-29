'use client'
import { useEffect, useState } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  amount: string
  paymentDate: string
  referenceNumber: string
  notes?: string
}

interface FeeData {
  totalAmount: string
  dueDate: string
  payments: Payment[]
}

interface StudentFeeProfile {
  fullName: string
  studentId: string
  programme: {
    name: string
    code: string
  }
  feeRecord?: FeeData
}

export default function StudentFeesPage() {
  const [profile, setProfile] = useState<StudentFeeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sid = localStorage.getItem('sms_student_id') || 'SMS-2025-0001'
    setLoading(true)

    fetch(`/api/students/by-student-id/${sid}`)
      .then(async r => {
        if (r.ok) {
          const data = await r.json()
          if (data && data.studentId) setProfile(data)
        }
      })
      .catch(e => console.error('Failed to load student fees:', e))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="page-body">
        <div className="empty-state"><div className="spinner" /></div>
      </div>
    )
  }

  const fee = profile?.feeRecord
  const totalAmount = fee ? Number(fee.totalAmount) : 0
  const paidAmount = fee ? fee.payments.reduce((sum, p) => sum + Number(p.amount), 0) : 0
  const balance = totalAmount - paidAmount
  const isOverdue = fee ? new Date(fee.dueDate) < new Date() && balance > 0 : false

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Fee Account & Statement
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            View programme tuition fees, payment statement, and balance status
          </p>
        </div>
      </div>

      <div className="page-body">
        {isOverdue && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <div>
              <strong>Overdue Balance Notice:</strong> You have an outstanding balance of <strong>{formatCurrency(balance)}</strong> which was due on {formatDate(fee!.dueDate)}. Please contact the Registry office to clear your balance.
            </div>
          </div>
        )}

        <div className="grid grid-3" style={{ gap: 16, marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">Programme Tuition Fee</div>
            <div className="stat-card-value">{formatCurrency(totalAmount)}</div>
            <div className="stat-card-sub">{profile?.programme.name}</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Total Amount Paid</div>
            <div className="stat-card-value" style={{ color: 'var(--success)' }}>{formatCurrency(paidAmount)}</div>
            <div className="stat-card-sub">{fee?.payments.length || 0} transaction(s) recorded</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Remaining Balance</div>
            <div className="stat-card-value" style={{ color: balance > 0 ? (isOverdue ? 'var(--danger)' : 'var(--warning)') : 'var(--success)' }}>
              {balance === 0 ? '£0.00' : formatCurrency(balance)}
            </div>
            <div className="stat-card-sub">Due Date: {fee ? formatDate(fee.dueDate) : '—'}</div>
          </div>
        </div>

        {/* Ledger */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Payment Statement & History</h3>

          {!fee || fee.payments.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-title">No payment transactions recorded yet</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference Number</th>
                  <th>Description / Notes</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {fee.payments.map(p => (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td className="font-mono" style={{ color: 'var(--accent)', fontSize: 12 }}>{p.referenceNumber}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{p.notes || 'Tuition Fee Payment'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
