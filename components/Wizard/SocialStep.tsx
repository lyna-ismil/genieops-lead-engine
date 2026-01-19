import React, { useState, useEffect } from 'react';
import { LeadMagnetIdea, LandingPageConfig } from '../../types';
import { generateLinkedInPost } from '../../services/gemini';
import { Linkedin, Loader2, Copy, Check, Save } from 'lucide-react';

interface Props {
  idea: LeadMagnetIdea;
  landingPage: LandingPageConfig;
  onSave: (post: string) => void;
  onBack: () => void;
}

const SocialStep: React.FC<Props> = ({ idea, landingPage, onSave, onBack }) => {
  const [post, setPost] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const result = await generateLinkedInPost(idea, landingPage);
      setPost(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Distribution</h2>
          <p className="text-gray-500 mt-1">Generate a LinkedIn post to drive traffic to your new funnel.</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-[#0077b5] text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
                <Linkedin size={20} fill="currentColor" />
                <span>LinkedIn Draft</span>
            </div>
        </div>
        
        <div className="flex-1 p-6 overflow-auto bg-gray-50 relative">
             {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80">
                    <Loader2 className="w-8 h-8 text-[#0077b5] animate-spin mb-3"/>
                    <p className="text-gray-500">Writing engaging post...</p>
                </div>
            ) : (
                <textarea 
                    className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 text-lg leading-relaxed"
                    value={post}
                    onChange={(e) => setPost(e.target.value)}
                />
            )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
             <button 
                onClick={handleCopy}
                disabled={loading || !post}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-gray-700 transition"
            >
                {copied ? <Check size={16} className="text-green-600"/> : <Copy size={16}/>}
                {copied ? 'Copied' : 'Copy Text'}
            </button>
        </div>
      </div>

       <div className="flex justify-between pt-6 shrink-0">
        <button onClick={onBack} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
          Back
        </button>
        <button
          onClick={() => onSave(post)}
          disabled={!post || loading}
          className={`px-8 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2 ${
            post && !loading
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save size={18} /> Save & Finish
        </button>
      </div>
    </div>
  );
};

export default SocialStep;