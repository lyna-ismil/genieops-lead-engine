import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="min-h-[70vh] w-full animate-pulse">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Hero Left */}
        <div className="flex-1 space-y-6">
          <div className="h-6 w-32 rounded-full bg-slate-200"></div>
          <div className="h-10 w-3/4 rounded-lg bg-slate-200"></div>
          <div className="h-6 w-2/3 rounded-lg bg-slate-200"></div>
          <div className="space-y-3">
            <div className="h-4 w-1/2 rounded bg-slate-200"></div>
            <div className="h-4 w-2/3 rounded bg-slate-200"></div>
            <div className="h-4 w-5/12 rounded bg-slate-200"></div>
          </div>
          <div className="h-12 w-40 rounded-xl bg-slate-200"></div>
        </div>

        {/* Image Right */}
        <div className="flex-1">
          <div className="aspect-[4/3] w-full rounded-2xl bg-slate-200"></div>
        </div>
      </div>

      {/* Form Section */}
      <div className="mt-10 w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 w-40 rounded bg-slate-200"></div>
            <div className="h-4 w-64 rounded bg-slate-200"></div>
          </div>
          <div className="flex-1 flex gap-2 w-full">
            <div className="h-10 flex-1 rounded-lg bg-slate-200"></div>
            <div className="h-10 flex-1 rounded-lg bg-slate-200"></div>
            <div className="h-10 w-28 rounded-lg bg-slate-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;
