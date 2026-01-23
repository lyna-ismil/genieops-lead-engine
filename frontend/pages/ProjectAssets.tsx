import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Project } from '../types';
import { getProjectById } from '../services/store';
import { Loader2, ArrowLeft, Edit, ExternalLink, FileText, Mail, Monitor, Share2, Target, Lightbulb } from 'lucide-react';
import GenieCard from '../components/ui/GenieCard';
import GenieButton from '../components/ui/GenieButton';

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
                    <Loader2 className="animate-spin text-green-400" size={32} />
                </div>
            </Layout>
        );
    }

    if (!project) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <h2 className="text-xl font-semibold">Project not found</h2>
                    <Link to="/" className="text-green-400 hover:underline mt-2 inline-block">Back to Dashboard</Link>
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
                        <Link to="/" className="genie-icon-button">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <div className="genie-section-number">04.</div>
                            <h1 className="text-2xl font-semibold">{project.name}</h1>
                            <div className="flex items-center gap-2 text-sm genie-muted mt-1">
                                <span className="genie-tag">
                                    {project.status}
                                </span>
                                <span>•</span>
                                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <GenieButton as={Link} to={`/project/${project.id}/edit`} variant="primary" className="gap-2">
                      <Edit size={16} />
                      Modify Campaign
                    </GenieButton>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Strategy */}
                    <div className="space-y-6">
                        {/* ICP Card */}
                        <GenieCard>
                            <h3 className="font-semibold text-green-400 flex items-center gap-2 mb-4">
                                <Target size={16}/> Strategy
                            </h3>
                            <div className="space-y-4 text-sm">
                                <div>
                                    <label className="text-xs uppercase tracking-[0.3em] text-green-400/70">Target Audience</label>
                                    <p className="text-green-200">{project.icp.role} in {project.icp.industry}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.3em] text-green-400/70">Goal</label>
                                    <p className="genie-muted">{project.targetConversion || 'Lead Generation'}</p>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.3em] text-green-400/70">Brand Voice</label>
                                    <p className="genie-muted">{project.brandVoice || 'Professional'}</p>
                                </div>
                            </div>
                        </GenieCard>

                        {/* Idea Card */}
                        {project.selectedIdea && (
                            <GenieCard>
                                <h3 className="font-semibold text-green-400 flex items-center gap-2 mb-4">
                                    <Lightbulb size={16}/> Concept
                                </h3>
                                <div className="space-y-3">
                                    <div className="text-sm font-semibold">{project.selectedIdea.title}</div>
                                    <div className="genie-tag inline-block">{project.selectedIdea.type}</div>
                                    <p className="text-sm genie-muted">{project.selectedIdea.valuePromise}</p>
                                </div>
                            </GenieCard>
                        )}
                    </div>

                    {/* Right Column: Assets */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Asset Content */}
                        {project.asset && (
                            <GenieCard className="overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-green-400 flex items-center gap-2">
                                        <FileText size={16}/> Lead Magnet Asset
                                    </h3>
                                    <span className="genie-tag">{project.asset.type}</span>
                                </div>
                                <div className="text-sm genie-muted line-clamp-6 mb-4">
                                    {project.asset.content}
                                </div>
                                <Link to={`/project/${project.id}/edit`} className="text-sm text-green-400 hover:underline font-medium">
                                    View Full Content -&gt;
                                </Link>
                            </GenieCard>
                        )}

                        {/* Landing Page */}
                        {project.landingPage && (
                            <GenieCard className="overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-green-400 flex items-center gap-2">
                                        <Monitor size={16}/> Landing Page
                                    </h3>
                                    <a 
                                        href={`#/landing/${project.id}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-xs flex items-center gap-1 text-green-400 hover:underline font-medium"
                                    >
                                        Open Live <ExternalLink size={12}/>
                                    </a>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <h4 className="font-semibold">{project.landingPage.headline}</h4>
                                        <p className="text-sm genie-muted">{project.landingPage.subheadline}</p>
                                        <div className="flex gap-2 mt-2">
                                            <span className="genie-tag">CTA: {project.landingPage.cta}</span>
                                        </div>
                                    </div>
                                    {project.landingPage.imageUrl && (
                                        <div className="w-full sm:w-32 h-24 bg-black rounded overflow-hidden shrink-0 border border-green-500/30">
                                            <img src={project.landingPage.imageUrl} alt="Hero" className="w-full h-full object-cover"/>
                                        </div>
                                    )}
                                </div>
                            </GenieCard>
                        )}

                        {/* Email Sequence */}
                        {project.emailSequence && project.emailSequence.length > 0 && (
                            <GenieCard className="overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-green-400 flex items-center gap-2">
                                        <Mail size={16}/> Email Sequence
                                    </h3>
                                </div>
                                <div className="divide-y divide-green-500/10">
                                    {project.emailSequence.map((email, idx) => (
                                        <div key={idx} className="py-3 flex items-center gap-4">
                                            <div className="w-8 h-8 border border-green-500/30 text-green-300 flex items-center justify-center text-xs font-semibold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium truncate">{email.subject}</h4>
                                                <p className="text-xs text-green-400/70">{email.delay} • {email.intent}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </GenieCard>
                        )}
                        
                        {/* LinkedIn Post */}
                        {project.linkedInPost && (
                            <GenieCard className="overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                     <h3 className="font-semibold text-green-400 flex items-center gap-2">
                                        <Share2 size={16}/> LinkedIn Post
                                    </h3>
                                </div>
                                <div>
                                     <p className="text-sm text-green-200 whitespace-pre-wrap leading-relaxed bg-black p-4 rounded border border-green-500/20">
                                        {project.linkedInPost}
                                     </p>
                                </div>
                            </GenieCard>
                        )}

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProjectAssets;
