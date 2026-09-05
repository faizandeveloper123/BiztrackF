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
import { Edit, Trash2, Eye, ExternalLink } from "lucide-react";
import CRMService from "@/src/services/CRMService";
import { Company, Contact } from "@/src/models/crm";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  contactAddressCountriesDisplay,
  contactTypeDisplayLabel,
  industryLabel,
} from "./contactUtils";

type ContactsListCardProps = {
  contacts: Contact[];
  companies: Company[];
  totalCount: number;
  page: number;
  totalPages: number;
  listLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (contact: Contact) => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
};

function primaryEmail(contact: Contact): string {
  const ev = (contact.emails || []).filter((e) => e.value.trim());
  if (ev.length > 0) return ev.map((e) => e.value).join(", ");
  return contact.email?.trim() || "";
}

function birthdayShort(contact: Contact): string {
  if (!contact.birthday) return "—";
  const d = String(contact.birthday).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [, month, day] = d.split("-");
    return `${month}/${day}`;
  }
  return CRMService.formatDate(contact.birthday);
}

export function ContactsListCard({
  contacts,
  companies,
  totalCount,
  page,
  totalPages,
  listLoading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: ContactsListCardProps) {
  const { formatCurrency } = useCurrency();
  const companyById = new Map(companies.map((c) => [c.id, c]));

  function money(value?: number): string {
    if (value == null || Number.isNaN(value)) return "—";
    return formatCurrency(value);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts ({totalCount})</CardTitle>
        <CardDescription>
          Manage your customer contacts and track interactions
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
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Birthday</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client Value</TableHead>
                <TableHead>Deal Closed</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Lifetime Value</TableHead>
                <TableHead className="text-right w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!listLoading && contacts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={14}
                    className="text-center text-muted-foreground py-8"
                  >
                    No contacts found
                  </TableCell>
                </TableRow>
              )}
              {contacts.map((contact) => {
                const co = contact.companyId
                  ? companyById.get(contact.companyId)
                  : undefined;
                const site = contact.website?.trim();
                return (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {primaryEmail(contact) || "—"}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {co?.name || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {co?.industry ? industryLabel(co.industry) : "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px]">
                      {site ? (
                        <a
                          href={
                            /^https?:\/\//i.test(site)
                              ? site
                              : `https://${site}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate">{site}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {contactTypeDisplayLabel(contact)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {birthdayShort(contact)}
                    </TableCell>
                    <TableCell className="max-w-[120px] truncate text-muted-foreground">
                      {contactAddressCountriesDisplay(contact) || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.isActive ? "default" : "secondary"}
                      >
                        {contact.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {money(contact.clientValue)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {money(contact.dealClosedValue)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {money(contact.remainingPayable)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium">
                      {money(contact.lifetimeValue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onView(contact)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEdit(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onDelete(contact)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-0 sm:px-0 pb-2">
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
