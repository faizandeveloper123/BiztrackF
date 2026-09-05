import { cn } from "@/src/lib/utils";

export function SectionSkeleton({
  className,
  rows = 3,
}: {
  className?: string;
  rows?: number;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl border border-slate-200/80 bg-slate-50/80 p-8",
        className,
      )}
      aria-hidden
    >
      <div className="mx-auto mb-6 h-4 w-32 rounded-full bg-slate-200" />
      <div className="mx-auto mb-4 h-8 max-w-md rounded-lg bg-slate-200" />
      <div className="mx-auto mb-8 h-4 max-w-sm rounded bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}
