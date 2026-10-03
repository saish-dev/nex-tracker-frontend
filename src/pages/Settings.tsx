
import React, { useState } from 'react';
import { useAppContext } from '../context';
import { Card, CardHeader, CardContent, Button, Modal, Input, Label, Textarea, Checkbox, Select } from '../components/UI';
import { Shield, Plus, Users, Trash2, Edit2 } from 'lucide-react';
import { UserRole } from '../types';
import { generateId, cn } from '../utils';

export const Settings = () => {
  const { state, dispatch } = useAppContext();
  const [activeTab, setActiveTab] = useState('users');
  
  // No tenant filtering
  const allUsers = state.users;
  
  // Role & Permissions State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
      name: '',
      email: '',
      role: UserRole.EMPLOYEE,
      department: ''
  });

  // Group Permissions by Module
  const groupedPermissions = state.permissions.reduce((acc: any, perm: any) => {
      if (!acc[perm.module]) acc[perm.module] = [];
      acc[perm.module].push(perm);
      return acc;
  }, {});

  // --- Role Handlers ---
  const handleCreateRole = (e) => {
      e.preventDefault();
      const newRole = {
          id: generateId(),
          name: roleForm.name,
          description: roleForm.description,
          isSystem: false
      };
      dispatch({ type: 'ADD_ROLE', payload: newRole });
      setIsRoleModalOpen(false);
      setRoleForm({ name: '', description: '' });
  };

  const togglePermission = (roleId, permId) => {
      if (roleId === UserRole.ADMIN) return;

      const currentPerms = state.rolePermissions[roleId] || [];
      const newPerms = currentPerms.includes(permId)
        ? currentPerms.filter(p => p !== permId)
        : [...currentPerms, permId];
      
      dispatch({
          type: 'UPDATE_ROLE_PERMISSIONS',
          payload: { roleId, permissions: newPerms }
      });
  };

  // --- User Handlers ---
  const handleOpenUserModal = (user?: any) => {
      if (user) {
          setEditingUser(user);
          setUserForm({ ...user });
      } else {
          setEditingUser(null);
          setUserForm({ name: '', email: '', role: UserRole.EMPLOYEE, department: '' });
      }
      setIsUserModalOpen(true);
  };

  const handleSaveUser = (e) => {
      e.preventDefault();
      if (editingUser) {
          dispatch({
              type: 'UPDATE_USER',
              payload: { ...editingUser, ...userForm }
          });
      } else {
          const newUser = {
              id: generateId(),
              avatarUrl: `https://ui-avatars.com/api/?name=${userForm.name}&background=random`,
              ...userForm
          };
          dispatch({ type: 'ADD_USER', payload: newUser });
      }
      setIsUserModalOpen(false);
  };

  const handleDeleteUser = (userId) => {
      if (window.confirm("Are you sure you want to remove this user? This action cannot be undone.")) {
          dispatch({ type: 'DELETE_USER', payload: userId });
      }
  };


  if (state.auth.user?.role !== UserRole.ADMIN && !state.auth.permissions.includes('manage_settings')) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-center p-10">
              <Shield className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
              <p className="text-gray-500 mt-2">You do not have permission to view system settings.</p>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h2>
                <p className="text-base text-gray-500 mt-1">Manage users, roles and access permissions.</p>
            </div>
            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 overflow-x-auto max-w-full">
                <button 
                    onClick={() => setActiveTab('users')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center whitespace-nowrap", 
                        activeTab === 'users' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    <Users className="h-4 w-4 mr-2" />
                    Users
                </button>
                <button 
                    onClick={() => setActiveTab('permissions')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap", 
                        activeTab === 'permissions' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Permissions Matrix
                </button>
                <button 
                    onClick={() => setActiveTab('roles')}
                    className={cn(
                        "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap", 
                        activeTab === 'roles' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    )}
                >
                    Roles
                </button>
             </div>
        </div>

        {activeTab === 'users' && (
            <Card className="overflow-hidden">
                <CardHeader 
                    title="User Management" 
                    description="Add or remove system users."
                    action={
                        <Button onClick={() => handleOpenUserModal()} size="sm" className="shadow-lg shadow-indigo-200">
                            <Plus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    }
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {allUsers.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden mr-3">
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={cn(
                                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                            user.role === UserRole.ADMIN ? "bg-purple-100 text-purple-800" :
                                            user.role === UserRole.MANAGER ? "bg-blue-100 text-blue-800" :
                                            "bg-gray-100 text-gray-800"
                                        )}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {user.department}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleOpenUserModal(user)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            {state.auth.user?.id !== user.id && (
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {activeTab === 'roles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.roles.map(role => (
                    <Card key={role.id} className="relative group">
                        <CardHeader 
                            title={role.name} 
                            description={role.isSystem ? "System Default Role" : "Custom Role"} 
                        />
                        <CardContent>
                            <p className="text-gray-600 text-sm mb-4 min-h-[40px]">{role.description}</p>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>ID: {role.id}</span>
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{(state.rolePermissions[role.id] || []).length} perms</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                <button 
                    onClick={() => setIsRoleModalOpen(true)}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group h-full min-h-[200px]"
                >
                    <Plus className="h-10 w-10 text-gray-300 group-hover:text-indigo-600 mb-3 transition-colors" />
                    <h3 className="text-lg font-semibold text-gray-900">Add Custom Role</h3>
                    <p className="text-sm text-gray-500 mt-1">Define a new role for your organization</p>
                </button>
            </div>
        )}

        {activeTab === 'permissions' && (
            <Card className="overflow-hidden">
                <CardHeader title="Access Control Matrix" description="Manage what each role can do within the application." />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/3">Permission / Module</th>
                                {state.roles.map(role => (
                                    <th key={role.id} className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        {role.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {Object.entries(groupedPermissions).map(([module, perms]: [string, any[]]) => (
                                <React.Fragment key={module}>
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={state.roles.length + 1} className="px-6 py-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                                            Module: {module}
                                        </td>
                                    </tr>
                                    {perms.map(perm => (
                                        <tr key={perm.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">{perm.name}</div>
                                                <div className="text-xs text-gray-500">{perm.description}</div>
                                            </td>
                                            {state.roles.map(role => {
                                                const hasPerm = (state.rolePermissions[role.id] || []).includes(perm.id);
                                                const isAdmin = role.id === UserRole.ADMIN;
                                                return (
                                                    <td key={`${role.id}-${perm.id}`} className="px-6 py-4 text-center">
                                                        <div className="flex justify-center">
                                                            <Checkbox 
                                                                checked={hasPerm || isAdmin}
                                                                disabled={isAdmin}
                                                                onChange={() => togglePermission(role.id, perm.id)}
                                                                className={cn(isAdmin && "opacity-50 cursor-not-allowed checked:bg-gray-400")}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        )}

        {/* Role Modal */}
        <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Create New Role">
            <form onSubmit={handleCreateRole} className="space-y-4">
                <div>
                    <Label>Role Name</Label>
                    <Input 
                        required 
                        placeholder="e.g. Content Editor" 
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                    />
                </div>
                <div>
                    <Label>Description</Label>
                    <Textarea 
                        required 
                        rows={3}
                        placeholder="What is this role for?" 
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                    />
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Create Role</Button>
                </div>
            </form>
        </Modal>

        {/* User Modal */}
        <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title={editingUser ? "Edit User" : "Add New User"}>
            <form onSubmit={handleSaveUser} className="space-y-4">
                <div>
                    <Label>Full Name</Label>
                    <Input 
                        required 
                        placeholder="e.g. John Doe" 
                        value={userForm.name}
                        onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    />
                </div>
                <div>
                    <Label>Email Address</Label>
                    <Input 
                        required 
                        type="email"
                        placeholder="john@nextracker.com" 
                        value={userForm.email}
                        onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Role</Label>
                        <Select 
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                        >
                            {Object.values(UserRole).map(role => (
                                <option key={role} value={role}>{role.toUpperCase()}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <Label>Department</Label>
                        <Input 
                            required
                            placeholder="e.g. Marketing" 
                            value={userForm.department}
                            onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-3">
                    <Button type="button" variant="ghost" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
                    <Button type="submit">{editingUser ? 'Save Changes' : 'Add User'}</Button>
                </div>
            </form>
        </Modal>
    </div>
  );
};
