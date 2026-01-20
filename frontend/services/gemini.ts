import { ICPProfile, LeadMagnetIdea, Email, GeneratedAsset, LandingPageConfig, PersonaSummary } from "../types";
import { request } from "./api";

// Helper to standard POST
const post = async <T>(path: string, body: any): Promise<T> => {
    return request<T>(path, {
        method: 'POST',
        body: JSON.stringify(body)
    });
}

export const generatePersonaSummary = async (icp: ICPProfile): Promise<PersonaSummary> => {
    return post<PersonaSummary>("/api/llm/persona-summary", { icp });
};

// --- Ideation Agent ---
export const generateLeadMagnetIdeas = async (
    icp: ICPProfile, 
    offerType?: string, 
    brandVoice?: string, 
    targetConversion?: string
): Promise<LeadMagnetIdea[]> => {
    return post<LeadMagnetIdea[]>("/api/llm/ideate", { 
        icp, 
        offer_type: offerType, 
        brand_voice: brandVoice, 
        target_conversion: targetConversion 
    });
};

// --- Asset Creation Agent ---
export const generateAssetContent = async (
    idea: LeadMagnetIdea, 
    icp: ICPProfile,
    offerType?: string, 
    brandVoice?: string
): Promise<GeneratedAsset> => {
    return post<GeneratedAsset>("/api/llm/asset", { 
        idea, 
        icp,
        offer_type: offerType, 
        brand_voice: brandVoice
    });
};

// --- Image Generation Agent ---
export const generateHeroImage = async (idea: LeadMagnetIdea, icp: ICPProfile): Promise<string> => {
    const data = await post<{ url: string }>("/api/llm/hero-image", { idea, icp });
    return data?.url || "";
};

// --- Landing Page Copy Agent ---
export const generateLandingPage = async (
    idea: LeadMagnetIdea, 
    asset: GeneratedAsset, 
    imageUrl?: string,
    offerType?: string, 
    brandVoice?: string, 
    targetConversion?: string
): Promise<LandingPageConfig> => {
    return post<LandingPageConfig>("/api/llm/landing-page", { 
        idea, 
        asset, 
        image_url: imageUrl,
        offer_type: offerType, 
        brand_voice: brandVoice, 
        target_conversion: targetConversion 
    });
};

// --- Nurture Sequence Agent ---
export const generateNurtureSequence = async (
    idea: LeadMagnetIdea,
    brandVoice?: string, 
    targetConversion?: string
): Promise<Email[]> => {
    return post<Email[]>("/api/llm/nurture-sequence", { 
        idea,
        brand_voice: brandVoice, 
        target_conversion: targetConversion
    });
};

// --- Upgrade Offer Agent ---
export const generateUpgradeOffer = async (idea: LeadMagnetIdea, emails: Email[]) => {
    return post<{ positioning: string; offerCopy: string; cta: string }>("/api/llm/upgrade-offer", { idea, emails });
}


// --- LinkedIn Post Agent ---
export const generateLinkedInPost = async (
    idea: LeadMagnetIdea, 
    landingPage: LandingPageConfig, 
    brandVoice?: string
): Promise<string> => {
    const data = await post<{ text: string }>("/api/llm/linkedin-post", { 
        idea, 
        landing_page: landingPage,
        brand_voice: brandVoice
    });
    return data?.text || "";
};

