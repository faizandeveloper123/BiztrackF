"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Clock, Calendar, BarChart3, TrendingUp } from "lucide-react";
import { timeTrackingService } from "../../services/TimeTrackingService";

interface TimeStatsProps {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
}

export function TimeStats({ employeeId, startDate, endDate }: TimeStatsProps) {
  const [stats, setStats] = useState({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    totalHours: 0,
    averageDailyHours: 0,
    overtimeHours: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [employeeId, startDate, endDate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await timeTrackingService.getTimeTrackingStats(
        startDate,
        endDate,
        employeeId,
      );
      setStats(response);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="modern-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.todayHours)}
              </p>
              <p className="text-sm text-gray-600">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.weekHours)}
              </p>
              <p className="text-sm text-gray-600">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.monthHours)}
              </p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.totalHours)}
              </p>
              <p className="text-sm text-gray-600">Total Hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.averageDailyHours)}
              </p>
              <p className="text-sm text-gray-600">Daily Average</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(stats.overtimeHours)}
              </p>
              <p className="text-sm text-gray-600">Overtime</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
