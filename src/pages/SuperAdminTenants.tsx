
import React, { useState } from 'react';
import { useAppContext } from '../context';
import { Card, CardHeader, Button, Modal, Input, Label, Select, Badge } from '../components/UI';
import { Users, Plus, Search, Globe, MoreHorizontal, Palette } from 'lucide-react';
import { generateId } from '../utils';

export const SuperAdminTenants = () => {
    const { state, dispatch } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        plan: 'pro',
        status: 'active',
        logoUrl: '',
        primaryColor: '#0f8a73',
        secondaryColor: '#7ad2b8'
    });

    const filteredTenants = state.tenants.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateTenant = (e) => {
        e.preventDefault();
        const newTenant = {
            id: generateId(),
            createdAt: new Date().toISOString(),
            name: formData.name,
            slug: formData.slug,
            plan: formData.plan,
            status: formData.status,
            branding: {
                logoUrl: formData.logoUrl,
                primaryColor: formData.primaryColor,
                secondaryColor: formData.secondaryColor
            }
        };
        dispatch({ type: 'ADD_TENANT', payload: newTenant });
        setIsModalOpen(false);
        setFormData({ name: '', slug: '', plan: 'pro', status: 'active', logoUrl: '', primaryColor: '#0f8a73', secondaryColor: '#7ad2b8' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Tenants</h2>
                    <p className="text-base text-gray-500 mt-1">Manage company workspaces and subscriptions.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-indigo-200">
                    <Plus className="h-5 w-5 mr-2" />
                    New Tenant
                </Button>
            </div>

            <Card className="overflow-hidden border-none shadow-sm">
                <CardHeader 
                    title="All Organizations" 
                    description={`${filteredTenants.length} tenants found`}
                    action={
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search tenants..." 
                                className="pl-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    }
                />
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Users</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {tenant.branding?.logoUrl ? (
                                                <div className="h-10 w-10 flex-shrink-0 mr-3 flex items-center justify-center">
                                                    <img src={tenant.branding.logoUrl} className="max-h-full max-w-full object-contain" alt="" />
                                                </div>
                                            ) : (
                                                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg font-bold text-white mr-3 shadow-sm" style={{ backgroundColor: tenant.branding?.primaryColor || '#0f8a73' }}>
                                                    {tenant.name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{tenant.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                                                    <Globe className="h-3 w-3 mr-1" />
                                                    {tenant.slug}.nextracker.app
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant="indigo" className="uppercase tracking-wider text-[10px]">{tenant.plan}</Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                                            {state.users.filter(u => u.tenantId === tenant.id).length}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge variant={tenant.status === 'active' ? 'success' : 'danger'}>
                                            {tenant.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(tenant.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision New Tenant">
                <form onSubmit={handleCreateTenant} className="space-y-4">
                    <div>
                        <Label>Company Name</Label>
                        <Input 
                            required 
                            placeholder="e.g. Acme Corp" 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div>
                        <Label>Subdomain Slug</Label>
                        <div className="flex rounded-md shadow-sm">
                            <Input 
                                required 
                                placeholder="acme" 
                                className="rounded-r-none border-r-0"
                                value={formData.slug}
                                onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                            />
                            <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-200 bg-gray-50 text-gray-500 text-sm">
                                .nextracker.app
                            </span>
                        </div>
                    </div>
                    <div>
                        <Label>Subscription Plan</Label>
                        <Select 
                            value={formData.plan} 
                            onChange={(e) => setFormData({...formData, plan: e.target.value})}
                        >
                            <option value="starter">Starter</option>
                            <option value="pro">Professional</option>
                            <option value="enterprise">Enterprise</option>
                        </Select>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-4 mt-4">
                        <Label className="flex items-center text-indigo-600 mb-4">
                            <Palette className="h-4 w-4 mr-2" />
                            Branding Defaults
                        </Label>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Primary Color</Label>
                                <div className="flex items-center space-x-2">
                                    <Input 
                                        type="color" 
                                        className="h-10 w-12 p-1"
                                        value={formData.primaryColor}
                                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                                    />
                                    <Input 
                                        value={formData.primaryColor}
                                        onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Secondary Color</Label>
                                <div className="flex items-center space-x-2">
                                    <Input 
                                        type="color" 
                                        className="h-10 w-12 p-1"
                                        value={formData.secondaryColor}
                                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                                    />
                                    <Input 
                                        value={formData.secondaryColor}
                                        onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Label>Logo URL (Optional)</Label>
                                <Input 
                                    placeholder="https://..." 
                                    value={formData.logoUrl}
                                    onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 space-x-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create Tenant</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
