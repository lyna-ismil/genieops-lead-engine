import React, { useMemo } from 'react';
import { BarChart3, FileCheck, Briefcase, Zap } from 'lucide-react';
import { Project } from '../types';
import GenieCard from './ui/GenieCard';

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
            className="genie-card animate-pulse"
          >
            <div className="h-4 w-24 bg-green-500/20 rounded mb-4" />
            <div className="h-7 w-32 bg-green-500/20 rounded mb-2" />
            <div className="h-3 w-24 bg-green-500/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <GenieCard>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-green-400">Total Campaigns</p>
          <BarChart3 className="text-green-400" size={20} />
        </div>
        <p className="text-3xl font-semibold mt-3">{metrics.total}</p>
        <p className="text-xs genie-muted mt-1">All projects</p>
      </GenieCard>

      <GenieCard>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-green-400">Pipeline Status</p>
          <FileCheck className="text-green-400" size={20} />
        </div>
        <p className="text-xl font-semibold mt-3">
          {metrics.published} Published / {metrics.drafts} Drafts
        </p>
        <p className="text-xs genie-muted mt-1">Live vs. in-progress</p>
      </GenieCard>

      <GenieCard>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-green-400">Top Target Industry</p>
          <Briefcase className="text-green-400" size={20} />
        </div>
        <p className="text-2xl font-semibold mt-3 line-clamp-1">{metrics.topIndustry}</p>
        <p className="text-xs genie-muted mt-1">Most frequent ICP focus</p>
      </GenieCard>

      <GenieCard>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-green-400">Campaign Velocity</p>
          <Zap className="text-green-400" size={20} />
        </div>
        <p className="text-base font-semibold mt-3">{metrics.velocityLabel}</p>
        <p className="text-xs genie-muted mt-1">Latest activity snapshot</p>
      </GenieCard>
    </div>
  );
};

export default DashboardOverview;
