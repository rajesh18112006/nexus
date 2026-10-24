import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges Tailwind classes safely, resolving conflicts */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format number with Indian locale */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

/** Format currency in INR with lakh/crore notation */
export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
    if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(2)} L`;
    if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format date in Indian style: 29 Sep 2026 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format datetime */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** Relative time: "3h ago", "2d ago" */
export function formatRelative(date: string | Date): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second');
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

/** Days until a date */
export function daysUntil(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
}

/** Stockout risk color class */
export function riskColor(daysOfCover: number): string {
  if (daysOfCover <= 3)  return 'text-critical';
  if (daysOfCover <= 7)  return 'text-warning';
  if (daysOfCover <= 14) return 'text-warning';
  return 'text-healthy';
}

/** Stockout risk bg for runway bars */
export function riskBg(daysOfCover: number): string {
  if (daysOfCover <= 3)  return 'bg-critical';
  if (daysOfCover <= 7)  return 'bg-warning';
  if (daysOfCover <= 14) return 'bg-warning/60';
  return 'bg-healthy/70';
}
