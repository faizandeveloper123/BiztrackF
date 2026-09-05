import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MenuHeaderButton } from '../layout/MenuHeaderButton';

export interface CommerceStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTeamMembers: number;
  averageProgress: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  lowStockItems: number;
  pendingOrdersHint: number;
  netIncome: number;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatUsdDecimal(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MobileCommerceDashboardProps {
  stats: CommerceStats;
  onLogout: () => void;
  userLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onNavigatePath?: (path: string) => void | Promise<void>;
}

export function MobileCommerceDashboard({
  stats,
  onLogout,
  userLabel,
  refreshing = false,
  onRefresh,
  onNavigatePath,
}: MobileCommerceDashboardProps) {
  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-10 pt-2"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ) : undefined
      }
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="flex-row flex-1 items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
            <Text className="text-2xl font-bold text-emerald-700">
              Commerce Dashboard
            </Text>
            <Text className="mt-1 text-sm text-slate-600">
              Retail & E-commerce overview
            </Text>
            {userLabel ? (
              <Text className="mt-1 text-xs text-slate-500">{userLabel}</Text>
            ) : null}
            </View>
          </View>
          <Pressable
            className="rounded-lg border border-slate-200 px-3 py-2 active:bg-slate-100"
            onPress={() => void onLogout()}
          >
            <Text className="text-sm font-medium text-slate-700">Sign out</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            className="flex-row items-center rounded-lg bg-emerald-600 px-3 py-2 active:bg-emerald-700"
            onPress={() => void onNavigatePath?.('/projects')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">
              New project
            </Text>
          </Pressable>
          <Pressable
            className="flex-row items-center rounded-lg border border-emerald-600 px-3 py-2 active:bg-emerald-50"
            onPress={() => void onNavigatePath?.('/pos/sale')}
          >
            <Ionicons name="cart-outline" size={18} color="#059669" />
            <Text className="ml-1 text-sm font-semibold text-emerald-700">
              New sale
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3 px-4">
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Total sales</Text>
            <Ionicons name="trending-up" size={16} color="#059669" />
          </View>
          <Text className="mt-2 text-xl font-bold text-emerald-700">
            {formatUsd(stats.totalSales ?? 0)}
          </Text>
          <Text className="text-xs text-slate-500">From overview</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-blue-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Orders</Text>
            <Ionicons name="bag-handle-outline" size={16} color="#2563eb" />
          </View>
          <Text className="mt-2 text-xl font-bold text-blue-600">
            {stats.totalOrders ?? 0}
          </Text>
          <Text className="text-xs text-slate-500">Work orders total</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-violet-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Avg order</Text>
            <Ionicons name="card-outline" size={16} color="#7c3aed" />
          </View>
          <Text className="mt-2 text-xl font-bold text-violet-600">
            {formatUsdDecimal(stats.averageOrderValue ?? 0)}
          </Text>
          <Text className="text-xs text-slate-500">Derived</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-orange-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Team</Text>
            <Ionicons name="people-outline" size={16} color="#ea580c" />
          </View>
          <Text className="mt-2 text-xl font-bold text-orange-600">
            {stats.totalTeamMembers ?? 0}
          </Text>
          <Text className="text-xs text-slate-500">Members</Text>
        </View>
      </View>

      <View className="mt-4 gap-4 px-4">
        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Ionicons name="stats-chart" size={20} color="#059669" />
            <Text className="text-base font-semibold text-slate-900">
              Sales overview
            </Text>
          </View>
          <View className="mt-3 flex-row justify-between">
            <Text className="text-sm text-slate-600">Progress (avg)</Text>
            <Text className="text-sm font-medium text-emerald-600">
              {stats.averageProgress ?? 0}%
            </Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <View
              className="h-2 rounded-full bg-emerald-500"
              style={{
                width: `${Math.min(100, Math.max(0, stats.averageProgress ?? 0))}%`,
              }}
            />
          </View>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-lg bg-emerald-50 p-3">
              <Text className="text-center text-lg font-bold text-emerald-700">
                {stats.activeProjects ?? 0}
              </Text>
              <Text className="text-center text-xs text-slate-600">
                Active projects
              </Text>
            </View>
            <View className="flex-1 rounded-lg bg-blue-50 p-3">
              <Text className="text-center text-lg font-bold text-blue-700">
                {stats.completedProjects ?? 0}
              </Text>
              <Text className="text-center text-xs text-slate-600">
                Completed
              </Text>
            </View>
          </View>
          <Pressable
            className="mt-4 items-center rounded-lg border border-emerald-600 py-2.5 active:bg-emerald-50"
            onPress={() => void onNavigatePath?.('/sales/analytics')}
          >
            <Text className="font-semibold text-emerald-700">
              View sales analytics
            </Text>
          </Pressable>
        </View>

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Ionicons name="storefront-outline" size={20} color="#2563eb" />
            <Text className="text-base font-semibold text-slate-900">
              Inventory & POS
            </Text>
          </View>
          <View className="mt-3 gap-2">
            <View className="flex-row items-center justify-between rounded-lg bg-red-50 px-3 py-2">
              <Text className="text-sm text-slate-700">Low stock</Text>
              <View className="rounded-full bg-red-600 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">
                  {stats.lowStockItems ?? 0}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
              <Text className="text-sm text-slate-700">In progress</Text>
              <View className="rounded-full bg-amber-600 px-2 py-0.5">
                <Text className="text-xs font-bold text-white">
                  {stats.pendingOrdersHint ?? 0}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center justify-between rounded-lg bg-blue-50 px-3 py-2">
              <Text className="text-sm text-slate-700">Net income</Text>
              <Text className="text-sm font-semibold text-blue-800">
                {formatUsd(stats.netIncome ?? 0)}
              </Text>
            </View>
          </View>
          <Pressable
            className="mt-4 items-center rounded-lg border border-blue-600 py-2.5 active:bg-blue-50"
            onPress={() => void onNavigatePath?.('/inventory')}
          >
            <Text className="font-semibold text-blue-700">Manage inventory</Text>
          </Pressable>
        </View>

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Ionicons name="cube-outline" size={20} color="#059669" />
            <Text className="text-base font-semibold text-slate-900">
              Quick actions
            </Text>
          </View>
          <View className="mt-4 flex-row flex-wrap gap-3">
            {(
              [
                ['POS', 'cart-outline', () => onNavigatePath?.('/pos')],
                ['CRM', 'people-outline', () => onNavigatePath?.('/crm')],
                ['Inventory', 'cube-outline', () => onNavigatePath?.('/inventory')],
                ['Reports', 'bar-chart-outline', () => onNavigatePath?.('/reports')],
              ] as const
            ).map(([label, icon, onPress]) => (
              <Pressable
                key={label}
                className="h-24 w-[47%] items-center justify-center rounded-xl border border-slate-200 active:bg-slate-50"
                onPress={onPress}
              >
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color="#334155" />
                <Text className="mt-2 text-xs font-medium text-slate-700">
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
