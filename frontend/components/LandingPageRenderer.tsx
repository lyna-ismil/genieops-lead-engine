import React, { useState } from 'react';
import { LandingPageConfig, Section } from '../types';
import { Check, ArrowRight, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

// --- Design System Tokens ---
const TOKENS = {
  radius: {
    sm: 'rounded-[4px]',
    md: 'rounded-[8px]',
    lg: 'rounded-[12px]',
  },
  animation: 'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
  layout: {
    maxWidth: 'max-w-[1100px]', // Stricter width for readability
    sectionPadding: 'py-16 md:py-24',
  }
};

interface Props {
  config: LandingPageConfig;
  mode?: 'desktop' | 'mobile';
  onSubmit?: (data: any) => Promise<any>;
  primaryColor?: string;
  brand?: {
    primaryColor?: string;
    fontStyle?: 'serif' | 'sans' | 'mono';
    logoUrl?: string;
  };
}

// --- Atomic Components ---

const PrimaryButton = ({ 
  children, 
  onClick, 
  isLoading, 
  color 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  isLoading?: boolean; 
  color: string;
}) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`
      ${TOKENS.radius.md} ${TOKENS.animation}
      px-6 py-3 font-medium text-white shadow-sm
      hover:translate-y-[-2px] hover:shadow-md active:translate-y-0
      disabled:opacity-70 disabled:cursor-not-allowed
      flex items-center justify-center gap-2
    `}
    style={{ backgroundColor: color }}
  >
    {isLoading && <Loader2 size={18} className="animate-spin" />}
    {children}
  </button>
);

const SectionHeader = ({ title, subtitle, isDark }: { title: string; subtitle?: string; isDark: boolean }) => (
  <div className="mb-12 md:mb-16">
    <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {title}
    </h2>
    {subtitle && (
      <p className={`text-lg max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {subtitle}
      </p>
    )}
  </div>
);

// --- Section Variants ---

const SplitSection = ({ section, isDark }: { section: Section; isDark: boolean }) => (
  <div className={`${TOKENS.layout.maxWidth} mx-auto px-6`}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <h3 className={`text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {section.title}
        </h3>
        <p className={`mb-8 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {section.subtitle || section.body}
        </p>
        <ul className="space-y-4">
          {(section.items || []).map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <div className={`mt-1 flex-shrink-0 w-5 h-5 ${TOKENS.radius.sm} bg-slate-100 flex items-center justify-center`}>
                <Check size={12} className="text-slate-900" />
              </div>
              <div>
                <strong className={`block text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {item.title}
                </strong>
                <span className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
                  {item.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className={`aspect-square ${TOKENS.radius.lg} ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        {/* Placeholder for real product UI - No generic illustrations */}
        <div className="text-center p-8">
          <div className="w-12 h-12 bg-slate-300 rounded-full mx-auto mb-4" />
          <p className="text-sm text-slate-500 font-mono">Product UI Preview</p>
        </div>
      </div>
    </div>
  </div>
);

const GridSection = ({ section, isDark }: { section: Section; isDark: boolean }) => (
  <div className={`${TOKENS.layout.maxWidth} mx-auto px-6`}>
    <SectionHeader title={section.title} subtitle={section.subtitle} isDark={isDark} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {(section.items || []).map((item, i) => (
        <div 
          key={i} 
          className={`
            p-6 border ${TOKENS.radius.md} ${TOKENS.animation}
            ${isDark ? 'border-slate-800 bg-slate-900/50 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300'}
          `}
        >
          <h4 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {item.title}
          </h4>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {item.description}
          </p>
        </div>
      ))}
    </div>
  </div>
);

const FAQSection = ({ section, isDark }: { section: Section; isDark: boolean }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-6">
      <SectionHeader title={section.title} isDark={isDark} />
      <div className="space-y-4">
        {(section.items || []).map((item, i) => (
          <div 
            key={i} 
            className={`border-b ${isDark ? 'border-slate-800' : 'border-slate-200'} pb-4`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex justify-between items-center text-left py-2 focus:outline-none"
            >
              <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                {item.title}
              </span>
              {openIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
            >
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main Renderer ---

const LandingPageRenderer: React.FC<Props> = ({ config, mode = 'desktop', onSubmit, primaryColor, brand }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDark = config.theme === 'dark';
  const brandColor = brand?.primaryColor || primaryColor || '#2563eb';
  
  const bgClass = isDark ? 'bg-slate-950' : 'bg-white';
  const textPrimary = isDark ? 'text-white' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!onSubmit) {
      alert("PREVIEW MODE: Submission disabled. Please save and use the 'Open Live' link from the dashboard.");
      setIsSubmitting(false);
      return;
    }
    if (onSubmit) {
      const formData = new FormData(e.target as HTMLFormElement);
      try {
        const response: any = await onSubmit(Object.fromEntries(formData));

        if (response && (response.success || response.message === "Success")) {
          if (response.redirect_url) {
            if (window.location.hash) {
              window.location.hash = response.redirect_url;
            } else {
              window.location.href = response.redirect_url;
            }
          } else {
            alert("Success! Check your email.");
          }
        }
      } catch (err) {
        console.error("Submission failed", err);
        alert("Something went wrong. Please try again.");
      }
    }
    setIsSubmitting(false);
  };

  const containerClass = mode === 'mobile' ? 'max-w-[375px] mx-auto border-x border-gray-200 shadow-xl' : 'w-full';

  return (
    <div className={`min-h-screen ${bgClass} font-sans antialiased selection:bg-blue-500/20 ${containerClass}`}>
      
      {/* Navbar Stub - Structural only */}
      <nav className={`h-16 border-b ${isDark ? 'border-slate-900' : 'border-slate-100'} flex items-center px-6`}>
        {brand?.logoUrl ? (
            <img src={brand.logoUrl} alt="Logo" className="h-8 w-auto" />
        ) : (
            <div className={`w-6 h-6 ${TOKENS.radius.sm} bg-current opacity-20 ${textPrimary}`}></div>
        )}
      </nav>

      {/* Hero Section */}
      <header className={`${TOKENS.layout.sectionPadding} px-6 text-center`}>
        <div className={`${TOKENS.layout.maxWidth} mx-auto`}>
          {/* Label */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 mb-8 ${TOKENS.radius.sm} border ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-xs font-medium uppercase tracking-wide">Free Resource</span>
          </div>

          <h1 className={`text-4xl md:text-6xl font-semibold tracking-tight mb-6 leading-[1.1] ${textPrimary}`}>
            {config.headline}
          </h1>
          
          <p className={`text-lg md:text-xl ${textSecondary} max-w-2xl mx-auto mb-10 leading-relaxed`}>
            {config.subheadline}
          </p>

          {config.imageUrl && (
            <div className="mb-10">
              <img
                src={config.imageUrl}
                alt="Hero"
                className={`w-full max-w-4xl mx-auto ${TOKENS.radius.lg} border ${isDark ? 'border-slate-800' : 'border-slate-200'} shadow-sm`}
              />
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <PrimaryButton color={brandColor} onClick={() => document.getElementById('capture-form')?.scrollIntoView({ behavior: 'smooth' })}>
              {config.cta} <ArrowRight size={16} />
            </PrimaryButton>
            
            {/* Secondary Action - Muted */}
            <button className={`px-6 py-3 text-sm font-medium ${textSecondary} hover:text-slate-900 transition-colors`}>
              Learn more
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Sections */}
      <main className="space-y-24">
        {(config.sections || []).map((section, idx) => {
          switch (section.variant) {
            case 'split_feature':
              return <SplitSection key={section.id} section={section} isDark={isDark} />;
            case 'faq':
              return <FAQSection key={section.id} section={section} isDark={isDark} />;
            default:
              return <GridSection key={section.id} section={section} isDark={isDark} />;
          }
        })}
      </main>

      {/* Capture Section - Structural Focus */}
      <section id="capture-form" className={`${TOKENS.layout.sectionPadding} px-6`}>
        <div className={`max-w-md mx-auto p-8 border ${TOKENS.radius.lg} ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
          <h3 className={`text-xl font-semibold mb-2 ${textPrimary}`}>
            Get Access
          </h3>
          <p className={`text-sm mb-6 ${textSecondary}`}>
            Enter your details to get the asset.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {(config.formSchema || []).map((field) => (
              <div key={field.name}>
                <label className={`block text-xs font-medium uppercase tracking-wide mb-1.5 ${textSecondary}`}>
                  {field.label} {field.required && '*'}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  className={`
                    w-full px-3 py-2.5 text-sm ${TOKENS.radius.md} border outline-none ${TOKENS.animation}
                    ${isDark 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-500' 
                      : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500 shadow-sm'}
                  `}
                />
              </div>
            ))}
            <div className="pt-2">
              <PrimaryButton color={brandColor} isLoading={isSubmitting}>
                {config.cta || 'Submit'}
              </PrimaryButton>
            </div>
          </form>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className={`py-12 text-center border-t ${isDark ? 'border-slate-900 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
        <p className="text-xs font-medium">© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPageRenderer;