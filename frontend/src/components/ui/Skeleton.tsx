// Skeleton placeholders shown while data is loading. Three pre-built variants
// (StatCard / TableRow / Card) mirror the most common layouts in this app so
// pages can swap in skeletons without rebuilding them inline.
interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

const roundedMap = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export function Skeleton({ className = "", rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-800/70 ${roundedMap[rounded]} ${className}`}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
      <Skeleton className="w-11 h-11" rounded="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-800/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className="h-3" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-32" />
        </div>
        <Skeleton className="h-5 w-20" rounded="full" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
