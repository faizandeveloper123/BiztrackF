"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { apiService } from "@/src/services/ApiService";
import { toast } from "sonner";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const sessionId = searchParams.get("session_id");
  const provider = searchParams.get("provider");
  const tenantId = searchParams.get("tenant_id");
  const paypalSubscriptionId = searchParams.get("subscription_id");

  useEffect(() => {
    const handleSuccess = async () => {
      const isPayPal = provider === "paypal";

      if (!isPayPal && !sessionId) {
        setError("No session ID provided");
        setLoading(false);
        return;
      }

      if (isPayPal && (!tenantId || !paypalSubscriptionId)) {
        setError("Missing PayPal subscription details");
        setLoading(false);
        return;
      }

      try {
        if (isPayPal && tenantId && paypalSubscriptionId) {
          let confirmed = false;
          for (let attempt = 0; attempt < 5; attempt += 1) {
            try {
              await apiService.confirmPayPalSubscription(
                tenantId,
                paypalSubscriptionId,
              );
              confirmed = true;
              break;
            } catch (confirmErr) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
          if (!confirmed) {
            setError(
              "PayPal payment received but subscription activation is still pending. Try syncing below.",
            );
            setLoading(false);
            return;
          }
        }

        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = 2000;

        const verifySubscription = async (): Promise<boolean> => {
          try {
            await apiService.refreshTenants();
            const tenants = apiService.getUserTenants();

            if (tenants && tenants.length > 0) {
              const latestTenant = tenantId
                ? tenants.find((tenant) => tenant.id === tenantId) || tenants[0]
                : tenants[0];
              apiService.setTenantId(latestTenant.id);

              try {
                const subscriptionResponse = await apiService.get(
                  "/tenants/current/subscription",
                );
                const status =
                  subscriptionResponse?.subscription?.status?.toLowerCase();
                if (status === "active" || status === "trial") {
                  return true;
                }
              } catch (subErr) {
                console.log(
                  "Subscription check failed, but tenant exists. Proceeding...",
                  subErr,
                );
              }
              return true;
            }
            return false;
          } catch (err) {
            console.error("Error verifying subscription:", err);
            return false;
          }
        };

        const pollForSubscription = async () => {
          while (attempts < maxAttempts) {
            attempts++;
            const verified = await verifySubscription();

            if (verified) {
              setLoading(false);
              setTimeout(() => {
                router.push("/dashboard");
              }, 1500);
              return;
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
          }

          await apiService.refreshTenants();
          const tenants = apiService.getUserTenants();

          if (tenants && tenants.length > 0) {
            const latestTenant = tenantId
              ? tenants.find((tenant) => tenant.id === tenantId) || tenants[0]
              : tenants[0];
            apiService.setTenantId(latestTenant.id);

            const latestTenantId = latestTenant.id;
            try {
              if (latestTenantId) {
                await apiService.syncSubscriptionStatus(latestTenantId);
              }
            } catch (syncErr) {
              console.error("Failed to sync subscription:", syncErr);
            }

            setLoading(false);
            setTimeout(() => {
              router.push("/dashboard");
            }, 1500);
          } else {
            setError(
              "Tenant created but not found. Please try logging in again or contact support.",
            );
            setLoading(false);
          }
        };

        pollForSubscription();
      } catch (err) {
        console.error("Error in handleSuccess:", err);
        setError(
          "Failed to complete setup. Please contact support if the issue persists.",
        );
        setLoading(false);
      }
    };

    handleSuccess();
  }, [sessionId, provider, tenantId, paypalSubscriptionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">
                Completing your subscription...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setSyncing(true);
                    await apiService.refreshTenants();
                    const tenants = apiService.getUserTenants();
                    if (tenants && tenants.length > 0) {
                      const latestTenant = tenantId
                        ? tenants.find((tenant) => tenant.id === tenantId) ||
                          tenants[0]
                        : tenants[0];
                      if (
                        provider === "paypal" &&
                        tenantId &&
                        paypalSubscriptionId
                      ) {
                        await apiService.confirmPayPalSubscription(
                          tenantId,
                          paypalSubscriptionId,
                        );
                      }
                      await apiService.syncSubscriptionStatus(latestTenant.id);
                      toast.success(
                        "Subscription status synced. Please refresh.",
                      );
                      router.push("/dashboard");
                    } else {
                      toast.error("No tenant found");
                    }
                  } catch (err) {
                    toast.error("Failed to sync subscription status");
                  } finally {
                    setSyncing(false);
                  }
                }}
                disabled={syncing}
                className="w-full"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
                />
                Sync Subscription Status
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Your subscription has been activated. Redirecting to your
              dashboard...
            </p>
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
