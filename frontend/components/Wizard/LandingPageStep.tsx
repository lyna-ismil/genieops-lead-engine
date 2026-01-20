import React, { useState, useEffect } from 'react';
import { LandingPageConfig, GeneratedAsset, LeadMagnetIdea, FormField } from '../../types';
import { generateLandingPage, generateHeroImage } from '../../services/gemini';
import { Loader2, RefreshCw, Smartphone, Monitor, Plus, Trash2 } from 'lucide-react';
import LandingPageRenderer from '../LandingPageRenderer';
import { useToast } from '../../context/ToastContext';

interface Props {
  idea: LeadMagnetIdea;
  asset: GeneratedAsset;
  offerType: string;
  brandVoice: string;
  targetConversion?: string;
  onNext: (config: LandingPageConfig) => void;
  onBack: () => void;
  savedConfig?: LandingPageConfig;
}

const LandingPageStep: React.FC<Props> = ({ idea, asset, offerType, brandVoice, targetConversion, onNext, onBack, savedConfig }) => {
  const [config, setConfig] = useState<LandingPageConfig | null>(savedConfig || null);
  const [loading, setLoading] = useState(!savedConfig);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const toast = useToast();

  useEffect(() => {
    if (!savedConfig && !config) {
      generate();
    }
  }, []);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateLandingPage(idea, asset, undefined, offerType, brandVoice, targetConversion);
      
      // Ensure arrays are initialized
      const initialConfig: LandingPageConfig = {
          ...result,
          sections: result.sections || [],
          formSchema: result.formSchema || [
              { name: "name", label: "Full Name", type: "text", required: true },
              { name: "email", label: "Email Address", type: "email", required: true }
          ] // Fallback default fields
      };
      
      setConfig(initialConfig);
      
      // Generate Image separately to not block text
      generateImage(initialConfig);
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate landing page content.");
      // Fallback
      setConfig({
        headline: "Error generating page",
        subheadline: "Please try again",
        bullets: [],
        cta: "Retry",
        htmlContent: "<div>Error</div>",
        sections: [],
        formSchema: []
      } as LandingPageConfig);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (currentConfig: LandingPageConfig) => {
      setRegeneratingImage(true);
      try {
          const icpStub = { role: "", industry: "", painPoints: [], goals: [], companySize: "" }; 
          const url = await generateHeroImage(idea, icpStub as any, offerType, brandVoice);
          setConfig(prev => prev ? { ...prev, imageUrl: url } : null);
      } catch (e) {
          console.error("Image generation failed", e);
          toast.error("Failed to generate hero image.");
      } finally {
          setRegeneratingImage(false);
      }
  };

  const handleUpdate = (field: keyof LandingPageConfig, value: any) => {
      setConfig(prev => prev ? { ...prev, [field]: value } : null);
  };

  // --- Form Builder Helpers ---
  const addField = () => {
      setConfig(prev => {
          if (!prev) return null;
          return {
              ...prev,
              formSchema: [...(prev.formSchema || []), { name: `field_${Date.now()}`, label: "New Field", type: "text", required: false }]
          };
      });
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
      setConfig(prev => {
          if (!prev) return null;
          const newSchema = [...(prev.formSchema || [])];
          newSchema[idx] = { ...newSchema[idx], ...updates };
          return { ...prev, formSchema: newSchema };
      });
  };

  const removeField = (idx: number) => {
      setConfig(prev => {
          if (!prev) return null;
          return { ...prev, formSchema: (prev.formSchema || []).filter((_, i) => i !== idx) };
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onloadend = () => {
              handleUpdate('imageUrl', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-gray-600 font-medium">Drafting high-conversion landing page...</p>
        <p className="text-gray-400 text-sm mt-2">Writing copy • Designing layout • Generating assets</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Editor Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
            
            {/* Standard Fields */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-800">Content</h3>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Headline</label>
                    <textarea 
                        value={config.headline} 
                        onChange={(e) => handleUpdate('headline', e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={2}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Subheadline</label>
                    <textarea 
                        value={config.subheadline} 
                        onChange={(e) => handleUpdate('subheadline', e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">CTA Button</label>
                    <input 
                        type="text"
                        value={config.cta} 
                        onChange={(e) => handleUpdate('cta', e.target.value)}
                        className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </div>

            {/* Form Builder */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Form Fields</h3>
                    <button onClick={addField} className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">
                        <Plus size={14}/> Add Field
                    </button>
                </div>
                <div className="space-y-3">
                    {(config.formSchema || []).map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100 group">
                            <div className="flex-1 space-y-2">
                                <input 
                                    value={field.label}
                                    onChange={(e) => updateField(idx, { label: e.target.value })}
                                    className="w-full text-xs font-medium bg-white border border-gray-200 rounded px-2 py-1"
                                    placeholder="Label"
                                />
                                <div className="flex gap-2">
                                    <select 
                                        value={field.type}
                                        onChange={(e) => updateField(idx, { type: e.target.value as any })}
                                        className="text-xs bg-white border border-gray-200 rounded px-1 py-1"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="textarea">Long Text</option>
                                    </select>
                                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={field.required}
                                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                                        /> Req.
                                    </label>
                                </div>
                            </div>
                            <button onClick={() => removeField(idx)} className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hero Image */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800">Hero Image</h3>
                     <div className="flex gap-2">
                         <label className="text-xs flex items-center gap-1 text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer transition">
                             Upload
                             <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                         </label>
                         <button 
                            onClick={() => generateImage(config)}
                            disabled={regeneratingImage}
                            className="text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded disabled:opacity-50"
                         >
                            <RefreshCw size={12} className={regeneratingImage ? "animate-spin" : ""} />
                            Generate
                         </button>
                     </div>
                 </div>
                 {config.imageUrl ? (
                     <img src={config.imageUrl} alt="Hero Preview" className="w-full h-32 object-cover rounded-lg border border-gray-200" />
                 ) : (
                     <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400">No Image</div>
                 )}
            </div>

        </div>

        {/* Live Preview Column */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('desktop')}
                        className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Monitor size={16} />
                    </button>
                    <button 
                        onClick={() => setViewMode('mobile')}
                        className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Smartphone size={16} />
                    </button>
                </div>
            </div>

            {/* Renderer Container */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                 <div className={`mx-auto origin-top transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'}`}>
                     <LandingPageRenderer config={config} mode={viewMode} />
                 </div>
            </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 flex justify-between items-center mt-auto z-50">
           <button onClick={onBack} className="text-gray-500 hover:text-gray-800 font-medium px-4 py-2">
               Back to Asset
           </button>
           <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  Autosaved
              </span>
              <button 
                  onClick={() => onNext(config)} 
                  className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-medium shadow-lg shadow-gray-200 hover:shadow-xl transition-all"
              >
                  Generate Email Sequence &rarr;
              </button>
           </div>
      </div>
    </div>
  );
};

export default LandingPageStep;