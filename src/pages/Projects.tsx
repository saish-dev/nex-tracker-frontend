
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context';
import { Card, Badge, Button, Modal, Input, Label, Textarea, Select, SearchableSelect } from '../components/UI';
import { Layers, CheckCircle2, Clock, AlertOctagon, Plus, Edit2, Briefcase, Search, X, ShieldAlert, CheckSquare, Trash2 } from 'lucide-react';
import { ProjectStatus, UserRole } from '../types';
import { generateId, cn } from '../utils';

export const Projects = () => {
  const { state, dispatch } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentUser = state.auth.user;
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Access Control for Employees
  if (currentUser?.role !== UserRole.ADMIN && currentUser?.role !== UserRole.MANAGER) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <ShieldAlert className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
              <p className="text-gray-500 mt-2 max-w-md">You do not have access to the project management view. Please contact your manager or administrator if you need assistance.</p>
          </div>
      );
  }

  const initialFormState = {
    name: '',
    code: '',
    client: '',
    description: '',
    status: ProjectStatus.ACTIVE,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    assignedUserIds: [],
    managerId: '' 
  };
  const [formData, setFormData] = useState(initialFormState);

  // Permission Check
  const canManageProjects = isAdmin || state.auth.permissions.includes('manage_projects');

  // No Tenant Filter
  const allProjects = state.projects;
  const allUsers = state.users;

  // Filter Projects based on role and search
  const visibleProjects = allProjects.filter(p => {
      // 1. Role Visibility
      let isVisible = false;
      if (isAdmin) {
          isVisible = true;
      } else if (currentUser?.role === UserRole.MANAGER) {
          isVisible = p.managerId === currentUser.id || p.assignedUserIds.includes(currentUser.id);
      } else {
          // Fallback, though employees are blocked above
          isVisible = p.assignedUserIds.includes(currentUser?.id || '');
      }

      if (!isVisible) return false;

      // 2. Search Filter
      if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          return (
              p.name.toLowerCase().includes(lowerTerm) ||
              p.code.toLowerCase().includes(lowerTerm) ||
              p.client.toLowerCase().includes(lowerTerm)
          );
      }

      return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case ProjectStatus.ACTIVE: return <Clock className="h-3.5 w-3.5 mr-1" />;
      case ProjectStatus.COMPLETED: return <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      case ProjectStatus.ON_HOLD: return <AlertOctagon className="h-3.5 w-3.5 mr-1" />;
      default: return <Layers className="h-3.5 w-3.5 mr-1" />;
    }
  };

  const handleOpenModal = (project?: any) => {
      if (project) {
          setEditingProject(project);
          setFormData({
              ...project,
              assignedUserIds: project.assignedUserIds || []
          });
      } else {
          setEditingProject(null);
          setFormData({
              ...initialFormState,
              managerId: !isAdmin ? currentUser?.id : ''
          });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalManagerId = formData.managerId || currentUser?.id || 'system';

    if (editingProject) {
        dispatch({
            type: 'UPDATE_PROJECT',
            payload: {
                ...editingProject,
                ...formData,
                managerId: finalManagerId,
                updatedAt: new Date().toISOString()
            }
        });
    } else {
        const newProject = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: currentUser?.id || 'system',
            assignedUserIds: formData.assignedUserIds || [],
            ...formData,
            managerId: finalManagerId
        };
        dispatch({ type: 'ADD_PROJECT', payload: newProject });
    }
    setIsModalOpen(false);
  };

  const handleAddUser = (userId) => {
      if (!userId) return;
      setFormData(prev => ({
          ...prev,
          assignedUserIds: [...(prev.assignedUserIds || []), userId]
      }));
  };

  const handleRemoveUser = (userId) => {
      setFormData(prev => ({
          ...prev,
          assignedUserIds: (prev.assignedUserIds || []).filter(id => id !== userId)
      }));
  };

  const availableUsersForSelect = allUsers
    .filter(u => !(formData.assignedUserIds || []).includes(u.id))
    .map(u => ({ label: `${u.name} (${u.role})`, value: u.id }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h2>
          <p className="text-base text-gray-500 mt-1">Manage all your ongoing and completed initiatives.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                    placeholder="Search name, code, client..." 
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
            {canManageProjects && (
                <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-indigo-200 whitespace-nowrap">
                    <Plus className="h-5 w-5 mr-2" />
                    New Project
                </Button>
            )}
        </div>
      </div>

      {visibleProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-gray-200 border-dashed">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
                <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Projects Found</h3>
            <p className="text-gray-500 mt-1 max-w-sm">
                {searchTerm ? "No projects match your search criteria." : (canManageProjects ? "Get started by creating a new project." : "You haven't been assigned to any projects yet.")}
            </p>
             {canManageProjects && !searchTerm && (
                <Button onClick={() => handleOpenModal()} className="mt-4">
                    Create Project
                </Button>
            )}
            {searchTerm && (
                <Button variant="ghost" onClick={() => setSearchTerm('')} className="mt-4">
                    Clear Search
                </Button>
            )}
          </div>
      ) : (
        <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {visibleProjects.map((project) => {
                            return (
                                <tr key={project.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                            <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-600 mr-3">
                                                {project.code.split('-')[1] || project.code}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                                                <div className="text-xs text-gray-500">{project.client}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={project.status === 'active' ? 'indigo' : project.status === 'completed' ? 'success' : 'neutral'}>
                                            <span className="flex items-center">
                                                {getStatusIcon(project.status)}
                                                {project.status.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {allUsers.find(u => u.id === project.managerId)?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {project.startDate}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {canManageProjects && (
                                            <Button size="sm" variant="ghost" onClick={() => handleOpenModal(project)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
      )}

      {/* Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? 'Edit Project' : 'New Project'} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label>Project Name</Label>
                        <Input 
                            required 
                            placeholder="e.g. Website Redesign" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Project Code</Label>
                        <Input 
                            required 
                            placeholder="e.g. PRJ-001" 
                            value={formData.code}
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label>Client Name</Label>
                        <Input 
                            required 
                            placeholder="e.g. Acme Corp" 
                            value={formData.client}
                            onChange={(e) => setFormData({...formData, client: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Status</Label>
                        <Select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                        >
                            {Object.values(ProjectStatus).map(s => (
                                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </Select>
                    </div>
                </div>
                
                <div>
                    <Label>Description</Label>
                    <Textarea 
                        rows={3}
                        placeholder="Project goals and scope..."
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <Label>Start Date</Label>
                        <Input 
                            type="date"
                            required 
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Project Manager</Label>
                        <Select 
                            value={formData.managerId}
                            onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                            disabled={!isAdmin}
                        >
                            <option value="">Select Manager</option>
                            {allUsers.filter(u => u.role === UserRole.MANAGER || u.role === UserRole.ADMIN).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </Select>
                        {!isAdmin && <p className="text-xs text-gray-500 mt-1">Only Admins can reassign PMs.</p>}
                    </div>
                </div>
                
                <div>
                    <Label className="mb-2 block">Assigned Team Members</Label>
                    <div className="mb-4">
                        <SearchableSelect 
                            options={availableUsersForSelect}
                            value=""
                            onChange={handleAddUser}
                            placeholder="Search and add team member..."
                            className="w-full"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-100 rounded-lg bg-gray-50/50">
                        {(formData.assignedUserIds || []).map(userId => {
                            const user = allUsers.find(u => u.id === userId);
                            if (!user) return null;
                            return (
                                <div key={userId} className="flex items-center bg-white text-gray-700 pl-1 pr-2 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm animate-fade-in">
                                    <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 mr-2">
                                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
                                    </div>
                                    <span className="mr-2">{user.name}</span>
                                    <button 
                                        type="button"
                                        onClick={() => handleRemoveUser(userId)}
                                        className="p-0.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                                        title="Remove"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                        {(formData.assignedUserIds || []).length === 0 && (
                            <div className="flex items-center justify-center w-full text-xs text-gray-400 italic">
                                No team members assigned yet. Use the search above.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingProject ? 'Save Changes' : 'Create Project'}</Button>
                </div>
            </form>
      </Modal>
    </div>
  );
};
