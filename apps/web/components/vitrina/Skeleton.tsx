"use client";
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[16px] bg-[#e5e7eb] ${className}`} />;
}
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white">
      <Skeleton className="aspect-[4/5] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
