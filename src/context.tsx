
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { MOCK_USERS, MOCK_PROJECTS, MOCK_WORK_LOGS, MOCK_ROLES, MOCK_PERMISSIONS, INITIAL_ROLE_PERMISSIONS, MOCK_TENANTS, MOCK_TASKS } from './constants';

const initialState = {
  auth: {
    user: null,
    isAuthenticated: false,
    permissions: [],
  },
  users: MOCK_USERS,
  projects: MOCK_PROJECTS,
  workLogs: MOCK_WORK_LOGS,
  tasks: MOCK_TASKS,
  roles: MOCK_ROLES,
  permissions: MOCK_PERMISSIONS,
  rolePermissions: INITIAL_ROLE_PERMISSIONS,
  tenants: MOCK_TENANTS
};

const AppContext = createContext({
  state: initialState,
  dispatch: (action) => null,
});

const appReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN': {
      const roleId = action.payload.role;
      const userPermissions = state.rolePermissions[roleId] || [];
      return {
        ...state,
        auth: {
          user: action.payload,
          isAuthenticated: true,
          permissions: userPermissions,
        },
      };
    }
    case 'LOGOUT':
      return {
        ...state,
        auth: {
          user: null,
          isAuthenticated: false,
          permissions: [],
        },
      };
    case 'ADD_LOG':
      return {
        ...state,
        workLogs: [action.payload, ...state.workLogs],
      };
    case 'UPDATE_LOG':
      return {
        ...state,
        workLogs: state.workLogs.map((log) =>
          log.id === action.payload.id ? action.payload : log
        ),
      };
    case 'DELETE_LOG':
      return {
        ...state,
        workLogs: state.workLogs.filter((log) => log.id !== action.payload),
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case 'ADD_PROJECT':
        return {
            ...state,
            projects: [...state.projects, action.payload]
        };
    case 'UPDATE_PROJECT':
        return {
            ...state,
            projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p)
        };
    case 'ADD_ROLE':
        return {
            ...state,
            roles: [...state.roles, action.payload],
            rolePermissions: { ...state.rolePermissions, [action.payload.id]: [] }
        };
    case 'UPDATE_ROLE_PERMISSIONS':
        return {
            ...state,
            rolePermissions: {
                ...state.rolePermissions,
                [action.payload.roleId]: action.payload.permissions
            }
        };
    case 'ADD_USER':
        return {
            ...state,
            users: [...state.users, action.payload]
        };
    case 'UPDATE_USER':
        return {
            ...state,
            users: state.users.map(u => u.id === action.payload.id ? action.payload : u)
        };
    case 'DELETE_USER':
        return {
            ...state,
            users: state.users.filter(u => u.id !== action.payload)
        };
    case 'ADD_TENANT':
        return {
            ...state,
            tenants: [...state.tenants, action.payload]
        };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const storedUser = localStorage.getItem('nex_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        dispatch({ type: 'LOGIN', payload: user });
      } catch (e) {
        console.error("Failed to parse stored user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (state.auth.user) {
      localStorage.setItem('nex_user', JSON.stringify(state.auth.user));
    } else {
      localStorage.removeItem('nex_user');
    }
  }, [state.auth.user]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
    