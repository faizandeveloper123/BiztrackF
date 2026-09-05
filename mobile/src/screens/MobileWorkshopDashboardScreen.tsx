import React, { useCallback, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { useAuth } from '../contexts/AuthContext';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import { useDashboard, type DashboardData } from '../hooks/useDashboard';
import { usePlanInfo } from '../hooks/usePlanInfo';
import { WS, cardShadow } from '../features/workshop/components/workshopTheme';

export interface WorkshopDashStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  productionEfficiency: number;
}

function buildWorkshopStats(data: DashboardData | null): WorkshopDashStats {
  if (!data) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      totalTeamMembers: 0,
      averageProgress: 0,
      productionEfficiency: 0,
    };
  }
  const avgProgress =
    data.projects.recent.length > 0
      ? Math.round(
          data.projects.recent.reduce(
            (sum, p) => sum + p.completionPercent,
            0,
          ) / data.projects.recent.length,
        )
      : 0;
  const total = data.projects.stats.total;
  const completed = data.projects.stats.completed;
  return {
    totalProjects: total,
    activeProjects: data.projects.stats.active,
    completedProjects: completed,
    totalTeamMembers: data.users.total,
    averageProgress: avgProgress,
    productionEfficiency:
      total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

const quickLinks: {
  path: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}[] = [
  { path: '/workshop-management/job-cards', label: 'Job cards', icon: 'clipboard', color: '#4f46e5', bg: '#eef2ff' },
  { path: '/workshop-management/vehicles', label: 'Vehicles', icon: 'car', color: '#7c3aed', bg: '#f5f3ff' },
  { path: '/workshop-management/quality-control', label: 'Quality', icon: 'shield-checkmark', color: '#059669', bg: '#ecfdf5' },
  { path: '/workshop-management/mot/bookings', label: 'MOT bookings', icon: 'car-sport', color: '#0d9488', bg: '#ccfbf1' },
  { path: '/projects', label: 'Projects', icon: 'folder-open', color: '#64748b', bg: '#f1f5f9' },
  { path: '/crm/customers', label: 'Customers', icon: 'people', color: '#64748b', bg: '#f1f5f9' },
];

export function MobileWorkshopDashboardScreen() {
  const { logout, user, currentTenant } = useAuth();
  const { setSidebarActivePath, navigateMenuPath } = useSidebarDrawer();
  const { refreshPlanInfo } = usePlanInfo();
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
    refetch,
  } = useDashboard();

  const stats = useMemo(
    () => buildWorkshopStats(dashboardData),
    [dashboardData],
  );

  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  useEffect(() => {
    setSidebarActivePath('/dashboard');
  }, [setSidebarActivePath]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshPlanInfo(), refetch()]);
  }, [refreshPlanInfo, refetch]);

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')}`
    : user?.email ?? '';

  if (dashboardLoading && !dashboardData) {
    return (
      <View style={{ flex: 1, backgroundColor: WS.bg }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: WS.card }}>
          <MenuHeaderButton />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={WS.primary} />
          <Text style={{ marginTop: 12, color: WS.textMuted }}>Loading workshop…</Text>
        </View>
      </View>
    );
  }

  if (dashboardError) {
    return (
      <View style={{ flex: 1, backgroundColor: WS.bg }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: WS.card }}>
          <MenuHeaderButton />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: '700', color: WS.text }}>
            Dashboard error
          </Text>
          <Text style={{ marginTop: 8, textAlign: 'center', color: WS.textMuted }}>{dashboardError}</Text>
          <Pressable
            onPress={() => void onRefresh()}
            style={{ marginTop: 24, alignItems: 'center', borderRadius: 14, backgroundColor: WS.primary, paddingVertical: 14 }}
          >
            <Text style={{ fontWeight: '700', color: '#fff' }}>Try again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const statTiles = [
    { label: 'Active projects', value: stats.activeProjects, sub: `${stats.totalProjects} total · ${completionRate}% done`, icon: 'pulse' as const, accent: '#4f46e5', accentBg: '#eef2ff' },
    { label: 'Completed', value: stats.completedProjects, sub: 'Projects done', icon: 'checkmark-circle' as const, accent: '#059669', accentBg: '#ecfdf5' },
    { label: 'Efficiency', value: `${stats.productionEfficiency}%`, sub: 'Completed / total', icon: 'flash' as const, accent: '#10b981', accentBg: '#ecfdf5' },
    { label: 'Team', value: stats.totalTeamMembers, sub: 'Members', icon: 'people' as const, accent: '#7c3aed', accentBg: '#f5f3ff' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: WS.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={dashboardLoading}
          onRefresh={() => void onRefresh()}
          tintColor={WS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={{ backgroundColor: WS.primary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 28, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: 8 }}>
            <MenuHeaderButton />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Workshop</Text>
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Operations overview
              </Text>
              {currentTenant ? (
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
                  {currentTenant.name}{userLabel ? ` · ${userLabel}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
          <Pressable
            onPress={() => void logout()}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 12, paddingVertical: 8 }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Sign out</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
          <Pressable
            onPress={() => void navigateMenuPath('/projects')}
            style={{ flex: 1, alignItems: 'center', borderRadius: 14, backgroundColor: '#fff', paddingVertical: 13 }}
          >
            <Text style={{ fontWeight: '700', color: WS.primary }}>New project</Text>
          </Pressable>
          <Pressable
            onPress={() => void navigateMenuPath('/workshop-management/job-cards')}
            style={{ flex: 1, alignItems: 'center', borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <Text style={{ fontWeight: '700', color: '#fff' }}>Job card</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginTop: -18 }}>
        {statTiles.map((t) => (
          <View
            key={t.label}
            style={{
              flex: 1,
              minWidth: '46%',
              backgroundColor: WS.card,
              borderRadius: 16,
              padding: 14,
              borderWidth: 1,
              borderColor: WS.border,
              ...cardShadow,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: WS.textMuted }}>{t.label}</Text>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: t.accentBg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={t.icon} size={16} color={t.accent} />
              </View>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: WS.text, marginTop: 8 }}>{t.value}</Text>
            <Text style={{ fontSize: 11, color: WS.textLight, marginTop: 2 }}>{t.sub}</Text>
          </View>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 12 }}>
          Workshop management
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {quickLinks.map((q) => (
            <Pressable
              key={q.path}
              onPress={() => void navigateMenuPath(q.path)}
              style={{
                width: '47%',
                backgroundColor: WS.card,
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: WS.border,
                ...cardShadow,
              }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: q.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Ionicons name={q.icon} size={20} color={q.color} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text }}>{q.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 12 }}>
          Recent projects
        </Text>
        {dashboardData?.projects.recent?.length ? (
          dashboardData.projects.recent.slice(0, 6).map((p) => (
            <View
              key={p.id}
              style={{
                marginBottom: 10,
                borderRadius: 14,
                backgroundColor: WS.card,
                borderWidth: 1,
                borderColor: WS.border,
                padding: 14,
                ...cardShadow,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', fontSize: 15, color: WS.text, flex: 1 }} numberOfLines={1}>
                  {p.name}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: WS.primary }}>{p.completionPercent}%</Text>
              </View>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: '#e2e8f0', marginTop: 10, overflow: 'hidden' }}>
                <View style={{ height: 5, borderRadius: 3, width: `${Math.min(100, p.completionPercent)}%`, backgroundColor: WS.primary }} />
              </View>
              <Text style={{ fontSize: 12, color: WS.textMuted, marginTop: 8, textTransform: 'capitalize' }}>{p.status}</Text>
            </View>
          ))
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: WS.card, borderRadius: 16, borderWidth: 1, borderColor: WS.border }}>
            <Ionicons name="folder-open-outline" size={32} color={WS.textLight} />
            <Text style={{ marginTop: 8, color: WS.textMuted }}>No recent projects</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
