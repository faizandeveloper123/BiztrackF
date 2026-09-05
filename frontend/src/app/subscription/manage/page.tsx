"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  RefreshCw,
  XCircle,
  CheckCircle,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { apiService } from "@/src/services/ApiService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { toast } from "sonner";
import { extractErrorMessage } from "@/src/utils/errorUtils";

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string | null;
  plan: {
    id: string;
    name: string;
    planType: string;
    price: number;
    billingCycle: string;
    maxProjects: number;
    maxUsers: number;
    features: string[];
  };
}

interface BillingInfo {
  tenant_id: string;
  subscription_id: string;
  plan_name: string;
  plan_type: string;
  monthly_price: number;
  billing_cycle: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  auto_renew: boolean;
  next_billing_date: string | null;
  features: string[];
}

interface UsageSummary {
  projects: { current: number; limit: number };
  users: { current: number; limit: number };
  storage: { current: number; limit: number };
  api_calls: { current: number; limit: number };
}

export default function SubscriptionManagePage() {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [upgrading, setUpgrading] = useState(false);

  const tenantId = apiService.getTenantId();

  useEffect(() => {
    if (!tenantId) {
      router.push("/dashboard");
      return;
    }
    loadSubscriptionData();
  }, [tenantId]);

  const loadSubscriptionData = async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      const [subscriptionRes, billingRes, usageRes] = await Promise.all([
        apiService.get("/tenants/current/subscription").catch(() => null),
        apiService.getSubscriptionBilling(tenantId).catch(() => null),
        apiService.getSubscriptionUsage(tenantId).catch(() => null),
      ]);

      if (subscriptionRes?.subscription) {
        setSubscription(subscriptionRes.subscription);
      }

      if (billingRes) {
        setBillingInfo(billingRes);
      }

      if (usageRes) {
        setUsageSummary(usageRes);
      }
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to load subscription data"),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!tenantId) return;

    try {
      setSyncing(true);
      await apiService.syncSubscriptionStatus(tenantId);
      toast.success("Subscription status synced successfully");
      await loadSubscriptionData();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to sync subscription status"),
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleCancel = async () => {
    if (!tenantId || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setCancelling(true);
      await apiService.cancelSubscription(tenantId, cancelReason);
      toast.success("Subscription cancelled successfully");
      setCancelDialogOpen(false);
      setCancelReason("");
      await loadSubscriptionData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to cancel subscription"));
    } finally {
      setCancelling(false);
    }
  };

  const handleReactivate = async () => {
    if (!tenantId) return;

    try {
      setCancelling(true);
      await apiService.reactivateSubscription(tenantId);
      toast.success("Subscription reactivated successfully");
      await loadSubscriptionData();
    } catch (error) {
      toast.error(
        extractErrorMessage(error, "Failed to reactivate subscription"),
      );
    } finally {
      setCancelling(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const response = await apiService.get("/public/plans");
      if (response.plans) {
        setAvailablePlans(
          response.plans.filter((p: any) => p.id !== subscription?.plan.id),
        );
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to load available plans"));
    }
  };

  const handleUpgrade = async () => {
    if (!tenantId || !selectedPlanId || !subscription) return;

    try {
      setUpgrading(true);
      await apiService.upgradePlan(
        tenantId,
        selectedPlanId,
        subscription.plan.id,
      );
      toast.success("Plan upgraded successfully");
      setUpgradeDialogOpen(false);
      setSelectedPlanId("");
      await loadSubscriptionData();
    } catch (error) {
      toast.error(extractErrorMessage(error, "Failed to upgrade plan"));
    } finally {
      setUpgrading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
      }
    > = {
      active: { variant: "default", label: "Active" },
      trial: { variant: "secondary", label: "Trial" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      expired: { variant: "destructive", label: "Expired" },
      inactive: { variant: "secondary", label: "Inactive" },
    };

    const config = statusConfig[status.toLowerCase()] || {
      variant: "secondary" as const,
      label: status,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!subscription && !billingInfo) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No subscription found</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Subscription Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and billing
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Plan</CardTitle>
                {subscription && getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription && (
                <>
                  <div>
                    <p className="text-2xl font-bold">
                      {subscription.plan.name}
                    </p>
                    <p className="text-muted-foreground">
                      {subscription.plan.planType}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-semibold">
                        {subscription.plan.price != null
                          ? formatCurrency(subscription.plan.price)
                          : "N/A"}
                        /
                        {subscription.plan.billingCycle === "monthly"
                          ? "month"
                          : "year"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Max Projects
                      </span>
                      <span className="font-semibold">
                        {subscription.plan.maxProjects}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Max Users</span>
                      <span className="font-semibold">
                        {subscription.plan.maxUsers}
                      </span>
                    </div>
                  </div>
                  {subscription.plan.features &&
                    subscription.plan.features.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm font-medium mb-2">Features</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {subscription.plan.features.map((feature, idx) => (
                              <li key={idx}>• {feature}</li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {billingInfo && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      {getStatusBadge(billingInfo.status)}
                    </div>
                    {billingInfo.start_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Start Date
                        </span>
                        <span>
                          {new Date(
                            billingInfo.start_date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {billingInfo.end_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End Date</span>
                        <span>
                          {new Date(billingInfo.end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {billingInfo.next_billing_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Next Billing
                        </span>
                        <span>
                          {new Date(
                            billingInfo.next_billing_date,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto Renew</span>
                      <Badge
                        variant={
                          billingInfo.auto_renew ? "default" : "secondary"
                        }
                      >
                        {billingInfo.auto_renew ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleSync}
                    disabled={syncing}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                    />
                    Sync Status
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {usageSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Summary</CardTitle>
              <CardDescription>
                Current usage against your plan limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Projects</span>
                    <span className="font-medium">
                      {usageSummary.projects.current} /{" "}
                      {usageSummary.projects.limit}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((usageSummary.projects.current / usageSummary.projects.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Users</span>
                    <span className="font-medium">
                      {usageSummary.users.current} / {usageSummary.users.limit}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${Math.min((usageSummary.users.current / usageSummary.users.limit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {subscription && subscription.status === "cancelled" ? (
                <Button onClick={handleReactivate} disabled={cancelling}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Reactivate Subscription
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUpgradeDialogOpen(true);
                      loadAvailablePlans();
                    }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setCancelDialogOpen(true)}
                    disabled={subscription?.status === "cancelled"}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling your subscription. Your
              subscription will remain active until the end of the current
              billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Cancellation</Label>
              <Textarea
                id="reason"
                placeholder="Please tell us why you're cancelling..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Plan</DialogTitle>
            <DialogDescription>
              Select a new plan to upgrade your subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {availablePlans.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No upgrade plans available
              </p>
            ) : (
              <div className="space-y-2">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPlanId === plan.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.planType}
                        </p>
                        <p className="text-sm mt-1">
                          {plan.price != null
                            ? formatCurrency(plan.price)
                            : "N/A"}
                          /{plan.billingCycle === "monthly" ? "month" : "year"}
                        </p>
                      </div>
                      {selectedPlanId === plan.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={upgrading || !selectedPlanId}
            >
              {upgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                "Upgrade Plan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
