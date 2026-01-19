export interface ICPProfile {
  role: string;
  industry: string;
  painPoints: string[];
  goals: string[];
  companySize: string;
}

export interface LeadMagnetIdea {
  id: string;
  title: string;
  type: 'checklist' | 'template' | 'calculator' | 'report' | 'other';
  painPointAlignment: string;
  valuePromise: string;
  conversionScore: number;
  formatRecommendation: string;
}

export interface GeneratedAsset {
  content: string; // Markdown or pseudo-code
  type: string;
}

export interface LandingPageConfig {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
  htmlContent: string; // Full HTML string
  imageUrl?: string;
}

export interface Email {
  id: string;
  subject: string;
  body: string;
  delay: string; // e.g., "Immediate", "Day 1", "Day 3"
  intent: string;
}

export interface NurtureStep {
  id: string;
  sequenceId: string;
  order: number;
  subject: string;
  body: string;
  offsetDays: number;
  intent?: string;
  type?: 'regular' | 'upgrade';
}

export interface EmailLog {
  id: string;
  leadId: string;
  sequenceId?: string;
  stepId?: string;
  subject: string;
  body: string;
  status: string;
  providerMessageId?: string;
  errorMessage?: string;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  status: 'draft' | 'published';
  icp: ICPProfile;
  selectedIdea?: LeadMagnetIdea;
  asset?: GeneratedAsset;
  landingPage?: LandingPageConfig;
  emailSequence?: Email[];
  linkedInPost?: string;
  upgradeOffer?: {
    positioning: string;
    offerCopy: string;
    cta: string;
  };
}

// Gemini AI Response Schemas
export enum AgentType {
  IDEATION = 'ideation',
  ASSET = 'asset',
  LANDING_PAGE = 'landing_page',
  NURTURE = 'nurture',
  SOCIAL = 'social',
  UPGRADE = 'upgrade'
}