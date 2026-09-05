"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Loader2, Building } from "lucide-react";
import { apiService } from "../../services/ApiService";

interface Tenant {
  id: string;
  name: string;
  domain?: string;
}

interface TenantSelectorProps {
  value?: string;
  onChange: (tenantId: string) => void;
  className?: string;
}

export default function TenantSelector({
  value,
  onChange,
  className,
}: TenantSelectorProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await apiService.getMyTenants();
      setTenants(response || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Organization</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-600">
            Loading organizations...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>Organization</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <SelectValue placeholder="Select organization" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {tenants.map((tenant) => (
            <SelectItem key={tenant.id} value={tenant.id}>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{tenant.name}</div>
                  {tenant.domain && (
                    <div className="text-xs text-gray-500">{tenant.domain}</div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
