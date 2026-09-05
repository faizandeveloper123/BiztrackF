"use client";

import { CheckCircle, Edit, FolderOpen, Users, XCircle } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import type { AdminPlan } from "@/src/types/adminPlan";
import { getPlanTypeColor, getPlanTypeIcon } from "./planTypeDisplay";

type AdminPlanCardProps = {
  plan: AdminPlan;
  currencySymbol: string;
  onEdit: (plan: AdminPlan) => void;
  onActivate: (planId: string) => void;
  onDeactivate: (planId: string) => void;
};

export function AdminPlanCard({
  plan,
  currencySymbol,
  onEdit,
  onActivate,
  onDeactivate,
}: AdminPlanCardProps) {
  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getPlanTypeIcon(plan.planType)}
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </div>
          </div>
          <Badge className={getPlanTypeColor(plan.planType)}>
            {plan.planType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Price</span>
            <span className="text-lg font-bold text-gray-900">
              {currencySymbol}
              {plan.price}/{plan.billingCycle}
            </span>
          </div>

          <div className="space-y-2">
            {plan.maxUsers != null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Max Users</span>
                </div>
                <span className="text-sm font-medium">{plan.maxUsers}</span>
              </div>
            )}
            {plan.maxProjects != null && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Max Projects</span>
                </div>
                <span className="text-sm font-medium">{plan.maxProjects}</span>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Features</p>
            <div className="flex flex-wrap gap-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {plan.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{plan.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {plan.isActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  plan.isActive ? "text-green-600" : "text-red-600"
                }`}
              >
                {plan.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(plan)}
              className="flex-1"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            {plan.isActive ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDeactivate(plan.id)}
                className="flex-1"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Deactivate
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => onActivate(plan.id)}
                className="flex-1"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Activate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
