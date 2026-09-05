export const WS = {
  primary: '#4f46e5',
  primaryDark: '#4338ca',
  primaryLight: '#eef2ff',
  primaryMuted: '#c7d2fe',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  success: '#10b981',
  successBg: '#ecfdf5',
  warning: '#f59e0b',
  warningBg: '#fffbeb',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  info: '#3b82f6',
  infoBg: '#eff6ff',
} as const;

export const cardShadow = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

export function statusTone(status?: string): {
  bg: string;
  text: string;
  dot: string;
} {
  const s = (status ?? '').toLowerCase();
  if (s === 'completed' || s === 'operational' || s === 'passed')
    return { bg: WS.successBg, text: '#047857', dot: WS.success };
  if (s === 'in_progress' || s === 'active' || s === 'planned')
    return { bg: WS.infoBg, text: '#1d4ed8', dot: WS.info };
  if (s === 'on_hold' || s === 'maintenance' || s === 'pending')
    return { bg: WS.warningBg, text: '#b45309', dot: WS.warning };
  if (s === 'cancelled' || s === 'failed' || s === 'overdue')
    return { bg: WS.dangerBg, text: '#b91c1c', dot: WS.danger };
  if (s === 'urgent' || s === 'high')
    return { bg: WS.dangerBg, text: '#b91c1c', dot: WS.danger };
  if (s === 'medium')
    return { bg: WS.warningBg, text: '#b45309', dot: WS.warning };
  return { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' };
}

export function fmtLabel(v?: string) {
  if (!v) return '—';
  return v.replace(/_/g, ' ');
}
