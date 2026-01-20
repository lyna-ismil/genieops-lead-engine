import { Project } from "../types";
import { request } from "./api";

// --- Mappers ---

const validateType = (type: string): string => {
    const validTypes = ["checklist", "template", "calculator", "report", "other"];
    return validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : "other";
};

const mapProjectToPayload = (project: Project) => ({
    name: project.name || "Untitled Campaign",
    status: project.status || "draft",
    icp: {
        role: project.icp.role,
        industry: project.icp.industry,
        company_size: project.icp.companySize,
        pain_points: project.icp.painPoints,
        goals: project.icp.goals
    },
    offer_type: project.offerType,
    brand_voice: project.brandVoice,
    target_conversion: project.targetConversion,
    selected_idea: project.selectedIdea ? {
        title: project.selectedIdea.title || "",
        type: validateType(project.selectedIdea.type || "other"),
        pain_point_alignment: project.selectedIdea.painPointAlignment || "",
        value_promise: project.selectedIdea.valuePromise || "",
        conversion_score: project.selectedIdea.conversionScore || 0,
        format_recommendation: project.selectedIdea.formatRecommendation || "",
        campaign_id: "temp",
    } : undefined,
    asset: project.asset ? {
        type: project.asset.type || "text",
        content: project.asset.content || "",
        lead_magnet_id: "temp",
        content_json: {} 
    } : undefined,
    landing_page: project.landingPage ? {
        headline: project.landingPage.headline || "",
        subheadline: project.landingPage.subheadline || "",
        bullets: Array.isArray(project.landingPage.bullets) ? project.landingPage.bullets : [],
        cta: project.landingPage.cta || "",
        html_content: project.landingPage.htmlContent || "",
        image_url: project.landingPage.imageUrl, 
        sections: {},
        form_schema: {},
        lead_magnet_id: "temp",
        slug: project.landingPage.slug || `slug-${Date.now()}`,
    } : undefined,
    email_sequence: Array.isArray(project.emailSequence) && project.emailSequence.length > 0 ? {
        lead_magnet_id: project.selectedIdea?.id || "temp",
        emails: project.emailSequence.map(e => ({
            id: e.id || crypto.randomUUID(),
            subject: e.subject || "",
            body: e.body || "",
            delay: e.delay || "Day 0",
            intent: e.intent || ""
        }))
    } : undefined,
    linked_in_post: project.linkedInPost || undefined,
    upgrade_offer: project.upgradeOffer ? {
        positioning: project.upgradeOffer.positioning || "",
        offerCopy: project.upgradeOffer.offerCopy || "",
        cta: project.upgradeOffer.cta || ""
    } : undefined
});

const mapBackendToProject = (data: any): Project => ({
    id: data.id,
    name: data.name || "Untitled Project",
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    status: data.status || 'draft',
    icp: {
        role: data.icp?.role || '',
        industry: data.icp?.industry || '',
        companySize: data.icp?.companySize || data.icp?.company_size || '',
        painPoints: Array.isArray(data.icp?.painpoints) ? data.icp.painpoints : (Array.isArray(data.icp?.painPoints) ? data.icp.painPoints : []),
        goals: Array.isArray(data.icp?.goals) ? data.icp.goals : []
    },
    offerType: data.offer_type,
    brandVoice: data.brand_voice,
    targetConversion: data.target_conversion, // BE schema has target_conversion (float or str?). We unified to string in context params but checking BE schema.
    selectedIdea: data.selected_idea ? {
        id: data.selected_idea.id,
        title: data.selected_idea.title,
        type: data.selected_idea.type,
        painPointAlignment: data.selected_idea.pain_point_alignment,
        valuePromise: data.selected_idea.value_promise,
        conversionScore: data.selected_idea.conversion_score,
        formatRecommendation: data.selected_idea.format_recommendation
    } : undefined,
    asset: data.asset ? {
        content: data.asset.content,
        type: data.asset.type
    } : undefined,
    landingPage: data.landing_page ? {
        headline: data.landing_page.headline,
        subheadline: data.landing_page.subheadline,
        bullets: Array.isArray(data.landing_page.bullets) ? data.landing_page.bullets : [],
        cta: data.landing_page.cta,
        htmlContent: data.landing_page.html_content,
        imageUrl: data.landing_page.image_url,
        slug: data.landing_page.slug
    } : undefined,
    emailSequence: (data.email_sequence?.emails && Array.isArray(data.email_sequence.emails)) ? data.email_sequence.emails.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        delay: e.delay,
        intent: e.intent
    })) : undefined,
    linkedInPost: data.linked_in_post || undefined,
    upgradeOffer: data.upgrade_offer ? {
        positioning: data.upgrade_offer.positioning,
        offerCopy: data.upgrade_offer.offerCopy || data.upgrade_offer.offer_copy, 
        cta: data.upgrade_offer.cta
    } : undefined
});


// --- API Actions ---

export const getProjects = async (): Promise<Project[]> => {
  const result = await request<any[]>("/api/projects");
  return result.map(mapBackendToProject);
};

export const createProject = async (project: Project): Promise<Project> => {
    const payload = mapProjectToPayload(project);
    const result = await request<any>("/api/projects", {
        method: "POST",
        body: JSON.stringify(payload)
    });
    return mapBackendToProject(result);
};

export const updateProject = async (id: string, project: Project): Promise<Project> => {
    const payload = mapProjectToPayload(project);
    const result = await request<any>(`/api/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });
    return mapBackendToProject(result);
};

export const saveProject = async (project: Project): Promise<Project> => {
    try {
        if (project.id) {
            return await updateProject(project.id, project);
        } else {
             return await createProject(project);
        }
    } catch (e: any) {
        // If update fails with 404 (maybe ID was temp or deleted), try create
        if (e.status === 404) {
             return await createProject(project);
        }
        throw e;
    }
};

export const getProjectById = async (id: string): Promise<Project | undefined> => {
    if (id === 'new') return undefined; // Special case for new project creation flow
    
    try {
        const result = await request<any>(`/api/projects/${id}`);
        return mapBackendToProject(result);
    } catch (e) {
        console.warn(`Failed to fetch project ${id}`, e);
        return undefined;
    }
};

export const getLandingPageBySlug = async (slug: string): Promise<any> => {
  return await request<any>(`/public/landing/${slug}`);
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await request(`/api/projects/${id}`, { method: "DELETE" });
  } catch (e) {
    console.error(e);
  }
};
