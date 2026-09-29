'use client'
import { useEffect, useState, useCallback } from 'react'
import { getClassification, classificationColor } from '@/lib/utils'

interface Assessment {
  id: string
  title: string
  module: string
  deadline: string
}

interface Student {
  id: string
  studentId: string
  fullName: string
  email: string
  programme: {
    name: string
  }
}

interface Submission {
  id: string
  studentId: string
  fileName: string
  fileUrl: string
  submittedAt: string
  isLate: boolean
}

interface Grade {
  id: string
  studentId: string
  assessmentId: string
  score: number
  classification: string
  isPublished: boolean
  feedback?: string
}

export default function MarksheetPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({})
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // Feedback modal
  const [feedbackModal, setFeedbackModal] = useState<{ student: Student; grade?: Grade } | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  useEffect(() => {
    fetch('/api/assessments')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data)) {
            setAssessments(data)
            if (data.length > 0) {
              setSelectedAssessmentId(data[0].id)
            }
          }
        }
      })
      .catch((e) => console.error('Failed to load assessments:', e))
  }, [])

  const loadAssessmentData = useCallback(async () => {
    if (!selectedAssessmentId) return
    setLoading(true)
    
    try {
      const [studentsRes, subsRes, gradesRes] = await Promise.all([
        fetch('/api/students'),
        fetch(`/api/submissions?assessmentId=${selectedAssessmentId}`),
        fetch(`/api/grades?assessmentId=${selectedAssessmentId}`)
      ])

      const studentsData: Student[] = studentsRes.ok ? await studentsRes.json() : []
      const subsData: Submission[] = subsRes.ok ? await subsRes.json() : []
      const gradesData: Grade[] = gradesRes.ok ? await gradesRes.json() : []

      if (Array.isArray(studentsData)) setStudents(studentsData)

      const subMap: Record<string, Submission> = {}
      subsData.forEach(s => { subMap[s.studentId] = s })
      setSubmissions(subMap)

      const gradeMap: Record<string, Grade> = {}
      gradesData.forEach(g => { gradeMap[g.studentId] = g })
      setGrades(gradeMap)
    } finally {
      setLoading(false)
    }
  }, [selectedAssessmentId])

  useEffect(() => {
    loadAssessmentData()
  }, [loadAssessmentData])

  const handleScoreChange = async (studentId: string, scoreStr: string) => {
    const score = parseInt(scoreStr, 10)
    if (isNaN(score) || score < 0 || score > 100) return

    setUpdatingId(studentId)
    try {
      const existingGrade = grades[studentId]
      const res = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          assessmentId: selectedAssessmentId,
          score,
          feedback: existingGrade?.feedback
        })
      })

      if (res.ok) {
        const updatedGrade = await res.json()
        setGrades(prev => ({ ...prev, [studentId]: updatedGrade }))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const togglePublish = async (studentId: string) => {
    const existingGrade = grades[studentId]
    if (!existingGrade) return

    setUpdatingId(studentId)
    try {
      const res = await fetch(`/api/grades/${existingGrade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !existingGrade.isPublished
        })
      })

      if (res.ok) {
        const updatedGrade = await res.json()
        setGrades(prev => ({ ...prev, [studentId]: updatedGrade }))
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const publishAll = async (publish: boolean) => {
    setLoading(true)
    try {
      const updatePromises = Object.values(grades).map(g => 
        fetch(`/api/grades/${g.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublished: publish })
        })
      )
      await Promise.all(updatePromises)
      await loadAssessmentData()
    } finally {
      setLoading(false)
    }
  }

  const saveFeedback = async () => {
    if (!feedbackModal) return
    const { student, grade } = feedbackModal
    if (!grade) return

    setUpdatingId(student.id)
    try {
      const res = await fetch(`/api/grades/${grade.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackText })
      })

      if (res.ok) {
        const updatedGrade = await res.json()
        setGrades(prev => ({ ...prev, [student.id]: updatedGrade }))
        setFeedbackModal(null)
      }
    } finally {
      setUpdatingId(null)
    }
  }

  const currentAssessment = assessments.find(a => a.id === selectedAssessmentId)

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Marksheet & Results Entry
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Enter numerical grades, automatically calculate classifications, and publish results to students
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => publishAll(true)} disabled={loading || Object.keys(grades).length === 0}>
              📢 Publish All Results
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => publishAll(false)} disabled={loading || Object.keys(grades).length === 0}>
              🔒 Withhold All
            </button>
          </div>
        </div>

        {/* Assessment selector */}
        <div style={{ marginTop: 16 }}>
          <label className="form-label" style={{ marginBottom: 6 }}>Select Assessment</label>
          <select
            className="form-select"
            style={{ maxWidth: 450, fontWeight: 600 }}
            value={selectedAssessmentId}
            onChange={e => setSelectedAssessmentId(e.target.value)}
          >
            {assessments.map(a => (
              <option key={a.id} value={a.id}>
                {a.module}: {a.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="page-body">
        {currentAssessment && (
          <div className="card" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{currentAssessment.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Module: <strong style={{ color: 'var(--accent)' }}>{currentAssessment.module}</strong> | Deadline: {new Date(currentAssessment.deadline).toLocaleString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Submissions</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{Object.keys(submissions).length} / {students.length}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Graded</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{Object.keys(grades).length} / {students.length}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Published</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
                  {Object.values(grades).filter(g => g.isPublished).length}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="empty-state"><div className="spinner" /></div>
          ) : students.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No students found</div>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Submission</th>
                  <th>Score (0-100)</th>
                  <th>Classification</th>
                  <th>Feedback</th>
                  <th>Publish Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const sub = submissions[s.id]
                  const grade = grades[s.id]
                  const isUpdating = updatingId === s.id

                  return (
                    <tr key={s.id}>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--accent)' }}>
                        {s.studentId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.programme.name}</div>
                      </td>
                      <td>
                        {sub ? (
                          <div>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>📄 {sub.fileName}</span>
                            {sub.isLate && (
                              <span className="badge" style={{ marginLeft: 6, background: 'rgba(239,68,68,0.15)', color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.3)', fontSize: 10 }}>
                                ⚠️ Late
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>No submission</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="grade-input"
                          defaultValue={grade ? grade.score : ''}
                          onBlur={e => handleScoreChange(s.id, e.target.value)}
                          placeholder="—"
                          disabled={isUpdating}
                        />
                      </td>
                      <td>
                        {grade ? (
                          <span className={`badge ${classificationColor(grade.classification as any)}`}>
                            {grade.classification}
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setFeedbackModal({ student: s, grade })
                            setFeedbackText(grade?.feedback || '')
                          }}
                        >
                          {grade?.feedback ? '✏️ Edit Feedback' : '➕ Add Feedback'}
                        </button>
                      </td>
                      <td>
                        {grade ? (
                          grade.isPublished ? (
                            <span className="badge" style={{ background: 'rgba(16,217,138,0.1)', color: 'var(--success)', borderColor: 'rgba(16,217,138,0.2)' }}>
                              🟢 Published
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.2)' }}>
                              🔒 Withheld
                            </span>
                          )
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Not graded</span>
                        )}
                      </td>
                      <td>
                        {grade && (
                          <button
                            className={`btn btn-sm ${grade.isPublished ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => togglePublish(s.id)}
                            disabled={isUpdating}
                          >
                            {grade.isPublished ? 'Withhold' : 'Publish'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setFeedbackModal(null) }}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Feedback — {feedbackModal.student.fullName}</div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setFeedbackModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Constructive Feedback for Student</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: 120 }}
                  placeholder="Enter comments, strengths, or areas for improvement…"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setFeedbackModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveFeedback} disabled={!feedbackModal.grade}>
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
