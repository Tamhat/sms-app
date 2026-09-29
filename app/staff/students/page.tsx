'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { formatDate, statusColor } from '@/lib/utils'

interface Programme {
  id: string
  name: string
  code: string
  feeAmount: string
}

interface Student {
  id: string
  studentId: string
  fullName: string
  email: string
  dateOfBirth: string
  programmeId: string
  programme: Programme
  academicYear: string
  enrolmentStatus: string
  feeRecord?: {
    totalAmount: string
    dueDate: string
    payments: { amount: string }[]
  }
  createdAt: string
}

const STATUSES = ['ENROLLED', 'DEFERRED', 'WITHDRAWN', 'COMPLETED']

const ACADEMIC_YEARS = ['2023/2024', '2024/2025', '2025/2026', '2026/2027']

function StatusBadge({ status }: { status: string }) {
  const colorClass = statusColor(status)
  return (
    <span className={`badge ${colorClass}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon" style={{ fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function StudentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterProgramme, setFilterProgramme] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [form, setForm] = useState({ fullName: '', email: '', dateOfBirth: '', programmeId: '', academicYear: '2024/2025', enrolmentStatus: 'ENROLLED' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (filterStatus) params.set('status', filterStatus)
      if (filterProgramme) params.set('programme', filterProgramme)
      const res = await fetch(`/api/students?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setStudents(data)
      }
    } catch (e) {
      console.error('Failed to load students:', e)
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterProgramme])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  useEffect(() => {
    fetch('/api/programmes')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data)) setProgrammes(data)
        }
      })
      .catch((e) => console.error('Failed to load programmes:', e))
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openNew()
      router.replace('/staff/students')
    }
  }, [searchParams, router])

  function openNew() {
    setEditStudent(null)
    setForm({ fullName: '', email: '', dateOfBirth: '', programmeId: programmes[0]?.id ?? '', academicYear: '2024/2025', enrolmentStatus: 'ENROLLED' })
    setError('')
    setShowModal(true)
  }

  function openEdit(s: Student) {
    setEditStudent(s)
    setForm({
      fullName: s.fullName,
      email: s.email,
      dateOfBirth: s.dateOfBirth.split('T')[0],
      programmeId: s.programmeId,
      academicYear: s.academicYear,
      enrolmentStatus: s.enrolmentStatus,
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.fullName || !form.email || !form.dateOfBirth || !form.programmeId) {
      setError('Please fill all required fields.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editStudent ? `/api/students/${editStudent.id}` : '/api/students'
      const method = editStudent ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save')
      }
      setShowModal(false)
      fetchStudents()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/students/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetchStudents()
  }

  const paidFor = (s: Student) => {
    if (!s.feeRecord) return 0
    return s.feeRecord.payments.reduce((sum, p) => sum + Number(p.amount), 0)
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Students</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{students.length} record{students.length !== 1 ? 's' : ''} found</p>
          </div>
          <button id="enrol-student-btn" className="btn btn-primary" onClick={openNew}>
            <span>➕</span> Enrol Student
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input id="student-search" className="form-input" placeholder="Search by name, ID, or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select id="filter-status" className="form-select" style={{ width: 160 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
          <select id="filter-programme" className="form-select" style={{ width: 200 }} value={filterProgramme} onChange={e => setFilterProgramme(e.target.value)}>
            <option value="">All Programmes</option>
            {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-state">
              <div className="spinner" />
            </div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students found</div>
              <div className="empty-state-sub">Try adjusting your search or filters</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Programme</th>
                  <th>Academic Year</th>
                  <th>Status</th>
                  <th>Fee Balance</th>
                  <th>Enrolled</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const paid = paidFor(s)
                  const balance = s.feeRecord ? Number(s.feeRecord.totalAmount) - paid : 0
                  const isOverdue = s.feeRecord ? new Date(s.feeRecord.dueDate) < new Date() && balance > 0 : false
                  return (
                    <tr key={s.id}>
                      <td>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>
                          {s.studentId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 12 }}>{s.programme.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.programme.code}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{s.academicYear}</td>
                      <td><StatusBadge status={s.enrolmentStatus} /></td>
                      <td>
                        {s.feeRecord ? (
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? 'var(--danger)' : balance === 0 ? 'var(--success)' : 'var(--text-primary)' }}>
                              {balance === 0 ? '✓ Paid' : `£${balance.toFixed(2)}`}
                            </span>
                            {isOverdue && <span className="badge" style={{ marginLeft: 6, background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10 }}>Overdue</span>}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(s.createdAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Enrol/Edit Modal */}
      {showModal && (
        <Modal title={editStudent ? `Edit — ${editStudent.fullName}` : 'Enrol New Student'} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Full Name <span className="form-required">*</span></label>
                <input className="form-input" placeholder="e.g. Alice Pemberton" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address <span className="form-required">*</span></label>
                <input className="form-input" type="email" placeholder="student@institution.ac.uk" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Date of Birth <span className="form-required">*</span></label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Academic Year <span className="form-required">*</span></label>
                <select className="form-select" value={form.academicYear} onChange={e => setForm({ ...form, academicYear: e.target.value })}>
                  {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Programme <span className="form-required">*</span></label>
                <select className="form-select" value={form.programmeId} onChange={e => setForm({ ...form, programmeId: e.target.value })}>
                  <option value="">Select programme…</option>
                  {programmes.map(p => <option key={p.id} value={p.id}>{p.name} (£{Number(p.feeAmount).toLocaleString()})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Enrolment Status</label>
                <select className="form-select" value={form.enrolmentStatus} onChange={e => setForm({ ...form, enrolmentStatus: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            {!editStudent && (
              <div className="alert alert-info" style={{ marginBottom: 8 }}>
                <span>ℹ️</span>
                <span>A unique Student ID (e.g. SMS-2026-0008) and fee record will be auto-generated on enrolment.</span>
              </div>
            )}
            {error && <div className="form-error" style={{ marginTop: 8 }}>⚠️ {error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button id="save-student-btn" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editStudent ? 'Save Changes' : 'Enrol Student'}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">Delete Student?</div>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.fullName}</strong> ({deleteTarget.studentId}) and all associated records. This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Student</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading students...</div>}>
      <StudentsContent />
    </Suspense>
  )
}
