import { Search } from "lucide-react";

export function SidebarEmptySearch() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
      <p className="text-sm font-medium">No matches found</p>
      <p className="text-xs mt-1">
        Try searching for module names or page titles
      </p>
    </div>
  );
}
