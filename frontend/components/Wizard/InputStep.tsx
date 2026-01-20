import React, { useState } from 'react';
import { ICPProfile } from '../../types';
import { Sparkles } from 'lucide-react';

interface Props {
  onNext: (icp: ICPProfile) => void;
  initialData?: ICPProfile;
}

const InputStep: React.FC<Props> = ({ onNext, initialData }) => {
  const [formData, setFormData] = useState<ICPProfile>(initialData || {
    role: '',
    industry: '',
    companySize: '',
    painPoints: [''],
    goals: ['']
  });

  const handleChange = (field: keyof ICPProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'painPoints' | 'goals', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: 'painPoints' | 'goals') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const isValid = formData.role && formData.industry && formData.painPoints[0];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1 rounded-md"><Sparkles size={18}/></span>
            Define Your Ideal Customer Profile (ICP)
        </h2>
        <p className="text-gray-500 mb-6 text-sm">Our AI agents need context to generate high-converting assets.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role / Job Title</label>
            <input
              type="text"
              value={formData.role}
              onChange={e => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. Marketing Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={formData.industry}
              onChange={e => handleChange('industry', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. SaaS, Real Estate"
            />
          </div>
        </div>
        
        <div className="mb-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Company Size (Optional)</label>
            <input
              type="text"
              value={formData.companySize}
              onChange={e => handleChange('companySize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="e.g. 10-50 employees"
            />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Top Pain Points</label>
          {formData.painPoints.map((point, idx) => (
            <input
              key={idx}
              type="text"
              value={point}
              onChange={e => handleArrayChange('painPoints', idx, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Pain point #${idx + 1}`}
            />
          ))}
          <button onClick={() => addArrayItem('painPoints')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            + Add another pain point
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Goals</label>
          {formData.goals.map((goal, idx) => (
            <input
              key={idx}
              type="text"
              value={goal}
              onChange={e => handleArrayChange('goals', idx, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`Goal #${idx + 1}`}
            />
          ))}
           <button onClick={() => addArrayItem('goals')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            + Add another goal
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => onNext(formData)}
            disabled={!isValid}
            className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
              isValid ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Generate Ideas &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputStep;