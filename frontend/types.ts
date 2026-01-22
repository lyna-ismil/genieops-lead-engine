export interface ICPProfile {
  role: string;
  industry: string;
  painPoints: string[];
  goals: string[];
  companySize: string;
}

export interface BrandIdentity {
  colors: {
    primary: string;
    secondary?: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  shape: {
    radiusSm: string;
    radiusMd: string;
  };
}

export interface VoiceProfile {
  sentenceLength: 'short' | 'long' | string;
  jargonLevel: 'tech' | 'simple' | string;
  bannedWords: string[];
}

export interface ProductContext {
  uniqueMechanism: string;
  competitorContrast: string;
  companyName?: string;
  productDescription?: string;
  mainBenefit?: string;
  websiteUrl?: string;
  toneGuidelines?: string[];
  primaryColor: string;
  fontStyle: 'serif' | 'sans' | 'mono';
  designVibe: 'minimal' | 'bold' | 'corporate';
  logoUrl: string;
  voiceProfile?: VoiceProfile;
}

export interface OfferStack {
  coreOffer: string;
  price: string;
  valueAnchor: string;
  guarantee: string;
  bonuses: string[];
}

export interface LeadMagnetIdea {
  id: string;
  title: string;
  type: 'checklist' | 'template' | 'calculator' | 'report' | 'other';
  painPointAlignment: string;
  valuePromise: string;
  conversionScore: number;
  formatRecommendation: string;
  strategySummary?: {
    objection: string;
    angle: string;
    hook: string;
    mechanism: string;
  };
}

export interface GeneratedAsset {
  content: string; // Markdown or pseudo-code
  type: string;
  contentJson?: any; // For calculator config etc
}

export interface SectionItem {
  title: string;
  description: string;
  icon?: string;
}

export interface Section {
  id: string;
  title: string;
  subtitle?: string;
  body?: string; // kept for backward compatibility
  items?: SectionItem[];
  variant: 'feature' | 'testimonial' | 'faq' | 'hero' | 'generic' | 'bento_grid' | 'split_feature' | 'feature_cards';
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}

export interface LandingPageConfig {
  headline: string;
  subheadline: string;
  bullets: string[]; // specific to hero benefits
  cta: string;
  htmlContent: string; // Full HTML string as fallback or container
  imageUrl?: string;
  backgroundStyle?: 'tech_grid' | 'clean_dots' | 'soft_aurora' | 'plain_white';
  theme?: 'light' | 'dark';
  slug?: string;
  
  // New Structured Fields
  sections: Section[];
  formSchema: FormField[];
  socialProof?: { logoUrl?: string; quote?: string; author?: string }[];
  faq?: { question: string; answer: string }[];
  rawImagePrompt?: string; 
  calculatorConfig?: any; // Config for CalculatorWidget
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
  updatedAt?: string;
  status: 'draft' | 'published';
  icp: ICPProfile;
  productContext?: ProductContext;
  offerType?: string;
  brandVoice?: string;
  targetConversion?: string;
  selectedIdea?: LeadMagnetIdea;
  asset?: GeneratedAsset;
  landingPage?: LandingPageConfig;
  emailSequence?: Email[];
  linkedInPost?: string;
  upgradeOffer?: OfferStack;
}

export interface PersonaSummary {
  summary: string;
  hooks: string[];
}


// LLM Response Schemas
export enum AgentType {
  IDEATION = 'ideation',
  ASSET = 'asset',
  LANDING_PAGE = 'landing_page',
  NURTURE = 'nurture',
  SOCIAL = 'social',
  UPGRADE = 'upgrade'
}