'use client';

import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type NoticeTone = 'error' | 'info' | 'success';

const toneStyles: Record<NoticeTone, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300',
  info:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200',
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

interface StatusNoticeProps {
  tone: NoticeTone;
  message: string;
  className?: string;
}

export function StatusNotice({ tone, message, className }: StatusNoticeProps) {
  const Icon = toneIcons[tone];

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        toneStyles[tone],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
