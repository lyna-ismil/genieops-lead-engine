import React, { useState, useEffect } from 'react';
import { LeadMagnetIdea, LandingPageConfig, ProductContext } from '../../types';
import { generateLinkedInPost } from '../../services/llm';
import { getLinkedInAuthUrl, getSocialStatus, publishToLinkedIn } from '../../services/social';
import { Linkedin, Loader2, Copy, Check, Save, Share2, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  idea: LeadMagnetIdea;
  landingPage: LandingPageConfig;
  brandVoice?: string;
    productContext?: ProductContext;
  onSave: (post: string) => void;
  onBack: () => void;
  savedPost?: string | null;
}

const SocialStep: React.FC<Props> = ({ idea, landingPage, brandVoice, productContext, onSave, onBack, savedPost }) => {
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
            const result = await generateLinkedInPost(idea, landingPage, brandVoice, productContext);
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

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
        
        {/* Helper Col / Preview */}
        <div className="order-2 lg:order-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-gray-200 bg-white font-medium text-gray-700 text-sm flex items-center gap-2">
                <Linkedin size={16} className="text-[#0077b5]" />
                <span>Feed Preview</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
                {/* LinkedIn Card Mockup */}
                <div className="bg-white border border-gray-300 rounded-lg shadow-sm w-full max-w-[550px]">
                    {/* Header */}
                    <div className="p-3 flex gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0">
                             {/* Avatar placeholder */}
                             <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                                 {connectedUser ? connectedUser.charAt(0).toUpperCase() : 'U'}
                             </div>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                                {connectedUser || "Your Name"} <span className="text-gray-400 font-normal">• 1st</span>
                            </div>
                            <div className="text-xs text-gray-500">Founder at Company • 1h • <span className="text-gray-400">🌐</span></div>
                        </div>
                    </div>

                    {/* Post Content */}
                    <div className="px-3 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
                        {post || "Drafting your post..."}
                    </div>

                    {/* Link Preview Card */}
                    <div className="bg-gray-100 border-t border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                         <div className="aspect-[1.91/1] w-full bg-gray-300 overflow-hidden relative">
                             {landingPage.imageUrl ? (
                                <img src={landingPage.imageUrl} className="w-full h-full object-cover" alt="OG Preview" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">
                                    No Image
                                </div>
                             )}
                         </div>
                         <div className="p-3 bg-gray-100">
                             <div className="font-semibold text-sm text-gray-900 truncate">{landingPage.headline || "Landing Page Headline"}</div>
                             <div className="text-xs text-gray-500 mt-0.5">genieops.ai • 1 min read</div>
                         </div>
                    </div>
                    
                    {/* Social Actions */}
                    <div className="px-3 py-2 flex justify-between border-t border-gray-100">
                        {['Like', 'Comment', 'Repost', 'Send'].map((action) => (
                             <div key={action} className="px-2 py-2 hover:bg-gray-100 rounded-md cursor-pointer flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition">
                                 <div className="w-4 h-4 bg-gray-400 rounded-sm opacity-50"></div>
                                 <span className="text-xs font-semibold">{action}</span>
                             </div>
                        ))}
                    </div>
                </div>
                
                <p className="text-center text-xs text-gray-400 mt-4">This is a preview of how your post will appear in the feed.</p>
            </div>
        </div>

        {/* Editor Col */}
        <div className="order-1 lg:order-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200 shrink-0">
                <span className="text-gray-600 font-medium text-sm">Post Content</span>
                <div className="flex gap-2">
                     <button 
                        onClick={handleCopy}
                        className="text-gray-500 hover:text-gray-800 flex items-center gap-1.5 text-xs transition px-2 py-1 rounded"
                    >
                        {copied ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                    <button 
                         onClick={generate} 
                         disabled={loading}
                         className="text-blue-600 hover:text-blue-800 flex items-center gap-1.5 text-xs transition px-2 py-1 rounded disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
                        Regenerate
                    </button>
                </div>
            </div>
            
            <div className="flex-1 p-6 relative min-h-[300px]">
                 {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3"/>
                        <p className="text-gray-500">Generating viral post content...</p>
                    </div>
                ) : (
                    <textarea 
                        className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-gray-800 text-lg leading-relaxed font-sans placeholder:text-gray-300"
                        value={post}
                        onChange={(e) => setPost(e.target.value)}
                        placeholder="Draft your LinkedIn post here..."
                    />
                )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
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