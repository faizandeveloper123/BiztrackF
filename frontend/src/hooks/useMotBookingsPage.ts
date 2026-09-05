"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import motBookingService from "@/src/services/MotBookingService";
import type {
  MotBooking,
  MotBookingStats,
  MotBookingStatus,
} from "@/src/models/mot/MotBooking";
import type {
  MotBookingFiltersState,
  MotBookingFormData,
} from "@/src/components/mot-bookings/types";
import {
  applyTimeSlot,
  bookingToFormData,
  defaultFilters,
  emptyMotBookingFormData,
  filterBookings,
  formDataToPayload,
} from "@/src/components/mot-bookings/motBookingUtils";

export function useMotBookingsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [bookings, setBookings] = useState<MotBooking[]>([]);
  const [stats, setStats] = useState<MotBookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] =
    useState<MotBookingFiltersState>(defaultFilters());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<MotBooking | null>(null);
  const [bookingToDelete, setBookingToDelete] = useState<MotBooking | null>(
    null,
  );
  const [viewingBooking, setViewingBooking] = useState<MotBooking | null>(null);
  const [formData, setFormData] = useState<MotBookingFormData>(
    emptyMotBookingFormData(),
  );

  const fetchBookings = useCallback(async () => {
    try {
      const response = await motBookingService.getBookings({ limit: 500 });
      setBookings(response.bookings || []);
    } catch {
      setBookings([]);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const data = await motBookingService.getStats();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchStats()]);
      setLoading(false);
    };
    load();
  }, [fetchBookings, fetchStats]);

  const filteredBookings = useMemo(
    () => filterBookings(bookings, filters),
    [bookings, filters],
  );

  const openNewBookingDialog = useCallback(() => {
    setEditingBooking(null);
    setFormData(emptyMotBookingFormData());
    setIsDialogOpen(true);
  }, []);

  useEffect(() => {
    if (searchParams.get("openAdd") !== "true") return;
    openNewBookingDialog();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openAdd");
    const nextQuery = params.toString();
    router.replace(
      nextQuery
        ? `/workshop-management/mot/bookings?${nextQuery}`
        : "/workshop-management/mot/bookings",
    );
  }, [searchParams, router, openNewBookingDialog]);

  const handleDialogClose = useCallback((open: boolean) => {
    if (!open) {
      setEditingBooking(null);
      setFormData(emptyMotBookingFormData());
    }
    setIsDialogOpen(open);
  }, []);

  const handleTimeSlotChange = useCallback((slotKey: string) => {
    setFormData((prev) => applyTimeSlot(prev, slotKey));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formData.customerName.trim()) return;
      setSaving(true);
      const payload = formDataToPayload(formData);
      try {
        if (editingBooking?.id) {
          await motBookingService.adminUpdateBooking(
            editingBooking.id,
            payload,
          );
        } else {
          await motBookingService.adminCreateBooking(payload);
        }
        setIsDialogOpen(false);
        setEditingBooking(null);
        setFormData(emptyMotBookingFormData());
        await Promise.all([fetchBookings(), fetchStats()]);
      } catch {
      } finally {
        setSaving(false);
      }
    },
    [editingBooking, formData, fetchBookings, fetchStats],
  );

  const handleEdit = useCallback((booking: MotBooking) => {
    setViewingBooking(null);
    setEditingBooking(booking);
    setFormData(bookingToFormData(booking));
    setIsDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((booking: MotBooking) => {
    setBookingToDelete(booking);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setBookingToDelete(null);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!bookingToDelete) return;
    try {
      await motBookingService.deleteBooking(bookingToDelete.id);
      setIsDeleteDialogOpen(false);
      setBookingToDelete(null);
      await Promise.all([fetchBookings(), fetchStats()]);
    } catch {
      handleDeleteCancel();
    }
  }, [bookingToDelete, fetchBookings, fetchStats, handleDeleteCancel]);

  const handleStatusChange = useCallback(
    async (booking: MotBooking, status: MotBookingStatus) => {
      try {
        await motBookingService.adminUpdateBookingStatus(booking.id, {
          status,
        });
        await Promise.all([fetchBookings(), fetchStats()]);
      } catch {}
    },
    [fetchBookings, fetchStats],
  );

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters());
  }, []);

  return {
    loading,
    saving,
    bookings,
    filteredBookings,
    totalCount: filteredBookings.length,
    stats,
    filters,
    setFilters,
    isDialogOpen,
    isDeleteDialogOpen,
    editingBooking,
    bookingToDelete,
    viewingBooking,
    formData,
    setFormData,
    openNewBookingDialog,
    handleDialogClose,
    handleTimeSlotChange,
    handleSubmit,
    handleEdit,
    handleDeleteClick,
    handleDeleteCancel,
    handleDeleteConfirm,
    handleStatusChange,
    setViewingBooking,
    clearFilters,
  };
}
