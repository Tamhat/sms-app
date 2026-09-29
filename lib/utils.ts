import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Classification } from '@prisma/client'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(Number(amount))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getClassification(score: number): Classification {
  if (score >= 70) return 'DISTINCTION'
  if (score >= 60) return 'MERIT'
  if (score >= 40) return 'PASS'
  return 'FAIL'
}

export function classificationLabel(c: Classification) {
  return c.charAt(0) + c.slice(1).toLowerCase()
}

export function classificationColor(c: Classification) {
  switch (c) {
    case 'DISTINCTION': return 'text-violet-400 bg-violet-500/10 border-violet-500/20'
    case 'MERIT':       return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    case 'PASS':        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'FAIL':        return 'text-red-400 bg-red-500/10 border-red-500/20'
  }
}

export function statusColor(status: string) {
  switch (status) {
    case 'ENROLLED':  return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    case 'DEFERRED':  return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'WITHDRAWN': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'COMPLETED': return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    default:          return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}

export function isOverdue(dueDate: string | Date, paidAmount: number, totalAmount: number) {
  return new Date(dueDate) < new Date() && paidAmount < Number(totalAmount)
}

export function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
