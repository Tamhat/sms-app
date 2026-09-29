'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/student/dashboard',    label: 'My Dashboard', icon: '⊞' },
  { href: '/student/submissions',  label: 'Submissions',  icon: '📤' },
  { href: '/student/results',      label: 'My Results',   icon: '📊' },
  { href: '/student/fees',         label: 'My Fees',      icon: '💳' },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [studentId, setStudentId] = useState('SMS-2025-0001')
  const [studentName, setStudentName] = useState('Student')

  useEffect(() => {
    const sid = localStorage.getItem('sms_student_id') || 'SMS-2025-0001'
    setStudentId(sid)
    fetch(`/api/students/by-student-id/${sid}`)
      .then(async r => {
        if (r.ok) {
          const d = await r.json()
          if (d && d.fullName) setStudentName(d.fullName)
        }
      })
      .catch(() => {})
  }, [])

  const switchRole = () => {
    localStorage.setItem('sms_role', 'staff')
    router.push('/staff/dashboard')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">📚</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">{studentName.split(' ')[0]}</div>
            <div className="sidebar-brand-sub">{studentId}</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">My Portal</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={switchRole} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="sidebar-link-icon">🔄</span>
            Switch to Staff
          </button>
          <div style={{ padding: '8px 10px', marginTop: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              PEN Global · Student Portal<br />
              <span style={{ opacity: 0.6 }}>Demo Mode</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
