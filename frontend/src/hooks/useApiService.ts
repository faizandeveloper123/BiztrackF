import { useMemo } from "react";
import { ApiService } from "../services/ApiService";

export function useApiService() {
  const apiService = useMemo(() => new ApiService(), []);
  return apiService;
}
