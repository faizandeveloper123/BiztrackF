"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Banknote, Eye } from "lucide-react";
import type { BankAccountsListProps } from "./types";

export function BankAccountsList({
  accounts,
  formatCurrency,
  onView,
}: BankAccountsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(accounts || []).map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Banknote className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">
                      {account.accountName || "Unnamed Account"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.bankName || "Unknown Bank"} •{" "}
                      {account.accountNumber
                        ? account.accountNumber.slice(-4)
                        : "N/A"}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{account.accountType}</Badge>
                {account.isPrimary && (
                  <Badge variant="default">Primary</Badge>
                )}
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {formatCurrency(account.currentBalance || 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Available: {formatCurrency(account.availableBalance || 0)}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(account)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
