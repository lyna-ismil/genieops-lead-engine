import React from 'react';
import Layout from '../components/Layout';
import { Database, Server, Globe, Bot, ShieldCheck, Zap } from 'lucide-react';
import GenieCard from '../components/ui/GenieCard';

const Architecture: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <div>
                    <div className="genie-section-number">01.</div>
                    <h1 className="text-3xl font-semibold mb-2">System Architecture</h1>
                    <p className="text-lg genie-muted">
            A production-ready blueprint for scaling automated lead generation.
          </p>
        </div>

        {/* High Level Diagram Sim */}
                <GenieCard>
                    <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-green-400">
                        <Zap size={18} /> Core Data Flow
                    </h2>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs uppercase tracking-[0.2em]">
                        <div className="p-4 border border-green-500/30 rounded text-center w-full text-green-300">
                            <div className="font-semibold">React Client</div>
                            <div className="text-green-400/70">User Inputs & Review</div>
                        </div>
                        <div className="hidden md:block text-green-400/60">→</div>
                        <div className="p-4 border border-green-500/30 rounded text-center w-full text-green-300">
                            <div className="font-semibold">FastAPI Backend</div>
                            <div className="text-green-400/70">Orchestration & Validation</div>
                        </div>
                        <div className="hidden md:block text-green-400/60">↔</div>
                        <div className="p-4 border border-green-500/30 rounded text-center w-full text-green-300">
                            <div className="font-semibold">LLM Engine</div>
                            <div className="text-green-400/70">OpenAI (GPT models)</div>
                        </div>
                        <div className="hidden md:block text-green-400/60">→</div>
                        <div className="p-4 border border-green-500/30 rounded text-center w-full text-green-300">
                            <div className="font-semibold">PostgreSQL</div>
                            <div className="text-green-400/70">Persistence</div>
                        </div>
                    </div>
                </GenieCard>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GenieCard>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
                            <Server size={18} /> Backend (FastAPI)
                        </h3>
                        <ul className="space-y-3 text-sm genie-muted">
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> Async/Await endpoints for non-blocking LLM calls.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> Pydantic models for strict data validation before DB insertion.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> Background tasks (Celery/RQ) for long-running asset generation.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> JWT Authentication for secure user access.</li>
                        </ul>
                    </GenieCard>

                    <GenieCard>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
                            <Database size={18} /> Database (PostgreSQL)
                        </h3>
                        <ul className="space-y-3 text-sm genie-muted">
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Users:</strong> Auth & Org Data</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Projects:</strong> Relational link between ICP, Assets, and Pages.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Leads:</strong> Captured email data with funnel status.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> JSONB columns for flexible storage of generated asset content.</li>
                        </ul>
                    </GenieCard>

                    <GenieCard>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
                            <Bot size={18} /> AI Agent Strategy
                        </h3>
                        <ul className="space-y-3 text-sm genie-muted">
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Chained Prompts:</strong> Output of Agent A (Ideation) feeds Agent B (Asset).</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Strict JSON Mode:</strong> Enforcing schema output from the LLM to prevent parsing errors.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Context Injection:</strong> Passing ICP data into every prompt to maintain relevance.</li>
                        </ul>
                    </GenieCard>

                    <GenieCard>
                        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-green-400">
                            <ShieldCheck size={18} /> Scalability & Safety
                        </h3>
                        <ul className="space-y-3 text-sm genie-muted">
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Rate Limiting:</strong> Redis-backed limiting on LLM endpoints.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>Content Guardrails:</strong> Post-processing check for spammy keywords.</li>
                            <li className="flex gap-2"><span className="text-green-400">&gt;</span> <strong>CDN:</strong> Static assets (Tailwind, Images) served via Cloudflare/AWS.</li>
                        </ul>
                    </GenieCard>
                </div>
      </div>
    </Layout>
  );
};

export default Architecture;