import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById } from '../services/store';
import { Project, LandingPageConfig } from '../types';
import LandingPageRenderer from '../components/LandingPageRenderer';
import { Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { request } from '../services/api';
import Layout from '../components/Layout';
import GenieCard from '../components/ui/GenieCard';

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
      <Layout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="animate-spin text-green-400" size={32} />
        </div>
      </Layout>
    );
  }

  if (!project || !project.landingPage) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <GenieCard className="text-center">
            <p className="genie-muted">Landing page not found.</p>
          </GenieCard>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="genie-section-number">03.</div>
        <h1 className="text-2xl font-semibold mb-6">Landing Page Preview</h1>
        <div className="genie-preview-frame">
          <div className="genie-preview-header">
            <span className="genie-preview-dot" />
            <span className="genie-preview-dot" />
            <span className="genie-preview-dot" />
            <span>Preview Terminal</span>
          </div>
          <div className="genie-preview-body">
            <div className="genie-preview-content">
              <LandingPageRenderer
                config={project.landingPage}
                mode="desktop"
                onSubmit={handleSubmit}
                primaryColor={project.productContext?.primaryColor}
                brand={{
                  primaryColor: project.productContext?.primaryColor,
                  fontStyle: project.productContext?.fontStyle,
                  logoUrl: project.productContext?.logoUrl,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LandingPagePreview;