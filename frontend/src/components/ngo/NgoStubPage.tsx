"use client";

import { DashboardLayout } from "@/src/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Construction } from "lucide-react";

type NgoStubPageProps = {
  title: string;
  description?: string;
};

export function NgoStubPage({ title, description }: NgoStubPageProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Construction className="h-5 w-5 text-emerald-600" />
              {title}
            </CardTitle>
            <CardDescription>
              {description ??
                "This page is part of the NGO module. Live data and workflows will connect here soon."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mock navigation is ready. Backend integration is planned for a
              later release.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
