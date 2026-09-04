import React from 'react';

export const ViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Top Banner / Stat Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="relative overflow-hidden h-32 rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 flex flex-col justify-between shadow-xs before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-slate-200/40 dark:before:via-white/[0.04] before:to-transparent"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-100 dark:bg-[#171E2A] rounded-md" />
              <div className="w-8 h-8 bg-slate-100 dark:bg-[#171E2A] rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-36 bg-slate-100 dark:bg-[#171E2A] rounded-md" />
              <div className="h-2.5 w-20 bg-slate-100/80 dark:bg-[#171E2A]/80 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content / Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="relative overflow-hidden lg:col-span-7 h-80 rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-xs before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-slate-200/40 dark:before:via-white/[0.04] before:to-transparent">
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-slate-100 dark:bg-[#171E2A] rounded-md" />
            <div className="h-6 w-24 bg-slate-100 dark:bg-[#171E2A] rounded-full" />
          </div>
          <div className="h-56 w-full bg-slate-50 dark:bg-[#171E2A]/50 rounded-2xl flex items-end gap-3 p-4">
            <div className="w-1/6 h-3/5 bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
            <div className="w-1/6 h-4/5 bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
            <div className="w-1/6 h-2/5 bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
            <div className="w-1/6 h-full bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
            <div className="w-1/6 h-3/4 bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
            <div className="w-1/6 h-2/3 bg-slate-200/60 dark:bg-[#202836]/60 rounded-t-lg" />
          </div>
        </div>

        <div className="relative overflow-hidden lg:col-span-5 h-80 rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-xs before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-slate-200/40 dark:before:via-white/[0.04] before:to-transparent">
          <div className="h-4 w-36 bg-slate-100 dark:bg-[#171E2A] rounded-md" />
          <div className="h-56 w-full bg-slate-50 dark:bg-[#171E2A]/50 rounded-2xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-slate-100 dark:border-[#171E2A] border-t-slate-200 dark:border-t-[#202836]" />
          </div>
        </div>
      </div>

      {/* Bottom Table / Cards Placeholder */}
      <div className="relative overflow-hidden h-64 rounded-3xl bg-white dark:bg-[#131822] border border-slate-200/80 dark:border-[#202836] p-6 space-y-4 shadow-xs before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-slate-200/40 dark:before:via-white/[0.04] before:to-transparent">
        <div className="h-4 w-40 bg-slate-100 dark:bg-[#171E2A] rounded-md" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 w-full bg-slate-50 dark:bg-[#171E2A]/60 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
