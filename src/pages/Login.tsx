
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context';
import { MOCK_USERS } from '../constants';
import { Button, Input, Card } from '../components/UI';
import { Shield, Building2, User, Code, Terminal } from 'lucide-react';
import { UserRole } from '../types';

export const Login = () => {
  const [email, setEmail] = useState('alice@nextgen.com');
  const [password, setPassword] = useState('password'); 
  const [error, setError] = useState('');
  const { dispatch } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.email === email);
    
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      navigate('/');
    } else {
      setError('Invalid email.');
    }
  };

  const handleDemoClick = (email) => {
      setEmail(email);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
            <div className="p-3 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                <Shield className="h-10 w-10 text-white" />
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Sign in to NexTracker
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enterprise Work Tracking Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1">
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none"
                />
              </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm">{error}</div>
            )}

            <div>
              <Button type="submit" className="w-full flex justify-center py-2 px-4">
                Sign in
              </Button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500 font-medium">Select a Persona to Demo</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
               <div onClick={() => handleDemoClick('charlie@nextgen.com')} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                  <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                      <Shield className="h-5 w-5" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-gray-900">Administrator</p>
                      <p className="text-xs text-gray-500">Full Access</p>
                  </div>
               </div>

               <div onClick={() => handleDemoClick('bob@nextgen.com')} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                   <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-3">
                      <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-gray-900">Manager</p>
                      <p className="text-xs text-gray-500">Team Management</p>
                  </div>
               </div>

               <div onClick={() => handleDemoClick('alice@nextgen.com')} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                   <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-3">
                      <Code className="h-5 w-5" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-gray-900">Senior Developer</p>
                      <p className="text-xs text-gray-500">Technical Lead</p>
                  </div>
               </div>
               
               <div onClick={() => handleDemoClick('frank@global.com')} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all group">
                   <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 mr-3">
                      <Terminal className="h-5 w-5" />
                  </div>
                  <div>
                      <p className="text-sm font-bold text-gray-900">Junior Developer</p>
                      <p className="text-xs text-gray-500">Restricted Access</p>
                  </div>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
