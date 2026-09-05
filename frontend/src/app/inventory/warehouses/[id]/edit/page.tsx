"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ModuleGuard } from "../../../../../components/guards/PermissionGuard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { Label } from "../../../../../components/ui/label";
import { Textarea } from "../../../../../components/ui/textarea";
import { Switch } from "../../../../../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useAuth } from "../../../../../contexts/AuthContext";
import { inventoryService } from "../../../../../services/InventoryService";
import { DashboardLayout } from "../../../../../components/layout";
import { toast } from "sonner";
import { useCrudPermissions } from "@/src/hooks/usePermissions";

export default function EditWarehousePage() {
  return (
    <ModuleGuard
      module="inventory"
      fallback={<div>You don&apos;t have access to Inventory module</div>}
    >
      <EditWarehouseContent />
    </ModuleGuard>
  );
}

function EditWarehouseContent() {
  const { canUpdate } = useCrudPermissions("inventory:warehouses");
  const {} = useAuth();
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
    phone: "",
    email: "",
    capacity: "",
    temperatureZone: "",
    securityLevel: "",
    isActive: true,
  });

  useEffect(() => {
    fetchWarehouse();
  }, [warehouseId]);

  const fetchWarehouse = async () => {
    try {
      setInitialLoading(true);
      const response = await inventoryService.getWarehouse(warehouseId);
      const warehouse = response.warehouse;

      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        description: warehouse.description || "",
        address: warehouse.address,
        city: warehouse.city,
        state: warehouse.state,
        country: warehouse.country,
        postalCode: warehouse.postalCode,
        phone: warehouse.phone || "",
        email: warehouse.email || "",
        capacity: warehouse.capacity?.toString() || "",
        temperatureZone: warehouse.temperatureZone || "",
        securityLevel: warehouse.securityLevel || "",
        isActive: warehouse.isActive,
      });
    } catch (error) {
      toast.error("Failed to load warehouse data. Please try again.");
      router.push("/inventory/warehouses");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | boolean | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const warehouseData = {
        ...formData,
        capacity: formData.capacity ? parseFloat(formData.capacity) : undefined,
      };

      await inventoryService.updateWarehouse(warehouseId, warehouseData);
      router.push("/inventory/warehouses");
    } catch (error) {
      toast.error("Failed to update warehouse. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Edit Warehouse
            </h1>
            <p className="text-muted-foreground">
              Update warehouse information and settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Warehouse Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Main Warehouse"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Warehouse Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    placeholder="WH-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Brief description of the warehouse"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity (cubic meters)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    step="0.1"
                    value={formData.capacity}
                    onChange={(e) =>
                      handleInputChange("capacity", e.target.value)
                    }
                    placeholder="1000.0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder="123 Warehouse St"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="New York"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="NY"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    placeholder="United States"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code *</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      handleInputChange("postalCode", e.target.value)
                    }
                    placeholder="10001"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Contact & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="warehouse@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperatureZone">Temperature Zone</Label>
                  <Select
                    value={formData.temperatureZone}
                    onValueChange={(value) =>
                      handleInputChange("temperatureZone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select temperature zone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="refrigerated">
                        Refrigerated (2-8°C)
                      </SelectItem>
                      <SelectItem value="frozen">Frozen (-20°C)</SelectItem>
                      <SelectItem value="deep_frozen">
                        Deep Frozen (-80°C)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityLevel">Security Level</Label>
                  <Select
                    value={formData.securityLevel}
                    onValueChange={(value) =>
                      handleInputChange("securityLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select security level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="high">High Security</SelectItem>
                      <SelectItem value="maximum">Maximum Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleInputChange("isActive", checked)
                    }
                  />
                  <Label htmlFor="isActive">Active Warehouse</Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submit Button */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
                        {canUpdate() && (
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Warehouse
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
