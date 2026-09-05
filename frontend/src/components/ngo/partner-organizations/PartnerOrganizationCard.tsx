import { Calendar, Edit, Globe, MapPin, Tag, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import type { PartnerOrganization, PartnerSector } from "@/src/models/ngo";
import {
  formatPartnerDate,
  partnerSectorLabel,
  partnerStatusLabel,
  sectorAccentClass,
} from "@/src/utils/ngo/partnerOrganizationUtils";
import { PartnerSectorIcon } from "./PartnerSectorIcon";

type PartnerOrganizationCardProps = {
  organization: PartnerOrganization;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function PartnerOrganizationCard({
  organization,
  onView,
  onEdit,
  onDelete,
}: PartnerOrganizationCardProps) {
  const accent = sectorAccentClass(organization.sector as PartnerSector);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent.bg}`}
            >
              <PartnerSectorIcon
                sector={organization.sector}
                className={accent.icon}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {organization.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {organization.email}
              </p>
            </div>
          </div>
          <Badge
            className={
              organization.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }
          >
            {partnerStatusLabel(organization.status)}
          </Badge>
        </div>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            Created: {formatPartnerDate(organization.createdAt)}
          </div>
          {organization.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{organization.website}</span>
            </div>
          )}
          {organization.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{organization.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0" />
            Sector: {partnerSectorLabel(organization.sector)}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <Button
            variant="link"
            className="h-auto p-0 text-emerald-600 hover:text-emerald-700"
            onClick={onView}
          >
            View Details →
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              aria-label="Edit"
            >
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
