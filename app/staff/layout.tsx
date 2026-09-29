'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { href: '/staff/dashboard',   label: 'Dashboard',    icon: '⊞' },
  { href: '/staff/students',    label: 'Students',     icon: '👥' },
  { href: '/staff/assessments', label: 'Assessments',  icon: '📋' },
  { href: '/staff/fees',        label: 'Fees',         icon: '💳' },
  { href: '/staff/marksheet',   label: 'Marksheet',    icon: '📊' },
]

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [overdueCount, setOverdueCount] = useState(0)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(async r => {
        if (r.ok) {
          const d = await r.json()
          setOverdueCount(d.overdueCount ?? 0)
        }
      })
      .catch(() => {})
  }, [])

  const switchRole = () => {
    localStorage.setItem('sms_role', 'student')
    router.push('/student/dashboard')
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🎓</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-title">SMS Registry</div>
            <div className="sidebar-brand-sub">Staff Portal</div>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
              {item.label === 'Fees' && overdueCount > 0 && (
                <span className="sidebar-link-badge">{overdueCount}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="sidebar-footer">
          <button onClick={switchRole} className="sidebar-link" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="sidebar-link-icon">🔄</span>
            Switch to Student
          </button>
          <div style={{ padding: '8px 10px', marginTop: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              PEN Global · Registry Module<br />
              <span style={{ opacity: 0.6 }}>v1.0.0 · Demo Mode</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
