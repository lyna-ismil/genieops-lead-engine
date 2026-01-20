import React from 'react';
import { LayoutDashboard, PlusCircle, Settings, Layers, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { ToastProvider } from '../context/ToastContext';

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

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
            to="/architecture"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/architecture') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Layers size={18} />
            System Architecture
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-100">
           <div className="flex items-center gap-3 px-3 py-2 text-sm text-gray-500">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">A</div>
             <div>
                <p className="text-gray-900 font-medium">Admin User</p>
                <p className="text-xs">admin@genieops.com</p>
             </div>
           </div>
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