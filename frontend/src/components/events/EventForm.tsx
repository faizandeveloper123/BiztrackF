"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useApiService } from "../../hooks/useApiService";
import { useCustomOptions } from "../../hooks/useCustomOptions";
import { CustomOptionDialog } from "../common/CustomOptionDialog";

interface EventFormProps {
  event?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface Project {
  id: string;
  name: string;
}

export default function EventForm({
  event,
  onSubmit,
  onCancel,
  loading = false,
}: EventFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCustomEventTypeDialog, setShowCustomEventTypeDialog] =
    useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "meeting",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    isOnline: true,
    participants: "",
    discussionPoints: "",
    reminderMinutes: 15,
    projectId: "",
    recurrenceType: "none",
  });

  const apiService = useApiService();
  const {
    customEventTypes,
    createCustomEventType,
    loading: customOptionsLoading,
  } = useCustomOptions();

  useEffect(() => {
    // Fetch projects for the dropdown
    const fetchProjects = async () => {
      try {
        const response = await apiService.getProjects();
        if (response && response.projects) {
          setProjects(response.projects);
        }
      } catch (error) {
        // Set empty array to prevent errors
        setProjects([]);
      }
    };

    fetchProjects();
  }, [apiService]);

  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      setFormData({
        title: event.title || "",
        description: event.description || "",
        eventType: event.eventType || "meeting",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location || "",
        isOnline: event.isOnline !== false,
        participants: event.participants?.join(", ") || "",
        discussionPoints: event.discussionPoints?.join(", ") || "",
        reminderMinutes: event.reminderMinutes || 15,
        projectId: event.projectId || "",
        recurrenceType: event.recurrenceType || "none",
      });
    }
  }, [event]);

  const handleCreateCustomEventType = async (
    name: string,
    description: string,
  ) => {
    try {
      await createCustomEventType(name, description);
    } catch (error) {}
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    const eventData = {
      title: formData.title,
      description: formData.description,
      eventType: formData.eventType,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      location: formData.location || undefined,
      isOnline: formData.isOnline,
      participants: formData.participants
        ? formData.participants.split(",").map((p) => p.trim())
        : [],
      discussionPoints: formData.discussionPoints
        ? formData.discussionPoints.split(",").map((p) => p.trim())
        : [],
      reminderMinutes: formData.reminderMinutes,
      projectId: formData.projectId || undefined,
      recurrenceType:
        formData.recurrenceType === "none"
          ? undefined
          : formData.recurrenceType,
    };

    onSubmit(eventData);
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Title */}
        <div className="md:col-span-2">
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter event title"
            required
          />
        </div>

        {/* Event Type */}
        <div>
          <Label htmlFor="eventType">Event Type *</Label>
          <Select
            value={formData.eventType}
            onValueChange={(value) => {
              if (value === "create_new") {
                setShowCustomEventTypeDialog(true);
              } else {
                handleInputChange("eventType", value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="other">Other</SelectItem>

              {/* Custom Event Types */}
              {customEventTypes &&
                customEventTypes.length > 0 &&
                customEventTypes.map((customType) => (
                  <SelectItem key={customType.id} value={customType.id}>
                    {customType.name}
                  </SelectItem>
                ))}

              <SelectItem
                value="create_new"
                className="font-semibold text-blue-600"
              >
                + Create New Event Type
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="md:col-span-3">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Enter event description"
            rows={2}
          />
        </div>

        {/* Project */}
        <div>
          <Label htmlFor="projectId">Project (Optional)</Label>
          <Select
            value={formData.projectId || "none"}
            onValueChange={(value) =>
              handleInputChange("projectId", value === "none" ? "" : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Project</SelectItem>
              {projects &&
                projects.length > 0 &&
                projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reminder */}
        <div>
          <Label htmlFor="reminderMinutes">Reminder (minutes)</Label>
          <Select
            value={formData.reminderMinutes.toString()}
            onValueChange={(value) =>
              handleInputChange("reminderMinutes", parseInt(value))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 minutes</SelectItem>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="1440">1 day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Recurrence */}
        <div>
          <Label htmlFor="recurrenceType">Recurrence</Label>
          <Select
            value={formData.recurrenceType || "none"}
            onValueChange={(value) =>
              handleInputChange("recurrenceType", value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Recurrence</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div>
          <Label htmlFor="startDate">Start Date *</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              required
            />
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange("startTime", e.target.value)}
              required
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <Label htmlFor="endDate">End Date *</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              required
            />
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange("endTime", e.target.value)}
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="Enter location"
          />
        </div>

        {/* Online Meeting */}
        <div className="flex items-center space-x-2 md:pt-8">
          <Switch
            id="isOnline"
            checked={formData.isOnline}
            onCheckedChange={(checked: boolean) =>
              handleInputChange("isOnline", checked)
            }
          />
          <Label htmlFor="isOnline">Online meeting</Label>
        </div>

        {/* Participants */}
        <div className="md:col-span-2">
          <Label htmlFor="participants">
            Participants (comma-separated emails)
          </Label>
          <Input
            id="participants"
            value={formData.participants}
            onChange={(e) => handleInputChange("participants", e.target.value)}
            placeholder="email1@example.com, email2@example.com"
          />
        </div>

        {/* Discussion Points */}
        <div className="md:col-span-3">
          <Label htmlFor="discussionPoints">
            Discussion Points (comma-separated)
          </Label>
          <Input
            id="discussionPoints"
            value={formData.discussionPoints}
            onChange={(e) =>
              handleInputChange("discussionPoints", e.target.value)
            }
            placeholder="Point 1, Point 2, Point 3"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : event ? "Update Event" : "Create Event"}
        </Button>
      </div>

      {/* Custom Event Type Dialog */}
      <CustomOptionDialog
        open={showCustomEventTypeDialog}
        onOpenChange={setShowCustomEventTypeDialog}
        title="Create New Event Type"
        description="Create a custom event type that will be available for your tenant."
        optionName="Event Type"
        placeholder="e.g., Training Session, Client Meeting"
        onSubmit={handleCreateCustomEventType}
        loading={customOptionsLoading.eventType}
      />
    </form>
  );
}
