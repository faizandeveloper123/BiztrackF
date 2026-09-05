import React from "react";
import EventsList from "../../components/events/EventsList";
import { DashboardLayout } from "../../components/layout";
import { ModuleGuard } from "../../components/guards/PermissionGuard";

export default function EventsPage() {
  return (
    <ModuleGuard
      module="events"
      fallback={<div>You don&apos;t have access to Events module</div>}
    >
      <EventsContent />
    </ModuleGuard>
  );
}

function EventsContent() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-6">
        <EventsList />
      </div>
    </DashboardLayout>
  );
}
