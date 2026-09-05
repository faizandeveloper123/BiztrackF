"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import { getTransactionTypeLabel } from "@/src/models/ledger";
import { getTransactionIcon, getStatusColor, getAccountName } from "./ledgerUtils";
import type { LedgerTransactionsTableProps } from "./types";

export function LedgerTransactionsTable({
  transactions,
  accounts,
  formatCurrency,
  onView,
  onEdit,
  onDelete,
}: LedgerTransactionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>
          {transactions.length} transactions found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Debit Account</TableHead>
              <TableHead>Credit Account</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.transaction_number}
                </TableCell>
                <TableCell>{formatDate(transaction.transaction_date)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTransactionIcon(transaction.transaction_type)}
                    {getTransactionTypeLabel(transaction.transaction_type)}
                  </div>
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>
                  {getAccountName(transaction.account_id, accounts)}
                </TableCell>
                <TableCell>
                  {getAccountName(transaction.contra_account_id, accounts)}
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(transaction.status)}>
                    {transaction.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(transaction)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {transactions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
