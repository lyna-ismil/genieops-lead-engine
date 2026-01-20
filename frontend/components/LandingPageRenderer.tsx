import React from 'react';
import { LandingPageConfig, Section, FormField } from '../../types';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  config: LandingPageConfig;
  mode?: 'desktop' | 'mobile';
  onSubmit?: (data: any) => void;
}

const LandingPageRenderer: React.FC<Props> = ({ config, mode = 'desktop', onSubmit }) => {
  const containerClass = mode === 'mobile' ? 'max-w-[375px] mx-auto border-x border-gray-200 shadow-xl' : 'w-full';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
        const formData = new FormData(e.target as HTMLFormElement);
        onSubmit(Object.fromEntries(formData));
    }
  };

  return (
    <div className={`bg-white min-h-screen font-sans ${containerClass}`}>
      
      {/* Hero Section */}
      <header className="bg-gradient-to-br from-indigo-50 to-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
         <div className="max-w-7xl mx-auto">
            <div className={`grid gap-12 items-center ${mode === 'mobile' ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
               <div className="space-y-8 relative z-10">
                   <div>
                       <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-6">
                           {config.headline || "Your Main Headline Here"}
                       </h1>
                       <p className="text-xl text-gray-600 leading-relaxed">
                           {config.subheadline || "Subheadline that explains the value proposition clearly."}
                       </p>
                   </div>
                   
                   {config.bullets && config.bullets.length > 0 && (
                       <ul className="space-y-4">
                           {config.bullets.map((bullet, idx) => (
                               <li key={idx} className="flex items-start gap-3">
                                   <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
                                   <span className="text-gray-700 font-medium">{bullet}</span>
                               </li>
                           ))}
                       </ul>
                   )}
                   
                   {/* Desktop CTA / Form */}
                   <div className="pt-4">
                       {config.formSchema && config.formSchema.length > 0 ? (
                           <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-md">
                               <h3 className="text-lg font-bold text-gray-800 mb-4">Get Instant Access</h3>
                               <div className="space-y-4">
                                   {config.formSchema.map((field) => (
                                       <div key={field.name}>
                                           <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                                           {field.type === 'textarea' ? (
                                             <textarea 
                                                name={field.name} 
                                                required={field.required}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                                rows={3}
                                             />
                                           ) : (
                                             <input 
                                                type={field.type} 
                                                name={field.name}
                                                required={field.required}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                             />
                                           )}
                                       </div>
                                   ))}
                                   <button type="submit" className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md transform hover:scale-[1.02]">
                                       {config.cta || "Sign Up Now"}
                                   </button>
                                   <p className="text-xs text-center text-gray-400 mt-2">No credit card required. Unsubscribe anytime.</p>
                               </div>
                           </form>
                       ) : (
                           <button className="px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-full shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                               {config.cta || "Get Started"}
                           </button>
                       )}
                   </div>
               </div>
               
               {/* Hero Image */}
               <div className="relative">
                   {config.imageUrl ? (
                       <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition duration-500">
                           <img src={config.imageUrl} alt="Hero" className="w-full h-auto object-cover" />
                       </div>
                   ) : (
                       <div className="aspect-video bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                           No Image Generated
                       </div>
                   )}
                   {/* Decorative Blob */}
                   <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 animate-blob"></div>
                   <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -z-10 animate-blob animation-delay-2000"></div>
               </div>
            </div>
         </div>
      </header>

      {/* Social Proof Section */}
      {config.socialProof && config.socialProof.length > 0 && (
          <section className="bg-gray-50 py-12 border-y border-gray-100">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {config.socialProof.map((proof, idx) => (
                          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 italic text-gray-600 text-center">
                              "{proof.quote}"
                              <div className="mt-4 font-bold text-gray-900 not-italic">— {proof.author}</div>
                          </div>
                      ))}
                  </div>
              </div>
          </section>
      )}

      {/* Dynamic Sections */}
      {config.sections && config.sections.map((section) => (
          <section key={section.id} className={`py-20 px-4 sm:px-6 lg:px-8 ${section.variant === 'feature' ? 'bg-white' : 'bg-gray-50'}`}>
              <div className="max-w-4xl mx-auto">
                  {section.variant === 'faq' ? (
                     <div className="max-w-3xl mx-auto">
                         <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">{section.title}</h2>
                         <div className="space-y-4">
                             {(config.faq || []).map((item, idx) => (
                                 <details key={idx} className="group bg-white rounded-lg border border-gray-200 open:ring-1 open:ring-blue-500 transition">
                                     <summary className="flex cursor-pointer items-center justify-between p-6 list-none font-medium text-gray-900">
                                         {item.question}
                                         <span className="transition group-open:rotate-180">
                                             <ChevronDown />
                                         </span>
                                     </summary>
                                     <div className="px-6 pb-6 text-gray-600">
                                         {item.answer}
                                     </div>
                                 </details>
                             ))}
                             {(!config.faq || config.faq.length === 0) && (
                                 <div dangerouslySetInnerHTML={{ __html: section.body }} className="prose prose-blue max-w-none text-gray-600" />
                             )}
                         </div>
                     </div>
                  ) : (
                     <>
                        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{section.title}</h2>
                        <div dangerouslySetInnerHTML={{ __html: section.body }} className="prose prose-lg prose-blue mx-auto text-gray-600" />
                     </>
                  )}
              </div>
          </section>
      ))}

      {/* Content Fallback if no sections */}
      {(!config.sections || config.sections.length === 0) && config.htmlContent && (
          <div dangerouslySetInnerHTML={{ __html: config.htmlContent }} />
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 text-center">
          <div className="max-w-7xl mx-auto px-4">
              <p className="text-gray-400">&copy; {new Date().getFullYear()} All rights reserved.</p>
          </div>
      </footer>

    </div>
  );
};

export default LandingPageRenderer;
