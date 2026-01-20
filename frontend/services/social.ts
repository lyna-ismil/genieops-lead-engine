import { request } from "./api";

export const getLinkedInAuthUrl = async (redirectUri: string): Promise<string> => {
    const data = await request<{ url: string }>(`/api/social/auth/linkedin?redirect_uri=${encodeURIComponent(redirectUri)}`);
    return data.url;
};

export const exchangeLinkedInCode = async (code: string, redirectUri: string) => {
    return request(`/api/social/auth/linkedin/callback?code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`);
};

export const getSocialStatus = async () => {
    return request<{ linkedin_connected: boolean, user?: string }>('/api/social/status');
};

export const publishToLinkedIn = async (text: string, landingPageUrl?: string) => {
    return request<{ success: boolean }>('/api/social/linkedin/share', {
        method: 'POST',
        body: JSON.stringify({ text, landing_page_url: landingPageUrl })
    });
};
