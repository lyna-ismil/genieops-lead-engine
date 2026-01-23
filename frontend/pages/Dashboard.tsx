import React, { useEffect, useState } from 'react';
import { getProjects, deleteProject } from '../services/store';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, Calendar, Users } from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../context/ToastContext';
import DashboardOverview from '../components/DashboardOverview';
import GenieCard from '../components/ui/GenieCard';
import GenieButton from '../components/ui/GenieButton';

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const toast = useToast();

  useEffect(() => {
    getProjects()
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load projects", err);
        toast.error("Failed to load campaigns. Using cached data if available.");
        setLoading(false); 
        // Note: In a real app we might load from localStorage or keep previous state if this was a refresh 
        // but here on mount initial valid state is empty.
      });
  }, [toast]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this campaign?')) {
        await deleteProject(id);
        const updated = await getProjects();
        setProjects(updated);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
        <div>
          <div className="genie-section-number">01.</div>
          <h1 className="text-3xl font-semibold">Campaign Dashboard</h1>
          <p className="genie-muted mt-2">Manage your automated lead funnels.</p>
        </div>
        <GenieButton as={Link} to="/create" variant="primary" className="gap-2">
          <Plus size={16} />
          Create New -&gt;
        </GenieButton>
      </div>

      <DashboardOverview projects={projects} loading={loading} />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="genie-muted text-sm">Loading campaigns...</p>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <GenieCard className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border border-green-500/40 text-green-400">
            <Plus size={28} />
          </div>
          <h3 className="text-lg font-semibold">No campaigns yet</h3>
          <p className="genie-muted mb-6 max-w-md mx-auto">
            Get started by creating your first automated lead magnet funnel. Our AI agents will guide you through the process.
          </p>
          <GenieButton as={Link} to="/create" variant="secondary">
            Start your first campaign
          </GenieButton>
        </GenieCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <GenieCard key={project.id} className="group">
              <div className="genie-card__header">
                <span className="genie-tag">{project.selectedIdea?.type || 'Draft'}</span>
                <button onClick={(e) => handleDelete(project.id, e)} className="genie-icon-button" aria-label="Delete campaign">
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="text-lg font-semibold mb-2 line-clamp-2 min-h-[3.5rem]">{project.name}</h3>

              <div className="space-y-2 mb-6 text-sm">
                <div className="flex items-center gap-2 text-green-400">
                  <Users size={16} /> <span>Target: {project.icp.role}</span>
                </div>
                <div className="flex items-center gap-2 genie-muted">
                  <Calendar size={16} /> <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-green-500/20">
                <GenieButton as={Link} to={`/preview/${project.id}`} variant="secondary" className="flex-1">
                  View Assets
                </GenieButton>
                <GenieButton as={Link} to={`/project/${project.id}/edit`} variant="secondary" className="flex-1">
                  Modify
                </GenieButton>
                {project.landingPage && (
                  <a
                    href={`#/landing/${project.id}`}
                    target="_blank"
                    className="genie-icon-button"
                    title="Preview Landing Page"
                    rel="noreferrer"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </GenieCard>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;