import React, { useEffect, useState } from 'react';
import { ICPProfile, LeadMagnetIdea, ProductContext } from '../../types';
import { generateLeadMagnetIdeas } from '../../services/llm';
import { Loader2, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';
import GenieCard from '../ui/GenieCard';
import GenieButton from '../ui/GenieButton';

interface Props {
  icp: ICPProfile;
  productContext?: ProductContext;
  offerType?: string;
  brandVoice?: string;
  targetConversion?: string;
  onNext: (idea: LeadMagnetIdea) => void;
  onBack: () => void;
  savedIdea?: LeadMagnetIdea;
}

const IdeationStep: React.FC<Props> = ({ icp, productContext, offerType, brandVoice, targetConversion, onNext, onBack, savedIdea }) => {
  const [ideas, setIdeas] = useState<LeadMagnetIdea[]>(savedIdea ? [savedIdea] : []);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(savedIdea?.id || null);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateLeadMagnetIdeas(icp, offerType, brandVoice, targetConversion, productContext);
      // Ensure IDs
      const withIds = generated.map((g, i) => ({ ...g, id: g.id || `idea-${Date.now()}-${i}` }));
      setIdeas(withIds);
    } catch (err) {
      console.error(err);
      const msg = (err as any)?.message || "Failed to generate ideas. Please check console.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ideas.length === 0 && !savedIdea) {
      fetchIdeas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (idea: LeadMagnetIdea) => {
    setSelectedId(idea.id);
  };

  const handleContinue = () => {
    const selected = ideas.find(i => i.id === selectedId);
    if (selected) onNext(selected);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <div className="genie-section-number">03.</div>
          <h2 className="text-2xl font-semibold">Lead Magnet Ideas</h2>
          <p className="genie-muted mt-1">Select the concept that best fits your strategy.</p>
        </div>
        {!loading && (
             <GenieButton 
             onClick={fetchIdeas} 
             variant="secondary"
             className="gap-2"
           >
             <RefreshCw size={14} /> Regenerate
           </GenieButton>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-green-400/70 font-medium">Analyzing pain points and brainstorming...</p>
        </div>
      ) : error ? (
        <GenieCard>
          <div className="text-red-400 text-sm">
            {error}
            <button onClick={fetchIdeas} className="underline ml-2">Try Again</button>
          </div>
        </GenieCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => handleSelect(idea)}
              className={`relative cursor-pointer group p-6 border transition-all duration-200 ${
                selectedId === idea.id
                  ? 'border-[#ccff00] bg-[#ccff00]/10'
                  : 'border-green-500/30 bg-black hover:border-green-500/60'
              }`}
            >
              {selectedId === idea.id && (
                <div className="absolute top-4 right-4 text-[#ccff00]">
                  <CheckCircle2 size={22} fill="currentColor" className="text-black" />
                </div>
              )}
              
              <div className="mb-4">
                <span className="genie-tag">{idea.type}</span>
              </div>
              
              <h3 className="text-lg font-semibold mb-2 leading-tight">{idea.title}</h3>
              
              <div className="space-y-3 mb-6">
                 <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-green-400">Value Promise</p>
                    <p className="text-sm text-green-200">{idea.valuePromise}</p>
                 </div>
                 <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-green-400">Format</p>
                    <p className="text-sm genie-muted">{idea.formatRecommendation}</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-green-500/20">
                <TrendingUp size={16} className="text-[#ccff00]" />
                <span className="text-sm font-medium text-green-200">
                  Conversion Score: <span className="text-[#ccff00]">{idea.conversionScore}/10</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-green-500/20">
        <GenieButton onClick={onBack} variant="secondary">
          Back
        </GenieButton>
        <GenieButton
          onClick={handleContinue}
          disabled={!selectedId || loading}
          variant="primary"
        >
          Next: Generate Assets -&gt;
        </GenieButton>
      </div>
    </div>
  );
};

export default IdeationStep;