'use client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  const choose = (role: 'staff' | 'student') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sms_role', role)
      // For student view, use a demo student ID
      if (role === 'student') {
        localStorage.setItem('sms_student_id', 'SMS-2025-0001')
      }
    }
    router.push(role === 'staff' ? '/staff/dashboard' : '/student/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '48px',
      background: 'var(--bg-base)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow blobs */}
      <div style={{
        position: 'absolute', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(79,124,255,0.06) 0%, transparent 70%)',
        top: '-100px', left: '-100px', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(124,79,255,0.06) 0%, transparent 70%)',
        bottom: '-50px', right: '-50px', pointerEvents: 'none',
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{
          width: 56, height: 56,
          background: 'linear-gradient(135deg, #4f7cff, #7c4fff)',
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 18px',
          boxShadow: '0 0 40px rgba(79,124,255,0.35)',
        }}>🎓</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Student Management System
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          PEN Global — Registry Module · Select your role to continue
        </p>
      </div>

      {/* Role cards */}
      <div style={{ display: 'flex', gap: 24 }}>
        <button id="role-staff" className="role-card" onClick={() => choose('staff')}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🏛️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Registry Staff
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Manage students, fees, assessments, and publish results
          </div>
          <div style={{
            marginTop: 18,
            background: 'var(--accent)',
            color: 'white',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-block',
          }}>
            Enter as Staff →
          </div>
        </button>

        <button id="role-student" className="role-card" onClick={() => choose('student')}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>📚</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Student Portal
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Submit assignments, view results, and check your fee balance
          </div>
          <div style={{
            marginTop: 18,
            background: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-strong)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            display: 'inline-block',
          }}>
            Enter as Student →
          </div>
        </button>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', position: 'relative' }}>
        Demo mode — role toggle only, no authentication required
      </p>
    </div>
  )
}
