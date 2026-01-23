import React, { useState } from 'react';
import { ICPProfile, PersonaSummary, ProductContext } from '../../types';
import { Sparkles, Target, Zap, MessageSquare } from 'lucide-react';
import { analyzeWebsite, generatePersonaSummary } from '../../services/llm';
import { useToast } from '../../context/ToastContext';
import GenieCard from '../ui/GenieCard';
import GenieButton from '../ui/GenieButton';

interface Props {
  onNext: (icp: ICPProfile, productContext: ProductContext, offerType: string, brandVoice: string, targetConversion: string, summary?: PersonaSummary) => void;
  initialData?: ICPProfile;
  initialOfferType?: string;
  initialBrandVoice?: string;
  initialTargetConversion?: string;
}

const ROLES = ["SaaS Marketer", "B2B Agency Owner", "Course Creator", "Real Estate Agent", "Startup Founder"];
const INDUSTRIES = ["SaaS", "E-commerce", "Professional Services", "Real Estate", "Education"];
const VOICES = ["Professional", "Bold", "Friendly", "Technical", "Empathetic"];
const OFFERS = ["SaaS Product", "Service / Agency", "Online Course", "Consulting", "Physical Product"]; // Offer Types

const AudienceGoalsStep: React.FC<Props> = ({ onNext, initialData, initialOfferType, initialBrandVoice, initialTargetConversion }) => {
  const toast = useToast();
  const [formData, setFormData] = useState<ICPProfile>(initialData || {
    role: '',
    industry: '',
    companySize: '',
    painPoints: [''],
    goals: ['']
  });
  const [productContext, setProductContext] = useState<ProductContext>({
    uniqueMechanism: '',
    competitorContrast: '',
    companyName: '',
    productDescription: '',
    mainBenefit: '',
    websiteUrl: '',
    toneGuidelines: [],
    primaryColor: '',
    fontStyle: 'sans',
    designVibe: 'minimal',
    logoUrl: '',
    voiceProfile: undefined
  });
  const [offerType, setOfferType] = useState(initialOfferType || '');
  const [brandVoice, setBrandVoice] = useState(initialBrandVoice || '');
  const [targetConversion, setTargetConversion] = useState(initialTargetConversion || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [personaSummary, setPersonaSummary] = useState<PersonaSummary | null>(null);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  const handleChange = (field: keyof ICPProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'painPoints' | 'goals', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'painPoints' | 'goals') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  // Quick-start chips handler
  const applyPreset = (role: string) => {
      setFormData(prev => ({ ...prev, role, industry: role.includes("SaaS") ? "SaaS" : prev.industry }));
  };

  const handleGenerateIdentity = async () => {
      setIsGenerating(true);
      try {
          const summary = await generatePersonaSummary(formData);
          setPersonaSummary(summary);
          toast.success("Identity generated!");
      } catch (e) {
          console.error(e);
          toast.error("Failed to generate identity.");
      } finally {
          setIsGenerating(false);
      }
  };

    const handleAutoFill = async () => {
      if (!productContext.websiteUrl) {
        toast.error("Please enter a website URL first.");
        return;
      }
      setIsAutoFilling(true);
      try {
        const result = await analyzeWebsite(productContext.websiteUrl);
        setProductContext(prev => ({
          ...prev,
          companyName: result.companyName || prev.companyName,
          productDescription: result.productDescription || prev.productDescription,
          mainBenefit: result.mainBenefit || prev.mainBenefit,
            uniqueMechanism: result.uniqueMechanism || prev.uniqueMechanism,
            competitorContrast: result.competitorContrast || prev.competitorContrast,
            primaryColor: result.primaryColor || prev.primaryColor,
            fontStyle: result.fontStyle || prev.fontStyle,
            designVibe: result.designVibe || prev.designVibe,
            logoUrl: result.logoUrl || prev.logoUrl,
            voiceProfile: result.voiceProfile || prev.voiceProfile
        }));
        toast.success("Auto-fill complete!");
      } catch (e) {
        console.error(e);
        toast.error("Auto-fill failed. Please try again.");
      } finally {
        setIsAutoFilling(false);
      }
    };
  
  const handleContinue = () => {
      if (personaSummary) {
          onNext(formData, productContext, offerType, brandVoice, targetConversion, personaSummary);
      } else {
          // If they skipped generation or we failed, strictly proceed but maybe warn?
          // We'll just generate on next if needed, or better, force generation?
          // For now, let's just proceed.
           onNext(formData, productContext, offerType, brandVoice, targetConversion);
      }
  };

  const isValid = formData.role && formData.industry && formData.painPoints[0] && offerType && brandVoice && targetConversion;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <GenieCard>
        
        {/* Outcome Header */}
      <div className="mb-8 border-b border-green-500/20 pb-6">
        <div className="genie-section-number">02.</div>
        <h2 className="text-2xl font-semibold flex items-center gap-2 mb-2">
          <span className="genie-icon-button"><Target size={16}/></span>
          Audience & Goals
        </h2>
        <p className="genie-muted font-medium">
          You'll walk out with: <span className="text-green-400/70 font-normal">3 tailored lead magnet ideas, a finished asset, landing page copy, and an email sequence.</span>
        </p>
      </div>

        {/* Quick Start Presets */}
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-3">Quick Start Presets</label>
            <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                    <button 
                        key={r} 
                        onClick={() => applyPreset(r)}
                className={`text-xs uppercase tracking-[0.2em] px-3 py-1.5 border transition-colors ${
                  formData.role === r
                  ? 'bg-green-500/15 border-green-500/60 text-green-300'
                  : 'bg-transparent border-green-500/30 text-green-400/70 hover:border-green-500/60'
                }`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Role */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Target Role / Job Title</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => handleChange('role', e.target.value)}
              className="w-full"
              placeholder="e.g. Marketing Manager"
            />
            <p className="text-xs text-green-400/60 mt-1">Used to tailor tone and examples.</p>
          </div>
          
          {/* Industry */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={e => handleChange('industry', e.target.value)}
              className="w-full"
              placeholder="e.g. B2B SaaS"
            />
          </div>

          {/* Offer Type */}
           <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Offer Type</label>
            <select 
                value={offerType} 
                onChange={e => setOfferType(e.target.value)}
              className="w-full"
            >
                <option value="">Select Offer Type...</option>
                {OFFERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <p className="text-xs text-green-400/60 mt-1">Determines the asset format best practices.</p>
          </div>

           {/* Brand Voice */}
           <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Brand Voice</label>
            <select 
                value={brandVoice} 
                onChange={e => setBrandVoice(e.target.value)}
              className="w-full"
            >
                <option value="">Select Voice...</option>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Product Context Section */}
        <div className="mb-6 p-4 bg-black border border-green-500/20 rounded">
          <h3 className="text-xs uppercase tracking-[0.3em] text-green-400 mb-4">Product Context (Optional)</h3>

          {/* Company Name */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Company Name</label>
            <input
              type="text"
              value={productContext.companyName}
              onChange={e => setProductContext(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full"
              placeholder="e.g. Acme Analytics"
            />
          </div>

          {/* Product Description */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Product Description</label>
            <textarea
              value={productContext.productDescription}
              onChange={e => setProductContext(prev => ({ ...prev, productDescription: e.target.value }))}
              className="w-full"
              rows={3}
              placeholder="What do you sell and who is it for?"
            />
          </div>

          {/* Main Benefit */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Main Benefit</label>
            <input
              type="text"
              value={productContext.mainBenefit}
              onChange={e => setProductContext(prev => ({ ...prev, mainBenefit: e.target.value }))}
              className="w-full"
              placeholder="e.g. Cut onboarding time in half"
            />
          </div>
          
          {/* Unique Mechanism */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Unique Mechanism / Secret Sauce</label>
            <input
              type="text"
              value={productContext.uniqueMechanism}
              onChange={e => setProductContext(prev => ({ ...prev, uniqueMechanism: e.target.value }))}
              className="w-full"
              placeholder="e.g. AI-powered lead scoring algorithm"
            />
            <p className="text-xs text-green-400/60 mt-1">What is the specific method, algorithm, or framework you use?</p>
          </div>

          {/* Competitor Contrast */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Competitor Contrast</label>
            <input
              type="text"
              value={productContext.competitorContrast}
              onChange={e => setProductContext(prev => ({ ...prev, competitorContrast: e.target.value }))}
              className="w-full"
              placeholder="e.g. Unlike HubSpot, we focus on micro-SaaS"
            />
            <p className="text-xs text-green-400/60 mt-1">Why us vs them?</p>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Website URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={productContext.websiteUrl}
                onChange={e => setProductContext(prev => ({ ...prev, websiteUrl: e.target.value }))}
                className="flex-1"
                placeholder="https://yourwebsite.com"
              />
              <GenieButton
                type="button"
                onClick={handleAutoFill}
                disabled={isAutoFilling}
                variant="primary"
                className="whitespace-nowrap"
              >
                {isAutoFilling ? 'Analyzing...' : 'Auto-Fill'}
              </GenieButton>
            </div>
            <p className="text-xs text-green-400/60 mt-1">We’ll scan your site to fill in the fields above.</p>
          </div>
        </div>
        
        {/* Pain Points */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Top Pain Points</label>
          <div className="space-y-3">
            {formData.painPoints.map((point, idx) => (
                <input
                key={idx}
                type="text"
                value={point}
                onChange={e => handleArrayChange('painPoints', idx, e.target.value)}
                className="w-full text-sm"
                placeholder={`Pain point #${idx + 1}`}
                />
            ))}
          </div>
          <GenieButton onClick={() => addArrayItem('painPoints')} variant="secondary" className="mt-2">
            + Add another pain point
          </GenieButton>
           <p className="text-xs text-green-400/60 mt-1">Drives specific hooks and bullet points.</p>
        </div>

        {/* Goals */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-2">
           <label className="block text-xs uppercase tracking-[0.3em] text-green-400">Primary Conversion Goal</label>
           </div>
           
           <input
                type="text"
                value={targetConversion}
                onChange={e => setTargetConversion(e.target.value)}
            className="w-full text-sm"
                placeholder="e.g. Book a Demo, 7-Day Free Trial, Newsletter Signup"
            />
            
            <div className="mt-4">
             <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Audience Goals (What they want)</label>
                 {formData.goals.map((goal, idx) => (
                    <input
                    key={idx}
                    type="text"
                    value={goal}
                    onChange={e => handleArrayChange('goals', idx, e.target.value)}
              className="w-full mb-2 text-sm"
                    placeholder={`Goal #${idx + 1}`}
                    />
                ))}
            <GenieButton onClick={() => addArrayItem('goals')} variant="secondary">
              + Add another goal
            </GenieButton>
            </div>
        </div>

        {/* Immediate Value Generator */}
        {isValid && !personaSummary && (
            <div className={`p-4 rounded border border-green-500/30 bg-black flex items-center justify-between transition-all ${isGenerating ? 'opacity-75' : ''}`}>
                <div>
                   <h4 className="text-sm font-semibold text-green-300">Ready to see who you're targeting?</h4> 
                   <p className="text-xs text-green-400/70">Generate an AI persona summary before moving on.</p>
                </div>
                <GenieButton
                  onClick={handleGenerateIdentity}
                  disabled={isGenerating}
                  variant="secondary"
                  className="gap-2"
                >
                    {isGenerating ? <span className="animate-spin">✨</span> : <Sparkles size={16}/>}
                    {isGenerating ? 'Generating...' : 'Generate Identity'}
                </GenieButton>
            </div>
        )}

        {/* Persona Summary Result */}
        {personaSummary && (
           <div className="mt-6 p-6 bg-black rounded border border-green-500/30 animate-slide-up">
            <h3 className="text-md font-semibold text-green-300 mb-2 flex items-center gap-2">
              <Zap size={18} className="text-[#ccff00]"/> 
              Your Audience Identity
            </h3>
            <p className="text-green-200 text-sm mb-4 leading-relaxed">{personaSummary.summary}</p>
                
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-green-400/70">High-Converting Hooks</p>
              {personaSummary.hooks.map((hook, i) => (
                <div key={i} className="flex items-start gap-2 text-green-200 text-sm italic border border-green-500/20 p-2 rounded">
                  <MessageSquare size={14} className="mt-1 flex-shrink-0 opacity-50"/>
                  "{hook}"
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Footer */}
        <div className="mt-8 flex justify-end gap-4 items-center">
             {personaSummary && <span className="text-sm text-green-400/70 mr-2">Looks good? Let's get ideas.</span>}
           
           <GenieButton
            onClick={handleContinue}
            disabled={!isValid || isGenerating}
            variant="primary"
            className="px-8 py-3 text-sm"
          >
            Next: Generate Lead Magnet Ideas -&gt;
          </GenieButton>
        </div>
      </GenieCard>
    </div>
  );
};

export default AudienceGoalsStep;
