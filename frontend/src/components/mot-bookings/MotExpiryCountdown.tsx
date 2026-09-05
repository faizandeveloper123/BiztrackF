"use client";

import { useEffect, useState } from "react";

const MONTH_MS = 30.4375 * 86400000;
const WEEK_MS = 7 * 86400000;
const DAY_MS = 86400000;
const HOUR_MS = 3600000;
const MINUTE_MS = 60000;
const SECOND_MS = 1000;

type Level = "far" | "mid" | "soon";

const TONE_CLASS: Record<Level | "none" | "expired", string> = {
  none: "text-muted-foreground",
  far: "text-emerald-600",
  mid: "text-amber-600",
  soon: "text-rose-600",
  expired: "text-red-700",
};

function parseDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickLevel(ms: number): Level {
  if (ms <= 30 * DAY_MS) return "soon";
  if (ms <= 180 * DAY_MS) return "mid";
  return "far";
}

function formatFar(ms: number): string {
  const totalSeconds = Math.floor(ms / SECOND_MS);
  const days = Math.floor(totalSeconds / (DAY_MS / SECOND_MS));
  const monthDays = MONTH_MS / DAY_MS;
  const months = Math.floor(days / monthDays);
  const rem = days - months * monthDays;
  const weeks = Math.floor(rem / (WEEK_MS / DAY_MS));
  const remainingDays = Math.floor(rem - weeks * (WEEK_MS / DAY_MS));
  const parts: string[] = [];
  if (months > 0) parts.push(`${months}mo`);
  if (weeks > 0) parts.push(`${weeks}w`);
  if (remainingDays > 0) parts.push(`${remainingDays}d`);
  return parts.length ? parts.join(" ") : "0d";
}

function formatMid(ms: number): string {
  const totalSeconds = Math.floor(ms / SECOND_MS);
  const days = Math.floor(totalSeconds / (DAY_MS / SECOND_MS));
  const hours = Math.floor(
    (totalSeconds % (DAY_MS / SECOND_MS)) / (HOUR_MS / SECOND_MS),
  );
  const weeks = Math.floor(days / (WEEK_MS / DAY_MS));
  const remainingDays = days % (WEEK_MS / DAY_MS);
  const parts: string[] = [];
  if (weeks > 0) parts.push(`${weeks}w`);
  if (remainingDays > 0) parts.push(`${remainingDays}d`);
  if (hours > 0) parts.push(`${hours}h`);
  return parts.length ? parts.join(" ") : "0d";
}

function formatSoon(ms: number): string {
  const totalSeconds = Math.floor(ms / SECOND_MS);
  const days = Math.floor(totalSeconds / (DAY_MS / SECOND_MS));
  const hours = Math.floor(
    (totalSeconds % (DAY_MS / SECOND_MS)) / (HOUR_MS / SECOND_MS),
  );
  const minutes = Math.floor(
    (totalSeconds % (HOUR_MS / SECOND_MS)) / (MINUTE_MS / SECOND_MS),
  );
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
}

export function MotExpiryCountdown({
  expiryDate,
  showExpiryDate = false,
}: {
  expiryDate?: string;
  showExpiryDate?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const startOfDay = parseDateOnly(expiryDate);

  if (!startOfDay) {
    return <span className={`tabular-nums ${TONE_CLASS.none}`}>—</span>;
  }

  const ms = startOfDay.getTime() + DAY_MS - 1 - now;

  if (ms <= 0) {
    return (
      <span className={`tabular-nums font-semibold ${TONE_CLASS.expired}`}>
        Expired
      </span>
    );
  }

  const level = pickLevel(ms);
  const text =
    level === "far"
      ? formatFar(ms)
      : level === "mid"
        ? formatMid(ms)
        : formatSoon(ms);

  return (
    <span className={`text-sm font-medium tabular-nums ${TONE_CLASS[level]}`}>
      {text}
      {showExpiryDate && expiryDate ? (
        <span className="ml-2 text-muted-foreground">
          expires {expiryDate.slice(0, 10)}
        </span>
      ) : null}
    </span>
  );
}