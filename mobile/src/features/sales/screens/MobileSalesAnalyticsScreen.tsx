import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { formatUsd } from '../../../services/crm/CrmMobileService';
import { fetchOpportunitiesPaged } from '../../../services/crm/opportunitiesApi';
import { fetchContacts } from '../../../services/crm/contactsApi';
import { fetchCompaniesPaged } from '../../../services/crm/companiesApi';
import type { Opportunity } from '../../../models/crm';
import { OpportunityStage } from '../../../models/crm';
import {
  getRevenueAnalytics,
  getConversionAnalytics,
} from '../../../services/sales/salesApi';

type TabKey = 'pipeline' | 'revenue' | 'conversion';

export function MobileSalesAnalyticsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [tab, setTab] = useState<TabKey>('pipeline');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [companyCount, setCompanyCount] = useState(0);
  const [revenue, setRevenue] = useState<unknown>(null);
  const [conversion, setConversion] = useState<unknown>(null);

  const loadPipeline = useCallback(async () => {
    const [opRes, ctRes, coRes] = await Promise.all([
      fetchOpportunitiesPaged({}, 1, 200),
      fetchContacts({}, 1, 1),
      fetchCompaniesPaged({}, 1, 1),
    ]);
    setOpportunities(opRes.opportunities ?? []);
    setContactCount(ctRes.pagination?.total ?? (ctRes.contacts?.length ?? 0));
    setCompanyCount(coRes.pagination?.total ?? (coRes.companies?.length ?? 0));
  }, []);

  const loadServerAnalytics = useCallback(async () => {
    const [rev, conv] = await Promise.all([
      getRevenueAnalytics('monthly'),
      getConversionAnalytics(),
    ]);
    setRevenue(rev);
    setConversion(conv);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([loadPipeline(), loadServerAnalytics()]);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [loadPipeline, loadServerAnalytics]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/sales/analytics',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const timeFiltered = useMemo(() => {
    const days = 30;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return opportunities.filter((o) => {
      const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
      return t >= cutoff;
    });
  }, [opportunities]);

  const pipelineByStage = useMemo(() => {
    return Object.values(OpportunityStage).map((stage) => {
      const rows = timeFiltered.filter((o) => o.stage === stage);
      const total = rows.reduce((s, o) => s + (o.amount ?? 0), 0);
      return { stage, count: rows.length, total };
    });
  }, [timeFiltered]);

  const pipelineValue = useMemo(
    () => timeFiltered.reduce((s, o) => s + (o.amount ?? 0), 0),
    [timeFiltered],
  );

  const weighted = useMemo(
    () =>
      timeFiltered.reduce(
        (s, o) => s + ((o.amount ?? 0) * (o.probability ?? 0)) / 100,
        0,
      ),
    [timeFiltered],
  );

  const fmtJson = (v: unknown) =>
    JSON.stringify(v, null, 2).slice(0, 4000);

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <Text className="flex-1 text-center text-lg font-semibold text-slate-900">
          Sales analytics
        </Text>
        <View className="w-10" />
      </View>

      <View className="flex-row border-b border-slate-200 bg-white px-2 py-2">
        {(
          [
            ['pipeline', 'Pipeline'],
            ['revenue', 'Revenue'],
            ['conversion', 'Conversion'],
          ] as const
        ).map(([k, label]) => (
          <Pressable
            key={k}
            onPress={() => setTab(k)}
            className={`mr-1 flex-1 rounded-lg px-2 py-2 ${
              tab === k ? 'bg-blue-600' : 'bg-slate-100'
            }`}
          >
            <Text
              className={`text-center text-xs font-semibold ${
                tab === k ? 'text-white' : 'text-slate-700'
              }`}
              numberOfLines={1}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-3 py-3"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {tab === 'pipeline' ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-sm text-slate-500">
                Last 30 days · opportunities {timeFiltered.length} · contacts{' '}
                {contactCount} · companies {companyCount}
              </Text>
              <Text className="mt-3 text-lg font-semibold text-slate-900">
                Pipeline {formatUsd(pipelineValue)}
              </Text>
              <Text className="mt-1 text-slate-700">
                Weighted {formatUsd(weighted)}
              </Text>
              <View className="mt-4 border-t border-slate-100 pt-3">
                {pipelineByStage.map((row) => (
                  <View
                    key={row.stage}
                    className="mb-2 flex-row justify-between border-b border-slate-50 py-2"
                  >
                    <Text className="flex-1 text-slate-800">{row.stage}</Text>
                    <Text className="text-slate-600">{row.count}</Text>
                    <Text className="ml-2 font-medium text-slate-900">
                      {formatUsd(row.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {tab === 'revenue' ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="mb-2 font-semibold text-slate-900">
                Revenue (API)
              </Text>
              <Text selectable className="font-mono text-xs text-slate-700">
                {revenue != null ? fmtJson(revenue) : '—'}
              </Text>
            </View>
          ) : null}

          {tab === 'conversion' ? (
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="mb-2 font-semibold text-slate-900">
                Conversion (API)
              </Text>
              <Text selectable className="font-mono text-xs text-slate-700">
                {conversion != null ? fmtJson(conversion) : '—'}
              </Text>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
