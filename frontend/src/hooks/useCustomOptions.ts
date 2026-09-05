import { useState, useEffect, useCallback } from "react";
import { useApiService } from "./useApiService";
import {
  CustomOptionsService,
  CustomOption,
} from "../services/CustomOptionsService";

export function useCustomOptions() {
  const apiService = useApiService();
  const [customOptionsService] = useState(
    () => new CustomOptionsService(apiService),
  );

  // State for different custom options
  const [customEventTypes, setCustomEventTypes] = useState<CustomOption[]>([]);
  const [customDepartments, setCustomDepartments] = useState<CustomOption[]>(
    [],
  );
  const [customLeaveTypes, setCustomLeaveTypes] = useState<CustomOption[]>([]);
  const [customLeadSources, setCustomLeadSources] = useState<CustomOption[]>(
    [],
  );
  const [customContactSources, setCustomContactSources] = useState<
    CustomOption[]
  >([]);
  const [customCompanyIndustries, setCustomCompanyIndustries] = useState<
    CustomOption[]
  >([]);
  const [customContactTypes, setCustomContactTypes] = useState<CustomOption[]>(
    [],
  );
  const [customIndustries, setCustomIndustries] = useState<CustomOption[]>([]);

  // Loading states
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Load all custom options
  const loadAllCustomOptions = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, all: true }));

      const [
        eventTypes,
        departments,
        leaveTypes,
        leadSources,
        contactSources,
        companyIndustries,
        contactTypes,
        industries,
      ] = await Promise.all([
        customOptionsService.getCustomEventTypes(),
        customOptionsService.getCustomDepartments(),
        customOptionsService.getCustomLeaveTypes(),
        customOptionsService.getCustomLeadSources(),
        customOptionsService.getCustomContactSources(),
        customOptionsService.getCustomCompanyIndustries(),
        customOptionsService.getCustomContactTypes(),
        customOptionsService.getCustomIndustries(),
      ]);

      setCustomEventTypes(Array.isArray(eventTypes) ? eventTypes : []);
      setCustomDepartments(Array.isArray(departments) ? departments : []);
      setCustomLeaveTypes(Array.isArray(leaveTypes) ? leaveTypes : []);
      setCustomLeadSources(Array.isArray(leadSources) ? leadSources : []);
      setCustomContactSources(
        Array.isArray(contactSources) ? contactSources : [],
      );
      setCustomCompanyIndustries(
        Array.isArray(companyIndustries) ? companyIndustries : [],
      );
      setCustomContactTypes(Array.isArray(contactTypes) ? contactTypes : []);
      setCustomIndustries(Array.isArray(industries) ? industries : []);
    } catch (error) {
    } finally {
      setLoading((prev) => ({ ...prev, all: false }));
    }
  }, [customOptionsService]);

  // Create custom event type
  const createCustomEventType = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, eventType: true }));
        const newType = await customOptionsService.createCustomEventType(
          name,
          description,
        );
        setCustomEventTypes((prev) => [...prev, newType]);
        return newType;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, eventType: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom department
  const createCustomDepartment = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, department: true }));
        const newDept = await customOptionsService.createCustomDepartment(
          name,
          description,
        );
        setCustomDepartments((prev) => [...prev, newDept]);
        return newDept;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, department: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom leave type
  const createCustomLeaveType = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, leaveType: true }));
        const newLeave = await customOptionsService.createCustomLeaveType(
          name,
          description,
        );
        setCustomLeaveTypes((prev) => [...prev, newLeave]);
        return newLeave;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, leaveType: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom lead source
  const createCustomLeadSource = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, leadSource: true }));
        const newSource = await customOptionsService.createCustomLeadSource(
          name,
          description,
        );
        setCustomLeadSources((prev) => [...prev, newSource]);
        return newSource;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, leadSource: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom contact source
  const createCustomContactSource = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, contactSource: true }));
        const newSource = await customOptionsService.createCustomContactSource(
          name,
          description,
        );
        setCustomContactSources((prev) => [...prev, newSource]);
        return newSource;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, contactSource: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom company industry
  const createCustomCompanyIndustry = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, companyIndustry: true }));
        const newIndustry =
          await customOptionsService.createCustomCompanyIndustry(
            name,
            description,
          );
        setCustomCompanyIndustries((prev) => [...prev, newIndustry]);
        return newIndustry;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, companyIndustry: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom contact type
  const createCustomContactType = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, contactType: true }));
        const newType = await customOptionsService.createCustomContactType(
          name,
          description,
        );
        setCustomContactTypes((prev) => [...prev, newType]);
        return newType;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, contactType: false }));
      }
    },
    [customOptionsService],
  );

  // Create custom industry
  const createCustomIndustry = useCallback(
    async (name: string, description?: string) => {
      try {
        setLoading((prev) => ({ ...prev, industry: true }));
        const newIndustry = await customOptionsService.createCustomIndustry(
          name,
          description,
        );
        setCustomIndustries((prev) => [...prev, newIndustry]);
        return newIndustry;
      } catch (error) {
        throw error;
      } finally {
        setLoading((prev) => ({ ...prev, industry: false }));
      }
    },
    [customOptionsService],
  );

  // Load options on mount
  useEffect(() => {
    loadAllCustomOptions();
  }, [loadAllCustomOptions]);

  return {
    // State
    customEventTypes,
    customDepartments,
    customLeaveTypes,
    customLeadSources,
    customContactSources,
    customCompanyIndustries,
    customContactTypes,
    customIndustries,

    // Loading states
    loading,

    // Actions
    createCustomEventType,
    createCustomDepartment,
    createCustomLeaveType,
    createCustomLeadSource,
    createCustomContactSource,
    createCustomCompanyIndustry,
    createCustomContactType,
    createCustomIndustry,

    // Refresh
    loadAllCustomOptions,
  };
}
