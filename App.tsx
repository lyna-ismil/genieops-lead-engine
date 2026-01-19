import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateFlow from './pages/CreateFlow';
import Architecture from './pages/Architecture';
import LandingPagePreview from './pages/LandingPagePreview';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/create" element={<CreateFlow />} />
        <Route path="/architecture" element={<Architecture />} />
        {/* Isolated route for previewing the landing page "live" */}
        <Route path="/landing/:id" element={<LandingPagePreview />} />
        {/* Project details/preview route reusing creation components in read-only mode could go here */}
        <Route path="/preview/:id" element={<CreateFlow />} /> 
      </Routes>
    </HashRouter>
  );
};

export default App;