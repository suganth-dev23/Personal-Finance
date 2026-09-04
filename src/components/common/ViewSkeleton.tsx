import React from 'react';

export const ViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-live="polite">
      {/* Top Banner / Stat Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-32 rounded-3xl bg-slate-100 dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 flex flex-col justify-between shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-[#171E2A] rounded-md" />
              <div className="w-9 h-9 bg-slate-200 dark:bg-[#171E2A] rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-36 bg-slate-200 dark:bg-[#171E2A] rounded-md" />
              <div className="h-2.5 w-20 bg-slate-200/80 dark:bg-[#171E2A]/80 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content / Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 h-80 rounded-3xl bg-slate-100 dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-sm">
          <div className="h-4 w-48 bg-slate-200 dark:bg-[#171E2A] rounded-md" />
          <div className="h-56 w-full bg-slate-200/50 dark:bg-[#171E2A]/50 rounded-2xl" />
        </div>
        <div className="lg:col-span-5 h-80 rounded-3xl bg-slate-100 dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-sm">
          <div className="h-4 w-36 bg-slate-200 dark:bg-[#171E2A] rounded-md" />
          <div className="h-56 w-full bg-slate-200/50 dark:bg-[#171E2A]/50 rounded-2xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-4 border-slate-200 dark:border-[#202836] border-t-amber-500 animate-spin" />
          </div>
        </div>
      </div>

      {/* Bottom Table / Cards Placeholder */}
      <div className="h-64 rounded-3xl bg-slate-100 dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-sm">
        <div className="h-4 w-40 bg-slate-200 dark:bg-[#171E2A] rounded-md" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 w-full bg-slate-200/60 dark:bg-[#171E2A]/60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
