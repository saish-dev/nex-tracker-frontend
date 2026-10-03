
import React, { useMemo } from 'react';
import { useAppContext } from '../context';
import { Card, CardHeader, CardContent } from '../components/UI';
import { Building2, Users, CreditCard, Activity, TrendingUp, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <Card className="hover:shadow-md transition-shadow border-none shadow-sm">
    <CardContent className="flex items-center p-6">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 mr-4 shadow-sm`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h4>
        {subtext && <p className="text-xs text-green-600 flex items-center mt-1 font-medium"><ArrowUpRight className="h-3 w-3 mr-0.5" /> {subtext}</p>}
      </div>
    </CardContent>
  </Card>
);

export const SuperAdminDashboard = () => {
    const { state } = useAppContext();
    
    const totalUsers = state.users.filter(u => u.tenantId !== 'system').length;
    const activeTenants = state.tenants.filter(t => t.status === 'active').length;
    
    // Mock Revenue Calculation
    const estimatedMRR = activeTenants * 299 + (state.tenants.length - activeTenants) * 0; // Simple calc

    // Mock Growth Data
    const data = [
      { name: 'Jan', users: 400, tenants: 24 },
      { name: 'Feb', users: 300, tenants: 13 },
      { name: 'Mar', users: 550, tenants: 38 },
      { name: 'Apr', users: 800, tenants: 45 },
      { name: 'May', users: 1100, tenants: 60 },
      { name: 'Jun', users: totalUsers + 50, tenants: state.tenants.length + 5 },
    ];

    // Mock Recent Activity
    const activityFeed = [
        { id: 1, action: 'New Tenant Created', target: 'Acme Corp', time: '2 hours ago', icon: Building2, color: 'text-indigo-600 bg-indigo-100' },
        { id: 2, action: 'High Usage Alert', target: 'Global Corp', time: '5 hours ago', icon: ShieldAlert, color: 'text-amber-600 bg-amber-100' },
        { id: 3, action: 'User Threshold Reached', target: 'NextGen Tech', time: '1 day ago', icon: Users, color: 'text-blue-600 bg-blue-100' },
        { id: 4, action: 'System Backup', target: 'Automated', time: '1 day ago', icon: Activity, color: 'text-green-600 bg-green-100' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Platform Overview</h2>
                <p className="text-base text-gray-500 mt-1">Real-time insights into SaaS performance and system health.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Tenants" value={state.tenants.length} subtext="12% vs last month" icon={Building2} color="text-indigo-600 bg-indigo-50" />
                <StatCard title="Total Users" value={totalUsers} subtext="8% vs last month" icon={Users} color="text-blue-600 bg-blue-50" />
                <StatCard title="Est. Monthly Revenue" value={`$${estimatedMRR.toLocaleString()}`} subtext="15% vs last month" icon={CreditCard} color="text-emerald-600 bg-emerald-50" />
                <StatCard title="System Uptime" value="99.99%" subtext="Healthy" icon={Activity} color="text-purple-600 bg-purple-50" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Growth Chart */}
                <div className="lg:col-span-2">
                    <Card className="h-full border-none shadow-sm">
                        <CardHeader 
                            title="Platform Growth" 
                            description="New user acquisition trends over the last 6 months" 
                            action={<div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">+24% Growth</div>}
                        />
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f8a73" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#0f8a73" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                                    <RechartsTooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="users" stroke="#0f8a73" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity Feed */}
                <div className="lg:col-span-1">
                     <Card className="h-full border-none shadow-sm">
                        <CardHeader title="System Activity" description="Recent events across tenants" />
                        <CardContent>
                            <div className="space-y-6">
                                {activityFeed.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-4">
                                        <div className={`p-2 rounded-full flex-shrink-0 ${item.color}`}>
                                            <item.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{item.action}</p>
                                            <p className="text-xs text-gray-500 truncate">{item.target}</p>
                                        </div>
                                        <div className="text-xs text-gray-400 whitespace-nowrap">{item.time}</div>
                                    </div>
                                ))}
                                <div className="pt-4 mt-2 border-t border-gray-50 text-center">
                                    <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">View Full System Log</button>
                                </div>
                            </div>
                        </CardContent>
                     </Card>
                </div>
            </div>
        </div>
    );
};
