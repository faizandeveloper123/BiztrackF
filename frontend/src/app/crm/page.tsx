"use client";

import React from "react";
import { ModuleGuard } from "@/src/components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Users,
  Building2,
  Target,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Plus,
  BarChart3,
} from "lucide-react";
import CRMService from "@/src/services/CRMService";
import { CRMDashboard } from "@/src/models/crm";
import Link from "next/link";
import { DashboardLayout } from "../../components/layout";
import { useCachedApi } from "../../hooks/useCachedApi";
import { useCurrency } from "../../contexts/CurrencyContext";

export default function CRMDashboardPage() {
  return (
    <ModuleGuard
      module="crm"
      fallback={<div>You don&apos;t have access to CRM module</div>}
    >
      <CRMDashboardContent />
    </ModuleGuard>
  );
}

function CRMDashboardContent() {
  const { formatCurrency } = useCurrency();
  const {
    data: dashboard,
    loading,
    error,
    refetch,
  } = useCachedApi<CRMDashboard>(
    "crm_dashboard",
    () => CRMService.getDashboard(),
    { ttl: 30000 },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Loading CRM Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">
            {error || "Dashboard not available"}
          </p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
            <p className="text-gray-600">
              Manage your customer relationships and sales pipeline
            </p>
          </div>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/crm/leads?new=1">
                <Plus className="w-4 h-4 mr-2" />
                New Lead
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/crm/opportunities/new">
                <Target className="w-4 h-4 mr-2" />
                New Opportunity
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.totalLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.metrics.activeLeads} active leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contacts
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.totalContacts}
              </div>
              <p className="text-xs text-muted-foreground">Customer database</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dashboard.metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(dashboard.metrics.projectedRevenue)} projected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">Lead to customer</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pipeline">Sales Pipeline</TabsTrigger>
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
            <TabsTrigger value="opportunities">Top Opportunities</TabsTrigger>
            <TabsTrigger value="leads">Recent Leads</TabsTrigger>
          </TabsList>

          {/* Sales Pipeline */}
          <TabsContent value="pipeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Pipeline</CardTitle>
                <CardDescription>
                  Track your opportunities through the sales stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.pipeline.map((stage: any) => (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="capitalize">
                            {stage.stage.replace("_", " ")}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {stage.count} opportunities
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(stage.value)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {stage.probability}% probability
                          </div>
                        </div>
                      </div>
                      <Progress
                        value={
                          stage.count > 0
                            ? (stage.count /
                                Math.max(
                                  ...dashboard.pipeline.map(
                                    (p: any) => p.count,
                                  ),
                                )) *
                              100
                            : 0
                        }
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activities */}
          <TabsContent value="activities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Latest sales activities and follow-ups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recentActivities.map((activity: any) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-3 border rounded-lg"
                    >
                      <div
                        className={`p-2 rounded-full ${CRMService.getActivityTypeColor(activity.type)}`}
                      >
                        {activity.type === "call" && (
                          <Phone className="w-4 h-4" />
                        )}
                        {activity.type === "email" && (
                          <Mail className="w-4 h-4" />
                        )}
                        {activity.type === "meeting" && (
                          <Calendar className="w-4 h-4" />
                        )}
                        {activity.type === "task" && (
                          <Target className="w-4 h-4" />
                        )}
                        {activity.type === "note" && (
                          <BarChart3 className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.subject}</div>
                        <div className="text-sm text-gray-500">
                          {activity.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          {CRMService.formatDateTime(activity.createdAt)}
                        </div>
                      </div>
                      <Badge
                        variant={activity.completed ? "default" : "secondary"}
                      >
                        {activity.completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Top Opportunities */}
          <TabsContent value="opportunities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Opportunities</CardTitle>
                <CardDescription>
                  High-value opportunities in your pipeline
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.topOpportunities.map((opportunity: any) => (
                    <div
                      key={opportunity.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{opportunity.title}</div>
                        <div className="text-sm text-gray-500">
                          {opportunity.description}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            className={CRMService.getOpportunityStageColor(
                              opportunity.stage,
                            )}
                          >
                            {opportunity.stage.replace("_", " ")}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {opportunity.probability}% probability
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          {opportunity.amount
                            ? formatCurrency(opportunity.amount)
                            : "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {opportunity.expectedCloseDate &&
                            `Closes ${CRMService.formatDate(opportunity.expectedCloseDate)}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Leads */}
          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>
                  Latest leads added to your system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.recentLeads.map((lead: any) => (
                    <Link
                      key={lead.id}
                      href={`/crm/leads/${lead.id}`}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {lead.company}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge
                            className={CRMService.getLeadStatusColor(
                              lead.status,
                            )}
                          >
                            {lead.status}
                          </Badge>
                          <Badge variant="outline">{lead.source}</Badge>
                          {lead.score > 0 && (
                            <span className="text-sm text-gray-500">
                              Score: {lead.score}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {CRMService.formatDate(lead.createdAt)}
                        </div>
                        {lead.budget && (
                          <div className="text-sm font-medium">
                            Budget: {formatCurrency(lead.budget)}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common CRM tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/crm/leads">
                  <Users className="w-6 h-6 mb-2" />
                  Manage Leads
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/crm/customers">
                  <Users className="w-6 h-6 mb-2" />
                  Manage Customers
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/crm/contacts">
                  <Users className="w-6 h-6 mb-2" />
                  Manage Contacts
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/crm/companies">
                  <Building2 className="w-6 h-6 mb-2" />
                  Manage Companies
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/crm/opportunities">
                  <Target className="w-6 h-6 mb-2" />
                  Manage Opportunities
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
