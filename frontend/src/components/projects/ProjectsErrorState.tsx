"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ProjectsErrorStateProps {
  error: string;
  onRetry: () => void;
}

export function ProjectsErrorState({
  error,
  onRetry,
}: ProjectsErrorStateProps) {
  return (
    <Card className="modern-card">
      <CardContent className="p-8 text-center">
        <p className="text-red-600">{error}</p>
        <Button onClick={onRetry} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
