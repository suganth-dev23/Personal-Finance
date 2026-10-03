import React from 'react';

interface ViewSkeletonProps {
  view?: string;
}

const SHIMMER_BASE =
  'relative overflow-hidden bg-surface border border-line shadow-xs ' +
  'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer motion-reduce:before:hidden ' +
  'before:bg-gradient-to-r before:from-transparent before:via-sunken/40 dark:before:via-white/[0.04] before:to-transparent';

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({ view = 'dashboard' }) => {
  // Table / List layout variant
  if (view === 'transactions' || view === 'categories' || view === 'recurring') {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {/* Header Hero Banner */}
        <div className={`${SHIMMER_BASE} h-36 rounded-2xl p-6 sm:p-8 flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-sunken rounded-xl" />
              <div className="h-7 w-48 bg-sunken rounded-xl" />
            </div>
            <div className="h-10 w-32 bg-sunken rounded-xl" />
          </div>
          <div className="h-3 w-64 bg-sunken/70 rounded-md" />
        </div>

        {/* Filter / Chips Bar */}
        <div className="flex items-center gap-2 overflow-hidden py-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className={`${SHIMMER_BASE} h-9 rounded-xl ${i === 1 ? 'w-20' : 'w-24'} shrink-0`}
            />
          ))}
        </div>

        {/* Table Rows Skeleton */}
        <div className={`${SHIMMER_BASE} rounded-2xl p-6 space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <div className="h-4 w-28 bg-sunken rounded-md" />
            <div className="h-4 w-20 bg-sunken rounded-md" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div
                key={i}
                className="h-14 w-full bg-sunken/50 rounded-2xl flex items-center justify-between px-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-line" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-line rounded-md" />
                    <div className="h-2.5 w-20 bg-line/60 rounded-md" />
                  </div>
                </div>
                <div className="h-4 w-20 bg-line rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Cards Grid layout variant (Budgets, Dreams, Investments, Badges, Emergency)
  if (
    view === 'budgets' ||
    view === 'dreams' ||
    view === 'investments' ||
    view === 'badges' ||
    view === 'emergency'
  ) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        {/* Hero Card Banner */}
        <div className={`${SHIMMER_BASE} h-40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between`}>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-36 bg-sunken rounded-xl" />
              <div className="h-8 w-52 bg-sunken rounded-xl" />
            </div>
            <div className="h-11 w-36 bg-sunken rounded-xl" />
          </div>
          <div className="h-2.5 w-full max-w-sm bg-sunken/70 rounded-full" />
        </div>

        {/* 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={`${SHIMMER_BASE} h-48 rounded-2xl p-5 flex flex-col justify-between`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sunken" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-sunken rounded-md" />
                    <div className="h-3 w-20 bg-sunken/70 rounded-md" />
                  </div>
                </div>
                <div className="w-6 h-6 rounded-xl bg-sunken" />
              </div>
              <div className="space-y-2 pt-4">
                <div className="h-2 w-full bg-sunken rounded-full" />
                <div className="flex justify-between items-center">
                  <div className="h-3 w-16 bg-sunken/70 rounded-md" />
                  <div className="h-3 w-12 bg-sunken/70 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Form / Settings layout variant
  if (view === 'settings' || view === 'import') {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" aria-busy="true" aria-live="polite">
        <div className={`${SHIMMER_BASE} h-40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between`}>
          <div className="space-y-2">
            <div className="h-4 w-40 bg-sunken rounded-xl" />
            <div className="h-8 w-60 bg-sunken rounded-xl" />
          </div>
          <div className="h-3 w-72 bg-sunken/70 rounded-md" />
        </div>
        <div className={`${SHIMMER_BASE} rounded-2xl p-6 space-y-4`}>
          <div className="h-5 w-48 bg-sunken rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-24 bg-sunken/40 rounded-2xl p-4" />
            <div className="h-24 bg-sunken/40 rounded-2xl p-4" />
          </div>
        </div>
        <div className={`${SHIMMER_BASE} rounded-2xl p-6 space-y-4`}>
          <div className="h-5 w-40 bg-sunken rounded-md" />
          <div className="h-32 bg-sunken/40 rounded-2xl p-4" />
        </div>
      </div>
    );
  }

  // Default / Dashboard layout variant
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* Top Banner / Stat Grid Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`${SHIMMER_BASE} h-32 rounded-2xl p-6 flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-sunken rounded-md" />
              <div className="w-8 h-8 bg-sunken rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-6 w-36 bg-sunken rounded-md" />
              <div className="h-2.5 w-20 bg-sunken/80 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content / Chart Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${SHIMMER_BASE} lg:col-span-7 h-80 rounded-2xl p-6 space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="h-4 w-48 bg-sunken rounded-md" />
            <div className="h-6 w-24 bg-sunken rounded-full" />
          </div>
          <div className="h-56 w-full bg-sunken/40 rounded-2xl flex items-end gap-3 p-4">
            <div className="w-1/6 h-3/5 bg-line/60 rounded-t-lg" />
            <div className="w-1/6 h-4/5 bg-line/60 rounded-t-lg" />
            <div className="w-1/6 h-2/5 bg-line/60 rounded-t-lg" />
            <div className="w-1/6 h-full bg-line/60 rounded-t-lg" />
            <div className="w-1/6 h-3/4 bg-line/60 rounded-t-lg" />
            <div className="w-1/6 h-2/3 bg-line/60 rounded-t-lg" />
          </div>
        </div>

        <div className={`${SHIMMER_BASE} lg:col-span-5 h-80 rounded-2xl p-6 space-y-4`}>
          <div className="h-4 w-36 bg-sunken rounded-md" />
          <div className="h-56 w-full bg-sunken/40 rounded-2xl flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-line border-t-reward-fill animate-spin motion-reduce:animate-none" />
          </div>
        </div>
      </div>

      {/* Bottom Table / Cards Placeholder */}
      <div className={`${SHIMMER_BASE} h-64 rounded-2xl p-6 space-y-4`}>
        <div className="h-4 w-40 bg-sunken rounded-md" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 w-full bg-sunken/50 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
