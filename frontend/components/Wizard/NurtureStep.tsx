import React, { useState, useEffect } from 'react';
import { LeadMagnetIdea, Email, OfferStack, ProductContext, GeneratedAsset } from '../../types';
import { generateNurtureSequence, generateUpgradeOffer } from '../../services/llm';
import { Mail, Clock, ArrowRight, Loader2, Gift } from 'lucide-react';

interface Props {
  idea: LeadMagnetIdea;
  asset?: GeneratedAsset;
  offerType?: string;
  brandVoice?: string;
  targetConversion?: string;
  productContext?: ProductContext;
  onNext: (emails: Email[], upgrade: OfferStack | null) => void;
  onBack: () => void;
  savedEmails?: Email[];
}

const NurtureStep: React.FC<Props> = ({ idea, asset, offerType, brandVoice, targetConversion, productContext, onNext, onBack, savedEmails }) => {
  const [emails, setEmails] = useState<Email[]>(savedEmails || []);
  const [upgrade, setUpgrade] = useState<OfferStack | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const emailResult = await generateNurtureSequence(idea, brandVoice, targetConversion, productContext, asset);
      setEmails(emailResult);
      
      const upgradeResult = await generateUpgradeOffer(idea, emailResult, offerType, brandVoice, productContext, targetConversion);
      setUpgrade(upgradeResult);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (emails.length === 0) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-180px)] flex flex-col">
       <div className="mb-6 shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">Nurture & Upsell</h2>
          <p className="text-gray-500 mt-1">Automated email sequence and strategic upgrade offer.</p>
      </div>

      <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-4">
        {/* Email Sequence Column */}
        <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Mail size={20} className="text-blue-500"/> Email Sequence
            </h3>
            {loading && emails.length === 0 ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 relative">
                     {/* Timeline Line */}
                    <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200 z-0"></div>

                    {Array.isArray(emails) && emails.map((email, idx) => (
                        <div key={idx} className="relative z-10 pl-14">
                            <div className="absolute left-3 top-0 bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                {idx + 1}
                            </div>
                            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-gray-900">{email.subject}</h4>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                                        <Clock size={12}/> {email.delay}
                                    </span>
                                </div>
                                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
                                    Goal: {email.intent}
                                </div>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                                    {email.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Upgrade Offer Column */}
        <div className="lg:col-span-1">
            <div className="sticky top-0">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
                    <Gift size={20} className="text-purple-500"/> Upgrade Offer
                </h3>
                {loading ? (
                    <div className="h-64 bg-gray-100 rounded-xl animate-pulse"></div>
                ) : upgrade ? (
                  <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100 shadow-sm">
                    <div className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Irresistible Offer</div>
                    <h4 className="font-bold text-gray-900 mb-3">{upgrade.coreOffer}</h4>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-sm text-gray-400 line-through">{upgrade.valueAnchor}</span>
                      <span className="text-2xl font-extrabold text-gray-900">{upgrade.price}</span>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2">Bonuses</div>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {(upgrade.bonuses || []).map((bonus, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 text-purple-500">✔</span>
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-100 rounded-lg p-3 text-sm text-gray-700 mb-4">
                      <div className="flex items-center gap-2 font-semibold text-purple-700 mb-1">
                        <span>🛡️</span>
                        <span>Guarantee</span>
                      </div>
                      <p>{upgrade.guarantee}</p>
                    </div>
                    <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold shadow hover:bg-purple-700 transition">
                      Claim Offer
                    </button>
                  </div>
                ) : null}
            </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200 shrink-0">
        <button onClick={onBack} className="px-6 py-2.5 text-gray-600 font-medium hover:text-gray-900">
          Back
        </button>
        <button
          onClick={() => emails.length > 0 && onNext(emails, upgrade)}
          disabled={loading || emails.length === 0}
          className={`px-8 py-2.5 rounded-lg font-medium shadow-md transition-all ${
            emails.length > 0 && !loading
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Draft Social Post &rarr;
        </button>
      </div>
    </div>
  );
};

export default NurtureStep;