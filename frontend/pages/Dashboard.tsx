import React, { useEffect, useState } from 'react';
import { getProjects, deleteProject } from '../services/store';
import { Project } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ExternalLink, Calendar, Users } from 'lucide-react';
import Layout from '../components/Layout';
import { useToast } from '../context/ToastContext';
import DashboardOverview from '../components/DashboardOverview';

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
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Campaign Dashboard</h1>
           <p className="text-gray-500 mt-1">Manage your automated lead funnels.</p>
        </div>
        <Link
          to="/create"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={18} />
          Create New Lead Magnet
        </Link>
      </div>

      <DashboardOverview projects={projects} loading={loading} />

      {loading ? (
        <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm">Loading campaigns...</p>
            </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">Get started by creating your first automated lead magnet funnel. Our AI agents will guide you through the process.</p>
          <Link to="/create" className="text-blue-600 font-medium hover:text-blue-700 underline">
            Start your first campaign
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase tracking-wide
                        ${project.selectedIdea?.type === 'checklist' ? 'bg-green-100 text-green-700' : 
                          project.selectedIdea?.type === 'template' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                        {project.selectedIdea?.type || 'Draft'}
                    </span>
                    <button onClick={(e) => handleDelete(project.id, e)} className="text-gray-400 hover:text-red-500 transition">
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {project.name}
                </h3>
                
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users size={16}/> <span>Target: {project.icp.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={16}/> <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <Link 
                        to={`/preview/${project.id}`} 
                        className="flex-1 text-center py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                        View Assets
                    </Link>
                    <Link 
                        to={`/project/${project.id}/edit`}
                        className="flex-1 text-center py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-1"
                    >
                        Modify
                    </Link>
                    {project.landingPage && (
                        <a 
                           href={`#/landing/${project.id}`} 
                           target="_blank"
                           className="flex items-center justify-center px-3 text-gray-400 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                           title="Preview Landing Page"
                        >
                            <ExternalLink size={18}/>
                        </a>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;