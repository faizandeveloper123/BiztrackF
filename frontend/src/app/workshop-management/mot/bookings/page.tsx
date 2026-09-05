"use client";

import { DashboardLayout } from "@/src/components/layout";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { PermissionGuard } from "@/src/components/guards/PermissionGuard";
import { useMotBookingsPage } from "@/src/hooks/useMotBookingsPage";
import { MotBookingsLoadingState } from "@/src/components/mot-bookings/MotBookingsLoadingState";
import { MotBookingsPageHeader } from "@/src/components/mot-bookings/MotBookingsPageHeader";
import { MotSettingsCard } from "@/src/components/mot-bookings/MotSettingsCard";
import { MotBookingsStatsCard } from "@/src/components/mot-bookings/MotBookingsStatsCard";
import { MotBookingsFiltersCard } from "@/src/components/mot-bookings/MotBookingsFiltersCard";
import { MotBookingsListCard } from "@/src/components/mot-bookings/MotBookingsListCard";
import { MotBookingFormDialog } from "@/src/components/mot-bookings/MotBookingFormDialog";
import { MotBookingViewDialog } from "@/src/components/mot-bookings/MotBookingViewDialog";
import { MotBookingDeleteDialog } from "@/src/components/mot-bookings/MotBookingDeleteDialog";

function MotManageBookingsContent() {
  const { formatCurrency } = useCurrency();
  const page = useMotBookingsPage();

  if (page.loading) {
    return <MotBookingsLoadingState />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto space-y-6 p-6">
        <MotBookingsPageHeader onAddBooking={page.openNewBookingDialog} />

        <MotSettingsCard />

        <MotBookingsStatsCard stats={page.stats} />

        <MotBookingsFiltersCard
          filters={page.filters}
          onFiltersChange={(patch) =>
            page.setFilters((prev) => ({ ...prev, ...patch }))
          }
          onClear={page.clearFilters}
        />

        <MotBookingsListCard
          bookings={page.filteredBookings}
          totalCount={page.totalCount}
          filters={page.filters}
          formatCurrency={formatCurrency}
          onAddBooking={page.openNewBookingDialog}
          onView={page.setViewingBooking}
          onEdit={page.handleEdit}
          onDelete={page.handleDeleteClick}
          onStatusChange={page.handleStatusChange}
        />

        <MotBookingFormDialog
          open={page.isDialogOpen}
          editingBooking={page.editingBooking}
          formData={page.formData}
          saving={page.saving}
          onOpenChange={page.handleDialogClose}
          onFormChange={(patch) =>
            page.setFormData((prev) => ({ ...prev, ...patch }))
          }
          onTimeSlotChange={page.handleTimeSlotChange}
          onSubmit={page.handleSubmit}
        />

        <MotBookingViewDialog
          booking={page.viewingBooking}
          formatCurrency={formatCurrency}
          onClose={() => page.setViewingBooking(null)}
          onEdit={page.handleEdit}
        />

        <MotBookingDeleteDialog
          open={page.isDeleteDialogOpen}
          customerName={page.bookingToDelete?.customer_name}
          onOpenChange={(open) => !open && page.handleDeleteCancel()}
          onConfirm={page.handleDeleteConfirm}
          onCancel={page.handleDeleteCancel}
        />
      </div>
    </DashboardLayout>
  );
}

export default function MotManageBookingsPage() {
  return (
    <PermissionGuard permission="mot:bookings:view">
      <MotManageBookingsContent />
    </PermissionGuard>
  );
}
