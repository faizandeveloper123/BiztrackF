"use client";

import {
  Building2,
  Edit,
  Globe,
  Mail,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
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
import { formatDate } from "@/src/lib/utils";
import type { SuppliersListCardProps } from "./types";

export function SuppliersListCard({
  suppliers,
  searchTerm,
  onAddSupplier,
  onEdit,
  onDelete,
}: SuppliersListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier List</CardTitle>
      </CardHeader>
      <CardContent>
        {suppliers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        {supplier.website && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="h-3 w-3" />
                            {supplier.website}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{supplier.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {supplier.contactPerson && (
                        <div className="text-sm font-medium">
                          {supplier.contactPerson}
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {supplier.phone}
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {supplier.city && supplier.state && (
                        <div>
                          {supplier.city}, {supplier.state}
                        </div>
                      )}
                      {supplier.country && (
                        <div className="text-muted-foreground">
                          {supplier.country}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={supplier.isActive ? "default" : "secondary"}
                    >
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(supplier.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {onEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(supplier)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-12 text-center">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No suppliers found</h3>
            <p className="mb-4 text-muted-foreground">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Get started by adding your first supplier"}
            </p>
            {!searchTerm && onAddSupplier && (
              <Button onClick={onAddSupplier}>
                <Plus className="mr-2 h-4 w-4" />
                Add Supplier
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
