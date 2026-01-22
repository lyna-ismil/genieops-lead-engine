import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { request } from '../services/api';
import { OfferStack } from '../types';

const ThankYou: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<
        { headline: string; copy: string; cta: string } &
        Partial<OfferStack> &
        { primaryColor?: string; fontStyle?: 'serif' | 'sans' | 'mono'; designVibe?: 'minimal' | 'bold' | 'corporate'; logoUrl?: string; companyName?: string }
    >();

    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        request<{ headline: string; copy: string; cta: string } & Partial<OfferStack>>(`/api/public/landing/${slug}/thank-you`)
            .then(setData)
            .finally(() => setLoading(false));
    }, [slug]);

    const hasOffer = !!data;
    const brandColor = data?.primaryColor || 'var(--brand-primary, #2563eb)';
    const fontFamily = data?.fontStyle === 'serif' ? 'var(--font-heading)' : 'var(--font-body)';
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4" style={{ fontFamily }}>
             <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden text-center p-12">
                 <div className="mb-6">
                    {data?.logoUrl ? (
                        <img src={data.logoUrl} alt="Brand logo" className="w-20 h-20 rounded-full object-contain mx-auto" />
                    ) : (
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                        </div>
                    )}
                 </div>
                 <h1 className="text-3xl font-bold text-gray-900 mb-4">Success!</h1>
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8">
                     <p className="text-emerald-900 font-medium">
                         Thanks for signing up{data?.companyName ? ` with ${data.companyName}` : ''}! Your resource is on its way.
                     </p>
                     <p className="text-emerald-700 text-sm mt-1">
                         Check your inbox for the download link and next steps.
                     </p>
                 </div>

                 {loading && <p className="text-gray-500">Loading offer...</p>}
                 {hasOffer && !loading && data && (
                     <div className="text-left bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8">
                         <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brandColor }}>Limited Time Offer</div>
                         <h2 className="text-2xl font-extrabold text-gray-900 mb-3">{data.headline}</h2>
                         <p className="text-sm text-gray-700 mb-3">{data.copy}</p>
                         <div className="flex items-end gap-3 mb-4">
                             {data.valueAnchor && <span className="text-sm text-gray-400 line-through">{data.valueAnchor}</span>}
                             {data.price && <span className="text-2xl font-extrabold text-gray-900">{data.price}</span>}
                         </div>

                         {(data.bonuses || []).length > 0 && (
                             <div className="mb-4">
                                 <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: brandColor }}>Bonuses</div>
                                 <ul className="space-y-2 text-sm text-gray-700">
                                     {(data.bonuses || []).map((bonus, idx) => (
                                         <li key={idx} className="flex items-start gap-2">
                                             <span className="mt-1" style={{ color: brandColor }}>✔</span>
                                             <span>{bonus}</span>
                                         </li>
                                     ))}
                                 </ul>
                             </div>
                         )}

                         {data.guarantee && (
                             <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                                 <div className="flex items-center gap-2 font-semibold mb-1" style={{ color: brandColor }}>
                                     <span>🛡️</span>
                                     <span>Guarantee</span>
                                 </div>
                                 <p>{data.guarantee}</p>
                             </div>
                         )}
                         <button className="w-full mt-4 py-2 text-white rounded-lg text-sm font-semibold shadow hover:opacity-90 transition" style={{ backgroundColor: brandColor }}>
                             {data.cta}
                         </button>
                     </div>
                 )}
                 <a href="/dashboard" className="text-blue-600 font-medium hover:underline">Return to Dashboard</a>
             </div>
        </div>
    );
};

export default ThankYou;
