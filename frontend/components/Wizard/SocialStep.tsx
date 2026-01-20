import React, { useState, useEffect } from 'react';
import { LeadMagnetIdea, LandingPageConfig } from '../../types';
import { generateLinkedInPost } from '../../services/gemini';
import { getLinkedInAuthUrl, getSocialStatus, publishToLinkedIn } from '../../services/social';
import { Linkedin, Loader2, Copy, Check, Save, Share2, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  idea: LeadMagnetIdea;
  landingPage: LandingPageConfig;
  brandVoice?: string;
  onSave: (post: string) => void;
  onBack: () => void;
  savedPost?: string | null;
}

const SocialStep: React.FC<Props> = ({ idea, landingPage, brandVoice, onSave, onBack, savedPost }) => {
  const toast = useToast();
  
  const [post, setPost] = useState(savedPost || '');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [connectedUser, setConnectedUser] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  const checkStatus = async () => {
      setStatusError(false);
      try {
          const status = await getSocialStatus();
          if (status.linkedin_connected) {
              setConnectedUser(status.user || 'Connected User');
          }
      } catch (e: any) {
          console.warn("Failed to check social status", e);
          setStatusError(true);
          const msg = e?.response?.status === 401 ? "Session expired. Please reconnect." : "Failed to check LinkedIn connection.";
          toast.error(msg);
      }
  };

  const generate = async () => {
    if (savedPost && !post) {
        setPost(savedPost);
        return;
    }
    if (post) return; 

    setLoading(true);
    try {
      const result = await generateLinkedInPost(idea, landingPage, brandVoice);
      setPost(result);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate LinkedIn post content.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generate();
    checkStatus();

    // Listen for popup success
    const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'LINKEDIN_CONNECTED') {
            checkStatus();
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
      try {
          const appBase = import.meta.env.VITE_APP_BASE_URL ?? window.location.origin;
          const redirectUri = `${appBase}/#/auth/linkedin/callback`;
          const url = await getLinkedInAuthUrl(redirectUri);
          window.open(url, 'Connect LinkedIn', 'width=600,height=700');
      } catch (e) {
          toast.error("Could not initiate connection");
      }
  };

  const handlePublish = async () => {
      setPublishing(true);
      try {
          const lpUrl = landingPage.slug 
            ? `${window.location.origin}/#/landing/${landingPage.slug}`
            : window.location.href;

          await publishToLinkedIn(post, lpUrl);
          setPublishedUrl("https://linkedin.com"); 
          toast.success("Published successfully!");
          // Auto-save after publish? The user asked to persist.
          // onSave(post); // Maybe not auto-advance/save, but good UX.
          // But 'onSave' is 'handleFinish' which navigates away.
          // So let's NOT call onSave automatically.
      } catch (e) {
          toast.error("Failed to publish to LinkedIn.");
      } finally {
          setPublishing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col">
      <div className="mb-6 shrink-0 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Distribution</h2>
            <p className="text-gray-500 mt-1">Generate a LinkedIn post to drive traffic to your new funnel.</p>
          </div>
          
          <div className="flex items-center gap-2">
            {statusError && (
                <button onClick={checkStatus} className="text-red-500 hover:text-red-700 p-2" title="Retry connection check">
                    <RefreshCw size={18} />
                </button>
            )}
            {!connectedUser ? (
                <button 
                    onClick={handleConnect}
                    className="bg-[#0077b5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#006097] flex items-center gap-2 shadow-sm transition"
                >
                    <Linkedin size={18} fill="currentColor"/> Connect Account
                </button>
            ) : (
                <div className="flex items-center gap-2 text-[#0077b5] font-medium bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {connectedUser}
                </div>
            )}
          </div>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <span className="text-gray-600 font-medium text-sm">Post Draft</span>
            <div className="flex gap-2">
                 <button 
                    onClick={handleCopy}
                    className="text-gray-500 hover:text-gray-800 flex items-center gap-1.5 text-xs transition px-2 py-1 rounded"
                >
                    {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
        
        <div className="flex-1 p-6 relative">
             {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3"/>
                    <p className="text-gray-500">Generating viral post content...</p>
                </div>
            ) : (
                <textarea 
                    className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 text-lg leading-relaxed font-sans"
                    value={post}
                    onChange={(e) => setPost(e.target.value)}
                    placeholder="Generatine post..."
                />
            )}
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
             <div className="text-xs text-gray-400">
                {post.length > 0 && `${post.length} characters`}
             </div>
             <div>
                 {connectedUser ? (
                     <button
                        onClick={handlePublish}
                        disabled={publishing || !post}
                        className="bg-[#0077b5] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#006097] flex items-center gap-2 shadow transition disabled:opacity-50"
                     >
                        {publishing ? <Loader2 size={18} className="animate-spin"/> : <Share2 size={18}/>}
                        {publishedUrl ? 'Published!' : 'Post Now'}
                     </button>
                 ) : (
                   <span className="text-xs text-gray-400 italic mr-2">Connect LinkedIn to publish directly</span>
                 )}
             </div>
        </div>
      </div>

       <div className="flex justify-between pt-6 shrink-0 text-center">
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
          <Save size={18} /> Save Campaign
        </button>
      </div>
    </div>
  );
};

export default SocialStep;