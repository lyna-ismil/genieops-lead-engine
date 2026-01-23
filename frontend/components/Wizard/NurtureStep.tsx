import React, { useState, useEffect } from 'react';
import { LeadMagnetIdea, Email, OfferStack, ProductContext, GeneratedAsset } from '../../types';
import { generateNurtureSequence, generateUpgradeOffer } from '../../services/llm';
import { Mail, Clock, ArrowRight, Loader2, Gift } from 'lucide-react';
import GenieCard from '../ui/GenieCard';
import GenieButton from '../ui/GenieButton';

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
         <div className="genie-section-number">06.</div>
         <h2 className="text-2xl font-semibold">Nurture & Upsell</h2>
         <p className="genie-muted mt-1">Automated email sequence and strategic upgrade offer.</p>
      </div>

      <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-4">
        {/* Email Sequence Column */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
            <Mail size={18}/> Email Sequence
            </h3>
            {loading && emails.length === 0 ? (
                <div className="space-y-4">
                    {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-green-500/10 rounded animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6 relative">
                     {/* Timeline Line */}
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-green-500/20 z-0"></div>

                    {Array.isArray(emails) && emails.map((email, idx) => (
                        <div key={idx} className="relative z-10 pl-14">
                  <div className="absolute left-3 top-0 bg-[#ccff00] text-black w-8 h-8 rounded flex items-center justify-center font-bold text-sm border border-[#ccff00]/70 shadow-sm">
                                {idx + 1}
                            </div>
                  <GenieCard>
                                <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{email.subject}</h4>
                      <span className="text-xs border border-green-500/30 text-green-300 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={12}/> {email.delay}
                                    </span>
                                </div>
                    <div className="text-xs font-semibold text-green-400 uppercase tracking-[0.2em] mb-3">
                                    Goal: {email.intent}
                                </div>
                    <p className="text-sm text-green-200 whitespace-pre-wrap leading-relaxed line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">
                                    {email.body}
                                </p>
                  </GenieCard>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Upgrade Offer Column */}
        <div className="lg:col-span-1">
            <div className="sticky top-0">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2 mb-6">
                    <Gift size={18}/> Upgrade Offer
                </h3>
                {loading ? (
                    <div className="h-64 bg-green-500/10 rounded animate-pulse"></div>
                ) : upgrade ? (
                  <GenieCard>
                    <div className="text-xs font-bold text-green-400 uppercase tracking-[0.3em] mb-2">Irresistible Offer</div>
                    <h4 className="font-semibold mb-3">{upgrade.coreOffer}</h4>
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-sm text-green-400/60 line-through">{upgrade.valueAnchor}</span>
                      <span className="text-2xl font-extrabold text-green-200">{upgrade.price}</span>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs font-semibold text-green-400 uppercase tracking-[0.3em] mb-2">Bonuses</div>
                      <ul className="space-y-2 text-sm text-green-200">
                        {(upgrade.bonuses || []).map((bonus, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 text-[#ccff00]">✔</span>
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border border-green-500/30 rounded p-3 text-sm text-green-200 mb-4">
                      <div className="flex items-center gap-2 font-semibold text-green-300 mb-1">
                        <span>🛡️</span>
                        <span>Guarantee</span>
                      </div>
                      <p>{upgrade.guarantee}</p>
                    </div>
                    <GenieButton variant="primary" className="w-full justify-center">
                      Claim Offer
                    </GenieButton>
                  </GenieCard>
                ) : null}
            </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-green-500/20 shrink-0">
        <GenieButton onClick={onBack} variant="secondary">
          Back
        </GenieButton>
        <GenieButton
          onClick={() => emails.length > 0 && onNext(emails, upgrade)}
          disabled={loading || emails.length === 0}
          variant="primary"
        >
          Draft Social Post -&gt;
        </GenieButton>
      </div>
    </div>
  );
};

export default NurtureStep;