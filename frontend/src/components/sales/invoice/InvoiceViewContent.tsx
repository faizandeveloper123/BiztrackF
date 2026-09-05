"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Calculator, User, Building } from "lucide-react";
import type { Invoice } from "@/src/models/sales";
import InvoiceService from "@/src/services/InvoiceService";
import { useCurrency } from "@/src/contexts/CurrencyContext";
import { hasWorkshopInvoiceData } from "@/src/utils/sales/invoiceFormUtils";
import { InvoiceDetailField } from "./InvoiceDetailField";

type InvoiceViewContentProps = {
  invoice: Invoice;
  onClose: () => void;
};

export function InvoiceViewContent({
  invoice,
  onClose,
}: InvoiceViewContentProps) {
  const { formatCurrency } = useCurrency();
  const showWorkshop = hasWorkshopInvoiceData(invoice);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{invoice.invoiceNumber}</span>
            <span
              className={`rounded px-2 py-1 text-xs ${InvoiceService.getStatusColor(invoice.status)}`}
            >
              {InvoiceService.getStatusLabel(invoice.status)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InvoiceDetailField
            label="Total"
            value={formatCurrency(invoice.total)}
          />
          <InvoiceDetailField
            label="Paid"
            value={
              <span className="text-green-600">
                {formatCurrency(invoice.totalPaid)}
              </span>
            }
          />
          <InvoiceDetailField
            label="Balance"
            value={
              <span
                className={
                  invoice.balance > 0 ? "text-red-600" : "text-green-600"
                }
              >
                {formatCurrency(invoice.balance)}
              </span>
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InvoiceDetailField
            label="Customer Name"
            value={invoice.customerName || "-"}
          />
          <InvoiceDetailField
            label="Customer ID"
            value={invoice.customerId || "-"}
          />
          <InvoiceDetailField
            label="Customer Email"
            value={invoice.customerEmail || "-"}
          />
          <InvoiceDetailField
            label="Customer Phone"
            value={invoice.customerPhone || "-"}
          />
          <InvoiceDetailField
            label="Billing Address"
            value={invoice.billingAddress || "-"}
          />
          <InvoiceDetailField
            label="Shipping Address"
            value={invoice.shippingAddress || "-"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Invoice Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InvoiceDetailField
            label="Issue Date"
            value={InvoiceService.formatDate(invoice.issueDate)}
          />
          <InvoiceDetailField
            label="Due Date"
            value={InvoiceService.formatDate(invoice.dueDate)}
          />
          <InvoiceDetailField
            label="Order Number"
            value={invoice.orderNumber || "-"}
          />
          <InvoiceDetailField
            label="Order Time"
            value={
              invoice.orderTime
                ? InvoiceService.formatDate(invoice.orderTime)
                : "-"
            }
          />
          <InvoiceDetailField
            label="Opportunity ID"
            value={invoice.opportunityId || "-"}
          />
          <InvoiceDetailField label="Quote ID" value={invoice.quoteId || "-"} />
          <InvoiceDetailField
            label="Project ID"
            value={invoice.projectId || "-"}
          />
        </CardContent>
      </Card>

      {showWorkshop && (
        <Card>
          <CardHeader>
            <CardTitle>Workshop Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InvoiceDetailField
              label="Registration"
              value={invoice.vehicleReg || "-"}
            />
            <InvoiceDetailField
              label="Job Card"
              value={invoice.jobCardId || "-"}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Invoice Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoice.items.length > 0 ? (
            invoice.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 md:grid-cols-6"
              >
                <InvoiceDetailField
                  label="Description"
                  value={item.description || "-"}
                  className="md:col-span-2"
                />
                <InvoiceDetailField label="Quantity" value={item.quantity} />
                <InvoiceDetailField
                  label="Sale Price"
                  value={formatCurrency(item.salePrice)}
                />
                <InvoiceDetailField
                  label="Discount"
                  value={`${item.discount}%`}
                />
                <InvoiceDetailField label="Tax" value={`${item.taxRate}%`} />
                <InvoiceDetailField
                  label="Line Total"
                  value={formatCurrency(item.total)}
                />
              </div>
            ))
          ) : (
            <p className="text-gray-500">No invoice items.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InvoiceDetailField
            label="Subtotal"
            value={formatCurrency(invoice.subtotal)}
          />
          {invoice.labourCost ? (
            <InvoiceDetailField
              label="Labour Cost"
              value={formatCurrency(invoice.labourCost)}
            />
          ) : null}
          {invoice.taxAmount > 0 ? (
            <InvoiceDetailField
              label={
                invoice.vatRate && invoice.vatRate > 0
                  ? `VAT (${Math.round(invoice.vatRate * 100)}%)`
                  : "VAT"
              }
              value={formatCurrency(invoice.taxAmount)}
            />
          ) : null}
          <InvoiceDetailField
            label="Total"
            value={
              <span className="font-semibold">
                {formatCurrency(invoice.total)}
              </span>
            }
          />
          <InvoiceDetailField
            label="Total Paid"
            value={formatCurrency(invoice.totalPaid)}
          />
          <InvoiceDetailField
            label="Balance"
            value={formatCurrency(invoice.balance)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <InvoiceDetailField
            label="Terms & Conditions"
            value={invoice.terms || "-"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <InvoiceDetailField
            label="Created At"
            value={InvoiceService.formatDate(invoice.createdAt)}
          />
          <InvoiceDetailField
            label="Updated At"
            value={InvoiceService.formatDate(invoice.updatedAt)}
          />
          <InvoiceDetailField
            label="Sent At"
            value={
              invoice.sentAt ? InvoiceService.formatDate(invoice.sentAt) : "-"
            }
          />
          <InvoiceDetailField
            label="Viewed At"
            value={
              invoice.viewedAt
                ? InvoiceService.formatDate(invoice.viewedAt)
                : "-"
            }
          />
          <InvoiceDetailField
            label="Paid At"
            value={
              invoice.paidAt ? InvoiceService.formatDate(invoice.paidAt) : "-"
            }
          />
          <InvoiceDetailField
            label="Overdue At"
            value={
              invoice.overdueAt
                ? InvoiceService.formatDate(invoice.overdueAt)
                : "-"
            }
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
