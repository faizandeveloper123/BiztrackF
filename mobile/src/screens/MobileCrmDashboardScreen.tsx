import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../contexts/SidebarDrawerContext';
import { useAuth } from '../contexts/AuthContext';
import { extractErrorMessage } from '../utils/errorUtils';
import type { CRMDashboard } from '../models/crm';
import {
  getCrmDashboard,
  formatUsd,
  formatCrmDate,
  formatCrmDateTime,
  getLeadStatusBadgeClass,
  getOpportunityStageBadgeClass,
  getActivityTypeBubbleClass,
  getActivityTypeIconName,
} from '../services/crm/CrmMobileService';

type TabKey = 'pipeline' | 'activities' | 'opportunities' | 'leads';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'activities', label: 'Activities' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'leads', label: 'Leads' },
];

export function MobileCrmDashboardScreen() {
  const { logout, user, currentTenant } = useAuth();
  const { setSidebarActivePath, navigateMenuPath } = useSidebarDrawer();
  const [data, setData] = useState<CRMDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('pipeline');

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await getCrmDashboard();
      setData(d);
    } catch (e) {
      setError(extractErrorMessage(e, 'Could not load CRM dashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/crm');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const pipelineMax = useMemo(() => {
    if (!data?.pipeline?.length) return 1;
    return Math.max(1, ...data.pipeline.map((p) => p.count));
  }, [data]);

  const userLabel = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
    ? `${[user?.firstName, user?.lastName].filter(Boolean).join(' ')} · ${user?.email ?? ''}`
    : user?.email ?? '';

  if (loading && !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="mt-3 text-slate-600">Loading CRM…</Text>
        </View>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-2">
          <MenuHeaderButton />
        </View>
        <View className="flex-1 justify-center px-6">
          <Text className="text-center text-lg font-semibold text-slate-900">
            CRM unavailable
          </Text>
          <Text className="mt-2 text-center text-slate-600">{error}</Text>
          <Pressable
            className="mt-6 items-center rounded-lg bg-blue-600 py-3 active:bg-blue-700"
            onPress={() => void load()}
          >
            <Text className="font-semibold text-white">Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!data) return null;

  const m = data.metrics;

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-12"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">
                CRM Dashboard
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Customers, pipeline, and activities
              </Text>
              {currentTenant ? (
                <Text className="mt-1 text-xs text-slate-500" numberOfLines={2}>
                  {currentTenant.name}
                  {userLabel ? ` · ${userLabel}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="items-end gap-2">
            <Pressable
              className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
              onPress={() => void logout()}
            >
              <Text className="text-sm font-medium text-slate-700">Sign out</Text>
            </Pressable>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="flex-row items-center rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
            onPress={() => void navigateMenuPath('/crm/leads')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">New lead</Text>
          </Pressable>
          <Pressable
            className="flex-row items-center rounded-lg border border-indigo-600 px-3 py-2 active:bg-indigo-50"
            onPress={() => void navigateMenuPath('/crm/opportunities')}
          >
            <Ionicons name="locate-outline" size={18} color="#4f46e5" />
            <Text className="ml-1 text-sm font-semibold text-indigo-700">
              New opportunity
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3 px-4">
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-indigo-500 bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium text-slate-500">Total leads</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-900">
            {m.totalLeads}
          </Text>
          <Text className="text-xs text-slate-500">{m.activeLeads} active</Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-blue-500 bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium text-slate-500">Contacts</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-900">
            {m.totalContacts}
          </Text>
          <Text className="text-xs text-slate-500">Customer database</Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium text-slate-500">Revenue</Text>
          <Text className="mt-1 text-xl font-bold text-slate-900">
            {formatUsd(m.totalRevenue)}
          </Text>
          <Text className="text-xs text-slate-500">
            {formatUsd(m.projectedRevenue)} projected
          </Text>
        </View>
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-violet-500 bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium text-slate-500">Conversion</Text>
          <Text className="mt-1 text-2xl font-bold text-slate-900">
            {m.conversionRate}%
          </Text>
          <Text className="text-xs text-slate-500">Lead to customer</Text>
        </View>
      </View>

      <View className="mt-6 px-4">
        <Text className="mb-2 text-sm font-semibold text-slate-700">Views</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pb-1">
            {TABS.map((t) => (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                className={`rounded-full px-4 py-2 ${
                  tab === t.key ? 'bg-indigo-600' : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    tab === t.key ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="mt-4 px-4">
        {tab === 'pipeline' ? (
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">
              Sales pipeline
            </Text>
            <Text className="mt-1 text-sm text-slate-500">
              Opportunities by stage
            </Text>
            <View className="mt-4 gap-4">
              {data.pipeline.map((stage) => (
                <View key={stage.stage}>
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-sm font-medium capitalize text-slate-800">
                      {String(stage.stage).replace(/_/g, ' ')}
                    </Text>
                    <Text className="text-sm font-semibold text-slate-900">
                      {formatUsd(stage.value)}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-500">
                    {stage.count} opportunities · {stage.probability}% probability
                  </Text>
                  <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <View
                      className="h-2 rounded-full bg-indigo-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (stage.count / pipelineMax) * 100,
                        )}%`,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {tab === 'activities' ? (
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">
              Recent activities
            </Text>
            <View className="mt-4 gap-3">
              {data.recentActivities.length === 0 ? (
                <Text className="text-slate-500">No recent activities.</Text>
              ) : null}
              {data.recentActivities.map((activity) => (
                <View
                  key={activity.id}
                  className="flex-row gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                >
                  <View
                    className={`h-10 w-10 items-center justify-center rounded-full ${getActivityTypeBubbleClass(
                      String(activity.type),
                    )}`}
                  >
                    <Ionicons
                      name={getActivityTypeIconName(String(activity.type)) as never}
                      size={20}
                      color="#334155"
                    />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="font-semibold text-slate-900">
                      {activity.subject}
                    </Text>
                    {activity.description ? (
                      <Text className="mt-0.5 text-sm text-slate-600">
                        {activity.description}
                      </Text>
                    ) : null}
                    <Text className="mt-1 text-xs text-slate-400">
                      {formatCrmDateTime(activity.createdAt)}
                    </Text>
                  </View>
                  <View
                    className={`self-start rounded-full px-2 py-1 ${
                      activity.completed ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        activity.completed ? 'text-emerald-800' : 'text-slate-700'
                      }`}
                    >
                      {activity.completed ? 'Done' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {tab === 'opportunities' ? (
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">
              Top opportunities
            </Text>
            <View className="mt-4 gap-3">
              {data.topOpportunities.length === 0 ? (
                <Text className="text-slate-500">No opportunities.</Text>
              ) : null}
              {data.topOpportunities.map((op) => (
                <View
                  key={op.id}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <Text className="font-semibold text-slate-900">{op.title}</Text>
                  {op.description ? (
                    <Text className="mt-1 text-sm text-slate-600">
                      {op.description}
                    </Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap items-center gap-2">
                    <View
                      className={`rounded-full px-2 py-1 ${getOpportunityStageBadgeClass(
                        String(op.stage),
                      )}`}
                    >
                      <Text className="text-xs font-medium capitalize">
                        {String(op.stage).replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <Text className="text-xs text-slate-500">
                      {op.probability}% probability
                    </Text>
                  </View>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-slate-900">
                      {op.amount != null ? formatUsd(op.amount) : 'N/A'}
                    </Text>
                    {op.expectedCloseDate ? (
                      <Text className="text-xs text-slate-500">
                        Closes {formatCrmDate(op.expectedCloseDate)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {tab === 'leads' ? (
          <View className="rounded-xl border border-slate-200 bg-white p-4">
            <Text className="text-lg font-semibold text-slate-900">
              Recent leads
            </Text>
            <View className="mt-4 gap-3">
              {data.recentLeads.length === 0 ? (
                <Text className="text-slate-500">No leads.</Text>
              ) : null}
              {data.recentLeads.map((lead) => (
                <View
                  key={lead.id}
                  className="rounded-xl border border-slate-100 p-3"
                >
                  <Text className="font-semibold text-slate-900">
                    {lead.firstName} {lead.lastName}
                  </Text>
                  <Text className="text-sm text-slate-600">{lead.email}</Text>
                  {lead.company ? (
                    <Text className="text-sm text-slate-500">{lead.company}</Text>
                  ) : null}
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <View
                      className={`rounded-full px-2 py-1 ${getLeadStatusBadgeClass(
                        String(lead.status),
                      )}`}
                    >
                      <Text className="text-xs font-medium capitalize">
                        {String(lead.status).replace(/_/g, ' ')}
                      </Text>
                    </View>
                    {lead.source ? (
                      <View className="rounded-full border border-slate-200 bg-white px-2 py-1">
                        <Text className="text-xs text-slate-600">
                          {String(lead.source)}
                        </Text>
                      </View>
                    ) : null}
                    {Number(lead.score) > 0 ? (
                      <Text className="text-xs text-slate-500">
                        Score {lead.score}
                      </Text>
                    ) : null}
                  </View>
                  <View className="mt-2 flex-row justify-between">
                    <Text className="text-xs text-slate-400">
                      {formatCrmDate(lead.createdAt)}
                    </Text>
                    {lead.budget != null ? (
                      <Text className="text-xs font-semibold text-slate-700">
                        {formatUsd(lead.budget)}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View className="mt-6 px-4">
        <Text className="text-lg font-semibold text-slate-900">Quick actions</Text>
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pressable
            className="min-w-[30%] flex-1 items-center rounded-xl border border-slate-200 bg-white py-4 active:bg-slate-50"
            onPress={() => void navigateMenuPath('/crm/leads')}
          >
            <Ionicons name="people-outline" size={24} color="#4f46e5" />
            <Text className="mt-2 text-center text-xs font-semibold text-slate-800">
              Leads
            </Text>
          </Pressable>
          <Pressable
            className="min-w-[30%] flex-1 items-center rounded-xl border border-slate-200 bg-white py-4 active:bg-slate-50"
            onPress={() => void navigateMenuPath('/crm/customers')}
          >
            <Ionicons name="people-outline" size={24} color="#4f46e5" />
            <Text className="mt-2 text-center text-xs font-semibold text-slate-800">
              Customers
            </Text>
          </Pressable>
          <Pressable
            className="min-w-[30%] flex-1 items-center rounded-xl border border-slate-200 bg-white py-4 active:bg-slate-50"
            onPress={() => void navigateMenuPath('/crm/contacts')}
          >
            <Ionicons name="person-outline" size={24} color="#4f46e5" />
            <Text className="mt-2 text-center text-xs font-semibold text-slate-800">
              Contacts
            </Text>
          </Pressable>
          <Pressable
            className="min-w-[30%] flex-1 items-center rounded-xl border border-slate-200 bg-white py-4 active:bg-slate-50"
            onPress={() => void navigateMenuPath('/crm/companies')}
          >
            <Ionicons name="business-outline" size={24} color="#4f46e5" />
            <Text className="mt-2 text-center text-xs font-semibold text-slate-800">
              Companies
            </Text>
          </Pressable>
          <Pressable
            className="min-w-[30%] flex-1 items-center rounded-xl border border-slate-200 bg-white py-4 active:bg-slate-50"
            onPress={() => void navigateMenuPath('/crm/opportunities')}
          >
            <Ionicons name="trending-up-outline" size={24} color="#4f46e5" />
            <Text className="mt-2 text-center text-xs font-semibold text-slate-800">
              Opportunities
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
