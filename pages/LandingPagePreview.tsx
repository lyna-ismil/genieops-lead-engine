import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../services/store';
import { Project } from '../types';

const LandingPagePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      const p = getProjectById(id);
      if (p) setProject(p);
    }
  }, [id]);

  if (!project) return <div className="p-10 text-center">Loading or Project Not Found...</div>;
  if (!project.landingPage) return <div className="p-10 text-center">No landing page generated for this project.</div>;

  return (
    <div 
        dangerouslySetInnerHTML={{ __html: project.landingPage.htmlContent }} 
        className="w-full h-screen overflow-auto bg-white"
    />
  );
};

export default LandingPagePreview;