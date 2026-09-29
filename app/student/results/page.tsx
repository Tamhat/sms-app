'use client'
import { useEffect, useState } from 'react'
import { formatDate, classificationColor } from '@/lib/utils'

interface GradeResult {
  id: string
  score: number
  classification: string
  publishedAt: string
  feedback?: string
  assessment: {
    title: string
    module: string
    deadline: string
  }
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<GradeResult[]>([])
  const [loading, setLoading] = useState(true)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    const sid = localStorage.getItem('sms_student_id') || 'SMS-2025-0001'
    setLoading(true)

    fetch(`/api/students/by-student-id/${sid}`)
      .then(async r => {
        if (r.ok) {
          const data = await r.json()
          if (data) {
            setStudentName(data.fullName || '')
            setResults(data.grades || [])
          }
        }
      })
      .catch(e => console.error('Failed to load results:', e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Academic Marksheet & Results
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Official assessment grades published by the Registry Team
          </p>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No published results available</div>
            <div className="empty-state-sub">
              Grades will appear here once they have been reviewed and published by your module tutors.
            </div>
          </div>
        ) : (
          <div>
            <div className="card" style={{ marginBottom: 20, background: 'var(--bg-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Official Marksheet</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{studentName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Modules Graded</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{results.length}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {results.map(r => (
                <div key={r.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <span className="badge font-mono" style={{ background: 'var(--accent-glow)', color: 'var(--accent)', marginBottom: 6 }}>
                        {r.assessment.module}
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{r.assessment.title}</h3>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                        Published on {formatDate(r.publishedAt)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                        {r.score} <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/ 100</span>
                      </div>
                      <span className={`badge ${classificationColor(r.classification as any)}`} style={{ fontSize: 12, padding: '4px 10px', marginTop: 4 }}>
                        {r.classification}
                      </span>
                    </div>
                  </div>

                  {r.feedback && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Tutor Feedback</div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-elevated)', padding: 12, borderRadius: 8 }}>
                        &ldquo;{r.feedback}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
