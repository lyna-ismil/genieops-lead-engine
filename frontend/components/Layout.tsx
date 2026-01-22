import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusCircle, Settings, Layers, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';
import ChatWidget from './ChatWidget';
import { request } from '../services/api';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthChecked(true);
      navigate('/login', { replace: true });
      return;
    }

    request<{ name?: string; email?: string }>(`/api/auth/me`)
      .then((data) => {
        setUser(data);
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
        navigate('/login', { replace: true });
      })
      .finally(() => setAuthChecked(true));
  }, [navigate]);

  if (!authChecked) {
    return null;
  }

  if (!localStorage.getItem('auth_token')) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
           <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            GenieOps
           </h1>
           <span className="text-xs text-gray-400 tracking-wider font-medium">LEAD ENGINE</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <Link
            to="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link
            to="/create"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/create') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <PlusCircle size={18} />
            New Campaign
          </Link>
          <Link
            to="/about"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/about') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Layers size={18} />
            About Us
          </Link>
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/settings') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings size={18} />
            Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
               {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
             </div>
             <div>
                <p className="text-gray-900 font-medium">{user?.name || 'User'}</p>
                <p className="text-xs">{user?.email || ''}</p>
             </div>
           </div>
           <button
             onClick={() => {
               localStorage.removeItem('auth_token');
               navigate('/login', { replace: true });
             }}
             className="mt-3 w-full text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg py-2"
           >
             Log out
           </button>
        </div>
      </aside>

      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-20 px-4 py-3 flex justify-between items-center">
         <span className="font-bold text-blue-600">GenieOps</span>
         <button className="text-gray-600"><Menu/></button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ToastProvider>
      <LayoutContent>{children}</LayoutContent>
    </ToastProvider>
  );
};

export default Layout;