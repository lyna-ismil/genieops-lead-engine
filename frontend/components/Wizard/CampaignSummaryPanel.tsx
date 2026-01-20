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
    <div className="w-80 bg-white border-l border-gray-200 p-6 h-full min-h-screen sticky top-0 hidden lg:block">
      <h3 className="text-lg font-bold text-gray-800 mb-6">Campaign Summary</h3>
      
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className={`relative pl-8 pb-6 border-l-2 ${step.done ? 'border-blue-500' : 'border-gray-200'} last:pb-0`}>
            {/* Dot/Icon */}
            <div className={`absolute -left-[9px] top-0 bg-white`}>
                {step.done ? <CheckCircle size={16} className="text-blue-500 fill-blue-50" /> : <Circle size={16} className="text-gray-300" />}
            </div>
            
            <div className="flex flex-col">
                <span className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</span>
                {step.value && (
                    <span className="text-xs text-gray-600 mt-1 line-clamp-2 bg-gray-50 p-1.5 rounded border border-gray-100">{step.value}</span>
                )}
            </div>
          </div>
        ))}
      </div>

      {currentStep > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Completion Status</p>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className="bg-green-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}></div>
              </div>
              <p className="text-xs text-right text-gray-500">{steps.filter(s => s.done).length}/{steps.length} components ready</p>
          </div>
      )}
    </div>
  );
};

export default CampaignSummaryPanel;
