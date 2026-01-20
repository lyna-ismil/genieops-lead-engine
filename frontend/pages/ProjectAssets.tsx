import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Project } from '../types';
import { getProjectById } from '../services/store';
import { Loader2, ArrowLeft, Edit, ExternalLink, FileText, Mail, Monitor, Share2, Target, Lightbulb } from 'lucide-react';

const ProjectAssets: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        getProjectById(id).then(p => {
            setProject(p || null);
            setLoading(false);
        });
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                </div>
            </Layout>
        );
    }

    if (!project) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h2 className="text-xl font-bold text-gray-800">Project not found</h2>
                    <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">Back to Dashboard</Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-5xl mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="capitalize px-2 py-0.5 bg-gray-100 rounded text-xs font-medium border border-gray-200">
                                    {project.status}
                                </span>
                                <span>•</span>
                                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <Link 
                        to={`/project/${project.id}/edit`} 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
                    >
                        <Edit size={16} />
                        Modify Campaign
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Strategy */}
                    <div className="space-y-6">
                        {/* ICP Card */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                <Target size={18} className="text-purple-500"/> Strategy
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Target Audience</label>
                                    <p className="text-sm font-medium text-gray-900">{project.icp.role} in {project.icp.industry}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Goal</label>
                                    <p className="text-sm text-gray-700">{project.targetConversion || 'Lead Generation'}</p>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Brand Voice</label>
                                    <p className="text-sm text-gray-700">{project.brandVoice || 'Professional'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Idea Card */}
                        {project.selectedIdea && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                                    <Lightbulb size={18} className="text-amber-500"/> Concept
                                </h3>
                                <div className="space-y-3">
                                    <div className="text-sm font-bold text-gray-900">{project.selectedIdea.title}</div>
                                    <div className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100 mb-2">
                                        {project.selectedIdea.type}
                                    </div>
                                    <p className="text-sm text-gray-600">{project.selectedIdea.valuePromise}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Assets */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Asset Content */}
                        {project.asset && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <FileText size={18} className="text-blue-500"/> Lead Magnet Asset
                                    </h3>
                                    <span className="text-xs text-gray-500 uppercase font-medium">{project.asset.type}</span>
                                </div>
                                <div className="p-6">
                                    <div className="prose prose-sm max-w-none text-gray-600 line-clamp-6 mb-4">
                                        {project.asset.content}
                                    </div>
                                    <Link to={`/project/${project.id}/edit`} className="text-sm text-blue-600 hover:underline font-medium">
                                        View Full Content &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Landing Page */}
                        {project.landingPage && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Monitor size={18} className="text-green-500"/> Landing Page
                                    </h3>
                                    <a 
                                        href={`#/landing/${project.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        Open Live <ExternalLink size={12}/>
                                    </a>
                                </div>
                                <div className="p-6 flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <h4 className="font-bold text-gray-900">{project.landingPage.headline}</h4>
                                        <p className="text-sm text-gray-600">{project.landingPage.subheadline}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 flex items-center gap-1">CTA: {project.landingPage.cta}</span>
                                        </div>
                                    </div>
                                    {project.landingPage.imageUrl && (
                                        <div className="w-full sm:w-32 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                                            <img src={project.landingPage.imageUrl} alt="Hero" className="w-full h-full object-cover"/>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Email Sequence */}
                        {project.emailSequence && project.emailSequence.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Mail size={18} className="text-indigo-500"/> Email Sequence
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {project.emailSequence.map((email, idx) => (
                                        <div key={idx} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{email.subject}</h4>
                                                <p className="text-xs text-gray-500">{email.delay} • {email.intent}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* LinkedIn Post */}
                        {project.linkedInPost && (
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-gray-50">
                                     <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Share2 size={18} className="text-blue-700"/> LinkedIn Post
                                    </h3>
                                </div>
                                <div className="p-6">
                                     <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        {project.linkedInPost}
                                     </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectAssets;
