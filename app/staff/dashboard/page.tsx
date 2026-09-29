'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

interface Stats {
  totalStudents: number
  enrolledStudents: number
  totalAssessments: number
  overdueCount: number
  totalOutstanding: number
  recentSubmissions: number
  unpublishedGrades: number
}

export default function StaffDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json()
          setStats(data)
        }
      })
      .catch((e) => console.error('Failed to load dashboard stats:', e))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
              Registry Dashboard
            </h1>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Overview of the student management system
            </p>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats grid */}
        <div className="grid grid-4" style={{ gap: 16, marginBottom: 28 }}>
          <div className="stat-card">
            <div className="stat-card-label">Total Students</div>
            {loading ? <div className="stat-card-value animate-pulse" style={{ height: 32, width: 60, background: 'var(--border)', borderRadius: 4 }} /> : (
              <div className="stat-card-value">{stats?.totalStudents ?? 0}</div>
            )}
            <div className="stat-card-sub">{stats?.enrolledStudents ?? 0} enrolled</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-label">Assessments</div>
            {loading ? <div className="stat-card-value animate-pulse" style={{ height: 32, width: 60, background: 'var(--border)', borderRadius: 4 }} /> : (
              <div className="stat-card-value">{stats?.totalAssessments ?? 0}</div>
            )}
            <div className="stat-card-sub">{stats?.recentSubmissions ?? 0} submissions this week</div>
          </div>

          <div className="stat-card" style={{ borderColor: (stats?.overdueCount ?? 0) > 0 ? 'rgba(239,68,68,0.3)' : undefined }}>
            <div className="stat-card-label" style={{ color: (stats?.overdueCount ?? 0) > 0 ? 'var(--danger)' : undefined }}>
              Overdue Fees
            </div>
            {loading ? <div className="stat-card-value animate-pulse" style={{ height: 32, width: 60, background: 'var(--border)', borderRadius: 4 }} /> : (
              <div className="stat-card-value" style={{ color: (stats?.overdueCount ?? 0) > 0 ? 'var(--danger)' : undefined }}>
                {stats?.overdueCount ?? 0}
              </div>
            )}
            <div className="stat-card-sub" style={{ color: (stats?.overdueCount ?? 0) > 0 ? 'var(--danger)' : undefined }}>
              {formatCurrency(stats?.totalOutstanding ?? 0)} outstanding
            </div>
          </div>

          <div className="stat-card" style={{ borderColor: (stats?.unpublishedGrades ?? 0) > 0 ? 'rgba(245,158,11,0.3)' : undefined }}>
            <div className="stat-card-label">Unpublished Grades</div>
            {loading ? <div className="stat-card-value animate-pulse" style={{ height: 32, width: 60, background: 'var(--border)', borderRadius: 4 }} /> : (
              <div className="stat-card-value" style={{ color: (stats?.unpublishedGrades ?? 0) > 0 ? 'var(--warning)' : undefined }}>
                {stats?.unpublishedGrades ?? 0}
              </div>
            )}
            <div className="stat-card-sub">awaiting publication</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 11 }}>
            Quick Actions
          </h2>
          <div className="grid grid-3" style={{ gap: 14 }}>
            {[
              { href: '/staff/students?action=new', icon: '➕', label: 'Enrol Student', desc: 'Add a new student record', color: '#4f7cff' },
              { href: '/staff/assessments?action=new', icon: '📋', label: 'Create Assessment', desc: 'Set up a new assessment', color: '#7c4fff' },
              { href: '/staff/fees', icon: '💳', label: 'Review Fees', desc: 'Check overdue balances', color: '#ef4444' },
              { href: '/staff/marksheet', icon: '📊', label: 'Enter Grades', desc: 'Record and publish results', color: '#10d98a' },
              { href: '/staff/students', icon: '👥', label: 'View Students', desc: 'Search and manage students', color: '#f59e0b' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="card" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.2s' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${item.color}18`,
                  border: `1px solid ${item.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Overdue notice */}
        {(stats?.overdueCount ?? 0) > 0 && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>⚠️</span>
            <div>
              <strong>{stats!.overdueCount} student{stats!.overdueCount !== 1 ? 's' : ''}</strong> have overdue fee balances totalling{' '}
              <strong>{formatCurrency(stats!.totalOutstanding)}</strong>.{' '}
              <Link href="/staff/fees" style={{ color: 'inherit', textDecoration: 'underline' }}>View Fees →</Link>
            </div>
          </div>
        )}

        {(stats?.unpublishedGrades ?? 0) > 0 && (
          <div className="alert alert-warning">
            <span>📊</span>
            <div>
              <strong>{stats!.unpublishedGrades} grade{stats!.unpublishedGrades !== 1 ? 's' : ''}</strong> are awaiting publication.{' '}
              <Link href="/staff/marksheet" style={{ color: 'inherit', textDecoration: 'underline' }}>Go to Marksheet →</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
