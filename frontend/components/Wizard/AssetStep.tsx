import React, { useState, useEffect } from 'react';
import { ICPProfile, LeadMagnetIdea, GeneratedAsset, ProductContext } from '../../types';
import { generateAssetContent } from '../../services/llm';
import { FileText, Loader2, RefreshCw, Copy, Check } from 'lucide-react';
import CalculatorWidget from '../CalculatorWidget';
import GenieCard from '../ui/GenieCard';
import GenieButton from '../ui/GenieButton';

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
          <div className="genie-section-number">04.</div>
          <h2 className="text-2xl font-semibold">Asset Generation</h2>
          <p className="genie-muted mt-1">The core value piece your leads will download.</p>
        </div>
        <div className="flex gap-2">
            {!loading && (
                 <GenieButton onClick={generate} variant="secondary" className="gap-2">
                    <RefreshCw size={14} /> Regenerate
                 </GenieButton>
            )}
        </div>
      </div>

      <GenieCard className="flex-1 overflow-hidden flex flex-col relative">
        {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
                <Loader2 className="w-8 h-8 text-green-400 animate-spin mb-3"/>
                <p className="text-green-400/70 animate-pulse">Drafting content for {idea.type}...</p>
            </div>
        ) : null}
        
        <div className="border-b border-green-500/20 px-4 py-3 flex justify-between items-center shrink-0 bg-black">
            <div className="flex items-center gap-2 text-green-300 font-medium">
                <FileText size={16} className="text-green-400" />
                <span>{idea.title}</span>
            </div>
            {asset && (
                <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center gap-1.5 text-green-400/70 hover:text-green-300 transition"
                >
                    {copied ? <Check size={14} className="text-[#ccff00]"/> : <Copy size={14}/>}
                    {copied ? 'Copied' : 'Copy Text'}
                </button>
            )}
        </div>


        <div className="flex-1 overflow-auto p-8 text-sm leading-relaxed bg-black">
            {asset ? (
                <div className="max-w-3xl mx-auto">
                    {asset.type === 'calculator' && asset.contentJson && (
                        <div className="mb-8 not-prose">
                           <CalculatorWidget config={asset.contentJson} />
                           <div className="my-8 border-t border-green-500/20"></div>
                        </div>
                    )}
                    <pre className="whitespace-pre-wrap text-green-200">{asset.content}</pre>
                </div>
            ) : (
                <div className="h-full flex items-center justify-center text-green-400/50">
                    Waiting for generation...
                </div>
            )}
        </div>
      </GenieCard>

      <div className="flex justify-between pt-6 mt-2 shrink-0">
        <GenieButton onClick={onBack} variant="secondary">
          Back
        </GenieButton>
        <GenieButton
          onClick={() => asset && onNext(asset)}
          disabled={!asset || loading}
          variant="primary"
        >
          Next: Create Landing Page -&gt;
        </GenieButton>
      </div>
    </div>
  );
};

export default AssetStep;