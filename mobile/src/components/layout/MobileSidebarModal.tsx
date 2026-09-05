import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import {
  useSidebarFilteredMenu,
  evalSidebarPathPermission,
} from '../../hooks/useSidebarFilteredMenu';
import { usePermissions } from '../../hooks/usePermissions';
import { useIsManagerPortal } from '../../hooks/useIsManagerPortal';
import { useEmployeeAccess } from '../../contexts/EmployeeAccessContext';
import type { SubMenuItemDef } from '../../navigation/sidebarMenuData';
import { AppModal } from '../../components/layout/AppModal';
import { VerifiedCompanyBadge } from '../common/VerifiedCompanyBadge';
import { BizTrackLogo } from '../brand/BizTrackLogo';

const EMPLOYEE_PROJECT_DUP_PATHS = new Set(['/tasks', '/time-tracking']);

const MANAGER_ONLY_PORTAL_PATHS = new Set([
  '/employee-portal/approvals',
  '/employee-portal/manage-devices',
]);

const EMPLOYEE_HIDDEN_MENU_PATHS = new Set(['/users']);

function subRolesAllowed(
  sub: SubMenuItemDef,
  userRole: string | undefined,
  isOwner: () => boolean,
): boolean {
  if (isOwner()) return true;
  if (!sub.roles?.length || sub.roles.includes('*')) return true;
  if (userRole === 'super_admin' || userRole === 'admin') {
    return sub.roles.includes('admin') || sub.roles.includes('owner') || sub.roles.includes(userRole);
  }
  if (!userRole) return false;
  return sub.roles.includes(userRole);
}

function isSubItemVisible(
  subItem: SubMenuItemDef,
  opts: {
    planType?: string | null;
    isSuperAdminNoTenant: boolean;
    isManagerPortal: boolean;
    isEmployee: boolean;
    isOwner: () => boolean;
    hasPermission: (p: string) => boolean;
    userRole?: string;
  },
): boolean {
  if (!opts.isSuperAdminNoTenant) {
    const subItemAvailable =
      subItem.planTypes.includes('*') ||
      (!!opts.planType && subItem.planTypes.includes(opts.planType));
    if (!subItemAvailable) return false;
  }

  if (opts.isEmployee && EMPLOYEE_PROJECT_DUP_PATHS.has(subItem.path)) {
    return false;
  }

  if (!opts.isManagerPortal && MANAGER_ONLY_PORTAL_PATHS.has(subItem.path)) {
    return false;
  }

  if (
    !evalSidebarPathPermission(subItem.path, opts.isOwner, opts.hasPermission)
  ) {
    return false;
  }

  if (!subRolesAllowed(subItem, opts.userRole, opts.isOwner)) {
    return false;
  }

  return true;
}

function getPlanDisplayName(
  isSuperAdmin: boolean,
  planInfo: { planType: string; planName: string } | null,
): string {
  if (isSuperAdmin) return 'Super Admin';
  if (!planInfo) return 'Loading…';
  switch (planInfo.planType) {
    case 'workshop':
      return 'Workshop Master';
    case 'commerce':
      return 'Commerce Pro';
    case 'agency':
      return 'Agency Pro';
    case 'healthcare':
      return 'Healthcare Suite';
    case 'ngo':
      return 'NGO Impact';
    default:
      return planInfo.planName;
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  activePath: string;
  onNavigatePath: (path: string) => void | Promise<void>;
};

export function MobileSidebarModal({
  visible,
  onClose,
  activePath,
  onNavigatePath,
}: Props) {
  const { user, logout } = useAuth();
  const { hasPermission, isOwner } = usePermissions();
  const isManagerPortal = useIsManagerPortal();
  const { isEmployee } = useEmployeeAccess();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const { filteredItems, isSuperAdminNoTenant, menuBootLoading, planInfo } =
    useSidebarFilteredMenu(searchQuery);

  const toggleExpanded = useCallback((itemText: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemText)) next.delete(itemText);
      else next.add(itemText);
      return next;
    });
  }, []);

  const isActive = useCallback(
    (path: string, exact: boolean = false) => {
      const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
      const normalizedActivePath = activePath.endsWith('/')
        ? activePath.slice(0, -1)
        : activePath;
      if (normalizedPath === '/' || exact) {
        return normalizedActivePath === normalizedPath;
      }
      return (
        normalizedActivePath === normalizedPath ||
        normalizedActivePath.startsWith(`${normalizedPath}/`)
      );
    },
    [activePath],
  );

  const onNavigate = useCallback(
    (path: string) => {
      void onNavigatePath(path);
    },
    [onNavigatePath],
  );

  useEffect(() => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    setExpandedItems((prev) => {
      const newExpanded = new Set(prev);
      filteredItems.forEach((item) => {
        if (
          item.subItems &&
          item.subItems.some((subItem) => {
            if (isSuperAdminNoTenant) {
              return subItem.text.toLowerCase().includes(query);
            }
            const subItemAvailable =
              subItem.planTypes.includes('*') ||
              (planInfo && subItem.planTypes.includes(planInfo.planType));
            return (
              subItemAvailable && subItem.text.toLowerCase().includes(query)
            );
          })
        ) {
          newExpanded.add(item.text);
        }
      });
      return newExpanded;
    });
  }, [searchQuery, filteredItems, planInfo, user, isSuperAdminNoTenant]);

  const planLabel = getPlanDisplayName(isSuperAdminNoTenant, planInfo);
  const accent = '#2563eb';
  const accentBg = '#eff6ff';
  const accentText = '#1e3a8a';
  const iconActive = '#334155';
  const iconDefault = '#475569';
  const subIconDefault = '#64748b';

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="fade"
      onClose={onClose}
    >
      <View className="flex-1 flex-row bg-black/50">
        <SafeAreaView
          edges={['top', 'bottom', 'left']}
          className="h-full w-[300px] max-w-[88%] border-r border-slate-200 bg-white"
        >
          <View className="border-b border-slate-200 px-4 pb-3 pt-2">
            <View className="items-center">
              <BizTrackLogo size="md" />
            </View>
            {planInfo || isSuperAdminNoTenant ? (
              <View className="mt-2">
                <Text className="text-center text-xs text-slate-500">
                  Current plan
                </Text>
                <Text className="text-center text-sm font-semibold text-slate-700">
                  {planLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="border-b border-slate-200 px-3 py-3">
            <View className="relative justify-center">
              <View className="absolute left-3 z-10">
                <Ionicons name="search-outline" size={18} color="#94a3b8" />
              </View>
              <TextInput
                className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-900"
                placeholder="Search modules…"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <Pressable
                  className="absolute right-2 top-2 z-10 p-1"
                  onPress={() => setSearchQuery('')}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            className="flex-1 px-3 py-3"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {menuBootLoading ? (
              <View className="gap-3 py-2">
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <View
                    key={k}
                    className="flex-row items-center gap-3 rounded-xl px-3 py-3"
                  >
                    <View className="h-10 w-10 rounded-lg bg-slate-200" />
                    <View className="h-4 flex-1 rounded bg-slate-200" />
                  </View>
                ))}
              </View>
            ) : (
              filteredItems
                .filter(
                  (item) =>
                    !isEmployee ||
                    !item.path ||
                    !EMPLOYEE_HIDDEN_MENU_PATHS.has(item.path),
                )
                .map((item) => {
                const visibleSubItems = (item.subItems ?? []).filter((subItem) =>
                  isSubItemVisible(subItem, {
                    planType: planInfo?.planType,
                    isSuperAdminNoTenant,
                    isManagerPortal,
                    isEmployee,
                    isOwner,
                    hasPermission,
                    userRole: user?.userRole,
                  }),
                );
                const isExpanded = expandedItems.has(item.text);
                const hasSubItems = visibleSubItems.length > 0;
                if (!item.path && item.subItems && !hasSubItems) {
                  return null;
                }
                const isMainItemActive = !!(
                  item.path && isActive(item.path, item.text === 'Dashboard')
                );
                const hasActiveSubItem =
                  hasSubItems &&
                  visibleSubItems.some((s) => isActive(s.path, s.text === 'Dashboard'));

                return (
                  <View key={item.text} className="mb-2">
                    {item.path ? (
                      <Pressable
                        onPress={() => void onNavigate(item.path!)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          borderRadius: 14,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          marginBottom: 4,
                          backgroundColor: isMainItemActive ? accentBg : '#f8fafc',
                          borderWidth: isMainItemActive ? 1 : 0,
                          borderColor: isMainItemActive ? accent : 'transparent',
                        }}
                      >
                        <View
                          style={{
                            borderRadius: 10,
                            padding: 8,
                            backgroundColor: isMainItemActive ? '#fff' : '#fff',
                          }}
                        >
                          <Ionicons
                            name={item.icon as never}
                            size={22}
                            color={isMainItemActive ? iconActive : iconDefault}
                          />
                        </View>
                        <Text
                          style={{
                            flex: 1,
                            fontWeight: '700',
                            color: isMainItemActive ? accentText : '#1e293b',
                          }}
                        >
                          {item.text}
                        </Text>
                        {isMainItemActive ? (
                          <View
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: accent,
                            }}
                          />
                        ) : null}
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => toggleExpanded(item.text)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: 14,
                          paddingHorizontal: 12,
                          paddingVertical: 12,
                          marginBottom: 4,
                          backgroundColor: hasActiveSubItem ? accentBg : '#f8fafc',
                          borderWidth: hasActiveSubItem ? 1 : 0,
                          borderColor: hasActiveSubItem ? accent : 'transparent',
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <View style={{ borderRadius: 10, padding: 8, backgroundColor: '#fff' }}>
                            <Ionicons
                              name={item.icon as never}
                              size={22}
                              color={hasActiveSubItem ? iconActive : iconDefault}
                            />
                          </View>
                          <Text
                            style={{
                              fontWeight: '700',
                              color: hasActiveSubItem ? accentText : '#1e293b',
                            }}
                          >
                            {item.text}
                          </Text>
                        </View>
                        {hasSubItems ? (
                          <Ionicons
                            name="chevron-down-outline"
                            size={20}
                            color={hasActiveSubItem ? iconActive : subIconDefault}
                            style={{
                              transform: [
                                { rotate: isExpanded ? '180deg' : '0deg' },
                              ],
                            }}
                          />
                        ) : null}
                      </Pressable>
                    )}

                    {hasSubItems && isExpanded ? (
                      <View className="ml-3 mt-1 border-l-2 border-slate-200 pl-3">
                        {visibleSubItems.map((subItem) => {
                          const subActive = isActive(subItem.path, subItem.text === 'Dashboard');

                          return (
                            <Pressable
                              key={subItem.text}
                              onPress={() => void onNavigate(subItem.path)}
                              style={{
                                marginBottom: 4,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                borderRadius: 12,
                                paddingHorizontal: 8,
                                paddingVertical: 10,
                                backgroundColor: subActive ? accentBg : 'transparent',
                                borderLeftWidth: subActive ? 3 : 0,
                                borderLeftColor: accent,
                              }}
                            >
                              <View
                                style={{
                                  borderRadius: 8,
                                  padding: 6,
                                  backgroundColor: subActive ? '#fff' : '#f1f5f9',
                                }}
                              >
                                <Ionicons
                                  name={subItem.icon as never}
                                  size={18}
                                  color={subActive ? iconActive : subIconDefault}
                                />
                              </View>
                              <Text
                                style={{
                                  flex: 1,
                                  fontSize: 14,
                                  fontWeight: '600',
                                  color: subActive ? accentText : '#475569',
                                }}
                              >
                                {subItem.text}
                              </Text>
                              {subActive ? (
                                <View
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: accent,
                                  }}
                                />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}

            {!menuBootLoading &&
            filteredItems.length === 0 &&
            searchQuery.trim() ? (
              <View className="items-center py-10">
                <Ionicons name="search-outline" size={40} color="#cbd5e1" />
                <Text className="mt-2 text-center font-medium text-slate-600">
                  No matches
                </Text>
                <Text className="mt-1 px-4 text-center text-xs text-slate-500">
                  Try another search term
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <View className="border-t border-slate-200 bg-slate-50 px-4 py-3">
            {user?.email ? (
              <Text
                className="mb-2 text-center text-xs text-slate-500"
                numberOfLines={1}
              >
                {user.email}
              </Text>
            ) : null}
            <View className="mb-3">
              <VerifiedCompanyBadge align="center" />
            </View>
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 active:bg-slate-300"
              onPress={() => {
                onClose();
                void logout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#334155" />
              <Text className="font-semibold text-slate-800">Sign out</Text>
            </Pressable>
            <View className="mt-2 items-center opacity-70">
              <BizTrackLogo size="sm" />
            </View>
          </View>
        </SafeAreaView>

        <Pressable className="flex-1" onPress={onClose} accessibilityRole="button" />
      </View>
    </AppModal>
  );
}
