import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import InputStep from '../components/Wizard/InputStep';
import IdeationStep from '../components/Wizard/IdeationStep';
import AssetStep from '../components/Wizard/AssetStep';
import LandingPageStep from '../components/Wizard/LandingPageStep';
import NurtureStep from '../components/Wizard/NurtureStep';
import SocialStep from '../components/Wizard/SocialStep';
import { ICPProfile, LeadMagnetIdea, GeneratedAsset, LandingPageConfig, Email, Project } from '../types';
import { saveProject } from '../services/store';

const steps = ['ICP & Context', 'Ideation', 'Asset Creation', 'Landing Page', 'Nurture Sequence', 'Distribution'];

const CreateFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  // State for the entire flow
  const [icp, setIcp] = useState<ICPProfile | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<LeadMagnetIdea | null>(null);
  const [asset, setAsset] = useState<GeneratedAsset | null>(null);
  const [landingPage, setLandingPage] = useState<LandingPageConfig | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [upgradeOffer, setUpgradeOffer] = useState<any>(null);
  
  const handleNext = () => setCurrentStep(p => Math.min(p + 1, steps.length - 1));
  const handleBack = () => setCurrentStep(p => Math.max(p - 1, 0));

  const handleFinish = (finalPost: string) => {
    if (!icp || !selectedIdea) return;

    const newProject: Project = {
      id: crypto.randomUUID(),
      name: selectedIdea.title,
      createdAt: new Date().toISOString(),
      status: 'published',
      icp,
      selectedIdea,
      asset: asset || undefined,
      landingPage: landingPage || undefined,
      emailSequence: emails,
      upgradeOffer,
      linkedInPost: finalPost
    };

    saveProject(newProject);
    navigate('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <InputStep onNext={(data) => { setIcp(data); handleNext(); }} initialData={icp || undefined} />;
      case 1:
        return icp ? <IdeationStep icp={icp} onNext={(idea) => { setSelectedIdea(idea); handleNext(); }} onBack={handleBack} savedIdea={selectedIdea || undefined} /> : null;
      case 2:
        return icp && selectedIdea ? <AssetStep icp={icp} idea={selectedIdea} onNext={(a) => { setAsset(a); handleNext(); }} onBack={handleBack} savedAsset={asset || undefined} /> : null;
      case 3:
        return selectedIdea && asset ? <LandingPageStep idea={selectedIdea} asset={asset} onNext={(lp) => { setLandingPage(lp); handleNext(); }} onBack={handleBack} savedConfig={landingPage || undefined} /> : null;
      case 4:
        return selectedIdea ? <NurtureStep idea={selectedIdea} onNext={(e, u) => { setEmails(e); setUpgradeOffer(u); handleNext(); }} onBack={handleBack} savedEmails={emails} /> : null;
      case 5:
        return selectedIdea && landingPage ? <SocialStep idea={selectedIdea} landingPage={landingPage} onSave={handleFinish} onBack={handleBack} /> : null;
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
             <h1 className="text-xl font-bold text-gray-800">New Campaign Wizard</h1>
             <span className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
             {steps.map((s, i) => (
                 <span key={i} className={`${i <= currentStep ? 'text-blue-600' : 'text-gray-300'}`}>{s}</span>
             ))}
        </div>
      </div>
      <div className="min-h-[500px]">
        {renderStep()}
      </div>
    </Layout>
  );
};

export default CreateFlow;