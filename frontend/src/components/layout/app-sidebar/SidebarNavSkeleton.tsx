export function SidebarNavSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl">
            <div className="w-8 h-8 bg-gray-200 rounded-lg" />
            <div className="h-4 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
