"use client";

import {
  CheckCircle,
  ClipboardCheck,
  Edit,
  Eye,
  MoreVertical,
  PlayCircle,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  formatMotVehicleLine,
  getMotStatusColor,
  getMotStatusLabel,
  getMotTestTypeLabel,
  type MotBooking,
  type MotBookingStatus,
} from "@/src/models/mot/MotBooking";
import { formatBookingDateTime } from "./motBookingUtils";
import { MotExpiryCountdown } from "./MotExpiryCountdown";
import type { MotBookingFiltersState } from "./types";

type MotBookingsListCardProps = {
  bookings: MotBooking[];
  totalCount: number;
  filters: MotBookingFiltersState;
  formatCurrency: (value: number) => string;
  onAddBooking: () => void;
  onView: (booking: MotBooking) => void;
  onEdit: (booking: MotBooking) => void;
  onDelete: (booking: MotBooking) => void;
  onStatusChange: (booking: MotBooking, status: MotBookingStatus) => void;
};

export function MotBookingsListCard({
  bookings,
  totalCount,
  filters,
  formatCurrency,
  onAddBooking,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}: MotBookingsListCardProps) {
  const hasActiveFilters =
    filters.searchTerm ||
    filters.status !== "all" ||
    filters.testType !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No MOT bookings found</h3>
          <p className="mt-2 text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters or search terms."
              : "Get started by creating your first MOT booking."}
          </p>
          {!hasActiveFilters && (
            <Button onClick={onAddBooking} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>MOT Bookings ({totalCount})</CardTitle>
        <CardDescription>
          Manage scheduled MOT checkup appointments
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 pt-0">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>MOT Expiry</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.customer_name}</div>
                    {booking.customer_phone && (
                      <div className="text-sm text-muted-foreground">
                        {booking.customer_phone}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatMotVehicleLine(booking)}</TableCell>
                  <TableCell>{formatBookingDateTime(booking)}</TableCell>
                  <TableCell>
                    {getMotTestTypeLabel(booking.test_type)}
                  </TableCell>
                  <TableCell>
                    <MotExpiryCountdown
                      expiryDate={
                        booking.expiry_status?.mot_expiry_date ||
                        booking.mot_expiry_date
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(Number(booking.price) || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getMotStatusColor(booking.status)}>
                      {getMotStatusLabel(booking.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(booking)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(booking)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onStatusChange(booking, "confirmed")}
                        >
                          Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(booking, "in_progress")}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Start test
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(booking, "passed")}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark passed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(booking, "failed")}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Mark failed
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange(booking, "cancelled")}
                        >
                          Cancel booking
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(booking)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
