import React from 'react';
import { Project } from '../../types';
import { Target, Lightbulb, FileText, Mail, CheckCircle, Circle } from 'lucide-react';

interface Props {
  project: Project;
  currentStep: number;
}

const CampaignSummaryPanel: React.FC<Props> = ({ project, currentStep }) => {
  const steps = [
    { label: 'Audience', icon: Target, done: !!project.icp.role, value: project.icp.role ? `${project.icp.role} in ${project.icp.industry}` : '' },
    { label: 'Idea', icon: Lightbulb, done: !!project.selectedIdea, value: project.selectedIdea?.title },
    { label: 'Asset', icon: FileText, done: !!project.asset, value: project.asset?.type },
    { label: 'Sequence', icon: Mail, done: (project.emailSequence?.length || 0) > 0, value: project.emailSequence ? `${project.emailSequence.length} Emails` : '' },
  ];

  return (
    <div className="w-80 genie-console sticky top-0 hidden lg:block">
      <div className="genie-section-number">LOG</div>
      <h3 className="text-lg font-semibold mb-6">Campaign Summary</h3>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="genie-console-item">
            <div className="flex items-center gap-2 text-green-300">
              {step.done ? <CheckCircle size={14} className="text-green-300" /> : <Circle size={14} className="text-green-400/40" />}
              <span className="text-xs uppercase tracking-[0.3em]">{step.label}</span>
            </div>
            {step.value && (
              <div className="mt-2 text-xs text-green-400/70 border border-green-500/20 p-2 rounded">
                {step.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentStep > 0 && (
        <div className="mt-8 pt-6 border-t border-green-500/20">
          <p className="text-[10px] uppercase tracking-[0.3em] text-green-400/70 mb-2">
            Completion Status
          </p>
          <div className="w-full h-1 bg-green-500/10">
            <div
              className="h-1 bg-[#ccff00] transition-all duration-500"
              style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}
            />
          </div>
          <p className="text-xs text-right text-green-400/70 mt-2">
            {steps.filter(s => s.done).length}/{steps.length} components ready
          </p>
        </div>
      )}
    </div>
  );
};

export default CampaignSummaryPanel;
