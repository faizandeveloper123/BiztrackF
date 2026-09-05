import { BizTrackLogo } from "../../brand/BizTrackLogo";

interface SidebarHeaderProps {
  planLabel?: string;
  collapsed?: boolean;
}

export function SidebarHeader({
  planLabel,
  collapsed = false,
}: SidebarHeaderProps) {
  return (
    <div
      className={
        collapsed
          ? "border-b border-gray-200 p-2"
          : "border-b border-gray-200 p-4"
      }
    >
      <div className="flex items-center justify-center">
        <BizTrackLogo size={collapsed ? "sm" : "md"} href="/dashboard" />
      </div>
      {planLabel && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 mb-1">Current Plan</div>
          <div className="text-sm font-semibold text-gray-700">{planLabel}</div>
        </div>
      )}
    </div>
  );
}
