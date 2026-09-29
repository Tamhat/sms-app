'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { formatDateTime } from '@/lib/utils'

interface Assessment {
  id: string
  title: string
  module: string
  deadline: string
  createdAt: string
  _count: { submissions: number; grades: number }
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-icon">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function AssessmentsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null)
  const [form, setForm] = useState({ title: '', module: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Assessment | null>(null)

  const fetchAssessments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assessments')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setAssessments(data)
      }
    } catch (e) {
      console.error('Failed to load assessments:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAssessments() }, [fetchAssessments])

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openNew()
      router.replace('/staff/assessments')
    }
  }, [searchParams, router])

  function openNew() {
    setEditAssessment(null)
    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 14)
    setForm({ title: '', module: '', deadline: defaultDeadline.toISOString().slice(0, 16) })
    setError('')
    setShowModal(true)
  }

  function openEdit(a: Assessment) {
    setEditAssessment(a)
    setForm({
      title: a.title,
      module: a.module,
      deadline: new Date(a.deadline).toISOString().slice(0, 16),
    })
    setError('')
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.title || !form.module || !form.deadline) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const url = editAssessment ? `/api/assessments/${editAssessment.id}` : '/api/assessments'
      const method = editAssessment ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (!res.ok) throw new Error('Failed to save')
      setShowModal(false)
      fetchAssessments()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await fetch(`/api/assessments/${deleteTarget.id}`, { method: 'DELETE' })
    setDeleteTarget(null)
    fetchAssessments()
  }

  const isOpen = (a: Assessment) => new Date(a.deadline) > new Date()
  const isPast = (a: Assessment) => !isOpen(a)

  const open = assessments.filter(isOpen)
  const past = assessments.filter(isPast)

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Assessments</h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{open.length} open · {past.length} closed</p>
          </div>
          <button id="create-assessment-btn" className="btn btn-primary" onClick={openNew}>
            <span>➕</span> Create Assessment
          </button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No assessments yet</div>
            <div className="empty-state-sub">Create your first assessment to get started</div>
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Open ({open.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {open.map(a => <AssessmentCard key={a.id} assessment={a} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                  Closed ({past.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {past.map(a => <AssessmentCard key={a.id} assessment={a} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <Modal title={editAssessment ? 'Edit Assessment' : 'Create Assessment'} onClose={() => setShowModal(false)}>
          <div className="modal-body">
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label className="form-label">Assessment Title <span className="form-required">*</span></label>
              <input className="form-input" placeholder="e.g. Introduction to Programming — Final Project" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">Module Code <span className="form-required">*</span></label>
                <input className="form-input" placeholder="e.g. CS101" value={form.module} onChange={e => setForm({ ...form, module: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Submission Deadline <span className="form-required">*</span></label>
                <input className="form-input" type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
              </div>
            </div>
            {error && <div className="form-error" style={{ marginTop: 10 }}>⚠️ {error}</div>}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editAssessment ? 'Save Changes' : 'Create Assessment'}
            </button>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null) }}>
          <div className="modal modal-sm">
            <div className="modal-header">
              <div className="modal-title">Delete Assessment?</div>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost btn-sm btn-icon">✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Deleting <strong style={{ color: 'var(--text-primary)' }}>{deleteTarget.title}</strong> will also remove all associated submissions and grades. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AssessmentCard({ assessment: a, onEdit, onDelete }: {
  assessment: Assessment
  onEdit: (a: Assessment) => void
  onDelete: (a: Assessment) => void
}) {
  const open = new Date(a.deadline) > new Date()
  const daysLeft = Math.ceil((new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: open ? 'rgba(16,217,138,0.1)' : 'rgba(79,124,255,0.1)',
        border: `1px solid ${open ? 'rgba(16,217,138,0.2)' : 'rgba(79,124,255,0.2)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
      }}>
        {open ? '📂' : '📁'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{a.title}</span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '1px 6px', borderRadius: 4 }}>{a.module}</span>
          {!open && <span className="badge" style={{ background: 'rgba(79,124,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(79,124,255,0.2)', fontSize: 10 }}>Closed</span>}
          {open && daysLeft <= 3 && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', fontSize: 10 }}>Due soon</span>}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Deadline: {formatDateTime(a.deadline)} ·{' '}
          {open ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining` : 'Closed'} ·{' '}
          {a._count.submissions} submission{a._count.submissions !== 1 ? 's' : ''} ·{' '}
          {a._count.grades} grade{a._count.grades !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(a)}>Edit</button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(a)}>Delete</button>
      </div>
    </div>
  )
}

export default function AssessmentsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading assessments...</div>}>
      <AssessmentsContent />
    </Suspense>
  )
}
