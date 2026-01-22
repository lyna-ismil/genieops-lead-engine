import { post } from './api';
import { LeadMagnetIdea, GeneratedAsset, LandingPageConfig, ICPProfile, ProductContext } from '../types';

export const generateLeadMagnetIdeas = async (
    icp: ICPProfile,
    offerType?: string,
    brandVoice?: string,
    targetConversion?: string,
    productContext?: ProductContext
): Promise<LeadMagnetIdea[]> => {
    return post<LeadMagnetIdea[]>("/api/llm/ideate", { icp, product_context: productContext, offer_type: offerType, brand_voice: brandVoice, target_conversion: targetConversion });
};

export const generateAssetContent = async (
    idea: LeadMagnetIdea,
    icp: ICPProfile,
    offerType?: string,
    brandVoice?: string,
    productContext?: ProductContext
): Promise<GeneratedAsset> => {
    return post<GeneratedAsset>("/api/llm/asset", { idea, icp, offer_type: offerType, brand_voice: brandVoice, product_context: productContext });
};

export const generateLandingPage = async (
    idea: LeadMagnetIdea,
    asset: GeneratedAsset,
    icp: ICPProfile,
    imageUrl?: string,
    offerType?: string,
    brandVoice?: string,
    targetConversion?: string,
    productContext?: ProductContext
): Promise<LandingPageConfig> => {
    return post<LandingPageConfig>("/api/llm/landing-page", {
        idea,
        asset,
        icp,
        image_url: imageUrl,
        offer_type: offerType,
        brand_voice: brandVoice,
        target_conversion: targetConversion,
        product_context: productContext
    });
};

export const generateThankYouPage = async (idea: LeadMagnetIdea): Promise<any> => {
    return post<any>("/api/llm/thank-you", { idea });
};

export const generateNurtureSequence = async (
    idea: LeadMagnetIdea,
    brandVoice?: string,
    targetConversion?: string,
    productContext?: ProductContext,
    asset?: GeneratedAsset
): Promise<any> => {
    return post<any>("/api/llm/nurture-sequence", { idea, asset, brand_voice: brandVoice, target_conversion: targetConversion, product_context: productContext });
};

export const generateUpgradeOffer = async (
    idea: LeadMagnetIdea,
    emails: any[],
    offerType?: string,
    brandVoice?: string,
    productContext?: ProductContext,
    targetConversion?: string
): Promise<any> => {
    return post<any>("/api/llm/upgrade-offer", { idea, emails, offer_type: offerType, brand_voice: brandVoice, product_context: productContext, target_conversion: targetConversion });
};

export const generateLinkedInPost = async (
    idea: LeadMagnetIdea,
    landingPage: LandingPageConfig,
    brandVoice?: string,
    productContext?: ProductContext
): Promise<string> => {
    const res = await post<{text: string}>("/api/llm/linkedin-post", { idea, landing_page: landingPage, brand_voice: brandVoice, product_context: productContext });
     return res.text;
};

export const generateHeroImage = async (idea: LeadMagnetIdea, icp: ICPProfile, offerType?: string, brandVoice?: string): Promise<string> => {
     const res = await post<{url: string}>("/api/llm/hero-image", { idea, icp, offer_type: offerType, brand_voice: brandVoice });
     return res.url;
};

export const generatePersonaSummary = async (icp: ICPProfile): Promise<any> => {
    return post<any>("/api/llm/persona-summary", { icp });
};

export const analyzeWebsite = async (url: string): Promise<any> => {
    return post<any>("/api/generation/analyze-website", { url });
};
