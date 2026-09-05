"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useApiService } from "../../hooks/useApiService";

interface Event {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function EventsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const apiService = useApiService();

  useEffect(() => {
    loadEvents();
  }, []);

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
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

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600 mt-1">
            View your events in calendar format
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <h2 className="text-lg font-semibold sm:text-xl">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <Button variant="outline" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1 min-w-[560px]">
            {/* Day Headers */}
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-gray-500 text-sm"
              >
                {day}
              </div>
            ))}

            {/* Empty cells for days before month starts */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="p-2 min-h-[100px] bg-gray-50"
              ></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dayEvents = getEventsForDay(day);
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day}
                  className={`p-2 min-h-[100px] border border-gray-200 ${
                    isToday ? "bg-blue-50 border-blue-300" : "bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isToday ? "text-blue-600" : "text-gray-900"
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded cursor-pointer hover:bg-gray-100"
                        title={event.title}
                      >
                        <Badge
                          className={`w-full text-xs ${getEventTypeColor(event.eventType)}`}
                          variant="secondary"
                        >
                          {event.title.length > 15
                            ? event.title.substring(0, 15) + "..."
                            : event.title}
                        </Badge>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Meeting</Badge>
              <span className="text-sm text-gray-600">
                Team meetings and discussions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-100 text-orange-800">Workshop</Badge>
              <span className="text-sm text-gray-600">
                Training and workshops
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">Deadline</Badge>
              <span className="text-sm text-gray-600">Important deadlines</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gray-100 text-gray-800">Other</Badge>
              <span className="text-sm text-gray-600">Other events</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
