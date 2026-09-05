import { Search, X } from "lucide-react";

interface SidebarSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function SidebarSearch({
  value,
  onChange,
  onClear,
}: SidebarSearchProps) {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Search modules and pages..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 text-xs text-gray-500">
          Searching modules and pages...
        </div>
      )}
    </div>
  );
}
