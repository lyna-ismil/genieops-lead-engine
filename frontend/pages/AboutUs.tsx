import React from 'react';
import Layout from '../components/Layout';
import { HeartHandshake, Sparkles, Target } from 'lucide-react';
import GenieCard from '../components/ui/GenieCard';

const AboutUs: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <div className="genie-section-number">01.</div>
          <h1 className="text-3xl font-semibold mb-2">About Us</h1>
          <p className="text-lg genie-muted">
            GenieOps helps teams turn product context into high-performing lead funnels with AI-driven speed and clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GenieCard>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-400">
              <Target size={18} /> Mission
            </h3>
            <p className="text-sm genie-muted">
              Give growth teams a reliable system to design, launch, and optimize lead generation faster than ever.
            </p>
          </GenieCard>

          <GenieCard>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-400">
              <Sparkles size={18} /> What We Do
            </h3>
            <p className="text-sm genie-muted">
              Combine research, strategy, and creative into a single workflow that outputs landing pages, emails, and social assets.
            </p>
          </GenieCard>

          <GenieCard>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2 text-green-400">
              <HeartHandshake size={18} /> Our Promise
            </h3>
            <p className="text-sm genie-muted">
              Transparent, human-first automation that keeps your brand voice intact and your pipeline growing.
            </p>
          </GenieCard>
        </div>

        <GenieCard>
          <h2 className="text-xl font-semibold mb-2">Why GenieOps</h2>
          <p className="text-sm genie-muted">
            We built GenieOps to remove the guesswork from modern lead generation. The platform transforms your ICP insights
            into campaigns with measurable outcomes—so your team can focus on relationships and revenue.
          </p>
        </GenieCard>
      </div>
    </Layout>
  );
};

export default AboutUs;
