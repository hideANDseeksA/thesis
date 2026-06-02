import { Skeleton } from "@/components/ui/skeleton";

function SkeletonPulse({ className = "" }) {
  return (
    <Skeleton className={`animate-pulse rounded-md bg-muted ${className}`} />
  );
}

// Left Column: Profile Card Skeleton
function ProfileCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow p-6 flex flex-col items-center space-y-4">
      {/* Avatar */}
      <SkeletonPulse className="w-20 h-20 rounded-full" />
      {/* Name & role */}
      <div className="flex flex-col items-center gap-2 w-full">
        <SkeletonPulse className="h-5 w-44" />
        <SkeletonPulse className="h-4 w-24" />
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-lg mt-4 w-full">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col items-center py-3 gap-1">
            <SkeletonPulse className="h-5 w-10" />
            <SkeletonPulse className="h-3 w-14" />
          </div>
        ))}
      </div>
      {/* Contact info rows */}
      <div className="space-y-3 w-full mt-4">
        {[180, 140, 120, 130, 110].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonPulse className="w-4 h-4 rounded-sm flex-shrink-0" />
            <SkeletonPulse className={`h-4`} style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Left Column: Check-Up Steps Skeleton
function CheckUpSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow max-w-xl w-full">
      <div className="p-6 pb-2">
        <SkeletonPulse className="h-5 w-52 mb-2" />
        <SkeletonPulse className="h-3 w-72" />
      </div>
      <div className="p-6 pt-2">
        <div className="flex flex-col">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <div key={step} className="flex gap-4">
              <div className="flex flex-col items-center">
                <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />
                {step < 6 && <div className="w-px flex-1 bg-muted my-1 min-h-[20px]" />}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-2">
                  <SkeletonPulse className="h-5 w-20 rounded-full" />
                </div>
                <SkeletonPulse className="h-4 w-40 mb-2" />
                <SkeletonPulse className="h-3 w-full mb-1" />
                <SkeletonPulse className="h-3 w-5/6" />
              </div>
            </div>
          ))}
        </div>
        {/* Emergency notice */}
        <div className="mt-2 border border-muted rounded-md px-4 py-3 space-y-1">
          <SkeletonPulse className="h-3 w-32" />
          <SkeletonPulse className="h-3 w-full" />
        </div>
      </div>
    </div>
  );
}

// Right: Latest News Skeleton
function LatestNewsSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow">
      <div className="p-6 flex flex-row items-center justify-between pb-2">
        <SkeletonPulse className="h-5 w-32" />
        <SkeletonPulse className="h-4 w-16" />
      </div>
      <div className="p-6 pt-0">
        <div className="space-y-8 pl-6 border-l-2 border-muted">
          {[0, 1].map((i) => (
            <div key={i} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-9 top-0">
                <SkeletonPulse className="w-6 h-6 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <SkeletonPulse className="h-5 w-56" />
                  <SkeletonPulse className="h-5 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="w-3 h-3 rounded-sm" />
                  <SkeletonPulse className="h-3 w-36" />
                </div>
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-4/5" />
                <SkeletonPulse className="h-3 w-full" />
                <SkeletonPulse className="h-3 w-11/12" />
                <SkeletonPulse className="h-9 w-36 rounded-md mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Right: Transaction History Skeleton
function TransactionHistorySkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow flex flex-col h-[500px]">
      <div className="p-6 pb-2">
        <SkeletonPulse className="h-5 w-44" />
      </div>
      <div className="p-6 pt-0 flex-1 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {["Certificate", "Status", "Date", "Amount"].map((col) => (
                <th key={col} className="h-10 px-2 text-left">
                  <SkeletonPulse className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">
                  <SkeletonPulse className="h-4 w-40" />
                </td>
                <td className="p-2">
                  <SkeletonPulse className="h-6 w-20 rounded-md" />
                </td>
                <td className="p-2 text-center">
                  <SkeletonPulse className="h-4 w-20 mx-auto" />
                </td>
                <td className="p-2 text-right">
                  <SkeletonPulse className="h-4 w-10 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Right: Barangay Officials Skeleton
function OfficialsSkeleton() {
  return (
    <div className="rounded-xl border bg-card shadow flex flex-col h-[500px]">
      <div className="p-6 pb-2">
        <SkeletonPulse className="h-5 w-44" />
      </div>
      <div className="p-6 pt-0 mt-4 flex-1 overflow-hidden space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SkeletonPulse className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <SkeletonPulse className="h-4 w-32" />
                <SkeletonPulse className="h-3 w-24" />
              </div>
            </div>
            <SkeletonPulse className="h-8 w-20 rounded-md flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen p-4 sm:p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <SkeletonPulse className="h-8 w-36" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left column */}
          <div className="space-y-4 sm:space-y-6">
            <ProfileCardSkeleton />
            <CheckUpSkeleton />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <LatestNewsSkeleton />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <TransactionHistorySkeleton />
              <OfficialsSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}