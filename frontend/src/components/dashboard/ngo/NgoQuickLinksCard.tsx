"use client";

import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { NGO_QUICK_LINKS } from "./ngoDashboardConfig";

export function NgoQuickLinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick links</CardTitle>
        <CardDescription>Programs, events, and finance</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {NGO_QUICK_LINKS.map((item) => (
          <Button key={item.href} variant="secondary" size="sm" asChild>
            <Link href={item.href}>{item.label}</Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
