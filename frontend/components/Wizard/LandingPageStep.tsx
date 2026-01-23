import React, { useState, useEffect } from 'react';
import { LandingPageConfig, GeneratedAsset, LeadMagnetIdea, FormField, ICPProfile, ProductContext } from '../../types';
import { generateLandingPage, generateHeroImage } from '../../services/llm';
import { Loader2, RefreshCw, Smartphone, Monitor, Plus, Trash2, Maximize2, X } from 'lucide-react';
import LandingPageRenderer from '../LandingPageRenderer';
import SkeletonLoader from '../SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import GenieCard from '../ui/GenieCard';
import GenieButton from '../ui/GenieButton';

interface Props {
  icp: ICPProfile;
  idea: LeadMagnetIdea;
  asset: GeneratedAsset;
  offerType: string;
  brandVoice: string;
  targetConversion?: string;
  onNext: (config: LandingPageConfig) => void;
  onBack: () => void;
  savedConfig?: LandingPageConfig;
    primaryColor?: string;
    productContext?: ProductContext;
}

const LandingPageStep: React.FC<Props> = ({
    icp,
    idea,
    asset,
    offerType,
    brandVoice,
    targetConversion,
    onNext,
    onBack,
    savedConfig,
    primaryColor,
    productContext
}) => {
  const [config, setConfig] = useState<LandingPageConfig | null>(savedConfig || null);
  const [loading, setLoading] = useState(!savedConfig);
  const [regeneratingImage, setRegeneratingImage] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    console.log("LandingPageStep initialized with:", { idea, asset, offerType, brandVoice });
    if (!savedConfig && !config) {
      generate();
    }
  }, [idea, asset]);

  const generate = async () => {
    setLoading(true);
    // Reset config to null to ensure loading state shows if retrying
    if (!savedConfig) setConfig(null); 
    
    try {
      const result = await generateLandingPage(idea, asset, icp, undefined, offerType, brandVoice, targetConversion, productContext);
      
      if (result) {
          // Inject calculator config if applicable
          if (asset.type === 'calculator' && asset.contentJson) {
              result.calculatorConfig = asset.contentJson;
          }

          if (asset.type === 'calculator') {
              result.imageUrl = null;
          }

          // Ensure arrays are initialized
          const initialConfig: LandingPageConfig = {
              ...result,
              sections: result.sections || [],
              formSchema: result.formSchema || [
                  { name: "name", label: "Full Name", type: "text", required: true },
                  { name: "email", label: "Email Address", type: "email", required: true }
              ]
          };
          setConfig(initialConfig);
          if (asset.type !== 'calculator') {
              generateImage(initialConfig); // Call generateImage with the new config
          }
      } else {
          setConfig(null); 
      }
    } catch (e) {
      console.error("Landing page generation error:", e);
      toast.error("Failed to generate landing page content.");
      // Set a flag or specific error state, but here we'll use null config + not loading to trigger a manual retry UI
      setConfig(null); 
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async (currentConfig: LandingPageConfig) => {
      // Don't generate image if it's a calculator
      if (asset.type === 'calculator') {
          setConfig(prev => prev ? { ...prev, imageUrl: undefined } : null);
          return;
      }

      setRegeneratingImage(true);
      try {
          // This calls the backend which now calls Unsplash
          const url = await generateHeroImage(idea, icp, offerType, brandVoice);
          
          setConfig(prev => {
              if (!prev) return null;
              return {
                  ...prev,
                  imageUrl: url,
                  // Ensure background style is respected if the LLM returned it
                  backgroundStyle: prev.backgroundStyle || 'plain_white'
              };
          });
      } catch (e) {
          console.error("Image search failed", e);
          toast.error("Failed to find stock image. Using fallback.");
          // Fallback to a gradient pattern if search fails completely
          setConfig(prev => prev ? { ...prev, imageUrl: undefined } : null);
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

  if (loading) {
    return (
            <div className="py-8">
                <SkeletonLoader />
            </div>
    );
  }

  if (!config) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="border border-red-500/40 p-4 rounded mb-4">
                  <RefreshCw className="text-red-400" size={32} />
              </div>
              <h3 className="text-lg font-semibold mb-2">Generation Failed</h3>
              <p className="genie-muted mb-6 max-w-md">We couldn't generate your landing page this time. Please try again or check your inputs.</p>
              <GenieButton onClick={generate} variant="primary" className="gap-2">
                  <RefreshCw size={16} /> Retry Generation
              </GenieButton>
          </div>
      );
  }

  // Full Screen Overlay
  if (isFullScreen) {
      return (
          <div className="fixed inset-0 z-50 bg-gray-100 flex flex-col animate-in fade-in duration-200">
              <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm shrink-0">
                  <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-gray-800">Full Screen Preview</span>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                          <button 
                              onClick={() => setViewMode('desktop')}
                              className={`p-1.5 rounded ${viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Desktop View"
                          >
                              <Monitor size={16} />
                          </button>
                          <button 
                              onClick={() => setViewMode('mobile')}
                              className={`p-1.5 rounded ${viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                              title="Mobile View"
                          >
                              <Smartphone size={16} />
                          </button>
                      </div>
                  </div>
                  <button 
                      onClick={() => setIsFullScreen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition"
                      title="Exit Full Screen"
                  >
                      <X size={20} />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-100/50">
                   <div className={`mx-auto bg-white shadow-2xl origin-top transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-[375px] min-h-[812px] rounded-[3rem] border-[8px] border-gray-900 overflow-hidden ring-1 ring-gray-900/5' : 'w-full min-h-full rounded-lg'}`}>
                                             <LandingPageRenderer
                                                 config={config}
                                                 mode={viewMode}
                                                 brand={{
                                                     primaryColor: productContext?.primaryColor || '#2563eb',
                                                     fontStyle: productContext?.fontStyle,
                                                     logoUrl: productContext?.logoUrl
                                                 }}
                                                 primaryColor={productContext?.primaryColor || '#2563eb'}
                                             />
                   </div>
              </div>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        
        {/* Editor Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 lg:h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
            
            {/* Standard Fields */}
            <GenieCard className="space-y-4">
                <div>
                  <div className="genie-section-number">05.</div>
                  <h3 className="font-semibold">Content</h3>
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Headline</label>
                    <textarea 
                        value={config.headline} 
                        onChange={(e) => handleUpdate('headline', e.target.value)}
                        className="w-full text-sm"
                        rows={2}
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">Subheadline</label>
                    <textarea 
                        value={config.subheadline} 
                        onChange={(e) => handleUpdate('subheadline', e.target.value)}
                        className="w-full text-sm"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-xs uppercase tracking-[0.3em] text-green-400 mb-2">CTA Button</label>
                    <input 
                        type="text"
                        value={config.cta} 
                        onChange={(e) => handleUpdate('cta', e.target.value)}
                        className="w-full text-sm"
                    />
                </div>
            </GenieCard>

            {/* Form Builder */}
            <GenieCard className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Form Fields</h3>
                    <GenieButton onClick={addField} variant="secondary" className="gap-1 text-[10px]">
                        <Plus size={12}/> Add Field
                    </GenieButton>
                </div>
                <div className="space-y-3">
                    {(config.formSchema || []).map((field, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-black p-2 rounded border border-green-500/20 group">
                            <div className="flex-1 space-y-2">
                                <input 
                                    value={field.label}
                                    onChange={(e) => updateField(idx, { label: e.target.value })}
                                    className="w-full text-xs font-medium"
                                    placeholder="Label"
                                />
                                <div className="flex gap-2">
                                    <select 
                                        value={field.type}
                                        onChange={(e) => updateField(idx, { type: e.target.value as any })}
                                        className="text-xs"
                                    >
                                        <option value="text">Text</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Phone</option>
                                        <option value="textarea">Long Text</option>
                                    </select>
                                    <label className="flex items-center gap-1 text-xs text-green-400/70 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={field.required}
                                            onChange={(e) => updateField(idx, { required: e.target.checked })}
                                        /> Req.
                                    </label>
                                </div>
                            </div>
                            <button onClick={() => removeField(idx)} className="text-green-400/60 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </GenieCard>

            {/* Hero Image */}
            <GenieCard className="relative overflow-hidden">
                 <div className="flex justify-between items-center mb-4 relative z-10">
                     <h3 className="font-semibold">Hero Image</h3>
                     <div className="flex gap-2">
                         <label className="text-xs flex items-center gap-1 text-green-300 border border-green-500/30 px-2 py-1 rounded cursor-pointer transition">
                             Upload
                             <input type="file" onChange={handleImageUpload} className="hidden" accept="image/*" />
                         </label>
                         <GenieButton 
                            onClick={() => generateImage(config)}
                            disabled={regeneratingImage}
                            variant="secondary"
                            className="text-[10px]"
                         >
                            <RefreshCw size={12} className={regeneratingImage ? "animate-spin" : ""} />
                            Generate
                         </GenieButton>
                     </div>
                 </div>
                 
                 <div className="relative w-full h-32 rounded overflow-hidden border border-green-500/20 bg-black">
                     {regeneratingImage && (
                        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                             <Loader2 size={24} className="text-green-400 animate-spin mb-2" />
                             <span className="text-xs font-semibold text-green-300">Generating Visuals...</span>
                        </div>
                     )}
                     
                     {config.imageUrl ? (
                         <img src={config.imageUrl} alt="Hero Preview" className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full bg-black flex items-center justify-center shadow-inner">
                             <div className="text-center text-green-400/40">
                                <span className="font-bold text-xs uppercase tracking-[0.3em] block">No Image</span>
                             </div>
                         </div>
                     )}
                 </div>
            </GenieCard>

        </div>

        {/* Live Preview Column */}
        <div className="flex-1 flex flex-col min-h-0 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden relative">
            {/* Toolbar */}
            <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsFullScreen(true)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded transition"
                        title="Enter Full Screen"
                    >
                        <Maximize2 size={16} />
                    </button>
                    <div className="w-px h-4 bg-gray-200 mx-1"></div>
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
            </div>

            {/* Renderer Container */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                 <div className={`mx-auto origin-top transition-all duration-300 ${viewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'}`}>
                                         <LandingPageRenderer
                                             config={config}
                                             mode={viewMode}
                                             brand={{
                                                 primaryColor: productContext?.primaryColor || '#2563eb',
                                                 fontStyle: productContext?.fontStyle,
                                                 logoUrl: productContext?.logoUrl
                                             }}
                                             primaryColor={productContext?.primaryColor || '#2563eb'}
                                         />
                 </div>
            </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-green-500/20 flex justify-between items-center mt-auto z-50">
           <GenieButton onClick={onBack} variant="secondary">
               Back to Asset
           </GenieButton>
           <div className="flex items-center gap-4">
              <span className="text-xs font-medium text-[#ccff00] border border-[#ccff00]/50 px-3 py-1 rounded">
                  Autosaved
              </span>
              <GenieButton onClick={() => onNext(config)} variant="primary">
                  Generate Email Sequence -&gt;
              </GenieButton>
           </div>
      </div>
    </div>
  );
};

export default LandingPageStep;