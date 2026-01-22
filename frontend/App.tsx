import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateFlow from './pages/CreateFlow';
import AboutUs from './pages/AboutUs';
import SettingsPage from './pages/Settings';
import LandingPagePreview from './pages/LandingPagePreview';
import LinkedInCallback from './pages/LinkedInCallback';
import { ToastProvider } from './context/ToastContext';

import ProjectAssets from './pages/ProjectAssets';
import ThankYou from './pages/ThankYou';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/create" element={<CreateFlow />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />
          <Route path="/landing/:id" element={<LandingPagePreview />} />
          <Route path="/landing/:slug/thank-you" element={<ThankYou />} />
          
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