"use client";

import React from "react";
import { DashboardLayout } from "@/src/components/layout";
import NotificationList from "@/src/components/notifications/NotificationList";

export default function NotificationsPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <NotificationList />
      </div>
    </DashboardLayout>
  );
}
