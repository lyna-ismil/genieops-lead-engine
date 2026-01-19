import { ICPProfile, LeadMagnetIdea, Email, GeneratedAsset, LandingPageConfig } from "../types";

const API_BASE = import.meta.env.VITE_API_URL || '';

const request = async <T>(path: string, body: any): Promise<T> => {
    const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const json = await response.json();
    if (!response.ok || !json?.success) {
        const message = json?.error?.message || 'Request failed';
        throw new Error(message);
    }
    return json.data as T;
};

// --- Ideation Agent ---
export const generateLeadMagnetIdeas = async (icp: ICPProfile): Promise<LeadMagnetIdea[]> => {
    return request<LeadMagnetIdea[]>("/api/llm/ideate", { icp });
};

// --- Asset Creation Agent ---
export const generateAssetContent = async (idea: LeadMagnetIdea, icp: ICPProfile): Promise<GeneratedAsset> => {
    return request<GeneratedAsset>("/api/llm/asset", { idea, icp });
};

// --- Image Generation Agent ---
export const generateHeroImage = async (idea: LeadMagnetIdea, icp: ICPProfile): Promise<string> => {
    const data = await request<{ url: string }>("/api/llm/hero-image", { idea, icp });
    return data?.url || "";
};

// --- Landing Page Copy Agent ---
export const generateLandingPage = async (idea: LeadMagnetIdea, asset: GeneratedAsset, imageUrl?: string): Promise<LandingPageConfig> => {
    return request<LandingPageConfig>("/api/llm/landing-page", { idea, asset, image_url: imageUrl });
};

// --- Nurture Sequence Agent ---
export const generateNurtureSequence = async (idea: LeadMagnetIdea): Promise<Email[]> => {
    return request<Email[]>("/api/llm/nurture-sequence", { idea });
};

// --- Upgrade Offer Agent ---
export const generateUpgradeOffer = async (idea: LeadMagnetIdea, emails: Email[]) => {
    return request<{ positioning: string; offerCopy: string; cta: string }>("/api/llm/upgrade-offer", { idea, emails });
}


// --- LinkedIn Post Agent ---
export const generateLinkedInPost = async (idea: LeadMagnetIdea, landingPage: LandingPageConfig): Promise<string> => {
    const data = await request<{ text: string }>("/api/llm/linkedin-post", { idea, landing_page: landingPage });
    return data?.text || "";
};
