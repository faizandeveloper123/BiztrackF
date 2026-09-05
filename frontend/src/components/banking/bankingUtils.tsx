"use client";

import { Badge } from "@/src/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  type BankAccount,
  TransactionType,
  TransactionStatus,
} from "@/src/models/banking";

const INCOME_TYPES = [
  TransactionType.DEPOSIT,
  TransactionType.TRANSFER_IN,
  TransactionType.REFUND,
  TransactionType.INTEREST,
];

const STATUS_CONFIG: Record<
  TransactionStatus,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  [TransactionStatus.PENDING]: { variant: "secondary", label: "Pending" },
  [TransactionStatus.PROCESSING]: { variant: "default", label: "Processing" },
  [TransactionStatus.COMPLETED]: { variant: "default", label: "Completed" },
  [TransactionStatus.FAILED]: { variant: "destructive", label: "Failed" },
  [TransactionStatus.CANCELLED]: { variant: "outline", label: "Cancelled" },
  [TransactionStatus.REVERSED]: { variant: "outline", label: "Reversed" },
};

export function getBankAccountDisplay(
  accountId: string,
  bankAccounts: BankAccount[],
) {
  const acc = bankAccounts.find((a) => a.id === accountId);
  if (!acc) return accountId ? "Unknown account" : "—";
  return `${acc.accountName} · ${acc.bankName}`;
}

export function getStatusBadge(status: TransactionStatus) {
  const config =
    STATUS_CONFIG[status] || STATUS_CONFIG[TransactionStatus.PENDING];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case TransactionType.DEPOSIT:
    case TransactionType.TRANSFER_IN:
    case TransactionType.REFUND:
    case TransactionType.INTEREST:
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case TransactionType.WITHDRAWAL:
    case TransactionType.TRANSFER_OUT:
    case TransactionType.PAYMENT:
    case TransactionType.FEE:
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <TrendingUp className="h-4 w-4 text-gray-600" />;
  }
}

export function isIncome(type: TransactionType) {
  return INCOME_TYPES.includes(type);
}
