"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent } from "../ui/card";
import { Calendar, Plus, Search, Grid, List, Link2 } from "lucide-react";
import EventCard from "./EventCard";
import EventForm from "./EventForm";
import { useApiService } from "../../hooks/useApiService";
import { toast } from "sonner";
import { useConfirm } from "@/src/contexts/ConfirmContext";

interface Event {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location?: string;
  isOnline: boolean;
  googleMeetLink?: string;
  participants: string[];
  status: string;
  projectId?: string;
}

export default function EventsList() {
  const confirm = useConfirm();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const apiService = useApiService();

  const checkAuthStatus = async () => {
    try {
      const response = await apiService.getGoogleAuthStatus();
      setIsAuthorized(response.authorized || false);
    } catch (error) {
      setIsAuthorized(false);
    }
  };

  useEffect(() => {
    loadEvents();
    checkAuthStatus();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "GOOGLE_AUTH_SUCCESS") {
        checkAuthStatus();
        setAuthLoading(false);
        toast.success("Google Calendar connected successfully!");
      } else if (event.data && event.data.type === "GOOGLE_AUTH_ERROR") {
        setAuthLoading(false);
        toast.error(event.data.error || "Authorization failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const handleAuthorize = async () => {
    try {
      setAuthLoading(true);
      const response = await apiService.getGoogleAuthUrl();

      const width = 500;
      const height = 600;
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;

      const popup = window.open(
        response.authorization_url,
        "google-oauth",
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
      );

      if (!popup) {
        toast.error(
          "Please allow popups for this site to complete authorization",
        );
        setAuthLoading(false);
        return;
      }

      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setAuthLoading(false);
          checkAuthStatus();
        }
      }, 500);

      setTimeout(() => {
        if (!popup.closed) {
          clearInterval(checkPopup);
        }
      }, 300000);
    } catch (error: any) {
      toast.error(
        error.response?.data?.detail || "Failed to get authorization URL",
      );
      setAuthLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEvents();
      setEvents(response.events || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const ok = await confirm({
      description: "Are you sure you want to delete this event?",
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await apiService.deleteEvent(id);
      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {}
  };

  const handleJoinEvent = async (id: string) => {
    try {
      const event = events.find((e) => e.id === id);
      if (event?.googleMeetLink) {
        window.open(event.googleMeetLink, "_blank");
      } else {
        const response = await apiService.joinEvent(id);
        if (response?.meet_link) {
          window.open(response.meet_link, "_blank");
        }
        toast.success("You have joined this event");
        loadEvents();
      }
    } catch (error) {
      toast.error("Failed to join event");
    }
  };

  const handleLeaveEvent = async (id: string) => {
    try {
      await apiService.leaveEvent(id);
      // Refresh events to update status
      loadEvents();
    } catch (error) {}
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      setCreateLoading(true);
      await apiService.createEvent(eventData);
      setShowCreateForm(false);
      toast.success("Event created successfully!");
      loadEvents();
    } catch (error) {
      toast.error("Failed to create event. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.description &&
        event.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || event.status === statusFilter;
    const matchesType = typeFilter === "all" || event.eventType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusOptions = () => [
    { value: "all", label: "All Statuses" },
    { value: "scheduled", label: "Scheduled" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const getTypeOptions = () => [
    { value: "all", label: "All Types" },
    { value: "meeting", label: "Meeting" },
    { value: "workshop", label: "Workshop" },
    { value: "deadline", label: "Deadline" },
    { value: "other", label: "Other" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage and track your events</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isAuthorized && (
            <Button
              onClick={handleAuthorize}
              variant="outline"
              className="flex items-center gap-2"
              disabled={authLoading}
            >
              <Link2 className="h-4 w-4" />
              {authLoading ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          )}
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Count */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>
          {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}{" "}
          found
        </span>
      </div>

      {/* Events Grid/List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No events found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Get started by creating your first event"}
            </p>
            {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={(_event) => {}}
              onDelete={handleDeleteEvent}
              onJoin={handleJoinEvent}
              onLeave={handleLeaveEvent}
            />
          ))}
        </div>
      )}

      {/* Create Event Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create New Event</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
            <EventForm
              onSubmit={handleCreateEvent}
              onCancel={() => setShowCreateForm(false)}
              loading={createLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
