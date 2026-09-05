"use client";

import React from "react";
import { TaskList } from "../../components/tasks";
import { DashboardLayout } from "../../components/layout";
import { ErrorBoundary } from "../../components/ErrorBoundary";

export default function TasksPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <ErrorBoundary>
          <TaskList />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
