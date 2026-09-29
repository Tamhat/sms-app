'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Payment {
  id: string
  amount: string
  paymentDate: string
  referenceNumber: string
  notes?: string
}

interface FeeItem {
  id: string
  studentId: string
  totalAmount: string
  dueDate: string
  paid: number
  balance: number
  isOverdue: boolean
  payments: Payment[]
  student: {
    id: string
    studentId: string
    fullName: string
    email: string
    programme: {
      name: string
      code: string
    }
  }
}

export default function StaffFeesPage() {
  const [fees, setFees] = useState<FeeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null)
  
  // Payment Modal state
  const [paymentModal, setPaymentModal] = useState<FeeItem | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    referenceNumber: '',
    notes: ''
  })
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const fetchFees = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/fees')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setFees(data)
      }
    } catch (e) {
      console.error('Failed to load fees:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFees()
  }, [fetchFees])

  const openPaymentModal = (fee: FeeItem) => {
    setPaymentModal(fee)
    const refNum = `PAY-${fee.student.studentId}-${Date.now().toString().slice(-4)}`
    setPaymentForm({
      amount: fee.balance > 0 ? fee.balance.toString() : '',
      paymentDate: new Date().toISOString().slice(0, 10),
      referenceNumber: refNum,
      notes: ''
    })
    setPaymentError('')
  }

  const handleRecordPayment = async () => {
    if (!paymentModal) return
    if (!paymentForm.amount || !paymentForm.referenceNumber || !paymentForm.paymentDate) {
      setPaymentError('Please fill all required fields.')
      return
    }

    setSubmittingPayment(true)
    setPaymentError('')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: paymentModal.student.id,
          amount: parseFloat(paymentForm.amount),
          paymentDate: paymentForm.paymentDate,
          referenceNumber: paymentForm.referenceNumber,
          notes: paymentForm.notes
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      setPaymentModal(null)
      fetchFees()
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Error recording payment')
    } finally {
      setSubmittingPayment(false)
    }
  }

  const filteredFees = fees.filter(f => {
    const matchesSearch =
      f.student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      f.student.studentId.toLowerCase().includes(search.toLowerCase()) ||
      f.student.programme.name.toLowerCase().includes(search.toLowerCase())
    
    if (overdueOnly) {
      return matchesSearch && f.isOverdue
    }
    return matchesSearch
  })

  const totalOutstanding = fees.reduce((sum, f) => sum + f.balance, 0)
  const overdueCount = fees.filter(f => f.isOverdue).length

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Fees & Payments</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Track student fee accounts, record payments, and monitor overdue balances
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="card card-sm" style={{ textAlign: 'right', padding: '8px 14px' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Outstanding</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>{formatCurrency(totalOutstanding)}</div>
            </div>
            <div className="card card-sm" style={{ textAlign: 'right', padding: '8px 14px', borderColor: overdueCount > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
              <div style={{ fontSize: 10, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overdue Accounts</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: overdueCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{overdueCount}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 240 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input className="form-input" placeholder="Search by student name, ID, or programme…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
            <input type="checkbox" checked={overdueOnly} onChange={e => setOverdueOnly(e.target.checked)} style={{ cursor: 'pointer' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: overdueOnly ? 'var(--danger)' : 'var(--text-secondary)' }}>Show Overdue Only ({overdueCount})</span>
          </label>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : filteredFees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💳</div>
              <div className="empty-state-title">No fee records found</div>
              <div className="empty-state-sub">Try changing your search or filter settings</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Programme</th>
                  <th>Total Fee</th>
                  <th>Paid</th>
                  <th>Outstanding Balance</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFees.map(item => (
                  <tr key={item.id} style={{ background: item.isOverdue ? 'rgba(239,68,68,0.03)' : undefined }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.student.fullName}</div>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--accent)' }}>{item.student.studentId}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12 }}>{item.student.programme.name}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.totalAmount)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(item.paid)}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: item.balance === 0 ? 'var(--success)' : item.isOverdue ? 'var(--danger)' : 'var(--text-primary)'
                      }}>
                        {item.balance === 0 ? 'Fully Paid' : formatCurrency(item.balance)}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: item.isOverdue ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {formatDate(item.dueDate)}
                    </td>
                    <td>
                      {item.balance === 0 ? (
                        <span className="badge" style={{ background: 'rgba(16,217,138,0.1)', color: 'var(--success)', borderColor: 'rgba(16,217,138,0.2)' }}>Cleared</span>
                      ) : item.isOverdue ? (
                        <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', fontWeight: 700 }}>
                          ⚠️ Overdue
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>Pending</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {item.balance > 0 && (
                          <button className="btn btn-primary btn-sm" onClick={() => openPaymentModal(item)}>
                            Record Payment
                          </button>
                        )}
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelectedFee(item)}>
                          History ({item.payments.length})
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setPaymentModal(null) }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Record Payment — {paymentModal.student.fullName}</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setPaymentModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                <div>
                  Student ID: <strong>{paymentModal.student.studentId}</strong> | Current Balance: <strong>{formatCurrency(paymentModal.balance)}</strong>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Payment Amount (£) <span className="form-required">*</span></label>
                <input
                  className="form-input font-mono"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentForm.amount}
                  onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                />
              </div>

              <div className="form-row form-row-2" style={{ marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label">Payment Date <span className="form-required">*</span></label>
                  <input
                    className="form-input"
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reference Number <span className="form-required">*</span></label>
                  <input
                    className="form-input font-mono"
                    placeholder="e.g. PAY-2025-001"
                    value={paymentForm.referenceNumber}
                    onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Bank transfer, receipt reference, etc."
                  value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                />
              </div>

              {paymentError && <div className="form-error" style={{ marginTop: 12 }}>⚠️ {paymentError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRecordPayment} disabled={submittingPayment}>
                {submittingPayment ? 'Recording…' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedFee && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setSelectedFee(null) }}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <div className="modal-title">Payment History — {selectedFee.student.fullName} ({selectedFee.student.studentId})</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelectedFee(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                <div className="card card-sm">
                  <div className="stat-card-label">Total Fee</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(selectedFee.totalAmount)}</div>
                </div>
                <div className="card card-sm">
                  <div className="stat-card-label">Total Paid</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(selectedFee.paid)}</div>
                </div>
                <div className="card card-sm">
                  <div className="stat-card-label">Outstanding Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: selectedFee.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {formatCurrency(selectedFee.balance)}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>Transaction Ledger</h4>

              {selectedFee.payments.length === 0 ? (
                <div className="empty-state" style={{ padding: 24 }}>
                  <div className="empty-state-title">No transactions recorded yet</div>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Amount</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFee.payments.map(p => (
                      <tr key={p.id}>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td className="font-mono" style={{ color: 'var(--accent)', fontSize: 12 }}>{p.referenceNumber}</td>
                        <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedFee(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
