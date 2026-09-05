import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '../services/ApiService';
import { useAuth } from './AuthContext';

type EmployeeAccessContextValue = {
  isEmployee: boolean;
  loading: boolean;
};

const EmployeeAccessContext = createContext<EmployeeAccessContextValue | undefined>(
  undefined,
);

export function EmployeeAccessProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentTenant } = useAuth();
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!isAuthenticated || !currentTenant) {
      setIsEmployee(false);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    void apiService
      .get<{ isEmployee: boolean }>('/employee-portal/access')
      .then((response) => {
        if (!cancelled) setIsEmployee(response.isEmployee === true);
      })
      .catch(() => {
        if (!cancelled) setIsEmployee(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, currentTenant?.id]);

  return (
    <EmployeeAccessContext.Provider value={{ isEmployee, loading }}>
      {children}
    </EmployeeAccessContext.Provider>
  );
}

export function useEmployeeAccess() {
  const context = useContext(EmployeeAccessContext);
  if (!context) {
    throw new Error('useEmployeeAccess must be used within EmployeeAccessProvider');
  }
  return context;
}
