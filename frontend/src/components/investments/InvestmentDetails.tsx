"use client";

import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useCurrency } from "../../contexts/CurrencyContext";
import { Investment } from "../../services/InvestmentService";
import {
  TrendingUp,
  Calendar,
  FileText,
  Tag,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Package,
  CreditCard,
  Building,
  User,
  Hash,
} from "lucide-react";

interface InvestmentDetailsProps {
  investment: Investment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvestmentDetails({
  investment,
  isOpen,
  onClose,
}: InvestmentDetailsProps) {
  const { getCurrencySymbol } = useCurrency();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      cancelled: "destructive",
      failed: "destructive",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cash_investment":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "card_transfer":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank_transfer":
        return <Building className="h-4 w-4 text-purple-600" />;
      case "equipment_purchase":
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      cash_investment: "Cash Investment",
      card_transfer: "Card Transfer",
      bank_transfer: "Bank Transfer",
      equipment_purchase: "Equipment Purchase",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog
      open={isOpen && !!investment}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!investment ? null : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Investment Details
              </DialogTitle>
              <DialogDescription>
                View detailed information about this investment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Investment Number and Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      {investment.investment_number}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(investment.status)}
                      {getStatusBadge(investment.status)}
                    </div>
                  </CardTitle>
                </CardHeader>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Investment Date</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(
                            investment.investment_date,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getTypeIcon(investment.investment_type)}
                      <div>
                        <p className="text-sm font-medium">Investment Type</p>
                        <p className="text-sm text-muted-foreground">
                          {getTypeLabel(investment.investment_type)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Amount</p>
                        <p className="text-sm text-muted-foreground">
                          {getCurrencySymbol()}
                          {investment.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {investment.currency && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Currency</p>
                          <p className="text-sm text-muted-foreground">
                            {investment.currency}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{investment.description}</p>
                </CardContent>
              </Card>

              {/* Reference Information */}
              {(investment.reference_number || investment.reference_type) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reference Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {investment.reference_number && (
                      <div>
                        <p className="text-sm font-medium">Reference Number</p>
                        <p className="text-sm text-muted-foreground">
                          {investment.reference_number}
                        </p>
                      </div>
                    )}
                    {investment.reference_type && (
                      <div>
                        <p className="text-sm font-medium">Reference Type</p>
                        <p className="text-sm text-muted-foreground">
                          {investment.reference_type}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {investment.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{investment.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {investment.tags && investment.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {investment.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              {investment.meta_data &&
                Object.keys(investment.meta_data).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(investment.meta_data).map(
                          ([key, value]) => (
                            <div key={key}>
                              <p className="text-sm font-medium capitalize">
                                {key.replace(/_/g, " ")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {typeof value === "object"
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Audit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Audit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Created By</p>
                    <p className="text-sm text-muted-foreground">
                      {investment.created_by_id}
                    </p>
                  </div>
                  {investment.approved_by_id && (
                    <div>
                      <p className="text-sm font-medium">Approved By</p>
                      <p className="text-sm text-muted-foreground">
                        {investment.approved_by_id}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Created At</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(investment.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(investment.updated_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
