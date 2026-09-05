"use client";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Plus } from "lucide-react";
import { LeadSaleItem } from "@/src/models/crm";
import CRMService from "@/src/services/CRMService";

type Props = {
  leadId: string;
  sales: LeadSaleItem[];
  saleRole: string;
  setSaleRole: (v: string) => void;
  saleMls: string;
  setSaleMls: (v: string) => void;
  salePrice: string;
  setSalePrice: (v: string) => void;
  saleDate: string;
  setSaleDate: (v: string) => void;
  loadTabData: () => Promise<void>;
};

export function LeadSoldTab({
  leadId,
  sales,
  saleRole,
  setSaleRole,
  saleMls,
  setSaleMls,
  salePrice,
  setSalePrice,
  saleDate,
  setSaleDate,
  loadTabData,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await CRMService.createLeadSale(leadId, {
              agentRole: saleRole || "Listing Agent",
              mlsNumber: saleMls || undefined,
              sellingPrice: salePrice ? Number(salePrice) : undefined,
              closingDate: saleDate
                ? new Date(saleDate).toISOString()
                : undefined,
            });
            setSaleRole("");
            setSaleMls("");
            setSalePrice("");
            setSaleDate("");
            loadTabData();
          }}
        >
          <Plus className="h-3 w-3 mr-1" /> Add a Sale
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Input
          placeholder="Agent role"
          value={saleRole}
          onChange={(e) => setSaleRole(e.target.value)}
        />
        <Input
          type="date"
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
        />
        <Input
          placeholder="MLS"
          value={saleMls}
          onChange={(e) => setSaleMls(e.target.value)}
        />
        <Input
          placeholder="Price"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted-foreground border-b">
            <th className="text-left pb-2">Agent Role</th>
            <th className="text-left pb-2">Closing Date</th>
            <th className="text-left pb-2">MLS Number</th>
            <th className="text-left pb-2">Selling Price</th>
          </tr>
        </thead>
        <tbody>
          {sales.length === 0 ? (
            <tr>
              <td
                colSpan={4}
                className="py-8 text-center text-muted-foreground text-xs"
              >
                No sales recorded yet.
              </td>
            </tr>
          ) : (
            sales.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2">{s.agentRole}</td>
                <td className="py-2">
                  {s.closingDate
                    ? new Date(s.closingDate).toLocaleDateString()
                    : "—"}
                </td>
                <td className="py-2">{s.mlsNumber || "—"}</td>
                <td className="py-2">
                  {s.sellingPrice != null
                    ? `$${s.sellingPrice.toLocaleString()}`
                    : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
