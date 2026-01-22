import React from 'react';
import Layout from '../components/Layout';
import { Database, Server, Globe, Bot, ShieldCheck, Zap } from 'lucide-react';

const Architecture: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Architecture</h1>
          <p className="text-lg text-gray-600">
            A production-ready blueprint for scaling automated lead generation.
          </p>
        </div>

        {/* High Level Diagram Sim */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Zap className="text-yellow-500"/> Core Data Flow
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-center w-full">
                    <div className="font-bold text-blue-800">React Client</div>
                    <div className="text-blue-600">User Inputs & Review</div>
                </div>
                <div className="hidden md:block text-gray-400">→</div>
                <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center w-full">
                    <div className="font-bold text-green-800">FastAPI Backend</div>
                    <div className="text-green-600">Orchestration & Validation</div>
                </div>
                <div className="hidden md:block text-gray-400">↔</div>
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg text-center w-full">
                    <div className="font-bold text-purple-800">LLM Engine</div>
                    <div className="text-purple-600">OpenAI (GPT models)</div>
                </div>
                <div className="hidden md:block text-gray-400">→</div>
                 <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center w-full">
                    <div className="font-bold text-gray-800">PostgreSQL</div>
                    <div className="text-gray-600">Persistence</div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Server size={20} className="text-indigo-500"/> Backend (FastAPI)
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Async/Await endpoints for non-blocking LLM calls.</li>
                    <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Pydantic models for strict data validation before DB insertion.</li>
                    <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> Background tasks (Celery/RQ) for long-running asset generation.</li>
                    <li className="flex gap-2"><span className="text-indigo-500 font-bold">•</span> JWT Authentication for secure user access.</li>
                </ul>
            </div>

             <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Database size={20} className="text-blue-500"/> Database (PostgreSQL)
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> <strong>Users:</strong> Auth & Org Data</li>
                    <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> <strong>Projects:</strong> Relational link between ICP, Assets, and Pages.</li>
                    <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> <strong>Leads:</strong> Captured email data with funnel status.</li>
                    <li className="flex gap-2"><span className="text-blue-500 font-bold">•</span> JSONB columns for flexible storage of generated asset content.</li>
                </ul>
            </div>
             
             <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <Bot size={20} className="text-purple-500"/> AI Agent Strategy
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <strong>Chained Prompts:</strong> Output of Agent A (Ideation) feeds Agent B (Asset).</li>
                    <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <strong>Strict JSON Mode:</strong> Enforcing schema output from the LLM to prevent parsing errors.</li>
                    <li className="flex gap-2"><span className="text-purple-500 font-bold">•</span> <strong>Context Injection:</strong> Passing ICP data into every prompt to maintain relevance.</li>
                </ul>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-800">
                    <ShieldCheck size={20} className="text-green-500"/> Scalability & Safety
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> <strong>Rate Limiting:</strong> Redis-backed limiting on LLM endpoints.</li>
                    <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> <strong>Content Guardrails:</strong> Post-processing check for spammy keywords.</li>
                    <li className="flex gap-2"><span className="text-green-500 font-bold">•</span> <strong>CDN:</strong> Static assets (Tailwind, Images) served via Cloudflare/AWS.</li>
                </ul>
            </div>
        </div>
      </div>
    </Layout>
  );
};

export default Architecture;