'use client'
import { useEffect, useState, useCallback } from 'react'
import { formatDateTime, fileSizeLabel } from '@/lib/utils'

interface Assessment {
  id: string
  title: string
  module: string
  deadline: string
}

interface Submission {
  id: string
  assessmentId: string
  fileName: string
  fileUrl: string
  fileSize: number
  submittedAt: string
  isLate: boolean
}

export default function StudentSubmissionsPage() {
  const [studentDbId, setStudentDbId] = useState<string>('')
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [loading, setLoading] = useState(true)

  // Upload modal state
  const [uploadModal, setUploadModal] = useState<Assessment | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const loadData = useCallback(async () => {
    const sid = localStorage.getItem('sms_student_id') || 'SMS-2025-0001'
    setLoading(true)

    try {
      const studentRes = await fetch(`/api/students/by-student-id/${sid}`)
      if (!studentRes.ok) return
      const studentData = await studentRes.json()
      if (!studentData?.id) return

      setStudentDbId(studentData.id)

      const [assessRes, subsRes] = await Promise.all([
        fetch('/api/assessments'),
        fetch(`/api/submissions?studentId=${studentData.id}`)
      ])

      const assessData: Assessment[] = assessRes.ok ? await assessRes.json() : []
      const subsData: Submission[] = subsRes.ok ? await subsRes.json() : []

      if (Array.isArray(assessData)) setAssessments(assessData)

      const subMap: Record<string, Submission> = {}
      if (Array.isArray(subsData)) {
        subsData.forEach(s => { subMap[s.assessmentId] = s })
      }
      setSubmissions(subMap)
    } catch (e) {
      console.error('Failed to load student submissions:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (ext !== 'pdf' && ext !== 'docx') {
        setUploadError('Only PDF and DOCX files are allowed.')
        setSelectedFile(null)
        return
      }
      setUploadError('')
      setSelectedFile(file)
    }
  }

  const handleUploadSubmit = async () => {
    if (!uploadModal || !selectedFile || !studentDbId) return

    setSubmitting(true)
    setUploadError('')

    try {
      // Create a mock upload URL / saved file reference
      const mockFileUrl = `/uploads/${Date.now()}_${selectedFile.name}`

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentDbId,
          assessmentId: uploadModal.id,
          fileName: selectedFile.name,
          fileUrl: mockFileUrl,
          fileSize: selectedFile.size
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit file')
      }

      setUploadModal(null)
      setSelectedFile(null)
      loadData()
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error submitting file')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Assessment Submissions
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Upload your coursework files (PDF or DOCX). One submission permitted per assessment.
          </p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : assessments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No assessments available</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assessments.map(a => {
              const sub = submissions[a.id]
              const deadlineDate = new Date(a.deadline)
              const isPastDeadline = new Date() > deadlineDate

              return (
                <div key={a.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span className="badge font-mono" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                        {a.module}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{a.title}</h3>
                    </div>
                    <div style={{ fontSize: 12, color: isPastDeadline ? 'var(--danger)' : 'var(--text-muted)' }}>
                      Deadline: <strong>{formatDateTime(a.deadline)}</strong> {isPastDeadline && '(Past Deadline)'}
                    </div>

                    {sub && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span>📎</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{sub.fileName} ({fileSizeLabel(sub.fileSize)})</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Submitted: {formatDateTime(sub.submittedAt)}</div>
                        </div>
                        {sub.isLate ? (
                          <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)' }}>
                            ⚠️ Late Submission
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(16,217,138,0.1)', color: 'var(--success)', borderColor: 'rgba(16,217,138,0.2)' }}>
                            ✓ Submitted On Time
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      className={`btn ${sub ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => {
                        setUploadModal(a)
                        setSelectedFile(null)
                        setUploadError('')
                      }}
                    >
                      {sub ? (isPastDeadline ? '⚠️ Resubmit Late File' : '🔄 Resubmit Work') : (isPastDeadline ? '⚠️ Submit Late File' : '📤 Upload Submission')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setUploadModal(null) }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Upload Submission — {uploadModal.module}</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setUploadModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>{uploadModal.title}</h4>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  Deadline: {formatDateTime(uploadModal.deadline)}
                </div>
              </div>

              {new Date() > new Date(uploadModal.deadline) && (
                <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                  <span>⚠️</span>
                  <div>
                    <strong>Late Submission Warning:</strong> The deadline for this assessment has passed. Your submission will be recorded and visually flagged as late.
                  </div>
                </div>
              )}

              <div className="dropzone" onClick={() => document.getElementById('file-upload-input')?.click()}>
                <input
                  id="file-upload-input"
                  type="file"
                  accept=".pdf,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{selectedFile.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{fileSizeLabel(selectedFile.size)} · Click to change file</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Click to select assignment file</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Supported formats: .pdf, .docx</div>
                  </div>
                )}
              </div>

              {uploadError && <div className="form-error" style={{ marginTop: 12 }}>⚠️ {uploadError}</div>}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setUploadModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUploadSubmit} disabled={!selectedFile || submitting}>
                {submitting ? 'Uploading…' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
