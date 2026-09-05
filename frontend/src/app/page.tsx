"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { useAuth } from "../contexts/AuthContext";
import { isTauriApp } from "@/src/lib/isTauriApp";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { apiService } from "../services/ApiService";
import dynamic from "next/dynamic";
import { LandingNav } from "../components/landing/LandingNav";
import { LazyLandingSection } from "../components/landing/LazyLandingSection";
import { BizTrackLogo } from "../components/brand/BizTrackLogo";
import { LandingFooter } from "../components/landing/LandingFooter";
import type { LandingPlan } from "../components/landing/LandingPricingSection";

const ProductCrmOverviewSection = dynamic(
  () =>
    import("../components/landing/ProductCrmOverviewSection").then((m) => ({
      default: m.ProductCrmOverviewSection,
    })),
  { ssr: false },
);

const FeaturesSection = dynamic(
  () =>
    import("../components/landing/FeaturesSection").then((m) => ({
      default: m.FeaturesSection,
    })),
  { ssr: false },
);

const ReviewsReputationSection = dynamic(
  () =>
    import("../components/landing/ReviewsReputationSection").then((m) => ({
      default: m.ReviewsReputationSection,
    })),
  { ssr: false },
);

const ImpactCommitmentSection = dynamic(
  () =>
    import("../components/landing/ImpactCommitmentSection").then((m) => ({
      default: m.ImpactCommitmentSection,
    })),
  { ssr: false },
);

const CompanyVerificationSection = dynamic(
  () =>
    import("../components/landing/CompanyVerificationSection").then((m) => ({
      default: m.CompanyVerificationSection,
    })),
  { ssr: false },
);

const LandingCtaSection = dynamic(
  () =>
    import("../components/landing/LandingCtaSection").then((m) => ({
      default: m.LandingCtaSection,
    })),
  { ssr: false },
);

const LandingPricingSection = dynamic(
  () =>
    import("../components/landing/LandingPricingSection").then((m) => ({
      default: m.LandingPricingSection,
    })),
  { ssr: false },
);

const LandingPlanModulesSection = dynamic(
  () =>
    import("../components/landing/LandingPlanModulesSection").then((m) => ({
      default: m.LandingPlanModulesSection,
    })),
  { ssr: false },
);
import { extractErrorMessage } from "../utils/errorUtils";
import { toast } from "sonner";
import {
  Star,
  Users,
  FolderOpen,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface Plan {
  id: string;
  name: string;
  planType: string;
  price: number;
  maxProjects: number;
  maxUsers: number;
  features: string[];
  description: string;
}

interface SubscriptionModalProps {
  plan: Plan | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tenantName: string, paymentMethod: "stripe" | "paypal") => void;
  loading: boolean;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  plan,
  isOpen,
  onClose,
  onSubmit,
  loading,
}) => {
  const { getCurrencySymbol } = useCurrency();
  const [tenantName, setTenantName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">(
    "stripe",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tenantName.trim()) {
      onSubmit(tenantName.trim(), paymentMethod);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Workspace</DialogTitle>
          <DialogDescription>
            Set up your new workspace with the {plan?.name} plan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Workspace Name</Label>
            <Input
              id="tenantName"
              placeholder="Enter your company/workspace name"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              This will be the name of your workspace in BizTrack
            </p>
          </div>

          {plan && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">{plan.name} Plan</span>
                <Badge variant="secondary">
                  {getCurrencySymbol()}
                  {plan.price}/month
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {plan.maxProjects} projects • {plan.maxUsers} users
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === "stripe" ? "default" : "outline"}
                onClick={() => setPaymentMethod("stripe")}
                className="w-full"
              >
                Card (Stripe)
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "paypal" ? "default" : "outline"}
                onClick={() => setPaymentMethod("paypal")}
                className="w-full"
              >
                PayPal
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !tenantName.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { getCurrencySymbol } = useCurrency();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [desktopApp, setDesktopApp] = useState(false);
  const [subscriptionModal, setSubscriptionModal] = useState<{
    isOpen: boolean;
    plan: Plan | null;
  }>({ isOpen: false, plan: null });

  useEffect(() => {
    if (isTauriApp()) {
      setDesktopApp(true);
    }
  }, []);

  useEffect(() => {
    if (!desktopApp || authLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [desktopApp, authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (desktopApp) return;
    fetchPlans();
  }, [desktopApp]);

  // Handle stored plan for new signups
  useEffect(() => {
    if (isAuthenticated) {
      // Check localStorage for selected plan (for new signups)
      const storedPlan = localStorage.getItem("selectedPlanForSignup");
      if (storedPlan) {
        try {
          const plan = JSON.parse(storedPlan);
          // Check if user already has tenants before showing workspace creation
          checkExistingTenantsAndHandlePlan(plan);
          // Clear the stored plan
          localStorage.removeItem("selectedPlanForSignup");
        } catch (error) {
          localStorage.removeItem("selectedPlanForSignup");
        }
      }
    }
  }, [isAuthenticated]);

  const checkExistingTenantsAndHandlePlan = async (plan: Plan) => {
    try {
      // Get user's existing tenants
      const existingTenants = apiService.getUserTenants();

      if (existingTenants && existingTenants.length > 0) {
        // User already has tenants - show message and redirect to dashboard
        toast.info(
          "You already have a workspace. Redirecting to your dashboard.",
        );
        router.push("/dashboard");
        return;
      }

      // User has no tenants - show workspace creation modal
      setSubscriptionModal({ isOpen: true, plan });
    } catch (error) {
      // Fallback: show workspace creation modal
      setSubscriptionModal({ isOpen: true, plan });
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await apiService.get("/public/plans");
      setPlans(response.plans || []);
    } catch (error) {
      // Plans fetch failed, continue without plans
    }
  };

  const handleSubscribe = (plan: Plan) => {
    if (!isAuthenticated) {
      // Store the selected plan in localStorage and redirect to signup
      localStorage.setItem("selectedPlanForSignup", JSON.stringify(plan));
      router.push("/signup");
      return;
    }

    // User is authenticated - check existing tenants first
    checkExistingTenantsAndHandlePlan(plan);
  };

  const handleCreateTenant = async (
    tenantName: string,
    paymentMethod: "stripe" | "paypal" = "stripe",
  ) => {
    if (!subscriptionModal.plan) return;

    try {
      setLoading(true);
      const response = await apiService.createTenantFromLanding({
        planId: subscriptionModal.plan.id,
        tenantName,
        domain: tenantName.toLowerCase().replace(/\s+/g, "-"),
        paymentMethod,
      });

      if (response.success && response.checkout_url) {
        setSubscriptionModal({ isOpen: false, plan: null });
        try {
          window.location.href = response.checkout_url;
        } catch (redirectError) {
          console.error("Failed to redirect to checkout:", redirectError);
          toast.error(
            "Workspace created but failed to redirect to payment. Please contact support.",
          );
        }
      } else if (response.success && response.tenant) {
        setSubscriptionModal({ isOpen: false, plan: null });
        try {
          await apiService.refreshTenants();
          const tenants = apiService.getUserTenants();
          const newTenant = tenants.find((t) => t.name === tenantName);

          if (newTenant) {
            apiService.setTenantId(newTenant.id);
            await new Promise((resolve) => setTimeout(resolve, 100));
            router.push("/dashboard");
          } else {
            throw new Error("Tenant was not found after creation");
          }
        } catch (error) {
          console.error("Error setting up tenant:", error);
          toast.error(
            "Workspace created but there was an issue setting it up. Please refresh the page and try again.",
          );
        }
      } else {
        const errorMessage =
          response.error || response.message || "Unknown error";
        throw new Error(`Tenant creation failed: ${errorMessage}`);
      }
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      const errorMessage = extractErrorMessage(
        error,
        "Failed to create workspace. Please try again.",
      );
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: "Active Users", value: "10,000+", icon: Users },
    { label: "Projects Managed", value: "50,000+", icon: FolderOpen },
    { label: "Uptime", value: "99.9%", icon: CheckCircle },
    { label: "Customer Satisfaction", value: "4.9/5", icon: Star },
  ];

  if (desktopApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50" />
        <div className="container mx-auto relative z-10 max-w-4xl">
          <div className="text-center mx-auto">
            <div className="flex justify-center mb-6 sm:mb-8">
              <BizTrackLogo size="hero" />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 mb-6">
              <Star className="h-4 w-4 fill-emerald-600 text-emerald-600" />
              <span className="text-sm font-medium">
                Trusted by 10,000+ businesses
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 text-slate-900">
              Complete Business
              <span className="block bg-gradient-to-r from-blue-700 to-emerald-600 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              Streamline your business operations with our comprehensive ERP
              solution. Manage projects, sales, HR, inventory, and more from a
              single dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-10 sm:mb-12">
              <Button
                size="lg"
                className="text-base sm:text-lg px-8 py-6 h-auto bg-blue-600 hover:bg-blue-700"
                onClick={() => router.push("/signup")}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base sm:text-lg px-8 py-6 h-auto border-blue-200 text-blue-800 hover:bg-blue-50"
                onClick={() =>
                  document
                    .getElementById("overview")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See How It Works
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-4 sm:p-4 shadow-sm"
                >
                  <div className="flex justify-center mb-2">
                    <stat.icon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LazyLandingSection minHeight="min-h-[400px]">
        <ProductCrmOverviewSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[480px]">
        <FeaturesSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[520px]">
        <ReviewsReputationSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[480px]">
        <ImpactCommitmentSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[360px]">
        <CompanyVerificationSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[280px]">
        <LandingCtaSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[360px]">
        <LandingPlanModulesSection />
      </LazyLandingSection>

      <LazyLandingSection minHeight="min-h-[400px]">
        <LandingPricingSection
          plans={plans as LandingPlan[]}
          currencySymbol={getCurrencySymbol()}
          isAuthenticated={isAuthenticated}
          onSubscribe={handleSubscribe}
        />
      </LazyLandingSection>

      <LandingFooter />

      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={subscriptionModal.isOpen}
        onClose={() => setSubscriptionModal({ isOpen: false, plan: null })}
        plan={subscriptionModal.plan}
        onSubmit={handleCreateTenant}
        loading={loading}
      />
    </div>
  );
}
