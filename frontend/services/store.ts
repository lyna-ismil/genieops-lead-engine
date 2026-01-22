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
    product_context: project.productContext ? {
        unique_mechanism: project.productContext.uniqueMechanism,
        competitor_contrast: project.productContext.competitorContrast,
        company_name: project.productContext.companyName,
        product_description: project.productContext.productDescription,
        main_benefit: project.productContext.mainBenefit,
        website_url: project.productContext.websiteUrl,
        tone_guidelines: project.productContext.toneGuidelines || [],
        primary_color: project.productContext.primaryColor,
        font_style: project.productContext.fontStyle,
        design_vibe: project.productContext.designVibe,
        logo_url: project.productContext.logoUrl,
        voice_profile: project.productContext.voiceProfile ? {
            sentence_length: project.productContext.voiceProfile.sentenceLength,
            jargon_level: project.productContext.voiceProfile.jargonLevel,
            banned_words: project.productContext.voiceProfile.bannedWords
        } : undefined
    } : undefined,
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
        strategy_summary: project.selectedIdea.strategySummary,
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
        background_style: project.landingPage.backgroundStyle,
        theme: project.landingPage.theme,
        sections: Array.isArray(project.landingPage.sections) ? project.landingPage.sections : [],
        form_schema: Array.isArray(project.landingPage.formSchema) ? project.landingPage.formSchema : [],
        social_proof: Array.isArray(project.landingPage.socialProof) ? project.landingPage.socialProof : [],
        faq: Array.isArray(project.landingPage.faq) ? project.landingPage.faq : [],
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
        core_offer: project.upgradeOffer.coreOffer || "",
        price: project.upgradeOffer.price || "",
        value_anchor: project.upgradeOffer.valueAnchor || "",
        guarantee: project.upgradeOffer.guarantee || "",
        bonuses: project.upgradeOffer.bonuses || []
    } : undefined
});

const mapBackendToProject = (data: any): Project => {
    const rawProduct = data.product_context || data.productContext;
    const rawUpgrade = data.upgrade_offer || data.upgradeOffer;
    const normalizeDesignVibe = (value: string | undefined) => {
        if (!value) return 'minimal';
        const v = value.toLowerCase();
        if (v === 'tech') return 'corporate';
        if (v === 'corporate' || v === 'bold' || v === 'minimal') return v;
        return 'minimal';
    };

    return ({
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
        formatRecommendation: data.selected_idea.format_recommendation,
        strategySummary: data.selected_idea.strategy_summary
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
        backgroundStyle: data.landing_page.background_style || data.landing_page.backgroundStyle,
        theme: data.landing_page.theme,
        slug: data.landing_page.slug,
        sections: Array.isArray(data.landing_page.sections) ? data.landing_page.sections : [],
        formSchema: Array.isArray(data.landing_page.form_schema) ? data.landing_page.form_schema : [],
        socialProof: Array.isArray(data.landing_page.social_proof) ? data.landing_page.social_proof : [],
        faq: Array.isArray(data.landing_page.faq) ? data.landing_page.faq : [],
        rawImagePrompt: data.landing_page.raw_image_prompt
    } : undefined,
    emailSequence: (data.email_sequence?.emails && Array.isArray(data.email_sequence.emails)) ? data.email_sequence.emails.map((e: any) => ({
        id: e.id,
        subject: e.subject,
        body: e.body,
        delay: e.delay,
        intent: e.intent
    })) : undefined,
    linkedInPost: data.linked_in_post || undefined,
    productContext: rawProduct ? {
        uniqueMechanism: rawProduct.unique_mechanism || rawProduct.uniqueMechanism || '',
        competitorContrast: rawProduct.competitor_contrast || rawProduct.competitorContrast || '',
        companyName: rawProduct.company_name || rawProduct.companyName || '',
        productDescription: rawProduct.product_description || rawProduct.productDescription || '',
        mainBenefit: rawProduct.main_benefit || rawProduct.mainBenefit || '',
        websiteUrl: rawProduct.website_url || rawProduct.websiteUrl || '',
        toneGuidelines: rawProduct.tone_guidelines || rawProduct.toneGuidelines || [],
        primaryColor: rawProduct.primary_color || rawProduct.primaryColor || '',
        fontStyle: rawProduct.font_style || rawProduct.fontStyle || 'sans',
        designVibe: normalizeDesignVibe(rawProduct.design_vibe || rawProduct.designVibe),
        logoUrl: rawProduct.logo_url || rawProduct.logoUrl || '',
        voiceProfile: (rawProduct.voice_profile || rawProduct.voiceProfile) ? {
            sentenceLength: (rawProduct.voice_profile?.sentence_length || rawProduct.voiceProfile?.sentenceLength || ''),
            jargonLevel: (rawProduct.voice_profile?.jargon_level || rawProduct.voiceProfile?.jargonLevel || ''),
            bannedWords: (rawProduct.voice_profile?.banned_words || rawProduct.voiceProfile?.bannedWords || [])
        } : undefined
    } : undefined,
    upgradeOffer: rawUpgrade ? {
        coreOffer: rawUpgrade.core_offer || rawUpgrade.coreOffer || rawUpgrade.positioning || '',
        price: rawUpgrade.price || '',
        valueAnchor: rawUpgrade.value_anchor || rawUpgrade.valueAnchor || '',
        guarantee: rawUpgrade.guarantee || '',
        bonuses: rawUpgrade.bonuses || []
    } : undefined
});
};


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
