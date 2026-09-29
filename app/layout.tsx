import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SMS — Student Management System',
  description: 'PEN Global Registry — Student Management System for enrolment, fees, assessments, and results.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
