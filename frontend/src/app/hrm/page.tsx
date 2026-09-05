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
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Users, UserPlus, Award, GraduationCap, Briefcase } from "lucide-react";
import HRMService from "@/src/services/HRMService";
import { HRMDashboard } from "@/src/models/hrm";
import Link from "next/link";
import { DashboardLayout } from "../../components/layout";
import { useCachedApi } from "../../hooks/useCachedApi";

export default function HRMDashboardPage() {
  return (
    <ModuleGuard
      module="hrm"
      fallback={<div>You don&apos;t have access to HRM module</div>}
    >
      <HRMDashboardContent />
    </ModuleGuard>
  );
}

function HRMDashboardContent() {
  const { getCurrencySymbol } = useCurrency();
  const {
    data: dashboard,
    loading,
    error,
    refetch,
  } = useCachedApi<HRMDashboard>(
    "hrm_dashboard",
    () => HRMService.getDashboard(),
    { ttl: 30000 },
  );

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading HRM Dashboard...</div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">Error: {error}</div>
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
            <h1 className="text-3xl font-bold text-gray-900">HRM Dashboard</h1>
            <p className="text-gray-600">Human Resource Management Overview</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/hrm/employees/new">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Employee
              </Link>
            </Button>
            <Button asChild>
              <Link href="/hrm/job-postings">
                <Briefcase className="w-4 h-4 mr-2" />
                Post Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.totalEmployees}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.metrics.activeEmployees} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Hires</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.newHires}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Open Positions
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboard.metrics.openPositions}
              </div>
              <p className="text-xs text-muted-foreground">
                {dashboard.metrics.pendingApplications} applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getCurrencySymbol()}
                {dashboard.metrics.averageSalary.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Monthly average</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Turnover Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {dashboard.metrics.turnoverRate}%
              </div>
              <Progress
                value={dashboard.metrics.turnoverRate}
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {dashboard.metrics.upcomingReviews}
              </div>
              <p className="text-sm text-muted-foreground">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Training Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {dashboard.metrics.trainingCompletionRate}%
              </div>
              <Progress
                value={dashboard.metrics.trainingCompletionRate}
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>
                    Employee count by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dashboard.departmentDistribution).map(
                      ([dept, count]) => (
                        <div
                          key={dept}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {HRMService.getDepartmentIcon(dept)}
                            </span>
                            <span className="capitalize">
                              {dept.replace("_", " ")}
                            </span>
                          </div>
                          <Badge variant="secondary">
                            {count as React.ReactNode}
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest HR activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                      <div className="text-sm">
                        <span className="font-medium">New employee hired</span>
                        <p className="text-xs text-gray-600">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-green-50">
                      <Award className="h-4 w-4 text-green-600" />
                      <div className="text-sm">
                        <span className="font-medium">
                          Performance review completed
                        </span>
                        <p className="text-xs text-gray-600">1 day ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-purple-50">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      <div className="text-sm">
                        <span className="font-medium">
                          Job posting published
                        </span>
                        <p className="text-xs text-gray-600">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Hires</CardTitle>
                <CardDescription>Latest employee additions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.recentHires.map((employee: any) => (
                    <div
                      key={employee.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {employee.position}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={HRMService.getEmploymentStatusColor(
                            employee.employmentStatus,
                          )}
                        >
                          {employee.employmentStatus}
                        </Badge>
                        <Badge
                          className={HRMService.getEmployeeTypeColor(
                            employee.employeeType,
                          )}
                        >
                          {employee.employeeType.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/hrm/employees">View All Employees</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recruitment" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Open Job Postings */}
              <Card>
                <CardHeader>
                  <CardTitle>Open Job Postings</CardTitle>
                  <CardDescription>
                    Active recruitment positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.openJobPostings.map((job: any) => (
                      <div key={job.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-gray-600">
                          {job.department}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={HRMService.getJobStatusColor(job.status)}
                          >
                            {job.status}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {job.location}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/hrm/jobs">View All Jobs</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Applications */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Applications</CardTitle>
                  <CardDescription>Latest job applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboard.recentApplications.map((app: any) => (
                      <div key={app.id} className="p-3 border rounded-lg">
                        <div className="font-medium">
                          {app.firstName} {app.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{app.email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            className={HRMService.getApplicationStatusColor(
                              app.status,
                            )}
                          >
                            {app.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/hrm/applications">
                        View All Applications
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Performance Reviews</CardTitle>
                <CardDescription>
                  Reviews scheduled for the next 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.upcomingReviews.map((review: any) => (
                    <div key={review.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Employee ID: {review.employeeId}
                          </div>
                          <div className="text-sm text-gray-600">
                            {review.reviewType} - {review.reviewPeriod}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={HRMService.getApplicationStatusColor(
                              review.status,
                            )}
                          >
                            {review.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {HRMService.formatDate(review.reviewDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/hrm/reviews">View All Reviews</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Leave Requests</CardTitle>
                <CardDescription>
                  Leave requests awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.pendingLeaveRequests.map((leave: any) => (
                    <div key={leave.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            Employee ID: {leave.employeeId}
                          </div>
                          <div className="text-sm text-gray-600">
                            {leave.leaveType} - {leave.totalDays} days
                          </div>
                          <div className="text-xs text-gray-500">
                            {HRMService.formatDate(leave.startDate)} -{" "}
                            {HRMService.formatDate(leave.endDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={HRMService.getLeaveStatusColor(
                              leave.status,
                            )}
                          >
                            {leave.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/hrm/leave-requests">
                      View All Leave Requests
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Training Programs</CardTitle>
                <CardDescription>
                  Ongoing and upcoming training sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard.trainingPrograms.map((program: any) => (
                    <div key={program.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{program.title}</div>
                          <div className="text-sm text-gray-600">
                            {program.provider}
                          </div>
                          <div className="text-xs text-gray-500">
                            {HRMService.formatDate(program.startDate)} -{" "}
                            {HRMService.formatDate(program.endDate)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={HRMService.getTrainingStatusColor(
                              program.status,
                            )}
                          >
                            {program.status.replace("_", " ")}
                          </Badge>
                          <span className="text-sm font-medium">
                            {getCurrencySymbol()}
                            {program.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/hrm/training">View All Training</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common HR tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/hrm/employees/new">
                  <UserPlus className="h-6 w-6 mb-2" />
                  <span className="text-sm">Add Employee</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/hrm/job-postings">
                  <Briefcase className="h-6 w-6 mb-2" />
                  <span className="text-sm">Post Job</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/hrm/reviews/new">
                  <Award className="h-6 w-6 mb-2" />
                  <span className="text-sm">Schedule Review</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/hrm/training/new">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  <span className="text-sm">Create Training</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
