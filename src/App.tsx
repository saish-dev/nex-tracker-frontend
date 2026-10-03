import React from 'react';
import { Routes, Route, HashRouter, Navigate } from 'react-router-dom';
import { AppProvider } from './context';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { WorkLogs } from './pages/WorkLogs';
import { Settings } from './pages/Settings';
import { Reports } from './pages/Reports';
import { ProtectedRoute } from './components/Layout';

const App = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/worklogs" element={
            <ProtectedRoute>
              <WorkLogs />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
