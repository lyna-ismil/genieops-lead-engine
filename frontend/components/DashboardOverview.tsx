import React, { useMemo } from 'react';
import { BarChart3, FileCheck, Briefcase, Zap } from 'lucide-react';
import { Project } from '../types';

interface DashboardOverviewProps {
  projects: Project[];
  loading?: boolean;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ projects, loading = false }) => {
  const metrics = useMemo(() => {
    const total = projects.length;
    const published = projects.filter((p) => p.status === 'published').length;
    const drafts = projects.filter((p) => p.status === 'draft').length;

    const industries = projects
      .map((p) => p.icp?.industry)
      .filter((industry): industry is string => Boolean(industry && industry.trim().length > 0));

    let topIndustry = 'N/A';
    if (industries.length > 0) {
      const counts = industries.reduce<Record<string, number>>((acc, industry) => {
        acc[industry] = (acc[industry] || 0) + 1;
        return acc;
      }, {});
      topIndustry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    }

    const newestProject = [...projects]
      .filter((p) => p.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const velocityLabel = newestProject ? `Newest: ${newestProject.name}` : 'Newest: N/A';

    return {
      total,
      published,
      drafts,
      topIndustry,
      velocityLabel,
    };
  }, [projects]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 rounded mb-4" />
            <div className="h-7 w-32 bg-gray-200 rounded mb-2" />
            <div className="h-3 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Total Campaigns</p>
          <BarChart3 className="text-blue-600" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-2">{metrics.total}</p>
        <p className="text-xs text-gray-400 mt-1">All projects</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Pipeline Status</p>
          <FileCheck className="text-emerald-600" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {metrics.published} Published / {metrics.drafts} Drafts
        </p>
        <p className="text-xs text-gray-400 mt-1">Live vs. in-progress</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Top Target Industry</p>
          <Briefcase className="text-purple-600" size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-2 line-clamp-1">{metrics.topIndustry}</p>
        <p className="text-xs text-gray-400 mt-1">Most frequent ICP focus</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Campaign Velocity</p>
          <Zap className="text-amber-500" size={20} />
        </div>
        <p className="text-base font-semibold text-gray-900 mt-2">{metrics.velocityLabel}</p>
        <p className="text-xs text-gray-400 mt-1">Latest activity snapshot</p>
      </div>
    </div>
  );
};

export default DashboardOverview;
