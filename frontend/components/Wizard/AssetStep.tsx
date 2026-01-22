import React, { useState, useEffect } from 'react';
import { ICPProfile, LeadMagnetIdea, GeneratedAsset, ProductContext } from '../../types';
import { generateAssetContent } from '../../services/llm';
import { FileText, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import CalculatorWidget from '../CalculatorWidget';

interface Props {
  icp: ICPProfile;
  idea: LeadMagnetIdea;
  offerType?: string;
  brandVoice?: string;
  productContext?: ProductContext;
  onNext: (asset: GeneratedAsset) => void;
  onBack: () => void;
  savedAsset?: GeneratedAsset;
}

const AssetStep: React.FC<Props> = ({ icp, idea, offerType, brandVoice, productContext, onNext, onBack, savedAsset }) => {
  const [asset, setAsset] = useState<GeneratedAsset | null>(savedAsset || null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateAssetContent(idea, icp, offerType, brandVoice, productContext);
      setAsset(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!asset) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    if (asset) {
      navigator.clipboard.writeText(asset.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] flex flex-col animate-fade-in">
       <div className="flex justify-between items-end mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asset Generation</h2>
          <p className="text-gray-500 mt-1">The core value piece your leads will download.</p>
        </div>
        <div className="flex gap-2">
            {!loading && (
                 <button onClick={generate} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <RefreshCw size={14} /> Regenerate
                 </button>
            )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3"/>
                <p className="text-gray-500 animate-pulse">Drafting content for {idea.type}...</p>
            </div>
        ) : null}
        
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
                <FileText size={18} className="text-blue-500" />
                <span>{idea.title}</span>
            </div>
            {asset && (
                <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-gray-900 transition"
                >
                    {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                    {copied ? 'Copied' : 'Copy Text'}
                </button>
            )}
        </div>


        <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed bg-white">
            {asset ? (
                <div className="max-w-3xl mx-auto">
                    {asset.type === 'calculator' && asset.contentJson && (
                        <div className="mb-8 not-prose font-sans">
                           <CalculatorWidget config={asset.contentJson} />
                           <div className="my-8 border-t border-gray-100"></div>
                        </div>
                    )}
                    <pre className="whitespace-pre-wrap">{asset.content}</pre>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-300">
                    Waiting for generation...
                </div>
            )}
        </div>
      </div>

      <div className="flex justify-between pt-6 mt-2 shrink-0">
        <button onClick={onBack} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
          Back
        </button>
        <button
          onClick={() => asset && onNext(asset)}
          disabled={!asset || loading}
          className={`px-8 py-2.5 rounded-lg font-medium shadow-md transition-all ${
            asset && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Create Landing Page &rarr;
        </button>
      </div>
    </div>
  );
};

export default AssetStep;