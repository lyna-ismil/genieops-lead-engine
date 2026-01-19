import React, { useState, useEffect } from 'react';
import { ICPProfile, LeadMagnetIdea, GeneratedAsset, LandingPageConfig } from '../../types';
import { generateLandingPage, generateHeroImage } from '../../services/gemini';
import { Loader2, Monitor, Smartphone, RefreshCw, ExternalLink, Image as ImageIcon, Upload, Sparkles } from 'lucide-react';

interface Props {
  idea: LeadMagnetIdea;
  asset: GeneratedAsset;
  onNext: (config: LandingPageConfig) => void;
  onBack: () => void;
  savedConfig?: LandingPageConfig;
}

const LandingPageStep: React.FC<Props> = ({ idea, asset, onNext, onBack, savedConfig }) => {
  const [config, setConfig] = useState<LandingPageConfig | null>(savedConfig || null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  
  // Image State
  const [imageUrl, setImageUrl] = useState<string>(savedConfig?.imageUrl || '');
  const [icp] = useState<ICPProfile>(() => {
    // Attempt to retrieve ICP from localStorage for image context if not passed directly
    // Ideally should be passed in props, but for now we trust the stored project or context
    // This is a simplification; in a real app, pass `icp` as prop.
    const stored = localStorage.getItem('genieops_projects');
    if (stored) {
       // Just a fallback attempt, normally passed down
       return { role: 'Professional', industry: 'General', companySize: '', painPoints: [], goals: [] };
    }
    return { role: 'Professional', industry: 'General', companySize: '', painPoints: [], goals: [] };
  });

  const injectImageIntoHtml = (html: string, url: string): string => {
      // Simple heuristic: Replace the placehold.co URL if it exists, otherwise replace the first img src
      if (html.includes('placehold.co')) {
          return html.replace(/src=["']https:\/\/placehold\.co\/[^"']*["']/g, `src="${url}"`);
      }
      // If no placeholder, try to find a hero image by common class names or just first img
      // This is less safe, so we mainly rely on the placeholder strategy established in the prompt.
      return html;
  };

  const generatePage = async (overrideImage?: string) => {
    setLoading(true);
    try {
      const imgToUse = overrideImage || imageUrl;
      const result = await generateLandingPage(idea, asset, imgToUse);
      setConfig(result);
      if (imgToUse) {
        setImageUrl(imgToUse);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
      setImageLoading(true);
      try {
          // We need ICP context really, let's assume it's passed or we fetch it. 
          // For now, we will use a "best effort" context derived from the Idea itself if ICP is missing from props.
          const tempIcp: ICPProfile = { role: 'Target Audience', industry: 'Target Industry', painPoints: [], goals: [], companySize: '' };
          
          const generatedUrl = await generateHeroImage(idea, tempIcp);
          if (generatedUrl) {
              setImageUrl(generatedUrl);
              // If page exists, inject image
              if (config) {
                  const newHtml = injectImageIntoHtml(config.htmlContent, generatedUrl);
                  setConfig({ ...config, htmlContent: newHtml, imageUrl: generatedUrl });
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setImageLoading(false);
      }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const result = reader.result as string;
              setImageUrl(result);
              if (config) {
                   const newHtml = injectImageIntoHtml(config.htmlContent, result);
                   setConfig({ ...config, htmlContent: newHtml, imageUrl: result });
              }
          };
          reader.readAsDataURL(file);
      }
  };

  useEffect(() => {
    if (!config) generatePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-180px)] flex flex-col">
       <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Landing Page</h2>
          <p className="text-gray-500 text-sm">Review the generated copy and layout.</p>
        </div>
        <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button 
                    onClick={() => setViewMode('desktop')}
                    className={`p-1.5 rounded-md transition ${viewMode === 'desktop' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Monitor size={18}/>
                </button>
                <button 
                     onClick={() => setViewMode('mobile')}
                     className={`p-1.5 rounded-md transition ${viewMode === 'mobile' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                    <Smartphone size={18}/>
                </button>
            </div>
            {!loading && (
                 <button onClick={() => generatePage()} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <RefreshCw size={14} /> Regenerate Copy
                 </button>
            )}
        </div>
      </div>

      {/* Image Control Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm mb-4 flex flex-wrap items-center gap-4 animate-fade-in shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mr-2">
                <ImageIcon size={18} className="text-blue-500"/>
                <span>Hero Image</span>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
                <input 
                    type="text" 
                    placeholder="Enter image URL..." 
                    value={imageUrl.length > 50 ? imageUrl.substring(0,50) + '...' : imageUrl}
                    onChange={(e) => {
                        setImageUrl(e.target.value);
                        if(config) {
                             const newHtml = injectImageIntoHtml(config.htmlContent, e.target.value);
                             setConfig({ ...config, htmlContent: newHtml, imageUrl: e.target.value });
                        }
                    }}
                    className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition">
                    <Upload size={14} /> Upload
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                <button 
                    onClick={handleGenerateImage}
                    disabled={imageLoading}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition disabled:opacity-50"
                >
                    {imageLoading ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14} />} 
                    Generate AI
                </button>
            </div>
            
            {imageUrl && (
                <div className="h-8 w-8 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                    <img src={imageUrl} alt="Hero Preview" className="h-full w-full object-cover" />
                </div>
            )}
      </div>

      <div className="flex-1 bg-gray-100 rounded-xl border border-gray-300 overflow-hidden relative flex flex-col items-center justify-center p-8">
         {loading ? (
             <div className="flex flex-col items-center">
                 <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4"/>
                 <p className="text-gray-600 font-medium">Designing landing page...</p>
                 <p className="text-gray-400 text-sm mt-2">Writing copy, structuring layout, applying styles</p>
             </div>
         ) : config ? (
             <div 
                className={`bg-white shadow-2xl transition-all duration-500 ease-in-out border border-gray-200 overflow-hidden ${
                    viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl' : 'w-full h-full rounded-lg'
                }`}
             >
                <iframe 
                    title="Landing Page Preview"
                    srcDoc={config.htmlContent}
                    className="w-full h-full"
                    sandbox="allow-scripts"
                />
             </div>
         ) : null}
      </div>

      <div className="flex justify-between pt-6 shrink-0">
        <button onClick={onBack} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
          Back
        </button>
        <button
          onClick={() => config && onNext(config)}
          disabled={!config || loading}
          className={`px-8 py-2.5 rounded-lg font-medium shadow-md transition-all ${
            config && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Generate Email Sequence &rarr;
        </button>
      </div>
    </div>
  );
};

export default LandingPageStep;