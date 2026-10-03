
import { ProjectStatus, UserRole, TaskType, WorkLogStatus, TaskStatus, TaskPriority } from './types';

// Mock Tenants
export const MOCK_TENANTS = [
  {
    id: 't1',
    name: 'NextGen Tech',
    slug: 'nextgen',
    plan: 'enterprise',
    status: 'active',
    createdAt: '2023-01-01T10:00:00Z',
    branding: {
      primaryColor: '#0f8a73',
      secondaryColor: '#7ad2b8',
      logoUrl: ''
    }
  },
  {
    id: 't2',
    name: 'Global Corp',
    slug: 'global',
    plan: 'pro',
    status: 'active',
    createdAt: '2023-02-15T14:30:00Z',
    branding: {
      primaryColor: '#0ea5e9',
      secondaryColor: '#7dd3fc',
      logoUrl: ''
    }
  }
];

// Mock Users
export const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Alice Johnson',
    email: 'alice@nextgen.com',
    role: UserRole.SENIOR_DEV,
    department: 'Engineering',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%234338ca"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">AJ</text></svg>',
    tenantId: 't1'
  },
  {
    id: 'u2',
    name: 'Bob Smith',
    email: 'bob@nextgen.com',
    role: UserRole.MANAGER,
    department: 'Engineering',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%230284c7"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">BS</text></svg>',
    tenantId: 't1'
  },
  {
    id: 'u3',
    name: 'Charlie Davis',
    email: 'charlie@nextgen.com',
    role: UserRole.ADMIN,
    department: 'Operations',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%237c3aed"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">CD</text></svg>',
    tenantId: 't1'
  },
  {
    id: 'u4',
    name: 'Diana Prince',
    email: 'diana@nextgen.com',
    role: UserRole.DEVELOPER,
    department: 'Design',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23db2777"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">DP</text></svg>',
    tenantId: 't1'
  },
  {
    id: 'u5',
    name: 'Eve Polastri',
    email: 'eve@global.com',
    role: UserRole.ADMIN,
    department: 'Security',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23059669"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">EP</text></svg>',
    tenantId: 't2'
  },
  {
    id: 'u6',
    name: 'Frank Castle',
    email: 'frank@global.com',
    role: UserRole.JUNIOR_DEV,
    department: 'Operations',
    avatarUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="%23475569"/><text x="50%" y="54%" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">FC</text></svg>',
    tenantId: 't2'
  }
];

// Mock Roles
export const MOCK_ROLES = [
  { id: UserRole.ADMIN, name: 'Administrator', description: 'Full system access', isSystem: true },
  { id: UserRole.MANAGER, name: 'Manager', description: 'Can manage projects and team logs', isSystem: true },
  { id: UserRole.SENIOR_DEV, name: 'Senior Developer', description: 'Technical lead, can view all projects', isSystem: true },
  { id: UserRole.DEVELOPER, name: 'Software Developer', description: 'Standard development access', isSystem: true },
  { id: UserRole.JUNIOR_DEV, name: 'Junior Developer', description: 'Limited scope, needs review', isSystem: true },
];

// Mock Permissions
export const MOCK_PERMISSIONS = [
  { id: 'view_dashboard', name: 'View Dashboard', module: 'tasks', description: 'View personal dashboard' },
  { id: 'manage_own_tasks', name: 'Manage Own Tasks', module: 'tasks', description: 'Create and edit own work logs' },
  { id: 'manage_all_tasks', name: 'Manage All Tasks', module: 'tasks', description: 'Edit work logs of other users' },
  { id: 'view_projects', name: 'View Projects', module: 'projects', description: 'View project list' },
  { id: 'manage_projects', name: 'Manage Projects', module: 'projects', description: 'Create, edit, delete projects' },
  { id: 'manage_settings', name: 'Manage Settings', module: 'settings', description: 'Access system settings and roles' },
];

export const INITIAL_ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: MOCK_PERMISSIONS.map(p => p.id),
  [UserRole.MANAGER]: ['view_dashboard', 'manage_own_tasks', 'manage_all_tasks', 'view_projects', 'manage_projects'],
  [UserRole.SENIOR_DEV]: ['view_dashboard', 'manage_own_tasks', 'view_projects'],
  [UserRole.DEVELOPER]: ['view_dashboard', 'manage_own_tasks', 'view_projects'],
  [UserRole.JUNIOR_DEV]: ['view_dashboard', 'manage_own_tasks', 'view_projects'],
};

// Helper to generate dates
const today = new Date();
const formatDate = (date: Date) => date.toISOString().split('T')[0];
const subDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
};

// Mock Projects
export const MOCK_PROJECTS = [
  { 
    id: 'p1', 
    name: 'Alpha Platform', 
    code: 'PRJ-001',
    client: 'Acme Corp', 
    status: ProjectStatus.ACTIVE,
    managerId: 'u2', 
    startDate: '2024-01-15',
    budgetHours: 180,
    hourlyRate: 140,
    assignedUserIds: ['u1', 'u2', 'u3', 'u4'],
    createdBy: 'u3',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    description: 'Enterprise core cloud platform overhaul and API migration.'
  },
  { 
    id: 'p2', 
    name: 'Beta Mobile App', 
    code: 'PRJ-002',
    client: 'Globex Inc', 
    status: ProjectStatus.ACTIVE,
    managerId: 'u2',
    startDate: '2024-02-01',
    budgetHours: 120,
    hourlyRate: 155,
    assignedUserIds: ['u1', 'u4'],
    createdBy: 'u3',
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
    description: 'React Native iOS & Android client with offline sync.'
  },
  { 
    id: 'p3', 
    name: 'Gamma Migration', 
    code: 'PRJ-003',
    client: 'Soylent Corp', 
    status: ProjectStatus.COMPLETED,
    managerId: 'u3',
    startDate: '2023-11-01',
    endDate: '2024-03-01',
    budgetHours: 240,
    hourlyRate: 130,
    assignedUserIds: ['u1', 'u2'],
    createdBy: 'u2',
    createdAt: '2023-10-15T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    description: 'Legacy Oracle DB to distributed PostgreSQL data warehouse.'
  },
  { 
    id: 'p5', 
    name: 'Security Operations', 
    code: 'SEC-001',
    client: 'Apex Capital', 
    status: ProjectStatus.ACTIVE,
    managerId: 'u5',
    startDate: '2024-05-01',
    budgetHours: 90,
    hourlyRate: 175,
    assignedUserIds: ['u5', 'u6'],
    createdBy: 'u5',
    createdAt: '2024-05-01T10:00:00Z',
    updatedAt: '2024-05-01T10:00:00Z',
    description: 'SOC2 Type II compliance audit and penetration testing.'
  },
];

// Mock Work Logs across the current week
export const MOCK_WORK_LOGS = [
  // Today's logs (u1 - Alice)
  {
    id: 'w1',
    userId: 'u1',
    projectId: 'p1',
    taskId: 't2',
    taskType: TaskType.DEVELOPMENT,
    description: 'Implemented OAuth2 PKCE login flow and token storage',
    timeSpent: 4.5,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w2',
    userId: 'u1',
    projectId: 'p2',
    taskId: '',
    taskType: TaskType.MEETING,
    description: 'Daily engineering architecture sync with backend team',
    timeSpent: 1.0,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w2b',
    userId: 'u1',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.BUG_FIX,
    description: 'Resolved memory leak in streaming table re-renders',
    timeSpent: 2.0,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  // Yesterday (subDays 1)
  {
    id: 'w3',
    userId: 'u1',
    projectId: 'p1',
    taskId: 't1',
    taskType: TaskType.DEVELOPMENT,
    description: 'Designed GraphQL query batching and caching tier',
    timeSpent: 5.5,
    date: formatDate(subDays(today, 1)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 1).toISOString()
  },
  {
    id: 'w4',
    userId: 'u1',
    projectId: 'p2',
    taskId: '',
    taskType: TaskType.REVIEW,
    description: 'Code review for PR #42 - Mobile navigation transitions',
    timeSpent: 2.0,
    date: formatDate(subDays(today, 1)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 1).toISOString()
  },
  // 2 days ago (subDays 2)
  {
    id: 'w5',
    userId: 'u1',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.DEVELOPMENT,
    description: 'Database schema migration scripts and rollback plans',
    timeSpent: 6.0,
    date: formatDate(subDays(today, 2)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 2).toISOString()
  },
  {
    id: 'w6',
    userId: 'u1',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.MEETING,
    description: 'Product sprint retro & backlog grooming',
    timeSpent: 1.5,
    date: formatDate(subDays(today, 2)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 2).toISOString()
  },
  // 3 days ago (subDays 3)
  {
    id: 'w7',
    userId: 'u1',
    projectId: 'p2',
    taskId: '',
    taskType: TaskType.DEVELOPMENT,
    description: 'Refactored biometric login modal for iOS 18',
    timeSpent: 7.5,
    date: formatDate(subDays(today, 3)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 3).toISOString()
  },
  // 4 days ago (subDays 4)
  {
    id: 'w8',
    userId: 'u1',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.RESEARCH,
    description: 'Benchmarked Vector Search engines (pgvector vs Pinecone)',
    timeSpent: 6.5,
    date: formatDate(subDays(today, 4)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 4).toISOString()
  },
  // 5 days ago (subDays 5)
  {
    id: 'w9',
    userId: 'u1',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.DEVELOPMENT,
    description: 'Docker compose local developer environment setup',
    timeSpent: 5.0,
    date: formatDate(subDays(today, 5)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 5).toISOString()
  },

  // Bob Smith (Manager - u2)
  {
    id: 'w10',
    userId: 'u2',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.REVIEW,
    description: 'Release checklist & QA sign-off for v2.4 staging release',
    timeSpent: 3.5,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w11',
    userId: 'u2',
    projectId: 'p2',
    taskId: 't5',
    taskType: TaskType.MEETING,
    description: 'Stakeholder progress presentation with Globex executive team',
    timeSpent: 2.5,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w12',
    userId: 'u2',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.REVIEW,
    description: 'Reviewed API architectural spec and RFC for partner webhooks',
    timeSpent: 4.0,
    date: formatDate(subDays(today, 1)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 1).toISOString()
  },

  // Diana Prince (Designer/Dev - u4)
  {
    id: 'w13',
    userId: 'u4',
    projectId: 'p2',
    taskId: 't4',
    taskType: TaskType.RESEARCH,
    description: 'Design system typography scale & Figma token exports',
    timeSpent: 5.0,
    date: formatDate(today),
    status: WorkLogStatus.IN_PROGRESS,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w14',
    userId: 'u4',
    projectId: 'p2',
    taskId: 't4',
    taskType: TaskType.DEVELOPMENT,
    description: 'Built interactive dashboard charts with dark mode fidelity',
    timeSpent: 6.5,
    date: formatDate(subDays(today, 1)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 1).toISOString()
  },
  {
    id: 'w15',
    userId: 'u4',
    projectId: 'p1',
    taskId: '',
    taskType: TaskType.BUG_FIX,
    description: 'Fixed mobile viewport breakpoint glitch on Safari 17',
    timeSpent: 3.0,
    date: formatDate(subDays(today, 2)),
    status: WorkLogStatus.BLOCKED,
    createdAt: subDays(today, 2).toISOString()
  },

  // Frank Castle (u6)
  {
    id: 'w16',
    userId: 'u6',
    projectId: 'p5',
    taskId: '',
    taskType: TaskType.SUPPORT,
    description: 'Automated vulnerability scanner deployment in CI/CD pipeline',
    timeSpent: 7.0,
    date: formatDate(today),
    status: WorkLogStatus.COMPLETED,
    createdAt: new Date().toISOString()
  },
  {
    id: 'w17',
    userId: 'u6',
    projectId: 'p5',
    taskId: '',
    taskType: TaskType.SUPPORT,
    description: 'Remediated open CVE-2024 TLS protocol cipher suites',
    timeSpent: 6.0,
    date: formatDate(subDays(today, 1)),
    status: WorkLogStatus.COMPLETED,
    createdAt: subDays(today, 1).toISOString()
  }
];

// Mock Tasks
export const MOCK_TASKS = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Setup Project Structure',
    description: 'Initialize repo and basic folder structure',
    status: TaskStatus.DONE,
    priority: TaskPriority.HIGH,
    type: TaskType.DEVELOPMENT,
    assigneeId: 'u1',
    createdAt: '2023-01-01T09:00:00Z'
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Database Schema Design',
    description: 'Design initial schema for users and projects',
    status: TaskStatus.DONE,
    priority: TaskPriority.URGENT,
    type: TaskType.DEVELOPMENT,
    assigneeId: 'u1',
    createdAt: '2023-01-02T10:00:00Z'
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Authentication API',
    description: 'Implement JWT auth flow',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    type: TaskType.DEVELOPMENT,
    assigneeId: 'u4',
    createdAt: '2023-01-05T14:00:00Z'
  },
  {
    id: 't4',
    projectId: 'p2',
    title: 'UI Mockups',
    description: 'Create high fidelity mockups for mobile app',
    status: TaskStatus.REVIEW,
    priority: TaskPriority.MEDIUM,
    type: TaskType.RESEARCH,
    assigneeId: 'u4',
    createdAt: '2023-01-20T11:00:00Z'
  },
  {
    id: 't5',
    projectId: 'p1',
    title: 'Client Meeting',
    description: 'Requirement gathering sync',
    status: TaskStatus.DONE,
    priority: TaskPriority.MEDIUM,
    type: TaskType.MEETING,
    assigneeId: 'u2',
    createdAt: '2023-01-15T15:00:00Z'
  }
];

export const TASK_TYPE_COLORS = {
  [TaskType.DEVELOPMENT]: '#3b82f6', // blue-500
  [TaskType.MEETING]: '#eab308', // yellow-500
  [TaskType.RESEARCH]: '#a855f7', // purple-500
  [TaskType.BUG_FIX]: '#ef4444', // red-500
  [TaskType.REVIEW]: '#22c55e', // green-500
  [TaskType.SUPPORT]: '#f97316', // orange-500
  [TaskType.OTHER]: '#64748b', // slate-500
};
    