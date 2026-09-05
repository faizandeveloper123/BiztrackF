import { useState } from "react";
import { reportsService } from "../services/reportsService";
import { useCachedApi } from "./useCachedApi";

export const useReportsDashboard = () => {
  const result = useCachedApi(
    "reports-dashboard",
    () => {
      return reportsService
        .getDashboard()
        .then((data) => {
          return data;
        })
        .catch((error) => {
          throw error;
        });
    },
    {
      ttl: 5 * 60 * 1000, // 5 minutes
    },
  );

  return result;
};

export const useReportsSummary = () => {
  const result = useCachedApi(
    "reports-summary",
    () => {
      return reportsService
        .getSummary()
        .then((data) => {
          return data;
        })
        .catch((error) => {
          throw error;
        });
    },
    {
      ttl: 2 * 60 * 1000, // 2 minutes
    },
  );

  return result;
};

export const useProjectAnalytics = (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const cacheKey = `project-analytics-${JSON.stringify(filters || {})}`;

  return useCachedApi(
    cacheKey,
    () => reportsService.getProjectAnalytics(filters),
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    },
  );
};

export const useFinancialAnalytics = (filters?: {
  start_date?: string;
  end_date?: string;
}) => {
  const cacheKey = `financial-analytics-${JSON.stringify(filters || {})}`;

  return useCachedApi(
    cacheKey,
    () => reportsService.getFinancialAnalytics(filters),
    {
      ttl: 10 * 60 * 1000, // 10 minutes
    },
  );
};

export const useReportsExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportReports = async (
    reportType: string,
    format: string = "json",
    filters?: {
      start_date?: string;
      end_date?: string;
    },
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await reportsService.exportReports(
        reportType,
        format,
        filters,
      );
      return result;
    } catch (err: any) {
      setError(err.message || "Failed to export reports");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    exportReports,
    loading,
    error,
  };
};
