import { VerifiedCompanyBadge } from "@/src/components/common/VerifiedCompanyBadge";

interface SidebarFooterProps {
  collapsed?: boolean;
}

export function SidebarFooter({ collapsed = false }: SidebarFooterProps) {
  if (collapsed) {
    return (
      <div className="shrink-0 overflow-visible border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 px-2 py-3">
        <div className="flex items-center justify-center overflow-visible">
          <VerifiedCompanyBadge variant="icon" tooltipPosition="right" />
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 p-4">
      <div className="mb-3 flex justify-center overflow-hidden">
        <VerifiedCompanyBadge className="max-w-full" />
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-500 mb-1">Powered by</p>
        <p className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          BizTrack Technologies
        </p>
      </div>
    </div>
  );
}
