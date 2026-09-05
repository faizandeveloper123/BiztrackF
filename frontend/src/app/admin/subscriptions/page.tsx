"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminGuard } from "@/src/components/guards/PermissionGuard";
import { apiService } from "@/src/services/ApiService";
import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

interface Subscription {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  status: string;
  startDate: string;
  endDate: string | null;
  autoRenew: boolean;
  plan: {
    id: string;
    name: string;
    planType: string;
    price: number;
    billingCycle: string;
  };
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface SubscriptionStats {
  total: number;
  active: number;
  inactive: number;
  cancelled: number;
  expired: number;
  trial: number;
}

export default function AdminSubscriptionsPage() {
  return (
    <SuperAdminGuard>
      <AdminSubscriptionsContent />
    </SuperAdminGuard>
  );
}

function AdminSubscriptionsContent() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/admin/subscriptions");

      if (response.subscriptions) {
        setSubscriptions(response.subscriptions);
      }

      if (response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load subscriptions"));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (subscriptionId: string, tenantId: string) => {
    try {
      setSyncing(subscriptionId);
      await apiService.syncSubscriptionStatus(tenantId);
      toast.success("Subscription status synced successfully");
      await loadSubscriptions();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to sync subscription"));
    } finally {
      setSyncing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: any;
      }
    > = {
      active: { variant: "default", icon: CheckCircle },
      trial: { variant: "secondary", icon: AlertTriangle },
      cancelled: { variant: "destructive", icon: XCircle },
      expired: { variant: "destructive", icon: XCircle },
      inactive: { variant: "secondary", icon: AlertTriangle },
    };

    const config = statusConfig[status.toLowerCase()] || {
      variant: "secondary" as const,
      icon: AlertTriangle,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      sub.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all tenant subscriptions
          </p>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Trial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.trial}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cancelled</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.cancelled}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Expired</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.expired}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Inactive</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {stats.inactive}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>All Subscriptions</CardTitle>
                <CardDescription>
                  View and manage tenant subscriptions
                </CardDescription>
              </div>
              <Button variant="outline" onClick={loadSubscriptions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by tenant, plan, or subscription ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Auto Renew</TableHead>
                    <TableHead>Stripe ID</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No subscriptions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell className="font-medium">
                          {sub.tenant_name || sub.tenant_id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{sub.plan.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {sub.plan.planType}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(sub.status)}</TableCell>
                        <TableCell>
                          {sub.plan?.price != null
                            ? formatCurrency(sub.plan.price)
                            : "N/A"}
                          /{sub.plan?.billingCycle === "monthly" ? "mo" : "yr"}
                        </TableCell>
                        <TableCell>
                          {new Date(sub.startDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {sub.endDate
                            ? new Date(sub.endDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={sub.autoRenew ? "default" : "secondary"}
                          >
                            {sub.autoRenew ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground font-mono">
                            {sub.stripe_subscription_id ? (
                              <span title={sub.stripe_subscription_id}>
                                {sub.stripe_subscription_id.substring(0, 20)}...
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {sub.stripe_subscription_id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSync(sub.id, sub.tenant_id)
                                }
                                disabled={syncing === sub.id}
                              >
                                <RefreshCw
                                  className={`h-3 w-3 ${syncing === sub.id ? "animate-spin" : ""}`}
                                />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/admin/tenants/${sub.tenant_id}`)
                              }
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
