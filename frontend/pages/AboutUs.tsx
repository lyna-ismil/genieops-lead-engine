import React from 'react';
import Layout from '../components/Layout';
import { HeartHandshake, Sparkles, Target } from 'lucide-react';

const AboutUs: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">About Us</h1>
          <p className="text-lg text-gray-600">
            GenieOps helps teams turn product context into high-performing lead funnels with AI-driven speed and clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <Target size={20} className="text-blue-600" /> Mission
            </h3>
            <p className="text-sm text-gray-600">
              Give growth teams a reliable system to design, launch, and optimize lead generation faster than ever.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <Sparkles size={20} className="text-purple-600" /> What We Do
            </h3>
            <p className="text-sm text-gray-600">
              Combine research, strategy, and creative into a single workflow that outputs landing pages, emails, and social assets.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2 text-gray-800">
              <HeartHandshake size={20} className="text-emerald-600" /> Our Promise
            </h3>
            <p className="text-sm text-gray-600">
              Transparent, human-first automation that keeps your brand voice intact and your pipeline growing.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Why GenieOps</h2>
          <p className="text-sm text-gray-700">
            We built GenieOps to remove the guesswork from modern lead generation. The platform transforms your ICP insights
            into campaigns with measurable outcomes—so your team can focus on relationships and revenue.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AboutUs;
