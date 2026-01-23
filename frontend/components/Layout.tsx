import React, { useEffect, useState } from 'react';
import { LayoutDashboard, PlusCircle, Settings, Layers } from 'lucide-react';
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
    <div className="genie-terminal">
      <header className="genie-header">
        <div className="flex items-center gap-6">
          <div className="genie-logo">&lt;/&gt; GENIE OPS</div>
          <div className="genie-status">
            <span className="genie-status-dot" />
            SYS.STATUS: ONLINE
          </div>
        </div>

        <nav className="genie-nav">
          <Link to="/" className={`genie-nav-link ${isActive('/') ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-2">
              <LayoutDashboard size={14} />
              Dashboard
            </span>
          </Link>
          <Link to="/create" className={`genie-nav-link ${isActive('/create') ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-2">
              <PlusCircle size={14} />
              New Campaign
            </span>
          </Link>
          <Link to="/about" className={`genie-nav-link ${isActive('/about') ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-2">
              <Layers size={14} />
              About Us
            </span>
          </Link>
          <Link to="/settings" className={`genie-nav-link ${isActive('/settings') ? 'active' : ''}`}>
            <span className="inline-flex items-center gap-2">
              <Settings size={14} />
              Settings
            </span>
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-xs uppercase tracking-[0.3em] text-green-400">
            USER: {user?.name || user?.email || 'Operator'}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              navigate('/login', { replace: true });
            }}
            className="genie-button genie-button--secondary"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="genie-main">
        <div className="max-w-7xl mx-auto">{children}</div>
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