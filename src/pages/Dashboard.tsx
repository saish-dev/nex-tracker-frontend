import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { UserRole, WorkLogStatus, TaskType } from '../types';
import { Card, CardContent, CardHeader, Badge, Button, ProgressBar, Input, Select, Modal, Label, Textarea } from '../components/UI';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine
} from 'recharts';
import { formatDuration, generateId, cn } from '../utils';
import { 
  Clock, CheckCircle, AlertCircle, TrendingUp, Users, Building2, Briefcase, 
  Plus, Calendar, ArrowUpRight, Flame, Target, Shield, CheckCircle2, 
  Layers, FileText
} from 'lucide-react';
import { TASK_TYPE_COLORS } from '../constants';

export const Dashboard = () => {
  const { state, dispatch } = useAppContext();
  const currentUser = state.auth.user;

  // Selected perspective tab: 'personal' (My Work Summary) or 'team' (Team Hours Overview) or 'department' (Department Summary)
  const [activeTab, setActiveTab] = useState<'personal' | 'team' | 'department'>(() => {
    if (currentUser?.role === UserRole.ADMIN) return 'department';
    if (currentUser?.role === UserRole.MANAGER) return 'team';
    return 'personal';
  });

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logFormData, setLogFormData] = useState({
    projectId: '',
    taskType: TaskType.DEVELOPMENT,
    description: '',
    timeSpent: 1.0,
    date: new Date().toISOString().split('T')[0],
    status: WorkLogStatus.COMPLETED
  });

  const handleOpenLogModal = (projectOverride?: string) => {
    setLogFormData({
      projectId: projectOverride || state.projects.find(p => p.status === 'active')?.id || state.projects[0]?.id || '',
      taskType: TaskType.DEVELOPMENT,
      description: '',
      timeSpent: 1.0,
      date: new Date().toISOString().split('T')[0],
      status: WorkLogStatus.COMPLETED
    });
    setIsLogModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    dispatch({
      type: 'ADD_LOG',
      payload: {
        id: generateId(),
        userId: currentUser.id,
        taskId: '',
        createdAt: new Date().toISOString(),
        ...logFormData
      }
    });
    setIsLogModalOpen(false);
  };

  if (!currentUser) return null;

  // Current Date Math
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Helper for current week dates (Mon to Sun)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const newDate = new Date(date.setDate(diff));
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };
  const weekStart = getStartOfWeek(today);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      name: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      isToday: d.toISOString().split('T')[0] === todayStr
    };
  });
  const weekDateSet = new Set(weekDays.map(w => w.dateStr));

  // --- Aggregate Personal Work Hours ---
  const myLogs = state.workLogs.filter(l => l.userId === currentUser.id);
  const myLogsToday = myLogs.filter(l => l.date === todayStr);
  const myHoursToday = myLogsToday.reduce((sum, l) => sum + l.timeSpent, 0);

  const myLogsThisWeek = myLogs.filter(l => weekDateSet.has(l.date));
  const myHoursThisWeek = myLogsThisWeek.reduce((sum, l) => sum + l.timeSpent, 0);

  // Active days count for personal user this week
  const myActiveDaysThisWeek = new Set(myLogsThisWeek.map(l => l.date)).size;
  const myAverageDailyHours = myActiveDaysThisWeek > 0 
    ? (myHoursThisWeek / myActiveDaysThisWeek).toFixed(1) 
    : '0.0';

  // Daily Chart Data for Current User this week (Mon to Sun)
  const personalWeeklyChartData = weekDays.map(day => {
    const hours = myLogs.filter(l => l.date === day.dateStr).reduce((sum, l) => sum + l.timeSpent, 0);
    return {
      day: day.name,
      hours: parseFloat(hours.toFixed(1)),
      target: 8.0,
      isToday: day.isToday
    };
  });

  // Work Type breakdown for current user this week
  const personalTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    myLogsThisWeek.forEach(log => {
      counts[log.taskType] = (counts[log.taskType] || 0) + log.timeSpent;
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name, 
      value: parseFloat(value.toFixed(1)) 
    })).sort((a, b) => b.value - a.value);
  }, [myLogsThisWeek]);

  // Logged Hours by Project for Current User this week
  const personalProjectBreakdown = useMemo(() => {
    const map: Record<string, { projectId: string; projectName: string; client: string; hours: number; entryCount: number }> = {};
    
    myLogsThisWeek.forEach(log => {
      const p = state.projects.find(proj => proj.id === log.projectId);
      const pId = log.projectId;
      if (!map[pId]) {
        map[pId] = {
          projectId: pId,
          projectName: p?.name || 'General Project',
          client: p?.client || 'General',
          hours: 0,
          entryCount: 0
        };
      }
      map[pId].hours += log.timeSpent;
      map[pId].entryCount += 1;
    });

    return Object.values(map).sort((a, b) => b.hours - a.hours);
  }, [myLogsThisWeek, state.projects]);

  // --- Aggregate Team Work Hours ---
  const teamLogsThisWeek = state.workLogs.filter(l => weekDateSet.has(l.date));
  const totalTeamHoursThisWeek = teamLogsThisWeek.reduce((sum, l) => sum + l.timeSpent, 0);

  // Department Distribution Data
  const deptHoursData = useMemo(() => {
    const map: Record<string, number> = {};
    state.workLogs.forEach(l => {
      const u = state.users.find(user => user.id === l.userId);
      const dept = u?.department || 'Operations';
      map[dept] = (map[dept] || 0) + l.timeSpent;
    });
    return Object.entries(map).map(([name, value]) => ({ 
      name, 
      value: parseFloat(value.toFixed(1)) 
    }));
  }, [state.workLogs, state.users]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Perspective Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60">
              {currentUser.role.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500">{currentUser.department} Department</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daily work status, logged hours pacing, and weekly timesheet summaries.
          </p>
        </div>

        {/* Perspective Switcher Controls & Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setActiveTab('personal')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                activeTab === 'personal'
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              My Work Summary
            </button>
            
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'team'
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Team Hours
            </button>

            <button
              onClick={() => setActiveTab('department')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'department'
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              Department Totals
            </button>
          </div>

          <Button 
            onClick={() => handleOpenLogModal()}
            className="shadow-xs shadow-indigo-200"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Work
          </Button>
        </div>
      </div>

      {/* 4 Work Logging KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Hours Logged Today */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Logged Today</span>
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                {myHoursToday.toFixed(1)}h
              </h3>
              <span className="text-xs text-slate-400">/ 8.0h target</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={myHoursToday} max={8} colorClass="bg-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Hours Logged This Week */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Logged This Week</span>
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                {myHoursThisWeek.toFixed(1)}h
              </h3>
              <span className="text-xs text-slate-400">/ 40.0h week</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={myHoursThisWeek} max={40} colorClass="bg-indigo-600" />
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Logged Entries This Week */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Work Logs Submitted</span>
              <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                {myLogsThisWeek.length}
              </h3>
              <span className="text-xs text-emerald-600 font-medium">entries this week</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <span>{myActiveDaysThisWeek} active days logged</span>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Daily Logged Average */}
        <Card className="hover:border-slate-300">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Daily Average</span>
              <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h3 className="text-2xl font-bold font-mono text-slate-900">
                {myAverageDailyHours}h
              </h3>
              <span className="text-xs text-slate-400">/ active day</span>
            </div>
            <div className="mt-3 text-xs text-slate-500 truncate">
              {myHoursThisWeek >= 32 ? 'Optimal weekly pacing' : 'On track for weekly goal'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Hours Bar Chart (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader 
            title="Weekly Hours Distribution" 
            description="Hours logged daily versus the standard 8.0h work pacing target"
            action={
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {myHoursThisWeek.toFixed(1)}h Total
              </span>
            }
          />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personalWeeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} domain={[0, 10]} />
                <RechartsTooltip 
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs shadow-xl border border-slate-800">
                          <p className="font-semibold">{data.day}</p>
                          <p className="font-mono text-indigo-300 mt-1">Logged: {data.hours}h</p>
                          <p className="text-slate-400 text-[10px]">Pacing Target: {data.target}h</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={8.0} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: '8h Target', fill: '#94a3b8', fontSize: 10, position: 'insideTopRight' }} />
                <Bar dataKey="hours" fill="#0f8a73" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Distribution Donut Chart (1 col) */}
        <Card>
          <CardHeader 
            title="Time by Work Type" 
            description="Distribution of hours this week" 
          />
          <CardContent className="h-72 flex flex-col justify-between">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={personalTypeData.length > 0 ? personalTypeData : [{ name: 'Development', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {personalTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TASK_TYPE_COLORS[entry.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              {personalTypeData.slice(0, 4).map((entry) => (
                <div key={entry.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: TASK_TYPE_COLORS[entry.name] || '#94a3b8' }} />
                    <span className="text-slate-600 truncate">{entry.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{entry.value}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Tab Content */}
      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time Logged by Project this week */}
          <Card>
            <CardHeader 
              title="Logged Hours by Project" 
              description="Where your working hours were allocated this week"
              action={
                <span className="text-xs text-slate-500 font-mono">
                  {personalProjectBreakdown.length} active projects
                </span>
              }
            />
            <div className="p-5 space-y-4">
              {personalProjectBreakdown.map(p => {
                const percent = myHoursThisWeek > 0 
                  ? Math.round((p.hours / myHoursThisWeek) * 100) 
                  : 0;

                return (
                  <div key={p.projectId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{p.projectName}</span>
                        <span className="text-slate-400 ml-2">({p.client})</span>
                      </div>
                      <div className="font-mono text-slate-600">
                        <span className="font-bold text-slate-900">{p.hours.toFixed(1)}h</span> ({percent}%)
                      </div>
                    </div>
                    <ProgressBar value={p.hours} max={myHoursThisWeek || 1} colorClass="bg-indigo-600" />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{p.entryCount} log entries submitted</span>
                      <button 
                        onClick={() => handleOpenLogModal(p.projectId)}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                      >
                        + Log to this project
                      </button>
                    </div>
                  </div>
                );
              })}

              {personalProjectBreakdown.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No work logged yet this week. Click "Log Work" to record your time.
                </div>
              )}
            </div>
          </Card>

          {/* My Recent Daily Logs */}
          <Card>
            <CardHeader 
              title="My Recent Work Entries" 
              description="Latest work submissions with status and duration" 
            />
            <div className="divide-y divide-slate-100">
              {myLogs.slice(0, 5).map(log => {
                const proj = state.projects.find(p => p.id === log.projectId);
                return (
                  <div key={log.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-900">
                          {proj?.name || 'General Project'}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[11px] font-mono text-slate-400">{log.date}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600 font-medium">{log.taskType}</span>
                      </div>
                      <p className="text-xs text-slate-600 truncate">{log.description}</p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-xs font-bold font-mono text-slate-900">
                        {formatDuration(log.timeSpent)}
                      </span>
                      <Badge variant={log.status === WorkLogStatus.COMPLETED ? 'success' : log.status === WorkLogStatus.IN_PROGRESS ? 'indigo' : 'danger'}>
                        {log.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}

              {myLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No logs recorded. Start by logging your work above.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Team Hours Tab */}
      {activeTab === 'team' && (
        <Card>
          <CardHeader 
            title="Team Hours & Capacity Overview" 
            description="Weekly hours logged by each team member"
            action={
              <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                {totalTeamHoursThisWeek.toFixed(1)}h Total Team Hours
              </span>
            }
          />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Logged This Week</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pacing Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Goal Progress (40h)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {state.users.map(u => {
                  const uHours = teamLogsThisWeek
                    .filter(l => l.userId === u.id)
                    .reduce((sum, l) => sum + l.timeSpent, 0);
                  const isTargetMet = uHours >= 35;
                  const isAhead = uHours >= 40;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img src={u.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                            <div className="text-xs text-slate-400 capitalize">{u.role.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-700 font-medium">
                        {u.department}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-sm font-bold font-mono text-slate-900">
                        {uHours.toFixed(1)}h
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Badge variant={isAhead ? 'success' : isTargetMet ? 'indigo' : 'warning'}>
                          {isAhead ? '40h Target Reached' : isTargetMet ? 'On Track (35h+)' : 'In Progress'}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap w-48">
                        <ProgressBar value={uHours} max={40} colorClass={isAhead ? 'bg-emerald-600' : 'bg-indigo-600'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Department Totals Tab */}
      {activeTab === 'department' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader 
              title="Department Logged Hours" 
              description="Cumulative hours logged across organizational units" 
            />
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" fill="#14b392" radius={[4, 4, 0, 0]} maxBarSize={48} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader 
              title="Department Logged Summary" 
              description="Total hours logged per operational unit" 
            />
            <div className="p-5 space-y-4">
              {deptHoursData.map(d => {
                const totalHours = deptHoursData.reduce((sum, item) => sum + item.value, 0);
                const percent = totalHours > 0 ? Math.round((d.value / totalHours) * 100) : 0;
                return (
                  <div key={d.name} className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{d.name} Department</h4>
                      <p className="text-xs text-slate-500 font-mono">{percent}% of organizational logs</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-slate-900">{d.value.toFixed(1)}h</div>
                      <div className="text-xs text-slate-400">logged time</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Recent Work Activity Feed */}
      <Card>
        <CardHeader 
          title="Recent Work Log Activity" 
          description="Chronological stream of work entries logged by the team"
        />
        <div className="divide-y divide-slate-100">
          {state.workLogs.slice(0, 6).map(log => {
            const user = state.users.find(u => u.id === log.userId);
            const project = state.projects.find(p => p.id === log.projectId);
            return (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img src={user?.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs text-slate-500 font-medium">{project?.name}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-mono text-slate-400">{log.date}</span>
                    </div>
                    <p className="text-sm text-slate-700 truncate mt-0.5">{log.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-bold font-mono text-slate-900">
                    {formatDuration(log.timeSpent)}
                  </span>
                  <Badge variant={log.status === WorkLogStatus.COMPLETED ? 'success' : log.status === WorkLogStatus.IN_PROGRESS ? 'indigo' : 'danger'}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Log Work Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title="Log Work Entry">
        <form onSubmit={handleModalSubmit} className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input 
              type="date" 
              required 
              value={logFormData.date}
              onChange={(e) => setLogFormData({...logFormData, date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project / Account</Label>
              <Select 
                required 
                value={logFormData.projectId}
                onChange={(e) => setLogFormData({...logFormData, projectId: e.target.value})}
              >
                <option value="">Select Project</option>
                {state.projects.filter(p => p.status === 'active').map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Work Type</Label>
              <Select 
                value={logFormData.taskType}
                onChange={(e) => setLogFormData({...logFormData, taskType: e.target.value})}
              >
                {Object.values(TaskType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Work Description</Label>
            <Textarea 
              required
              rows={3}
              placeholder="Summary of work completed..."
              value={logFormData.description}
              onChange={(e) => setLogFormData({...logFormData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Time Spent (Hours)</Label>
              <Input 
                type="number"
                step="0.25"
                min="0.25"
                max="24"
                required
                value={logFormData.timeSpent}
                onChange={(e) => setLogFormData({...logFormData, timeSpent: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={logFormData.status}
                onChange={(e) => setLogFormData({...logFormData, status: e.target.value})}
              >
                {Object.values(WorkLogStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsLogModalOpen(false)}>Cancel</Button>
            <Button type="submit">Submit Work Log</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
