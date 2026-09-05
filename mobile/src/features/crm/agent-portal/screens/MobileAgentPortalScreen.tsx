import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { apiService } from '../../../../services/ApiService';

type Overview = {
  totalEarnings: number;
  dealsClosed: number;
  targetAchievementPct: number;
  winRatePct: number;
  level: { current: { icon: string; label: string }; progressPct: number };
};

type Badge = { key: string; icon: string; label: string; earned: boolean };

export function MobileAgentPortalScreen() {
  const [tab, setTab] = useState<'overview' | 'earnings' | 'achievements'>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [earnings, setEarnings] = useState<{ clients: { clientName: string; paidAmount: number; dealValue: number }[] } | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ov, earn, ach] = await Promise.all([
        apiService.get<Overview>('/agent-portal/overview?quick_filter=30d'),
        apiService.get<{ clients: { clientName: string; paidAmount: number; dealValue: number }[] }>('/agent-portal/earnings?quick_filter=30d'),
        apiService.get<{ badges: Badge[] }>('/agent-portal/achievements'),
      ]);
      setOverview(ov);
      setEarnings(earn);
      setBadges(ach.badges || []);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View className="p-4">
        <Text className="text-2xl font-bold text-slate-900">Agent Portal</Text>
        {overview?.level && (
          <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
            <Text className="text-2xl">{overview.level.current.icon}</Text>
            <View>
              <Text className="font-semibold text-slate-900">{overview.level.current.label}</Text>
              <Text className="text-xs text-slate-500">{overview.level.progressPct}% progress</Text>
            </View>
          </View>
        )}
        <View className="mt-4 flex-row gap-2">
          {(['overview', 'earnings', 'achievements'] as const).map((t) => (
            <Pressable
              key={t}
              className={`rounded-full px-4 py-2 ${tab === t ? 'bg-indigo-600' : 'bg-white border border-slate-200'}`}
              onPress={() => setTab(t)}
            >
              <Text className={`text-sm font-medium capitalize ${tab === t ? 'text-white' : 'text-slate-700'}`}>{t}</Text>
            </Pressable>
          ))}
        </View>
        {tab === 'overview' && overview && (
          <View className="mt-4 gap-3">
            <View className="rounded-xl border border-slate-200 bg-white p-4">
              <Text className="text-sm text-slate-500">Total Earnings</Text>
              <Text className="text-2xl font-bold text-slate-900">${overview.totalEarnings.toLocaleString()}</Text>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                <Text className="text-sm text-slate-500">Deals</Text>
                <Text className="text-xl font-bold">{overview.dealsClosed}</Text>
              </View>
              <View className="flex-1 rounded-xl border border-slate-200 bg-white p-4">
                <Text className="text-sm text-slate-500">Win Rate</Text>
                <Text className="text-xl font-bold">{overview.winRatePct}%</Text>
              </View>
            </View>
          </View>
        )}
        {tab === 'earnings' && earnings && (
          <View className="mt-4 gap-2">
            {earnings.clients.map((c, i) => (
              <View key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <Text className="font-semibold text-slate-900">{c.clientName}</Text>
                <Text className="text-sm text-slate-600">Paid ${c.paidAmount.toLocaleString()} / ${c.dealValue.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}
        {tab === 'achievements' && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {badges.map((b) => (
              <View key={b.key} className={`rounded-xl border p-3 ${b.earned ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white opacity-60'}`}>
                <Text className="text-lg">{b.icon}</Text>
                <Text className="text-sm font-medium text-slate-900">{b.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
