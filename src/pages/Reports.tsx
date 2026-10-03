import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Download, Printer, Sparkles, Loader2, Copy } from 'lucide-react';
import { useAppContext } from '../context';
import { Button, Card, CardHeader, CardContent, Select, SearchableSelect, Input, Label, Badge } from '../components/UI';
import { UserRole, WorkLogStatus } from '../types';
import { cn } from '../utils';
import { summarizeLogs } from '../ai';
import { RangePreset, presetRange, sumHours, groupBy, statusCounts, toCSV, downloadCSV } from '../reports';

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'this_week', label: 'This week' },
  { id: 'last_week', label: 'Last week' },
  { id: 'custom', label: 'Custom range' },
];

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

const statusVariant = (s: string) =>
  s === WorkLogStatus.COMPLETED ? 'success' : s === WorkLogStatus.IN_PROGRESS ? 'warning' : 'danger';

export const Reports = () => {
  const { state } = useAppContext();
  const currentUser = state.auth.user;
  const canGenerate = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

  const [userId, setUserId] = useState('');
  const [preset, setPreset] = useState<RangePreset>('this_month');
  const [range, setRange] = useState(presetRange('this_month'));
  const [narrative, setNarrative] = useState('');
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrativeError, setNarrativeError] = useState('');

  const person = state.users.find(u => u.id === userId);
  const projectName = (id: string) => state.projects.find(p => p.id === id)?.name || 'Unknown';

  const logs = useMemo<any[]>(() => (state.workLogs as any[])
    .filter(l => l.userId === userId && l.date >= range.from && l.date <= range.to)
    .sort((a, b) => a.date.localeCompare(b.date)),
  [state.workLogs, userId, range]);

  const totalHours = sumHours(logs);
  const counts = statusCounts(logs);
  const days = new Set(logs.map(l => l.date)).size;

  const byProject = useMemo(() => groupBy(logs, l => l.projectId)
    .map(([pid, ls]) => ({ name: projectName(pid), logs: ls, hours: sumHours(ls) }))
    .sort((a, b) => b.hours - a.hours), [logs, state.projects]);

  const summary = useMemo(() => {
    if (!logs.length || !person) return null;
    const unique = (status: string) => Array.from(new Set(logs.filter(l => l.status === status).map(l => l.description)));
    return {
      headline: `${person.name} logged ${fmt(totalHours)}h over ${days} day${days === 1 ? '' : 's'} across ${byProject.length} project${byProject.length === 1 ? '' : 's'}, mostly on ${byProject[0].name} (${fmt(byProject[0].hours)}h).`,
      groups: [
        { label: 'Completed', tone: 'text-emerald-700', items: unique(WorkLogStatus.COMPLETED) },
        { label: 'In progress', tone: 'text-amber-700', items: unique(WorkLogStatus.IN_PROGRESS) },
        { label: 'Blocked', tone: 'text-rose-700', items: unique(WorkLogStatus.BLOCKED) },
      ].filter(g => g.items.length),
    };
  }, [logs, person, totalHours, days, byProject]);

  if (!canGenerate) return <Navigate to="/" replace />;

  const periodLabel = `${range.from} to ${range.to}`;
  const resetNarrative = () => setNarrative('');

  const handleNarrative = async () => {
    if (!person || !logs.length) return;
    setNarrativeLoading(true);
    setNarrativeError('');
    try {
      setNarrative(await summarizeLogs(
        logs.map(l => ({
          date: l.date, userName: person.name, projectName: projectName(l.projectId),
          taskType: l.taskType, description: l.description, timeSpent: l.timeSpent, status: l.status,
        })),
        { team: false, label: person.name, periodLabel }
      ));
    } catch (e: any) {
      setNarrativeError(e.message);
    } finally {
      setNarrativeLoading(false);
    }
  };

  const handleExport = () => {
    if (!person || !summary) return;
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [q(`Work report: ${person.name}`), q(`Period: ${periodLabel}`), q(`Total hours: ${fmt(totalHours)}`), '', q('Summary'), q(summary.headline)];
    summary.groups.forEach(g => {
      lines.push(q(`${g.label} (${g.items.length})`));
      g.items.forEach(it => lines.push(`,${q(it)}`));
    });
    if (narrative) lines.push('', q('AI summary'), ...narrative.split('\n').filter(Boolean).map(q));
    const rows = byProject.flatMap(p => p.logs.map(l => [p.name, l.date, l.taskType, l.description, fmt(l.timeSpent), l.status]));
    lines.push('', toCSV(['Project', 'Date', 'Type', 'Description', 'Hours', 'Status'], [...rows, ['Total', '', '', '', fmt(totalHours), '']]));
    downloadCSV(`report_${person.name.replace(/\s+/g, '_')}_${range.from}_to_${range.to}.csv`, lines.join('\n'));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h2>
          <p className="text-xs text-slate-500 mt-1">Pick a person and a period to see what they worked on.</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button variant="secondary" onClick={handleExport} disabled={!summary}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button onClick={() => window.print()} disabled={!summary}>
            <Printer className="h-4 w-4 mr-1.5" /> Print / PDF
          </Button>
        </div>
      </div>

      <Card className="print:hidden">
        <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Label>Person</Label>
            <SearchableSelect
              options={state.users.map(u => ({ label: `${u.name} (${u.role.replace(/_/g, ' ')})`, value: u.id }))}
              value={userId}
              onChange={v => { setUserId(v); resetNarrative(); }}
              placeholder="Search for a person…"
            />
          </div>
          <div>
            <Label htmlFor="rp-preset">Period</Label>
            <Select id="rp-preset" value={preset} onChange={e => {
              const p = e.target.value as RangePreset;
              setPreset(p);
              if (p !== 'custom') setRange(presetRange(p));
              resetNarrative();
            }}>
              {PRESETS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="rp-from">From</Label>
            <Input id="rp-from" type="date" value={range.from} max={range.to}
              onChange={e => { setPreset('custom'); setRange(r => ({ ...r, from: e.target.value })); resetNarrative(); }} />
          </div>
          <div>
            <Label htmlFor="rp-to">To</Label>
            <Input id="rp-to" type="date" value={range.to} min={range.from}
              onChange={e => { setPreset('custom'); setRange(r => ({ ...r, to: e.target.value })); resetNarrative(); }} />
          </div>
        </div>
      </Card>

      {!person && (
        <Card><div className="py-16 text-center text-sm text-slate-500">Select a person to generate their report.</div></Card>
      )}

      {person && (
        <>
          <div>
            <h3 className="text-xl font-bold text-slate-900">{person.name}</h3>
            <p className="text-sm text-slate-500"><span className="capitalize">{person.role.replace(/_/g, ' ')}</span> · {periodLabel}</p>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              ['Total hours', `${fmt(totalHours)}h`],
              ['Days worked', days],
              ['Projects', byProject.length],
              ['Blocked entries', counts.blocked],
            ].map(([label, value]) => (
              <Card key={label as string}>
                <div className="p-4">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold font-display tabular">{value}</p>
                </div>
              </Card>
            ))}
          </div>

          {!summary ? (
            <Card><div className="py-12 text-center text-sm text-slate-500">{person.name} has no work logged in this period.</div></Card>
          ) : (
            <>
              <Card>
                <CardHeader title="Work summary" />
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-800">{summary.headline}</p>
                    <div className="grid gap-4 md:grid-cols-3">
                      {summary.groups.map(g => (
                        <div key={g.label}>
                          <p className={cn('text-xs font-bold uppercase tracking-wider mb-1.5', g.tone)}>{g.label} · {g.items.length}</p>
                          <ul className="space-y-1.5 text-sm text-slate-600 list-disc pl-4">
                            {g.items.slice(0, 8).map(it => <li key={it}>{it}</li>)}
                            {g.items.length > 8 && <li className="list-none -ml-4 text-xs text-slate-400">+ {g.items.length - 8} more in the table below</li>}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-indigo-200">
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Sparkles className="h-4 w-4 text-indigo-600" /> AI summary
                    </div>
                    <div className="flex items-center gap-1 print:hidden">
                      {narrative && (
                        <button onClick={() => navigator.clipboard?.writeText(narrative)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer" title="Copy">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <Button size="sm" variant="secondary" onClick={handleNarrative} disabled={narrativeLoading}>
                        {narrativeLoading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                        {narrative ? 'Regenerate' : 'Generate'}
                      </Button>
                    </div>
                  </div>
                  {narrativeError && <p className="mt-2 text-xs text-rose-600">{narrativeError}</p>}
                  {narrative
                    ? <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">{narrative}</p>
                    : !narrativeError && <p className="mt-2 text-xs text-slate-500 print:hidden">Optional. Writes a short narrative of this person's work for the period.</p>}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader title="Work log" description="Grouped by project" />
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm tabular">
                    <thead className="bg-slate-50">
                      <tr>
                        {['Date', 'Type', 'Description', 'Hours', 'Status'].map((h, i) => (
                          <th key={h} className={cn('px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider', i === 3 ? 'text-right' : 'text-left')}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    {byProject.map(p => (
                      <tbody key={p.name} className="divide-y divide-slate-100 bg-white break-inside-avoid">
                        <tr className="bg-slate-50/70">
                          <td colSpan={3} className="px-4 py-2 font-semibold text-slate-900">{p.name}</td>
                          <td className="px-4 py-2 text-right font-mono font-semibold text-slate-900">{fmt(p.hours)}h</td>
                          <td />
                        </tr>
                        {p.logs.map(l => (
                          <tr key={l.id}>
                            <td className="px-4 py-2.5 whitespace-nowrap font-mono text-xs text-slate-600">{l.date}</td>
                            <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">{l.taskType}</td>
                            <td className="px-4 py-2.5 text-slate-700 min-w-[240px]">{l.description}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-700">{fmt(l.timeSpent)}</td>
                            <td className="px-4 py-2.5"><Badge variant={statusVariant(l.status)}>{l.status}</Badge></td>
                          </tr>
                        ))}
                      </tbody>
                    ))}
                    <tfoot className="bg-slate-50 font-semibold text-slate-900">
                      <tr>
                        <td colSpan={3} className="px-4 py-3">Total</td>
                        <td className="px-4 py-3 text-right font-mono">{fmt(totalHours)}h</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};
