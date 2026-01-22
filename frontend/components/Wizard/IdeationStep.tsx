import React, { useEffect, useState } from 'react';
import { ICPProfile, LeadMagnetIdea, ProductContext } from '../../types';
import { generateLeadMagnetIdeas } from '../../services/llm';
import { Loader2, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';

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
          <h2 className="text-2xl font-bold text-gray-900">Lead Magnet Ideas</h2>
          <p className="text-gray-500 mt-1">Select the concept that best fits your strategy.</p>
        </div>
        {!loading && (
             <button 
             onClick={fetchIdeas} 
             className="text-sm flex items-center gap-2 text-gray-600 hover:text-blue-600 transition"
           >
             <RefreshCw size={16} /> Regenerate
           </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing pain points and brainstorming...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg text-red-600 border border-red-200">
            {error}
            <button onClick={fetchIdeas} className="underline ml-2">Try Again</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => handleSelect(idea)}
              className={`relative cursor-pointer group p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                selectedId === idea.id
                  ? 'border-blue-600 bg-blue-50/50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              {selectedId === idea.id && (
                <div className="absolute top-4 right-4 text-blue-600">
                  <CheckCircle2 size={24} fill="currentColor" className="text-white" />
                </div>
              )}
              
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                  ${idea.type === 'checklist' ? 'bg-green-100 text-green-700' : 
                    idea.type === 'calculator' ? 'bg-purple-100 text-purple-700' : 
                    'bg-gray-100 text-gray-700'}`}>
                  {idea.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">{idea.title}</h3>
              
              <div className="space-y-3 mb-6">
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Value Promise</p>
                    <p className="text-sm text-gray-700">{idea.valuePromise}</p>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Format</p>
                    <p className="text-sm text-gray-600">{idea.formatRecommendation}</p>
                 </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-sm font-medium text-gray-700">Conversion Score: <span className="text-green-600">{idea.conversionScore}/10</span></span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button onClick={onBack} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selectedId || loading}
          className={`px-8 py-2.5 rounded-lg font-medium shadow-md transition-all ${
            selectedId && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Next: Generate Assets &rarr;
        </button>
      </div>
    </div>
  );
};

export default IdeationStep;