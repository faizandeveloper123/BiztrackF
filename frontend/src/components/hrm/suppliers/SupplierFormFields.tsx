"use client";

import type { SupplierFormData } from "./types";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { CountrySelect } from "@/src/components/ui/country-select";

type SupplierFormFieldsProps = {
  formData: SupplierFormData;
  onChange: (
    field: keyof SupplierFormData,
    value: string | number | boolean | undefined,
  ) => void;
};

export function SupplierFormFields({
  formData,
  onChange,
}: SupplierFormFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Supplier name"
        />
      </div>
      <div>
        <Label htmlFor="code">Code *</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => onChange("code", e.target.value)}
          placeholder="Supplier code"
        />
      </div>
      <div>
        <Label htmlFor="contactPerson">Contact Person</Label>
        <Input
          id="contactPerson"
          value={formData.contactPerson || ""}
          onChange={(e) => onChange("contactPerson", e.target.value)}
          placeholder="Contact person name"
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email || ""}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="contact@supplier.com"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone || ""}
          onChange={(e) => onChange("phone", e.target.value)}
          placeholder="Phone number"
        />
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          value={formData.website || ""}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://supplier.com"
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address || ""}
          onChange={(e) => onChange("address", e.target.value)}
          placeholder="Street address"
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input
          id="city"
          value={formData.city || ""}
          onChange={(e) => onChange("city", e.target.value)}
          placeholder="City"
        />
      </div>
      <div>
        <Label htmlFor="state">State</Label>
        <Input
          id="state"
          value={formData.state || ""}
          onChange={(e) => onChange("state", e.target.value)}
          placeholder="State"
        />
      </div>

      <div>
        <Label htmlFor="postalCode">Postal Code</Label>
        <Input
          id="postalCode"
          value={formData.postalCode || ""}
          onChange={(e) => onChange("postalCode", e.target.value)}
          placeholder="ZIP/Postal code"
        />
      </div>
      <div>
        <CountrySelect
          value={formData.country || ""}
          onChange={(value) => onChange("country", value)}
          placeholder="Select country..."
        />
      </div>
      <div>
        <Label htmlFor="paymentTerms">Payment Terms</Label>
        <Input
          id="paymentTerms"
          value={formData.paymentTerms || ""}
          onChange={(e) => onChange("paymentTerms", e.target.value)}
          placeholder="e.g., Net 30"
        />
      </div>

      <div>
        <Label htmlFor="creditLimit">Credit Limit</Label>
        <Input
          id="creditLimit"
          type="number"
          value={formData.creditLimit ?? ""}
          onChange={(e) =>
            onChange(
              "creditLimit",
              e.target.value === ""
                ? undefined
                : parseFloat(e.target.value) || 0,
            )
          }
          placeholder="e.g. 50000"
        />
      </div>
      <div className="flex items-center space-x-2 pt-8">
        <Switch
          id="isActive"
          checked={formData.isActive ?? true}
          onCheckedChange={(checked) => onChange("isActive", checked)}
        />
        <Label htmlFor="isActive">Active Supplier</Label>
      </div>
    </div>
  );
}
