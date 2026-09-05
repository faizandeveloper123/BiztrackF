"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Calendar,
  MapPin,
  Users,
  Video,
  ExternalLink,
  Edit,
  Trash2,
} from "lucide-react";

interface EventDetailsProps {
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
    discussionPoints: string[];
    attachments: string[];
    status: string;
    projectId?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  onEdit?: (event: any) => void;
  onDelete?: (id: string) => void;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
}

export default function EventDetails({
  event,
  onEdit,
  onDelete,
  onJoin,
}: EventDetailsProps) {
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={getEventTypeColor(event.eventType)}>
              {event.eventType.replace("_", " ")}
            </Badge>
            <Badge className={getStatusColor(event.status)}>
              {event.status.replace("_", " ")}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasMeetLink && (
            <Button
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
                <Button variant="default" onClick={() => onJoin(event.id)}>
                  Join Event
                </Button>
              )}
            </>
          )}

          {onEdit && (
            <Button variant="outline" onClick={() => onEdit(event)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(event.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{event.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {formatDateTime(startDate)}
                </p>
                <p className="text-sm text-gray-600">
                  to {formatTime(endDate)}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-sm text-gray-600">{event.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-gray-500" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-sm text-gray-600">
                  {event.participants.length} participant
                  {event.participants.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {hasMeetLink && (
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Online Meeting</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600"
                    onClick={() => window.open(event.googleMeetLink, "_blank")}
                  >
                    Join Google Meet
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discussion Points */}
      {event.discussionPoints && event.discussionPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Discussion Points</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {event.discussionPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Participants List */}
      {event.participants && event.participants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.participants.map((participant, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {participant.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-gray-700">{participant}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {event.attachments && event.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {event.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                >
                  <ExternalLink className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{attachment}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Created by</p>
              <p className="text-gray-600">{event.createdBy}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Created</p>
              <p className="text-gray-600">
                {new Date(event.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Last updated</p>
              <p className="text-gray-600">
                {new Date(event.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {event.projectId && (
              <div>
                <p className="font-medium text-gray-700">Project ID</p>
                <p className="text-gray-600">{event.projectId}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
