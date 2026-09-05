"use client";

import { TrendingUp, TrendingDown, Receipt, CheckCircle } from "lucide-react";
import {
  TransactionType,
  TransactionStatus,
  type ChartOfAccountsResponse,
} from "@/src/models/ledger";

export function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case TransactionType.INCOME:
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case TransactionType.EXPENSE:
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case TransactionType.TRANSFER:
      return <Receipt className="h-4 w-4 text-blue-600" />;
    case TransactionType.ADJUSTMENT:
      return <CheckCircle className="h-4 w-4 text-yellow-600" />;
    case TransactionType.REFUND:
      return <Receipt className="h-4 w-4 text-purple-600" />;
    default:
      return <Receipt className="h-4 w-4" />;
  }
}

export function getStatusColor(
  status: TransactionStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case TransactionStatus.COMPLETED:
      return "default";
    case TransactionStatus.PENDING:
      return "secondary";
    case TransactionStatus.CANCELLED:
      return "destructive";
    case TransactionStatus.FAILED:
      return "destructive";
    default:
      return "outline";
  }
}

export function getAccountName(
  accountId: string,
  accounts: ChartOfAccountsResponse[] | undefined,
) {
  return (
    accounts?.find((acc) => acc.id === accountId)?.account_name || accountId
  );
}
