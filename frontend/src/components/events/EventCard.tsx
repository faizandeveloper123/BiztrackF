"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Calendar, Clock, MapPin, Users, Video } from "lucide-react";

interface EventCardProps {
  event: {
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
  };
  onEdit?: (event: any) => void;
  onDelete?: (id: string) => void;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onJoin,
}: EventCardProps) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isUpcoming = startDate > new Date();
  const hasMeetLink =
    event.googleMeetLink && event.googleMeetLink.trim().length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-purple-100 text-purple-800";
      case "workshop":
        return "bg-orange-100 text-orange-800";
      case "deadline":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
              {event.title}
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getEventTypeColor(event.eventType)}>
                {event.eventType.replace("_", " ")}
              </Badge>
              <Badge className={getStatusColor(event.status)}>
                {event.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {event.description && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(startDate)}</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              {formatTime(startDate)} - {formatTime(endDate)}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}

          {event.participants.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{event.participants.length} participants</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          {hasMeetLink && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => window.open(event.googleMeetLink, "_blank")}
            >
              <Video className="h-4 w-4" />
              Join Meeting
            </Button>
          )}

          {isUpcoming && event.status === "scheduled" && (
            <>
              {onJoin && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onJoin(event.id)}
                >
                  Join Event
                </Button>
              )}
            </>
          )}

          {onEdit && (
            <Button size="sm" variant="ghost" onClick={() => onEdit(event)}>
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
