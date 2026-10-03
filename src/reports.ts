// Pure helpers for the Reports page: date ranges, filtering, aggregation, CSV.
import { WorkLogStatus } from './types';

export type RangePreset = 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'last_30' | 'custom';

export const iso = (d: Date) => d.toISOString().split('T')[0];
const parse = (s: string) => new Date(s + 'T12:00:00Z');
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setUTCDate(r.getUTCDate() + n); return r; };
const mondayOf = (d: Date) => {
  const r = new Date(d);
  const day = r.getUTCDay();
  return addDays(r, day === 0 ? -6 : 1 - day);
};

export const presetRange = (preset: RangePreset): { from: string; to: string } => {
  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);
  switch (preset) {
    case 'last_week': {
      const mon = addDays(mondayOf(now), -7);
      return { from: iso(mon), to: iso(addDays(mon, 6)) };
    }
    case 'this_month':
      return { from: iso(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12))), to: iso(now) };
    case 'last_month': {
      const y = now.getUTCFullYear(), m = now.getUTCMonth();
      return { from: iso(new Date(Date.UTC(y, m - 1, 1, 12))), to: iso(new Date(Date.UTC(y, m, 0, 12))) };
    }
    case 'last_30':
      return { from: iso(addDays(now, -29)), to: iso(now) };
    default: {
      const mon = mondayOf(now);
      return { from: iso(mon), to: iso(addDays(mon, 6)) };
    }
  }
};

export const listDays = (from: string, to: string): string[] => {
  const out: string[] = [];
  for (let d = parse(from); iso(d) <= to && out.length < 400; d = addDays(d, 1)) out.push(iso(d));
  return out;
};

export const workdaysIn = (from: string, to: string) =>
  listDays(from, to).filter(d => { const w = parse(d).getUTCDay(); return w !== 0 && w !== 6; }).length;

export interface Bucket { key: string; label: string; from: string; to: string }

// Daily columns for short ranges, Monday-based weekly columns for long ones.
export const buildBuckets = (from: string, to: string): Bucket[] => {
  const days = listDays(from, to);
  if (days.length <= 14) {
    return days.map(d => ({
      key: d,
      label: parse(d).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }),
      from: d,
      to: d,
    }));
  }
  const buckets: Bucket[] = [];
  let cursor = mondayOf(parse(from));
  while (iso(cursor) <= to && buckets.length < 60) {
    const start = iso(cursor);
    const end = iso(addDays(cursor, 6));
    buckets.push({
      key: start,
      label: 'Wk ' + parse(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      from: start,
      to: end,
    });
    cursor = addDays(cursor, 7);
  }
  return buckets;
};

export const sumHours = (logs: any[]) => logs.reduce((s, l) => s + (l.timeSpent || 0), 0);

export const groupBy = (items: any[], keyFn: (i: any) => string): [string, any[]][] => {
  const map: Record<string, any[]> = {};
  items.forEach(i => { (map[keyFn(i)] = map[keyFn(i)] || []).push(i); });
  return Object.keys(map).map(k => [k, map[k]]);
};

export const statusCounts = (logs: any[]) => ({
  completed: logs.filter(l => l.status === WorkLogStatus.COMPLETED).length,
  inProgress: logs.filter(l => l.status === WorkLogStatus.IN_PROGRESS).length,
  blocked: logs.filter(l => l.status === WorkLogStatus.BLOCKED).length,
});

const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export const toCSV = (headers: string[], rows: unknown[][]) =>
  [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');

export const downloadCSV = (filename: string, csv: string) => {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
