import { useState, useCallback } from "react";
import { useApiService } from "./useApiService";
import {
  CustomOptionsService,
  CustomOption,
} from "../services/CustomOptionsService";
import { useCachedApi } from "./useCachedApi";

export function useCustomDepartments() {
  const apiService = useApiService();
  const [customOptionsService] = useState(
    () => new CustomOptionsService(apiService),
  );

  // Use cached API for departments with longer TTL since they don't change often
  const {
    data: customDepartments,
    loading: departmentsLoading,
    refetch: refetchDepartments,
  } = useCachedApi<CustomOption[]>(
    "custom-departments",
    () => customOptionsService.getCustomDepartments(),
    { ttl: 15 * 60 * 1000 }, // 15 minutes cache
  );

  // Create custom department
  const createCustomDepartment = useCallback(
    async (name: string, description?: string) => {
      try {
        const newDept = await customOptionsService.createCustomDepartment(
          name,
          description,
        );
        // Refetch to get updated list
        await refetchDepartments();
        return newDept;
      } catch (error) {
        throw error;
      }
    },
    [customOptionsService, refetchDepartments],
  );

  return {
    customDepartments: customDepartments || [],
    loading: departmentsLoading,
    createCustomDepartment,
    refetchDepartments,
  };
}
