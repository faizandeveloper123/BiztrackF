"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Eye } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import { getTransactionTypeLabel } from "@/src/models/banking";
import {
  getBankAccountDisplay,
  getStatusBadge,
  getTransactionIcon,
  isIncome,
} from "./bankingUtils";
import type { RecentTransactionsTableProps } from "./types";

export function RecentTransactionsTable({
  transactions,
  bankAccounts,
  formatCurrency,
  onViewAll,
}: RecentTransactionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Button variant="outline" onClick={onViewAll}>
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="min-w-[10rem]">Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Running Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(transactions || []).map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {formatDate(transaction.transactionDate)}
                </TableCell>
                <TableCell className="max-w-[14rem]">
                  <div
                    className="truncate text-sm"
                    title={getBankAccountDisplay(
                      transaction.bankAccountId,
                      bankAccounts,
                    )}
                  >
                    {getBankAccountDisplay(
                      transaction.bankAccountId,
                      bankAccounts,
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.transactionType)}
                    <span>
                      {getTransactionTypeLabel(transaction.transactionType)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate">
                    {transaction.description}
                  </div>
                  {transaction.counterpartyName && (
                    <div className="text-sm text-muted-foreground">
                      {transaction.counterpartyName}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div
                    className={`font-medium ${
                      isIncome(transaction.transactionType)
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isIncome(transaction.transactionType) ? "+" : "-"}
                    {formatCurrency(transaction.baseAmount)}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {formatCurrency(transaction.runningBalance || 0)}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onViewAll}
                    title="Open transactions"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
