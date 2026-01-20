import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateFlow from './pages/CreateFlow';
import Architecture from './pages/Architecture';
import LandingPagePreview from './pages/LandingPagePreview';
import LinkedInCallback from './pages/LinkedInCallback';
import { ToastProvider } from './context/ToastContext';

import ProjectAssets from './pages/ProjectAssets';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateFlow />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
          <Route path="/landing/:id" element={<LandingPagePreview />} />
          
          {/* Read-only Asset View */}
          <Route path="/preview/:id" element={<ProjectAssets />} />
          
          {/* Edit Mode */}
          <Route path="/project/:id/edit" element={<CreateFlow />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
};

export default App;