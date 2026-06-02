import { Skeleton } from "@/components/ui/skeleton";

function SkeletonPulse({ className = "", style }) {
  return (
    <Skeleton
      className={`animate-pulse rounded-md bg-muted ${className}`}
      style={style}
    />
  );
}

function CertificateCardSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border shadow overflow-hidden">
      <div className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
          {/* Icon box */}
          <SkeletonPulse className="flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-lg" />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <SkeletonPulse className="h-5 w-48" />
            {/* Price + badge */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <SkeletonPulse className="h-4 w-14" />
              <SkeletonPulse className="h-5 w-28 rounded-md" />
            </div>
            {/* Date */}
            <SkeletonPulse className="h-3 w-36" />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full sm:w-auto flex-shrink-0 mt-1 sm:mt-0">
            <SkeletonPulse className="h-8 w-28 rounded-md flex-1 sm:flex-initial" />
            <SkeletonPulse className="h-8 w-28 rounded-md flex-1 sm:flex-initial" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CertificatesSkeleton() {
  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 md:py-8 bg-background">
      <div className="w-full max-w-5xl mx-auto">
        <div className="p-4 sm:p-6 space-y-6">

          {/* Header section */}
          <div className="space-y-1.5">
            {/* Eyebrow label */}
            <div className="flex items-center gap-2">
              <SkeletonPulse className="w-3.5 h-3.5 rounded-sm" />
              <SkeletonPulse className="h-3 w-36" />
            </div>
            {/* Page title */}
            <SkeletonPulse className="h-9 w-52" />
            {/* Description */}
            <div className="space-y-1 max-w-2xl">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-4 w-4/5" />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-border" />

          {/* Count label */}
          <SkeletonPulse className="h-3 w-40" />

          {/* Certificate cards */}
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CertificateCardSkeleton key={i} />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}