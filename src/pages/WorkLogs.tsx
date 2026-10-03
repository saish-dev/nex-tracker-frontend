import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { Button, Card, Input, Select, Textarea, Modal, Badge, Label, SearchableSelect, ProgressBar } from '../components/UI';
import { 
  Plus, Search, Filter, Edit2, Trash2, Calendar, LayoutGrid, List, 
  ChevronLeft, ChevronRight, Clock, X, Users, User as UserIcon, Download, 
  CheckCircle2, AlertCircle, Sparkles, Loader2, Copy
} from 'lucide-react';
import { TaskType, WorkLogStatus, UserRole } from '../types';
import { formatDuration, generateId, cn } from '../utils';
import { TASK_TYPE_COLORS } from '../constants';
import { parseWorkLog, summarizeLogs } from '../ai';

export const WorkLogs = () => {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  
  const currentUser = state.auth.user;
  const currentUserId = currentUser?.id || '';
  const isManagerOrAdmin = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

  const allLogs = state.workLogs;
  const allProjects = state.projects;
  const allUsers = state.users;

  // Filters
  const [filterText, setFilterText] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // User Filter
  const [userFilter, setUserFilter] = useState(currentUserId);
  
  // View State: 'week' (Timesheet Matrix) or 'list' (Chronological Ledger)
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  const [weekCursor, setWeekCursor] = useState(new Date());

  // Form State
  const initialFormState = {
    projectId: '',
    taskType: TaskType.DEVELOPMENT,
    description: '',
    timeSpent: 1,
    date: new Date().toISOString().split('T')[0],
    status: WorkLogStatus.COMPLETED
  };
  const [formData, setFormData] = useState(initialFormState);

  // AI state
  const [aiNote, setAiNote] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const showUserColumn = isManagerOrAdmin && userFilter === 'ALL';

  // --- Helpers for Week Navigation ---
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    const newDate = new Date(date.setDate(diff));
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const currentWeekStart = useMemo(() => getStartOfWeek(weekCursor), [weekCursor]);
  const currentWeekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = addDays(currentWeekStart, i);
    const dateStr = d.toISOString().split('T')[0];
    return {
      dateObj: d,
      dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayFullName: d.toLocaleDateString('en-US', { weekday: 'long' }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString('en-US', { month: 'short' })
    };
  }), [currentWeekStart]);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDayStr, setSelectedDayStr] = useState<string>(() => {
    // Default to today if within current week, else Monday of the week
    return todayStr;
  });

  const handleWeekNav = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      setWeekCursor(new Date());
      setSelectedDayStr(todayStr);
    } else {
      setWeekCursor(prev => addDays(prev, direction === 'next' ? 7 : -7));
    }
  };

  const handleOpenModal = (log?: any, dateOverride?: string, projectOverride?: string) => {
    if (log) {
      setEditingLog(log);
      setFormData({
        projectId: log.projectId,
        taskType: log.taskType,
        description: log.description,
        timeSpent: log.timeSpent,
        date: log.date,
        status: log.status
      });
    } else {
      setEditingLog(null);
      setFormData({
        ...initialFormState,
        projectId: projectOverride || (availableProjectOptions[0]?.id || ''),
        date: dateOverride || selectedDayStr || todayStr
      });
    }
    setAiNote('');
    setAiError('');
    setIsModalOpen(true);
  };

  const handleSmartFill = async () => {
    if (!aiNote.trim()) return;
    setAiParsing(true);
    setAiError('');
    try {
      const parsed = await parseWorkLog(
        aiNote,
        availableProjectOptions.map(p => ({ id: p.id, name: p.name, code: p.code })),
        Object.values(TaskType),
        Object.values(WorkLogStatus)
      );
      setFormData(prev => ({
        ...prev,
        projectId: parsed.projectId || prev.projectId,
        taskType: parsed.taskType,
        description: parsed.description,
        timeSpent: parsed.timeSpent,
        status: parsed.status,
      }));
    } catch (e: any) {
      setAiError(e.message);
    } finally {
      setAiParsing(false);
    }
  };

  const handleSummarize = async () => {
    const logs = viewMode === 'week' ? weekLogs : listViewLogs;
    if (logs.length === 0) {
      setSummaryError('No logs in the current view to summarize.');
      return;
    }
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const team = isManagerOrAdmin && userFilter === 'ALL';
      const target = allUsers.find(u => u.id === userFilter);
      setSummary(await summarizeLogs(
        logs.map(l => ({
          date: l.date,
          userName: allUsers.find(u => u.id === l.userId)?.name,
          projectName: allProjects.find(p => p.id === l.projectId)?.name || 'Unknown',
          taskType: l.taskType,
          description: l.description,
          timeSpent: l.timeSpent,
          status: l.status,
        })),
        {
          team,
          label: team ? 'the whole team' : (target?.name || currentUser?.name || 'me'),
          periodLabel: viewMode === 'week'
            ? `${currentWeekDays[0].dateStr} to ${currentWeekDays[6].dateStr}`
            : 'the filtered logs',
        }
      ));
    } catch (e: any) {
      setSummaryError(e.message);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.auth.user) return;

    if (editingLog) {
      dispatch({
        type: 'UPDATE_LOG',
        payload: {
          ...editingLog,
          ...formData,
        }
      });
    } else {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: generateId(),
          userId: state.auth.user.id,
          createdAt: new Date().toISOString(),
          ...formData
        }
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      dispatch({ type: 'DELETE_LOG', payload: id });
    }
  };

  const clearFilters = () => {
    setFilterText('');
    setDateFilter('');
    setProjectFilter('');
    setTypeFilter('');
    setStatusFilter('');
    if (isManagerOrAdmin) {
      setUserFilter(currentUserId);
    }
  };

  const hasFilters = filterText || dateFilter || projectFilter || typeFilter || statusFilter || (isManagerOrAdmin && userFilter !== currentUserId);

  // Filtering Logic
  const getFilteredLogs = (logs: any[]) => {
    return logs.filter(log => {
      let userMatch = true;

      if (state.auth.user?.role !== UserRole.ADMIN && state.auth.user?.role !== UserRole.MANAGER) {
        userMatch = log.userId === state.auth.user?.id;
      } else {
        if (userFilter === 'ALL') {
          userMatch = true;
        } else if (userFilter) {
          userMatch = log.userId === userFilter;
        } else {
          userMatch = log.userId === currentUserId;
        }
      }

      const textMatch = filterText ? log.description.toLowerCase().includes(filterText.toLowerCase()) : true;
      const projectMatch = projectFilter ? log.projectId === projectFilter : true;
      const typeMatch = typeFilter ? log.taskType === typeFilter : true;
      const statusMatch = statusFilter ? log.status === statusFilter : true;

      return userMatch && textMatch && projectMatch && typeMatch && statusMatch;
    });
  };

  const filteredLogs = useMemo(() => {
    const logs = getFilteredLogs(allLogs);
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allLogs, state.auth.user, filterText, dateFilter, projectFilter, typeFilter, statusFilter, userFilter]);

  // List View specific filtering
  const listViewLogs = useMemo(() => {
    if (dateFilter) {
      return filteredLogs.filter(log => log.date === dateFilter);
    }
    return filteredLogs;
  }, [filteredLogs, dateFilter]);

  const userOptions = useMemo(() => {
    const others = allUsers.filter(u => u.id !== currentUserId).sort((a, b) => a.name.localeCompare(b.name));
    return [
      { label: 'Me (My Logs)', value: currentUserId },
      { label: 'All Users (Team Overview)', value: 'ALL' }, 
      ...others.map(u => ({ label: `${u.name} (${u.role.replace('_', ' ')})`, value: u.id }))
    ];
  }, [allUsers, currentUserId]);

  const availableProjectOptions = useMemo(() => {
    return allProjects.filter(p => {
      if (p.status !== 'active') return false;
      if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.MANAGER) {
        return p.assignedUserIds?.includes(currentUserId);
      }
      return true;
    });
  }, [allProjects, currentUser, currentUserId]);

  // --- Weekly Timesheet Matrix Aggregation ---
  // We group logs that belong to the current week by [projectId + taskType]
  const weekDatesSet = useMemo(() => new Set(currentWeekDays.map(d => d.dateStr)), [currentWeekDays]);

  const weekLogs = useMemo(() => {
    return filteredLogs.filter(log => weekDatesSet.has(log.date));
  }, [filteredLogs, weekDatesSet]);

  interface TimesheetRow {
    key: string;
    projectId: string;
    taskType: string;
    projectName: string;
    projectCode: string;
    client: string;
    dailyHours: Record<string, number>;
    dailyLogs: Record<string, any[]>;
    totalHours: number;
  }

  const timesheetMatrix = useMemo(() => {
    const rowMap: Record<string, TimesheetRow> = {};

    weekLogs.forEach(log => {
      const key = `${log.projectId}__${log.taskType}`;
      const project = allProjects.find(p => p.id === log.projectId);

      if (!rowMap[key]) {
        rowMap[key] = {
          key,
          projectId: log.projectId,
          taskType: log.taskType,
          projectName: project?.name || 'General Project',
          projectCode: project?.code || 'PRJ',
          client: project?.client || 'Internal',
          dailyHours: {},
          dailyLogs: {},
          totalHours: 0
        };
      }

      rowMap[key].dailyHours[log.date] = (rowMap[key].dailyHours[log.date] || 0) + log.timeSpent;
      rowMap[key].dailyLogs[log.date] = rowMap[key].dailyLogs[log.date] || [];
      rowMap[key].dailyLogs[log.date].push(log);
      rowMap[key].totalHours += log.timeSpent;
    });

    return Object.values(rowMap).sort((a, b) => b.totalHours - a.totalHours);
  }, [weekLogs, allProjects]);

  // Daily totals across all rows
  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    currentWeekDays.forEach(day => {
      totals[day.dateStr] = 0;
    });
    weekLogs.forEach(log => {
      if (totals[log.date] !== undefined) {
        totals[log.date] += log.timeSpent;
      }
    });
    return totals;
  }, [weekLogs, currentWeekDays]);

  const grandTotalWeekHours = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum: number, h: number) => sum + h, 0);
  }, [dailyTotals]);

  // Logs for the currently selected day to display in the ledger below
  const selectedDayLogs = useMemo(() => {
    return filteredLogs.filter(log => log.date === selectedDayStr);
  }, [filteredLogs, selectedDayStr]);

  const selectedDayTotalHours = useMemo(() => {
    return selectedDayLogs.reduce((sum, l) => sum + l.timeSpent, 0);
  }, [selectedDayLogs]);

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Date', 'Project', 'Task Type', 'Description', 'Hours', 'Status', 'User'];
    const rows = weekLogs.map(log => [
      log.date,
      `"${allProjects.find(p => p.id === log.projectId)?.name || 'Unknown'}"`,
      log.taskType,
      `"${log.description.replace(/"/g, '""')}"`,
      log.timeSpent,
      log.status,
      `"${allUsers.find(u => u.id === log.userId)?.name || 'Unknown'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timesheet_${currentWeekDays[0].dateStr}_to_${currentWeekDays[6].dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Work Logs & Timesheet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Track daily work hours, project allocation, and weekly timesheet compliance.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setViewMode('week')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md flex items-center transition-all cursor-pointer", 
                viewMode === 'week' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Timesheet (Week)
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-md flex items-center transition-all cursor-pointer", 
                viewMode === 'list' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Detailed List
            </button>
          </div>

          <Button variant="secondary" onClick={handleSummarize} disabled={summaryLoading}>
            {summaryLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            AI Summary
          </Button>

          <Button onClick={() => handleOpenModal()} className="shadow-xs shadow-indigo-200">
            <Plus className="h-4 w-4 mr-1.5" />
            Log Work
          </Button>
        </div>
      </div>

      {/* Filter and Navigation Toolbar */}
      <Card>
        <div className="p-4 space-y-3.5">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Manager / Admin User Selector */}
            {isManagerOrAdmin && (
              <div className="flex-none w-full lg:w-64">
                <SearchableSelect 
                  options={userOptions}
                  value={userFilter}
                  onChange={setUserFilter}
                  placeholder={userFilter === currentUserId ? "Me (My Logs)" : "Select Team Member..."}
                  className="w-full"
                />
              </div>
            )}

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input 
                placeholder="Search descriptions or keywords..." 
                className="pl-9" 
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2.5 flex-1">
              <Select 
                className="w-full sm:w-auto min-w-[130px]" 
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="">All Projects</option>
                {allProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              
              <Select 
                className="w-full sm:w-auto min-w-[125px]"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">All Work Types</option>
                {Object.values(TaskType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>

              <Select 
                className="w-full sm:w-auto min-w-[120px]"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.values(WorkLogStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>

              {viewMode === 'list' && (
                <Input 
                  type="date" 
                  className="w-full sm:w-auto"
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              )}
              
              {hasFilters && (
                <Button variant="ghost" onClick={clearFilters} className="text-slate-500 hover:text-rose-600">
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Week Navigation Bar (When in Timesheet Mode) */}
          {viewMode === 'week' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-slate-100 pt-3 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                  <button 
                    onClick={() => handleWeekNav('prev')} 
                    className="p-1.5 hover:bg-white hover:shadow-xs rounded-md transition-all text-slate-600 cursor-pointer"
                    title="Previous Week"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-3 text-xs font-semibold text-slate-800 min-w-[140px] text-center font-mono">
                    {currentWeekDays[0].monthName} {currentWeekDays[0].dayNum} – {currentWeekDays[6].monthName} {currentWeekDays[6].dayNum}
                  </span>
                  <button 
                    onClick={() => handleWeekNav('next')} 
                    className="p-1.5 hover:bg-white hover:shadow-xs rounded-md transition-all text-slate-600 cursor-pointer"
                    title="Next Week"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleWeekNav('current')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                >
                  Current Week
                </button>
              </div>

              {/* Timesheet Summary Stats & Quick Export */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Week Total:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm px-2 py-0.5 bg-slate-100 rounded-md">
                    {grandTotalWeekHours.toFixed(1)}h
                  </span>
                  <span className="text-slate-400">/ 40h target</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportCSV}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer text-xs flex items-center gap-1.5 border border-slate-200"
                    title="Export CSV"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {(summary || summaryError) && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="h-4 w-4 text-indigo-600" /> AI Summary
              </div>
              <div className="flex items-center gap-1">
                {summary && (
                  <button
                    onClick={() => navigator.clipboard?.writeText(summary)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md cursor-pointer"
                    title="Copy"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => { setSummary(''); setSummaryError(''); }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md cursor-pointer"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {summaryError
              ? <p className="text-xs text-rose-600">{summaryError}</p>
              : <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary}</p>}
          </div>
        </Card>
      )}

      {/* Main View Area */}
      {viewMode === 'week' ? (
        <div className="space-y-6">
          {/* Matrix Timesheet Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-left">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider w-80">
                      Project & Activity Type
                    </th>
                    {currentWeekDays.map(day => {
                      const isToday = day.dateStr === todayStr;
                      const isSelected = day.dateStr === selectedDayStr;
                      return (
                        <th 
                          key={day.dateStr}
                          onClick={() => setSelectedDayStr(day.dateStr)}
                          className={cn(
                            "py-3 px-3 text-center text-xs font-semibold cursor-pointer transition-colors border-l border-slate-200/60 min-w-[90px]",
                            isSelected ? "bg-indigo-50/80 text-indigo-950 font-bold" : "text-slate-700 hover:bg-slate-100/70"
                          )}
                        >
                          <div className="flex flex-col items-center">
                            <span className={cn("text-[10px] uppercase font-bold", isToday ? "text-indigo-600" : "text-slate-400")}>
                              {day.dayName}
                            </span>
                            <span className={cn(
                              "text-sm font-mono mt-0.5 px-1.5 py-0.5 rounded",
                              isToday ? "bg-indigo-600 text-white font-bold" : "text-slate-800"
                            )}>
                              {day.dayNum}
                            </span>
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-3 px-4 text-center text-xs font-semibold text-slate-900 uppercase tracking-wider border-l border-slate-200/80 w-28 bg-slate-100/60">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {timesheetMatrix.map(row => (
                    <tr key={row.key} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Project & Activity Info */}
                      <td className="py-3 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: TASK_TYPE_COLORS[row.taskType] || '#94a3b8' }}
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {row.projectName}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span className="font-mono text-[11px] text-slate-400">{row.projectCode}</span>
                              <span>·</span>
                              <span className="text-slate-600 font-medium">{row.taskType}</span>
                              <span>·</span>
                              <span className="text-slate-400 truncate max-w-[120px]">{row.client}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Daily Cells */}
                      {currentWeekDays.map(day => {
                        const hours = row.dailyHours[day.dateStr] || 0;
                        const logs = row.dailyLogs[day.dateStr] || [];
                        const isSelectedDay = day.dateStr === selectedDayStr;

                        return (
                          <td 
                            key={day.dateStr}
                            className={cn(
                              "py-2.5 px-2 text-center align-middle border-l border-slate-100 transition-colors",
                              isSelectedDay && "bg-indigo-50/20"
                            )}
                          >
                            {hours > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDayStr(day.dateStr);
                                  if (logs.length === 1) {
                                    handleOpenModal(logs[0]);
                                  }
                                }}
                                title={`${hours}h logged: ${logs.map(l => l.description).join('; ')}`}
                                className="w-full py-1.5 px-2 rounded-lg bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200/80 text-indigo-900 font-mono text-xs font-bold transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
                              >
                                {hours.toFixed(1)}h
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDayStr(day.dateStr);
                                  handleOpenModal(undefined, day.dateStr, row.projectId);
                                }}
                                className="w-full py-1.5 text-xs text-slate-300 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Click to log hours"
                              >
                                <span className="group-hover:hidden">—</span>
                                <span className="hidden group-hover:inline">+ Add</span>
                              </button>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Total */}
                      <td className="py-2.5 px-3 text-center align-middle border-l border-slate-200/80 bg-slate-50/40">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-mono font-bold text-slate-900 bg-slate-100">
                          {row.totalHours.toFixed(1)}h
                        </span>
                      </td>
                    </tr>
                  ))}

                  {timesheetMatrix.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium text-slate-600">No time recorded for this week yet.</p>
                        <p className="text-xs text-slate-400 mt-1">Click below to start logging time for this week.</p>
                        <div className="mt-4">
                          <Button size="sm" onClick={() => handleOpenModal(undefined, currentWeekDays[0].dateStr)}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Log First Entry
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Footer Totals Row */}
                <tfoot>
                  <tr className="bg-slate-100/80 border-t-2 border-slate-200 text-slate-900 font-semibold">
                    <td className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-slate-700">
                      Daily Summary
                    </td>
                    {currentWeekDays.map(day => {
                      const total = dailyTotals[day.dateStr] || 0;
                      const isTargetMet = total >= 8.0;
                      return (
                        <td 
                          key={day.dateStr}
                          className="py-3 px-2 text-center border-l border-slate-200/80 font-mono text-xs"
                        >
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "font-bold",
                              total > 0 ? "text-slate-900" : "text-slate-400"
                            )}>
                              {total.toFixed(1)}h
                            </span>
                            {total > 0 && (
                              <span className={cn(
                                "text-[10px] mt-0.5",
                                isTargetMet ? "text-emerald-600 font-medium" : "text-amber-600"
                              )}>
                                {isTargetMet ? "Target met" : `${(8 - total).toFixed(1)}h left`}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center border-l border-slate-200 bg-slate-200/60 font-mono font-bold text-sm text-indigo-900">
                      {grandTotalWeekHours.toFixed(1)}h
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {/* Selected Day Detailed Ledger */}
          <Card>
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Detailed Activity for {new Date(selectedDayStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md ml-1">
                  {selectedDayTotalHours.toFixed(1)}h total
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => handleOpenModal(undefined, selectedDayStr)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Entry for This Day
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/60">
                  <tr>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Task Type</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {selectedDayLogs.map(log => {
                    const project = allProjects.find(p => p.id === log.projectId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {project?.name || 'Unknown Project'}
                          <span className="block text-xs font-normal text-slate-400">{project?.code}</span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-xs text-slate-700">
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-slate-200 bg-slate-50 font-medium">
                            {log.taskType}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm text-slate-600 max-w-md">
                          {log.description}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm font-bold font-mono text-slate-900">
                          {formatDuration(log.timeSpent)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <Badge variant={log.status === WorkLogStatus.COMPLETED ? 'success' : log.status === WorkLogStatus.IN_PROGRESS ? 'indigo' : 'danger'}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-xs">
                          {(state.auth.user?.role === UserRole.ADMIN || state.auth.user?.id === log.userId) && (
                            <div className="flex justify-end gap-1">
                              <button 
                                onClick={() => handleOpenModal(log)} 
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={(e) => handleDelete(log.id, e)} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {selectedDayLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No work logged for this date. Click "Add Entry for This Day" above to log work.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        /* Detailed Chronological List View */
        <Card className="overflow-hidden">
          <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  {showUserColumn && <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>}
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {listViewLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-mono text-slate-900 font-semibold">{log.date}</td>
                    {showUserColumn && (
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 overflow-hidden">
                            {(() => {
                              const u = allUsers.find(user => user.id === log.userId);
                              return u?.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" /> : u?.name.charAt(0);
                            })()}
                          </div>
                          <span className="font-medium text-slate-800">{allUsers.find(u => u.id === log.userId)?.name}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-800 font-medium">
                      {allProjects.find(p => p.id === log.projectId)?.name}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {log.taskType}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-slate-600 max-w-sm truncate" title={log.description}>
                      {log.description}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-sm text-slate-900 font-bold font-mono">
                      {formatDuration(log.timeSpent)}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <Badge variant={log.status === WorkLogStatus.COMPLETED ? 'success' : log.status === WorkLogStatus.IN_PROGRESS ? 'indigo' : 'danger'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs">
                      {(state.auth.user?.role === UserRole.ADMIN || state.auth.user?.id === log.userId) && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleOpenModal(log)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer">
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(log.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {listViewLogs.length === 0 && (
                  <tr>
                    <td colSpan={showUserColumn ? 8 : 7} className="px-6 py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center">
                        <Search className="h-8 w-8 mb-2 opacity-25" />
                        <p className="text-sm font-medium text-slate-600">No work logs found matching your filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Log Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingLog ? 'Edit Work Log' : 'New Work Log'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editingLog && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
              <Label>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" /> Smart fill
                </span>
              </Label>
              <Textarea
                rows={2}
                placeholder='e.g. "fixed login bug for 2 hours, still stuck on the API timeout"'
                value={aiNote}
                onChange={(e) => setAiNote(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-600">{aiError}</span>
                <Button type="button" size="sm" variant="secondary" onClick={handleSmartFill} disabled={aiParsing || !aiNote.trim()}>
                  {aiParsing && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  Fill form
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label>Date</Label>
            <Input 
              type="date" 
              required 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Project</Label>
              <Select 
                required 
                value={formData.projectId}
                onChange={(e) => setFormData({...formData, projectId: e.target.value})}
              >
                <option value="">Select Project</option>
                {availableProjectOptions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Work Type</Label>
              <Select 
                value={formData.taskType}
                onChange={(e) => setFormData({...formData, taskType: e.target.value})}
              >
                {Object.values(TaskType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea 
              required
              rows={3}
              placeholder="Detailed description of the work performed..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                value={formData.timeSpent}
                onChange={(e) => setFormData({...formData, timeSpent: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                {Object.values(WorkLogStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-3 space-x-2 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingLog ? 'Save Changes' : 'Log Work'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
