import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Edit, Trash2, Eye } from "lucide-react";
import CRMService from "@/src/services/CRMService";
import { Lead } from "@/src/models/crm";

type LeadsListCardProps = {
  leads: Lead[];
  totalCount: number;
  page: number;
  totalPages: number;
  listLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
};

function leadSourceLabel(lead: Lead): string {
  const raw = lead.leadSource ?? lead.source ?? "";
  if (!raw) return "—";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function displayEmail(email?: string | null): string {
  if (!email) return "—";
  if (email.endsWith("@noemail.crm")) return "—";
  return email;
}

export function LeadsListCard({
  leads,
  totalCount,
  page,
  totalPages,
  listLoading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: LeadsListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads ({totalCount})</CardTitle>
        <CardDescription>
          Manage your sales leads and track their progress
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 pt-0 space-y-4">
        <div
          className={`rounded-md border relative ${listLoading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {listLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Job title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!listLoading && leads.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center text-muted-foreground py-8"
                  >
                    No leads found
                  </TableCell>
                </TableRow>
              )}
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {lead.firstName} {lead.lastName}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {displayEmail(lead.email) || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {lead.phone?.trim() || "—"}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {lead.company?.trim() || "—"}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate text-muted-foreground">
                    {lead.jobTitle?.trim() || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={CRMService.getLeadStatusColor(
                        lead.status ?? "new",
                      )}
                    >
                      {(lead.status ?? "new").charAt(0).toUpperCase() +
                        (lead.status ?? "new").slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {leadSourceLabel(lead)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.score > 0 ? lead.score : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                    {CRMService.formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onView(lead)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(lead)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onDelete(lead.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1 || listLoading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || listLoading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
