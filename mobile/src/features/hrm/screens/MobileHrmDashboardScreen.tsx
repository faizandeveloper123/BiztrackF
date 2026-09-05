import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { getHrmDashboard } from '../../../services/hrm/hrmMobileApi';
import type { HRMDashboard } from '../../../models/hrm';
import { ModuleHubScreen, type HubLink, type HubStat } from '../../../components/layout/ModuleHubScreen';
import { WS } from '../../workshop/components/workshopTheme';

const LINKS: HubLink[] = [
  { path: '/hrm/employees', label: 'Employees', icon: 'people', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/hrm/job-postings', label: 'Job postings', icon: 'briefcase', color: '#2563eb', bg: '#eff6ff' },
  { path: '/hrm/performance-reviews', label: 'Reviews', icon: 'ribbon', color: '#7c3aed', bg: '#f5f3ff' },
  { path: '/hrm/leave-management', label: 'Leave', icon: 'calendar', color: '#0891b2', bg: '#ecfeff' },
  { path: '/hrm/training', label: 'Training', icon: 'school', color: '#059669', bg: '#ecfdf5' },
  { path: '/hrm/payroll', label: 'Payroll', icon: 'wallet', color: '#d97706', bg: '#fffbeb' },
  { path: '/hrm/suppliers', label: 'Suppliers', icon: 'business', color: '#64748b', bg: '#f1f5f9' },
];

export function MobileHrmDashboardScreen() {
  const { workspacePath, setSidebarActivePath, navigateMenuPath } =
    useSidebarDrawer();
  const [data, setData] = useState<HRMDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getHrmDashboard();
      setData(d);
    } catch (e) {
      Alert.alert('HRM', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/hrm',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const m = data?.metrics;
  const hubStats: HubStat[] = m
    ? [
        { label: 'Employees', value: m.totalEmployees, sub: `${m.activeEmployees} active`, icon: 'people', accent: '#4f46e5', accentBg: '#eef2ff' },
        { label: 'New hires', value: m.newHires, sub: 'Last 30 days', icon: 'person-add', accent: '#2563eb', accentBg: '#eff6ff' },
        { label: 'Open roles', value: m.openPositions, sub: `${m.pendingApplications} applicants`, icon: 'briefcase', accent: '#7c3aed', accentBg: '#f5f3ff' },
        { label: 'Training', value: `${m.trainingCompletionRate}%`, sub: 'Completion rate', icon: 'school', accent: '#059669', accentBg: '#ecfdf5' },
      ]
    : [];

  return (
    <ModuleHubScreen
      title="HRM"
      subtitle="People, payroll & performance"
      accent={WS.primary}
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      stats={hubStats}
      links={LINKS}
      onNavigate={(path) => void navigateMenuPath(path)}
      linksTitle="HR modules"
    />
  );
}
