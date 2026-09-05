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
import {
  Eye,
  Edit,
  CheckCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/src/lib/utils";
import {
  getTransactionTypeLabel,
  getPaymentMethodLabel,
} from "@/src/models/banking";
import {
  getBankAccountDisplay,
  getStatusBadge,
  getTransactionIcon,
  isIncome,
} from "./bankingUtils";
import type { TransactionsTableProps } from "./types";

export function TransactionsTable({
  transactions,
  bankAccounts,
  formatCurrency,
  isDeleting,
  onView,
  onEdit,
  onReconcile,
  onUnreconcile,
  onDelete,
}: TransactionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead className="min-w-[10rem]">Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reconciled</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatDate(transaction.transactionDate)}
                    </div>
                    {transaction.valueDate && (
                      <div className="text-sm text-muted-foreground">
                        Value: {formatDate(transaction.valueDate)}
                      </div>
                    )}
                  </div>
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
                  {transaction.paymentMethod && (
                    <div className="text-sm text-muted-foreground">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium truncate">
                      {transaction.description}
                    </div>
                    {transaction.referenceNumber && (
                      <div className="text-sm text-muted-foreground">
                        Ref: {transaction.referenceNumber}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {transaction.counterpartyName && (
                    <div>
                      <div className="font-medium">
                        {transaction.counterpartyName}
                      </div>
                      {transaction.counterpartyAccount && (
                        <div className="text-sm text-muted-foreground">
                          {transaction.counterpartyAccount}
                        </div>
                      )}
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
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {transaction.isReconciled ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm">
                      {transaction.isReconciled ? "Yes" : "No"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onView(transaction)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(transaction)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {transaction.isReconciled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUnreconcile(transaction.id)}
                        className="text-orange-600 hover:text-orange-700"
                        title="Unreconcile"
                      >
                        <Clock className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReconcile(transaction.id)}
                        className="text-green-600 hover:text-green-700"
                        title="Reconcile"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(transaction)}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700"
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
      </CardContent>
    </Card>
  );
}
