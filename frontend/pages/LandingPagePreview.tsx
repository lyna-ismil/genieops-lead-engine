import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../services/store';
import { Project, LandingPageConfig } from '../types';
import LandingPageRenderer from '../components/LandingPageRenderer';
import { Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { request } from '../services/api';

const LandingPagePreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (id) {
      getProjectById(id).then(p => {
        setProject(p);
      }).catch(err => {
        console.error(err);
      }).finally(() => setLoading(false));
    }
  }, [id]);

    const handleSubmit = async (data: any) => {
      if (!project?.landingPage?.slug) {
        toast.error("Missing landing page slug.");
        return;
      }
      const result = await request<any>(`/api/public/lp/${project.landingPage.slug}/submit`, {
        method: "POST",
        body: JSON.stringify(data)
      });
      return result;
    };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (!project || !project.landingPage) {
    return <div className="p-8 text-center text-gray-500">Landing page not found.</div>;
  }

  return (
    <LandingPageRenderer 
        config={project.landingPage} 
        mode="desktop" // Preview is always full screen desktop/responsive
        onSubmit={handleSubmit}
      primaryColor={project.productContext?.primaryColor}
      brand={{
        primaryColor: project.productContext?.primaryColor,
        fontStyle: project.productContext?.fontStyle,
        logoUrl: project.productContext?.logoUrl
      }}
    />
  );
};

export default LandingPagePreview;