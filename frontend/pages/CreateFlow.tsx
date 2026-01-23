import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import AudienceGoalsStep from '../components/Wizard/AudienceGoalsStep';
import IdeationStep from '../components/Wizard/IdeationStep';
import AssetStep from '../components/Wizard/AssetStep';
import LandingPageStep from '../components/Wizard/LandingPageStep';
import NurtureStep from '../components/Wizard/NurtureStep';
import SocialStep from '../components/Wizard/SocialStep';
import CampaignSummaryPanel from '../components/Wizard/CampaignSummaryPanel';
import { ICPProfile, LeadMagnetIdea, GeneratedAsset, LandingPageConfig, Email, Project, PersonaSummary, ProductContext, OfferStack } from '../types';
import { createProject, updateProject, getProjectById } from '../services/store';
import { Loader2, CheckCircle, CircleDot, Circle } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const steps = [
    { label: 'Audience & Goals', sub: 'Define context' },
    { label: 'Lead Magnet Ideas', sub: 'Select concept' },
    { label: 'Create the Asset', sub: 'Generate content' },
    { label: 'Landing Page & Form', sub: 'Draft copy' },
    { label: 'Nurture Emails', sub: 'Build sequence' },
    { label: 'Promotion Post', sub: 'Distribute' }
];

const CreateFlow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  
  // State for the entire flow
  const [projectId, setProjectId] = useState<string | null>(null);
  const [icp, setIcp] = useState<ICPProfile | null>(null);
  
  // New Context Fields
  const [offerType, setOfferType] = useState<string>('');
  const [brandVoice, setBrandVoice] = useState<string>('');
  const [targetConversion, setTargetConversion] = useState<string>('');
  const [personaSummary, setPersonaSummary] = useState<PersonaSummary | undefined>(undefined);
  const [productContext, setProductContext] = useState<ProductContext | null>(null);

  // Effect to load existing project if ID is present
  useEffect(() => {
    if (id) {
        setLoadingProject(true);
        getProjectById(id).then(project => {
            if (project) {
                setProjectId(project.id);
                setIcp(project.icp);
                setOfferType(project.offerType || '');
                setBrandVoice(project.brandVoice || '');
                setTargetConversion(project.targetConversion || '');
                setProductContext(project.productContext || null);
                
                if (project.selectedIdea) setSelectedIdea(project.selectedIdea);
                if (project.asset) setAsset(project.asset);
                if (project.landingPage) setLandingPage(project.landingPage);
                if (project.emailSequence) setEmails(project.emailSequence);
                if (project.upgradeOffer) setUpgradeOffer(project.upgradeOffer);
                if (project.linkedInPost) setLinkedInPost(project.linkedInPost);

                // Determine step based on progress
                if (project.linkedInPost) setCurrentStep(5);
                else if (project.emailSequence && project.emailSequence.length > 0) setCurrentStep(5);
                else if (project.landingPage) setCurrentStep(4);
                else if (project.asset) setCurrentStep(3);
                else if (project.selectedIdea) setCurrentStep(2);
                else setCurrentStep(0);
            } else {
                toast.error("Project not found");
                navigate('/');
            }
        }).catch(err => {
            console.error(err);
            toast.error("Failed to load project");
        }).finally(() => setLoadingProject(false));
    }
  }, [id, navigate, toast]);

  const [selectedIdea, setSelectedIdea] = useState<LeadMagnetIdea | null>(null);
  const [asset, setAsset] = useState<GeneratedAsset | null>(null);
  const [landingPage, setLandingPage] = useState<LandingPageConfig | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
    const [upgradeOffer, setUpgradeOffer] = useState<OfferStack | null>(null);
  const [linkedInPost, setLinkedInPost] = useState<string>('');
  
  const handleNext = () => setCurrentStep(p => Math.min(p + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(p => Math.max(p - 1, 0));

  // Helper to build current project object from state
  const buildProjectPayload = (
      overrideIdea?: LeadMagnetIdea, 
      overrideAsset?: GeneratedAsset, 
      overrideLp?: LandingPageConfig,
      overrideEmails?: Email[],
      overrideUpgrade?: any,
      finalPost?: string
  ): Project => {
      const idea = overrideIdea || selectedIdea;
      const ass = overrideAsset || asset;
      const lp = overrideLp || landingPage;
      const em = overrideEmails || emails;
      const up = overrideUpgrade || upgradeOffer;

      return {
          id: projectId || crypto.randomUUID(), 
          name: idea?.title || "Draft Campaign",
          createdAt: new Date().toISOString(),
          status: 'draft',
          icp: icp!, 
          productContext: productContext || undefined,
          offerType,
          brandVoice,
          targetConversion,
          selectedIdea: idea || undefined,
          asset: ass || undefined,
          landingPage: lp || undefined,
          emailSequence: em,
          upgradeOffer: up,
          linkedInPost: finalPost
      };
  };

  const currentProject = icp ? buildProjectPayload() : { icp: { role: '', industry: '', painPoints: [], goals: [], companySize: '' }, id: '', name: '', createdAt: '', status: 'draft' } as Project;

  const handleAudienceSubmit = async (data: ICPProfile, prodContext: ProductContext, offer: string, voice: string, conversion: string, summary?: PersonaSummary) => {
      setIcp(data);
      setProductContext(prodContext);
      setOfferType(offer);
      setBrandVoice(voice);
      setTargetConversion(conversion);
      if (summary) setPersonaSummary(summary);
      
      // We don't save to backend yet usually until we have an ID or at least more data, 
      // but if we want per-step save we can start here. 
      // For now, simple state transition.
      handleNext();
  };

  const handleIdeaSelect = async (idea: LeadMagnetIdea) => {
      setSelectedIdea(idea);
      setSaving(true);
      try {
          // Now we definitely create/save
          const projectData = buildProjectPayload(idea);
          
          if (projectId) {
              await updateProject(projectId, projectData);
          } else {
              const created = await createProject(projectData);
              setProjectId(created.id);
          }
          handleNext();
      } catch (e) {
          toast.error("Failed to save draft project. Please try again.");
          console.error(e);
      } finally {
          setSaving(false);
      }
  };

  const handleAssetSave = async (a: GeneratedAsset) => {
      setAsset(a);
      if (!projectId) { 
          toast.error("No active project found. Returning to previous step.");
          handleBack();
          return; 
      }
      setSaving(true);
      try {
          const projectData = buildProjectPayload(undefined, a);
          await updateProject(projectId, projectData);
          handleNext();
      } catch (e) {
           toast.error("Failed to save asset content. Please try again.");
           console.error(e);
      } finally { setSaving(false); }
  };

  const handleLandingPageSave = async (lp: LandingPageConfig) => {
      if (selectedIdea && !lp.slug) {
          lp.slug = selectedIdea.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);
      }
      setLandingPage(lp);
      if (!projectId) return;
      
      setSaving(true);
      try {
          const projectData = buildProjectPayload(undefined, undefined, lp);
          await updateProject(projectId, projectData);
          handleNext();
      } catch (e) {
          toast.error("Failed to save landing page configuration.");
          console.error(e);
      } finally { setSaving(false); }
  };

    const handleNurtureSave = async (e: Email[], u: OfferStack | null) => {
      setEmails(e);
      setUpgradeOffer(u);
      if (!projectId) return;

      setSaving(true);
      try {
        const projectData = buildProjectPayload(undefined, undefined, undefined, e, u);
        await updateProject(projectId, projectData);
        handleNext();
      } catch (err) {
          toast.error("Failed to save nurture sequence.");
          console.error(err);
      } finally { setSaving(false); }
  };

  const handleFinish = async (finalPost: string) => {
    if (!projectId) return;
    setSaving(true);
    try {
        const projectData = buildProjectPayload(undefined, undefined, undefined, undefined, undefined, finalPost);
        projectData.status = 'published';
        setLinkedInPost(finalPost);
        await updateProject(projectId, projectData);
        toast.success("Campaign Published Successfully!");
        navigate('/');
    } catch (e) {
        toast.error("Failed to publish campaign. Please try again.");
        console.error(e);
    } finally {
        setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <AudienceGoalsStep 
            onNext={handleAudienceSubmit} 
            initialData={icp || undefined} 
            initialOfferType={offerType}
            initialBrandVoice={brandVoice}
            initialTargetConversion={targetConversion}
        />;
      case 1:
        return icp ? <IdeationStep 
            icp={icp} 
                        productContext={productContext || undefined}
            offerType={offerType}
            brandVoice={brandVoice}
            targetConversion={targetConversion}
            onNext={handleIdeaSelect} 
            onBack={handleBack} 
            savedIdea={selectedIdea || undefined} 
        /> : null;
      case 2:
        return icp && selectedIdea ? <AssetStep 
            icp={icp} 
            idea={selectedIdea} 
            offerType={offerType}
            brandVoice={brandVoice}
                        productContext={productContext || undefined}
            onNext={handleAssetSave} 
            onBack={handleBack} 
            savedAsset={asset || undefined} 
        /> : null;
      case 3:
        return selectedIdea && asset && icp ? <LandingPageStep 
            icp={icp}
            idea={selectedIdea} 
            asset={asset} 
            offerType={offerType}
            brandVoice={brandVoice}
            targetConversion={targetConversion}
            onNext={handleLandingPageSave} 
            onBack={handleBack} 
            savedConfig={landingPage || undefined} 
                        primaryColor={productContext?.primaryColor}
                        productContext={productContext || undefined}
        /> : null;
      case 4:
        return selectedIdea ? <NurtureStep 
            idea={selectedIdea} 
                        asset={asset || undefined}
                        offerType={offerType}
            brandVoice={brandVoice}
            targetConversion={targetConversion}
                        productContext={productContext || undefined}
            onNext={handleNurtureSave} 
            onBack={handleBack} 
            savedEmails={emails} 
        /> : null;
      case 5:
        return selectedIdea && landingPage ? <SocialStep 
            idea={selectedIdea} 
            landingPage={landingPage} 
            brandVoice={brandVoice}
                        productContext={productContext || undefined}
            onSave={handleFinish} 
            onBack={handleBack} 
            savedPost={linkedInPost} 
        /> : null;
      default:
        return <div>Unknown Step</div>;
    }
  };

  if (loadingProject) {
      return (
          <Layout>
              <div className="flex h-screen items-center justify-center">
                  <Loader2 className="animate-spin text-green-400" size={32} />
              </div>
          </Layout>
      );
  }

  return (
    <Layout>
            <div className="flex flex-col lg:flex-row min-h-screen">
         {/* Main Wizard Area */}
                 <div className="flex-1 lg:pr-8 pb-20">
                            <div className="mb-8 pl-1">
                                <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="genie-section-number">02.</div>
                                            <h1 className="text-2xl font-semibold">New Campaign Wizard</h1>
                                        </div>
                                        {saving && (
                                            <span className="text-xs font-normal text-green-400 flex items-center gap-1 border border-green-500/40 px-3 py-1 rounded">
                                                <Loader2 size={12} className="animate-spin" /> Saving...
                                            </span>
                                        )}
                                </div>

                                <div className="relative">
                                    <div className="genie-progress-line" />
                                    <div className="flex justify-between items-center">
                                        {steps.map((s, i) => {
                                            const isDone = i < currentStep;
                                            const isCurrent = i === currentStep;
                                            return (
                                                <div key={i} className="flex flex-col items-center gap-2 px-2 cursor-default z-10">
                                                    <div className={`genie-step-dot ${isDone ? 'done' : ''} ${isCurrent ? 'active' : ''}`}>
                                                        {isDone ? <CheckCircle size={16} /> : isCurrent ? <CircleDot size={16} /> : <Circle size={16} />}
                                                    </div>
                                                    <span className={`text-[10px] uppercase tracking-[0.25em] whitespace-nowrap hidden md:block ${isCurrent ? 'text-green-300' : 'text-green-400/50'}`}>
                                                        {s.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

              <div className="relative">
                {renderStep()}
              </div>
         </div>

         {/* Sticky Summary Panel */}
         <div className="hidden lg:block">
            <CampaignSummaryPanel project={currentProject} currentStep={currentStep} />
         </div>
      </div>
    </Layout>
  );
};

export default CreateFlow;