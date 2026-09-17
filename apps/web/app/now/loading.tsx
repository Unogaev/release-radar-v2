import { FeedSkeleton } from "@/components/radar/states";

export default function Loading() {
  return (
    <div className="min-h-screen bg-rr-bg pt-[104px]">
      <FeedSkeleton />
    </div>
  );
}
