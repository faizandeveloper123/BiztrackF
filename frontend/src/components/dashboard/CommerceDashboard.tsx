"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import {
  ShoppingCart,
  BarChart3,
  Users,
  Package,
  TrendingUp,
  CreditCard,
  Store,
  Plus,
  ArrowRight,
  ShoppingBag,
  Target,
} from "lucide-react";

interface CommerceStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  customerSatisfaction: number;
}

interface CommerceDashboardProps {
  stats: CommerceStats;
  onNavigate: (path: string) => void;
}

export default function CommerceDashboard({
  stats,
  onNavigate,
}: CommerceDashboardProps) {
  const { getCurrencySymbol } = useCurrency();
  const handleCreateProject = () => onNavigate("/projects");
  const handleNewSale = () => onNavigate("/pos/sale");
  const handleViewSales = () => onNavigate("/sales");
  const handleViewInventory = () => onNavigate("/inventory");
  const handleAddInvestment = () => onNavigate("/ledger/investments");

  return (
    <div className="space-y-8">
      {/* Commerce-Specific Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Commerce Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Retail & E-commerce Business Overview
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCreateProject}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
          <Button
            onClick={handleNewSale}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Sale
          </Button>
          <Button
            onClick={handleAddInvestment}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Add Investment
          </Button>
        </div>
      </div>

      {/* Commerce-Specific Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {getCurrencySymbol()}
              {(stats.totalSales ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalOrders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Orders processed</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {getCurrencySymbol()}
              {stats.averageOrderValue ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Customer Satisfaction
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.customerSatisfaction ?? 0}%
            </div>
            <p className="text-xs text-muted-foreground">Rating score</p>
          </CardContent>
        </Card>
      </div>

      {/* Commerce-Specific Content Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Monthly Growth</span>
              <span className="text-sm text-green-600">+12.5%</span>
            </div>
            <Progress value={75} className="h-2" />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeProjects ?? 0}
                </div>
                <div className="text-xs text-gray-600">Active Campaigns</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalTeamMembers ?? 0}
                </div>
                <div className="text-xs text-gray-600">Sales Team</div>
              </div>
            </div>

            <Button
              onClick={handleViewSales}
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
            >
              View Sales Analytics
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Inventory & POS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              Inventory & POS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                <span className="text-sm">Low Stock Items</span>
                <Badge variant="destructive">5</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                <span className="text-sm">Pending Orders</span>
                <Badge variant="secondary">12</Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                <span className="text-sm">Today&apos;s Sales</span>
                <Badge variant="default">{getCurrencySymbol()}2,450</Badge>
              </div>
            </div>

            <Button
              onClick={handleViewInventory}
              variant="outline"
              className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Manage Inventory
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => onNavigate("/pos")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Point of Sale</span>
            </Button>

            <Button
              onClick={() => onNavigate("/crm")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Customer CRM</span>
            </Button>

            <Button
              onClick={() => onNavigate("/inventory")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <Package className="h-6 w-6" />
              <span className="text-sm">Inventory</span>
            </Button>

            <Button
              onClick={() => onNavigate("/reports")}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              <BarChart3 className="h-6 w-6" />
              <span className="text-sm">Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
