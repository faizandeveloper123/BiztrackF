import {
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Eye,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { DonorLead } from "@/src/models/ngo";
import {
  donorLeadSourceLabel,
  donorLeadStatusBadgeClass,
  donorLeadStatusLabel,
  formatDonorLeadDate,
} from "@/src/utils/ngo/donorLeadUtils";

type DonorLeadCardProps = {
  lead: DonorLead;
  formatCurrency: (amount: number) => string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function DonorLeadCard({
  lead,
  formatCurrency,
  onView,
  onEdit,
  onDelete,
}: DonorLeadCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border-l-4 border-l-emerald-500 bg-white p-5 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">{lead.full_name}</h3>
          <p className="text-sm text-muted-foreground">
            {lead.email || "No email"}
          </p>
        </div>
        <Badge className={donorLeadStatusBadgeClass(lead.status)}>
          {donorLeadStatusLabel(lead.status)}
        </Badge>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        {lead.organization && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0" />
            {lead.organization}
          </div>
        )}
        {lead.expected_donation > 0 && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 shrink-0" />
            Expected: {formatCurrency(lead.expected_donation)}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 shrink-0" />
          Source: {donorLeadSourceLabel(lead.source)}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 shrink-0" />
          Created: {formatDonorLeadDate(lead.createdAt)}
        </div>
        {lead.assigned_to && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 shrink-0" />
            Assigned to: {lead.assigned_to}
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col-reverse gap-2 border-t pt-3 sm:flex-row sm:justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="w-full sm:w-auto text-emerald-600"
          onClick={onView}
        >
          <Eye className="mr-1 h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full sm:w-auto text-blue-600"
          onClick={onEdit}
        >
          <Edit className="mr-1 h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full sm:w-auto text-red-600"
          onClick={onDelete}
        >
          <Trash2 className="mr-1 h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
