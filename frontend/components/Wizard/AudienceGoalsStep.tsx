import React, { useState } from 'react';
import { ICPProfile, PersonaSummary } from '../../types';
import { Sparkles, Target, Zap, MessageSquare } from 'lucide-react';
import { generatePersonaSummary } from '../../services/gemini';
import { useToast } from '../../context/ToastContext';

interface Props {
  onNext: (icp: ICPProfile, offerType: string, brandVoice: string, targetConversion: string, summary?: PersonaSummary) => void;
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
  const [offerType, setOfferType] = useState(initialOfferType || '');
  const [brandVoice, setBrandVoice] = useState(initialBrandVoice || '');
  const [targetConversion, setTargetConversion] = useState(initialTargetConversion || '');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [personaSummary, setPersonaSummary] = useState<PersonaSummary | null>(null);

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
  
  const handleContinue = () => {
      if (personaSummary) {
          onNext(formData, offerType, brandVoice, targetConversion, personaSummary);
      } else {
          // If they skipped generation or we failed, strictly proceed but maybe warn?
          // We'll just generate on next if needed, or better, force generation?
          // For now, let's just proceed.
           onNext(formData, offerType, brandVoice, targetConversion);
      }
  };

  const isValid = formData.role && formData.industry && formData.painPoints[0] && offerType && brandVoice && targetConversion;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* Outcome Header */}
        <div className="mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg"><Target size={24}/></span>
                Audience & Goals
            </h2>
            <p className="text-gray-600 font-medium">
                You'll walk out with: <span className="text-gray-500 font-normal">3 tailored lead magnet ideas, a finished asset, landing page copy, and an email sequence.</span>
            </p>
        </div>

        {/* Quick Start Presets */}
        <div className="mb-8">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Start Presets</label>
            <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                    <button 
                        key={r} 
                        onClick={() => applyPreset(r)}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${formData.role === r ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                        {r}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Role / Job Title</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => handleChange('role', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. Marketing Manager"
            />
            <p className="text-xs text-gray-400 mt-1">Used to tailor tone and examples.</p>
          </div>
          
          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={e => handleChange('industry', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. B2B SaaS"
            />
          </div>

          {/* Offer Type */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Type</label>
            <select 
                value={offerType} 
                onChange={e => setOfferType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
                <option value="">Select Offer Type...</option>
                {OFFERS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Determines the asset format best practices.</p>
          </div>

           {/* Brand Voice */}
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Voice</label>
            <select 
                value={brandVoice} 
                onChange={e => setBrandVoice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
                <option value="">Select Voice...</option>
                {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        
        {/* Pain Points */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Top Pain Points</label>
          <div className="space-y-3">
            {formData.painPoints.map((point, idx) => (
                <input
                key={idx}
                type="text"
                value={point}
                onChange={e => handleArrayChange('painPoints', idx, e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder={`Pain point #${idx + 1}`}
                />
            ))}
          </div>
          <button onClick={() => addArrayItem('painPoints')} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            + Add another pain point
          </button>
           <p className="text-xs text-gray-400 mt-1">Drives specific hooks and bullet points.</p>
        </div>

        {/* Goals */}
        <div className="mb-8">
           <div className="flex justify-between items-center mb-2">
             <label className="block text-sm font-medium text-gray-700">Primary Conversion Goal</label>
           </div>
           
           <input
                type="text"
                value={targetConversion}
                onChange={e => setTargetConversion(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="e.g. Book a Demo, 7-Day Free Trial, Newsletter Signup"
            />
            
            <div className="mt-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Audience Goals (What they want)</label>
                 {formData.goals.map((goal, idx) => (
                    <input
                    key={idx}
                    type="text"
                    value={goal}
                    onChange={e => handleArrayChange('goals', idx, e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder={`Goal #${idx + 1}`}
                    />
                ))}
                <button onClick={() => addArrayItem('goals')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    + Add another goal
                </button>
            </div>
        </div>

        {/* Immediate Value Generator */}
        {isValid && !personaSummary && (
            <div className={`p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between transition-all ${isGenerating ? 'opacity-75' : ''}`}>
                <div>
                   <h4 className="text-sm font-semibold text-blue-800">Ready to see who you're targeting?</h4> 
                   <p className="text-xs text-blue-600">Generate an AI persona summary before moving on.</p>
                </div>
                <button 
                  onClick={handleGenerateIdentity}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isGenerating ? <span className="animate-spin">✨</span> : <Sparkles size={16}/>}
                    {isGenerating ? 'Generating...' : 'Generate Identity'}
                </button>
            </div>
        )}

        {/* Persona Summary Result */}
        {personaSummary && (
             <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 animate-slide-up">
                <h3 className="text-md font-bold text-indigo-900 mb-2 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500 fill-amber-500"/> 
                    Your Audience Identity
                </h3>
                <p className="text-indigo-800 text-sm mb-4 leading-relaxed">{personaSummary.summary}</p>
                
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">High-Converting Hooks</p>
                    {personaSummary.hooks.map((hook, i) => (
                        <div key={i} className="flex items-start gap-2 text-indigo-700 text-sm italic bg-white/60 p-2 rounded">
                            <MessageSquare size={14} className="mt-1 flex-shrink-0 opacity-50"/>
                            "{hook}"
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Action Footer */}
        <div className="mt-8 flex justify-end gap-4 items-center">
             {personaSummary && <span className="text-sm text-gray-500 mr-2">Looks good? Let's get ideas.</span>}
           
           <button
            onClick={handleContinue}
            disabled={!isValid || isGenerating}
            className={`px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl flex items-center gap-2 ${
              isValid ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white transform hover:-translate-y-0.5' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Next: Generate Lead Magnet Ideas &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudienceGoalsStep;
