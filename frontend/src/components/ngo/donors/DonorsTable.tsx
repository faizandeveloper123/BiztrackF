import { Edit, Eye, Trash2 } from "lucide-react";
import { Card } from "@/src/components/ui/card";
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
import type { Donor } from "@/src/models/ngo";
import { donorTypeLabel } from "@/src/utils/ngo/donorUtils";

type DonorsTableProps = {
  donors: Donor[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
  showingStart: number;
  showingEnd: number;
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  onView: (donor: Donor) => void;
  onEdit: (donor: Donor) => void;
  onDelete: (donor: Donor) => void;
};

export function DonorsTable({
  donors,
  loading,
  formatCurrency,
  showingStart,
  showingEnd,
  total,
  page,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: DonorsTableProps) {
  return (
    <Card className="overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Donor ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Donor Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Donated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  Loading donors...
                </TableCell>
              </TableRow>
            ) : donors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-12 text-center text-muted-foreground"
                >
                  No donors found
                </TableCell>
              </TableRow>
            ) : (
              donors.map((d) => (
                <TableRow
                  key={d.id}
                  className="cursor-pointer hover:bg-emerald-50/50"
                  onClick={() => onView(d)}
                >
                  <TableCell className="font-medium text-emerald-600">
                    {d.donor_code}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{d.full_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{d.phone || "—"}</div>
                    {d.address && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {d.address}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="bg-purple-100 text-purple-700"
                    >
                      {donorTypeLabel(d.donor_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        d.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {d.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(d.total_donated)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className="flex justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(d)}
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onView(d)}
                        aria-label="View"
                      >
                        <Eye className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(d)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between border-t px-6 py-4 text-sm text-muted-foreground">
        <span>
          Showing {showingStart} to {showingEnd} of {total} donors
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={showingEnd >= total}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
