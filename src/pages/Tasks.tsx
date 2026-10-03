
import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../context';
import { Card, Button, Modal, Input, Label, Textarea, Select, Badge, SearchableSelect } from '../components/UI';
import { 
  Plus, Search, CheckCircle2, Circle, Clock, AlertCircle, 
  GripVertical, User as UserIcon, Filter, MoreHorizontal, 
  Trash2, X, Zap, Bug, BookOpen, MessageSquare, Layout,
  List, LayoutGrid, ArrowUp, ArrowDown, AlignLeft
} from 'lucide-react';
import { TaskStatus, TaskPriority, UserRole, TaskType } from '../types';
import { generateId, cn } from '../utils';

// --- Icons & Helpers ---

const getTypeIcon = (type) => {
  switch (type) {
    case TaskType.BUG_FIX: return <Bug className="h-3 w-3" />;
    case TaskType.MEETING: return <MessageSquare className="h-3 w-3" />;
    case TaskType.RESEARCH: return <BookOpen className="h-3 w-3" />;
    case TaskType.DEVELOPMENT: 
    default: return <Zap className="h-3 w-3" />;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case TaskType.BUG_FIX: return 'text-red-600 bg-red-50 border-red-100';
    case TaskType.MEETING: return 'text-amber-600 bg-amber-50 border-amber-100';
    case TaskType.RESEARCH: return 'text-purple-600 bg-purple-50 border-purple-100';
    case TaskType.DEVELOPMENT: 
    default: return 'text-blue-600 bg-blue-50 border-blue-100';
  }
};

const getPriorityColor = (priority) => {
    switch(priority) {
        case TaskPriority.URGENT: return 'bg-red-100 text-red-700 border-red-200';
        case TaskPriority.HIGH: return 'bg-orange-100 text-orange-700 border-orange-200';
        case TaskPriority.MEDIUM: return 'bg-blue-100 text-blue-700 border-blue-200';
        case TaskPriority.LOW: return 'bg-slate-100 text-slate-600 border-slate-200';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const getStatusColor = (status) => {
    switch(status) {
        case TaskStatus.DONE: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
        case TaskStatus.REVIEW: return 'bg-purple-100 text-purple-700 border-purple-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

export const Tasks = () => {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL'); // ALL, ME, UNASSIGNED
  const [sortBy, setSortBy] = useState('PRIORITY'); // PRIORITY, DATE
  
  // Editing State
  const [editingTask, setEditingTask] = useState(null);
  
  // Drag & Drop State
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentUser = state.auth.user;
  const isAdminOrManager = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER;

  const initialFormState = {
    projectId: '',
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    type: TaskType.DEVELOPMENT,
    assigneeId: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Data & Filtering ---
  const allProjects = state.projects;
  const allTasks = state.tasks || [];
  const allUsers = state.users;

  // Filter Projects visible to user (for dropdowns)
  const visibleProjects = useMemo(() => {
      if (isAdminOrManager) return allProjects.filter(p => p.status === 'active');
      return allProjects.filter(p => p.assignedUserIds.includes(currentUser?.id) && p.status === 'active');
  }, [allProjects, currentUser, isAdminOrManager]);

  // Filter Tasks visible on board
  const visibleTasks = useMemo(() => {
      let filtered = allTasks.filter(task => {
          // 1. Text Search
          if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
          
          // 2. Project Filter
          if (projectFilter && task.projectId !== projectFilter) return false;

          // 3. Permission / Assignee Filter
          if (!isAdminOrManager) {
               // Standard users: Must be in their project OR assigned to them
               const isAssigned = task.assigneeId === currentUser?.id;
               const isInMyProject = visibleProjects.some(p => p.id === task.projectId);
               if (!isAssigned && !isInMyProject) return false;
          }

          // 4. Dashboard Assignee Filter
          if (assigneeFilter === 'ME') {
              if (task.assigneeId !== currentUser?.id) return false;
          } else if (assigneeFilter === 'UNASSIGNED') {
              if (task.assigneeId) return false;
          }

          return true;
      });

      // Sorting
      return filtered.sort((a, b) => {
          if (sortBy === 'PRIORITY') {
              const pOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 };
              return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
          } else {
              // Date
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }
      });
  }, [allTasks, searchTerm, projectFilter, assigneeFilter, isAdminOrManager, currentUser, visibleProjects, sortBy]);

  // --- Handlers ---
  const handleOpenModal = (task?: any, statusOverride?: string) => {
      if (task) {
          setEditingTask(task);
          setFormData({
              ...task,
              type: task.type || TaskType.DEVELOPMENT
          });
      } else {
          setEditingTask(null);
          setFormData({
              ...initialFormState,
              status: statusOverride || TaskStatus.TODO,
              assigneeId: currentUser?.id,
              // If project filter is set, pre-fill it
              projectId: projectFilter || '' 
          });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
      e.preventDefault();
      
      if (editingTask) {
          dispatch({ 
              type: 'UPDATE_TASK', 
              payload: { ...editingTask, ...formData } 
          });
      } else {
          const newTask = {
              id: generateId(),
              ...formData,
              createdAt: new Date().toISOString()
          };
          dispatch({ type: 'ADD_TASK', payload: newTask });
      }
      setIsModalOpen(false);
  };

  const handleDelete = () => {
      if (editingTask && confirm('Are you sure you want to delete this task?')) {
          dispatch({ type: 'DELETE_TASK', payload: editingTask.id });
          setIsModalOpen(false);
      }
  };

  // --- Drag & Drop Handlers ---
  const onDragStart = (e, task) => {
      dragItem.current = task;
      setIsDragging(true);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", task.id);
  };

  const onDragOver = (e) => {
      e.preventDefault(); 
  };

  const onDrop = (e, newStatus) => {
      e.preventDefault();
      const task = dragItem.current;
      if (task && task.status !== newStatus) {
          dispatch({ type: 'UPDATE_TASK', payload: { ...task, status: newStatus } });
      }
      setIsDragging(false);
      dragItem.current = null;
  };

  const onQuickAdd = (status, title) => {
      if (!title.trim()) return;
      
      // Try to infer project if filter is set, else grab first visible project
      const pid = projectFilter || (visibleProjects.length > 0 ? visibleProjects[0].id : '');
      
      if (!pid) {
          alert("Please select a project filter or ensure you have active projects to add tasks.");
          return;
      }

      const newTask = {
          id: generateId(),
          title: title,
          projectId: pid,
          status: status,
          priority: TaskPriority.MEDIUM,
          type: TaskType.DEVELOPMENT,
          description: '',
          assigneeId: '',
          createdAt: new Date().toISOString()
      };
      dispatch({ type: 'ADD_TASK', payload: newTask });
  };


  // --- Sub-Components ---

  const TaskCard = ({ task }: { task: any; [key: string]: any }) => {
      const project = allProjects.find(p => p.id === task.projectId);
      const assignee = allUsers.find(u => u.id === task.assigneeId);
      const type = task.type || TaskType.DEVELOPMENT;

      return (
          <div 
            draggable 
            onDragStart={(e) => onDragStart(e, task)}
            onClick={() => handleOpenModal(task)}
            className={cn(
                "bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm transition-all group cursor-pointer relative hover:shadow-md hover:border-indigo-300",
                isDragging && dragItem.current?.id === task.id ? "opacity-50 scale-95" : "opacity-100"
            )}
          >
              {/* Card Header Labels */}
              <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-1.5">
                    <span className={cn("flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", getTypeColor(type))}>
                        {getTypeIcon(type)}
                        <span className="ml-1 hidden xl:inline">{type === TaskType.DEVELOPMENT ? 'Dev' : type}</span>
                    </span>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border", getPriorityColor(task.priority))}>
                        {task.priority}
                    </span>
                  </div>
              </div>
              
              {/* Content */}
              <h4 className="text-sm font-semibold text-gray-800 mb-1 leading-snug line-clamp-2">{task.title}</h4>
              <div className="text-xs text-gray-400 mb-3 truncate flex items-center">
                   {project?.name || 'Unknown Project'}
              </div>
              
              {/* Footer */}
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-50">
                  <div className="flex items-center">
                      {assignee ? (
                          <div className="flex items-center" title={assignee.name}>
                            <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] text-indigo-700 font-bold mr-1.5 border border-white shadow-sm ring-1 ring-gray-100">
                                {assignee.avatarUrl ? <img src={assignee.avatarUrl} className="w-full h-full rounded-full object-cover" /> : assignee.name.charAt(0)}
                            </div>
                            <span className="text-xs text-gray-500 max-w-[80px] truncate">{assignee.name.split(' ')[0]}</span>
                          </div>
                      ) : (
                          <span className="text-xs text-gray-300 italic flex items-center">
                              <UserIcon className="h-3 w-3 mr-1" /> Unassigned
                          </span>
                      )}
                  </div>
                  
                  {/* Edit Icon on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                  </div>
              </div>
          </div>
      );
  };

  const KanbanColumn = ({ status, title, icon: Icon, color }) => {
      const tasks = visibleTasks.filter(t => t.status === status);
      const [quickAddValue, setQuickAddValue] = useState('');

      const handleQuickAddSubmit = (e) => {
          e.preventDefault();
          onQuickAdd(status, quickAddValue);
          setQuickAddValue('');
      };

      return (
          <div 
            className="flex flex-col h-full min-w-[300px] w-full bg-gray-50/80 rounded-xl border border-gray-200/60 flex-shrink-0 md:flex-shrink"
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, status)}
          >
              {/* Header */}
              <div className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center rounded-t-xl bg-white sticky top-0 z-10 shadow-sm`}>
                  <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-md ${color} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
                      </div>
                      <h3 className="font-bold text-gray-700 text-sm">{title}</h3>
                  </div>
                  <Badge variant="neutral" className="bg-gray-50 border shadow-sm text-gray-500 font-mono">
                      {tasks.length}
                  </Badge>
              </div>

              {/* Task List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[500px]">
                  {tasks.map(task => <TaskCard key={task.id} task={task} />)}
                  
                  {/* Quick Add Form */}
                  <form onSubmit={handleQuickAddSubmit} className="mt-2">
                     <div className="relative group">
                        <Plus className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text"
                            placeholder="Quick add task..."
                            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-dashed border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-400"
                            value={quickAddValue}
                            onChange={(e) => setQuickAddValue(e.target.value)}
                        />
                     </div>
                  </form>
              </div>
          </div>
      );
  };

  // --- List View Component ---
  const TaskListView = () => {
      return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assignee</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {visibleTasks.map(task => {
                            const project = allProjects.find(p => p.id === task.projectId);
                            const assignee = allUsers.find(u => u.id === task.assigneeId);
                            const type = task.type || TaskType.DEVELOPMENT;
                            
                            return (
                                <tr key={task.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className={cn("w-full justify-center", getStatusColor(task.status))}>
                                            {task.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900 line-clamp-1 cursor-pointer hover:text-indigo-600" onClick={() => handleOpenModal(task)}>
                                                {task.title}
                                            </span>
                                            {task.description && (
                                                <span className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-xs">{task.description}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {project?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", getTypeColor(type))}>
                                            {getTypeIcon(type)}
                                            <span className="ml-1.5">{type === TaskType.DEVELOPMENT ? 'Dev' : type}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", getPriorityColor(task.priority))}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         {assignee ? (
                                            <div className="flex items-center">
                                                <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-700 font-bold mr-2 border border-white shadow-sm">
                                                    {assignee.avatarUrl ? <img src={assignee.avatarUrl} className="w-full h-full rounded-full object-cover" /> : assignee.name.charAt(0)}
                                                </div>
                                                <span className="text-sm text-gray-600">{assignee.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">Unassigned</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(task)} className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-indigo-50">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {visibleTasks.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <Search className="h-10 w-10 text-gray-300 mb-2" />
                                        <p>No tasks found matching your filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Task Board</h2>
          <p className="text-sm text-gray-500 mt-1">
             {visibleProjects.length === 0 ? "No active projects assigned." : `Showing tasks from ${projectFilter ? '1 project' : `${visibleProjects.length} projects`}`}
          </p>
        </div>
        
        {/* Actions Row */}
        <div className="flex flex-col xl:flex-row gap-3 w-full md:w-auto items-end xl:items-center">
             
             {/* View Switcher */}
             <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button 
                    onClick={() => setViewMode('kanban')}
                    className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center", viewMode === 'kanban' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700")}
                    title="Kanban Board"
                >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Board
                </button>
                <button 
                    onClick={() => setViewMode('list')}
                    className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center", viewMode === 'list' ? "bg-white shadow-sm text-indigo-600" : "text-gray-500 hover:text-gray-700")}
                    title="List View"
                >
                    <List className="h-4 w-4 mr-2" />
                    List
                </button>
             </div>

             {/* Search */}
             <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                    placeholder="Search titles..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             {/* Filter Group */}
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                 <Select 
                    className="w-40 min-w-[150px]"
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                 >
                     <option value="">All Projects</option>
                     {visibleProjects.map(p => (
                         <option key={p.id} value={p.id}>{p.name}</option>
                     ))}
                 </Select>

                 <Select 
                    className="w-36 min-w-[140px]"
                    value={assigneeFilter}
                    onChange={(e) => setAssigneeFilter(e.target.value)}
                 >
                     <option value="ALL">All Assignees</option>
                     <option value="ME">My Tasks</option>
                     <option value="UNASSIGNED">Unassigned</option>
                 </Select>
                 
                 <Select 
                    className="w-36 min-w-[140px]"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                 >
                     <option value="PRIORITY">Sort: Priority</option>
                     <option value="DATE">Sort: Recent</option>
                 </Select>
             </div>

             <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-indigo-200 whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                New Task
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'kanban' ? (
        <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-6 h-full min-w-[1000px] md:min-w-0">
                <KanbanColumn status={TaskStatus.TODO} title="To Do" icon={Circle} color="text-slate-600 bg-slate-500" />
                <KanbanColumn status={TaskStatus.IN_PROGRESS} title="In Progress" icon={Clock} color="text-blue-600 bg-blue-500" />
                <KanbanColumn status={TaskStatus.REVIEW} title="In Review" icon={AlertCircle} color="text-purple-600 bg-purple-500" />
                <KanbanColumn status={TaskStatus.DONE} title="Done" icon={CheckCircle2} color="text-emerald-600 bg-emerald-500" />
            </div>
        </div>
      ) : (
        <TaskListView />
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTask ? "Edit Task" : "Create New Task"}>
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <Label>Task Title</Label>
                  <Input 
                      required 
                      placeholder="e.g. Implement API Endpoint" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label>Project</Label>
                      <Select 
                          required 
                          value={formData.projectId}
                          onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                          disabled={!!editingTask} // Lock project on edit to keep things simple
                      >
                          <option value="">Select Project</option>
                          {visibleProjects.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                      </Select>
                  </div>
                  <div>
                      <Label>Task Type</Label>
                      <Select 
                          value={formData.type}
                          onChange={(e) => setFormData({...formData, type: e.target.value})}
                      >
                          {Object.values(TaskType).map(t => (
                              <option key={t} value={t}>{t}</option>
                          ))}
                      </Select>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                   <div>
                      <Label>Status</Label>
                      <Select 
                          value={formData.status}
                          onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                          {Object.values(TaskStatus).map(s => (
                              <option key={s} value={s}>{s}</option>
                          ))}
                      </Select>
                  </div>
                  <div>
                      <Label>Priority</Label>
                      <Select 
                          value={formData.priority}
                          onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      >
                          {Object.values(TaskPriority).map(p => (
                              <option key={p} value={p}>{p}</option>
                          ))}
                      </Select>
                  </div>
              </div>

              <div>
                  <Label>Assignee</Label>
                  <Select 
                      value={formData.assigneeId}
                      onChange={(e) => setFormData({...formData, assigneeId: e.target.value})}
                  >
                      <option value="">Unassigned</option>
                      {allUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                  </Select>
              </div>

              <div>
                  <Label>Description</Label>
                  <Textarea 
                      rows={4}
                      placeholder="Detailed task description..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100 mt-4">
                  {editingTask ? (
                      <Button type="button" variant="danger" onClick={handleDelete} className="bg-white border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-none">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </Button>
                  ) : <div></div>}
                  
                  <div className="flex space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingTask ? 'Save Changes' : 'Create Task'}</Button>
                  </div>
              </div>
          </form>
      </Modal>
    </div>
  );
};
