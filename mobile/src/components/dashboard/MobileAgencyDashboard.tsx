import { View, Text, Pressable, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { MenuHeaderButton } from '../layout/MenuHeaderButton';
import { getEmployeePortalDashboard } from '../../services/employeePortal/employeePortalMobileApi';
import type { PendingApproval, TeamTimeRow } from '../../models/employeePortal';

export interface AgencyProjectSummary {
  id: string;
  name: string;
  status: string;
  completionPercent: number;
  priority?: string;
}

export interface AgencyTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive?: boolean;
}

export interface AgencyStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  averageProgress: number;
  recentProjects: AgencyProjectSummary[];
  teamMembers: AgencyTeamMember[];
}

interface MobileAgencyDashboardProps {
  stats: AgencyStats;
  onLogout: () => void;
  userLabel?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  onNavigatePath?: (path: string) => void | Promise<void>;
}

function isRunningProject(status: string): boolean {
  return status === 'in_progress' || status === 'planning';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ');
}

export function MobileAgencyDashboard({
  stats,
  onLogout,
  userLabel,
  refreshing = false,
  onRefresh,
  onNavigatePath,
}: MobileAgencyDashboardProps) {
  const completionRate =
    stats.totalProjects > 0
      ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
      : 0;

  const runningProjects = stats.recentProjects.filter((p) =>
    isRunningProject(p.status),
  );

  const displayedProjects =
    runningProjects.length > 0 ? runningProjects : stats.recentProjects.slice(0, 5);

  const activeMembers = stats.teamMembers.filter((m) => m.isActive !== false);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [teamTimeToday, setTeamTimeToday] = useState<TeamTimeRow[]>([]);

  const loadPortal = useCallback(async () => {
    try {
      const d = await getEmployeePortalDashboard();
      setPendingApprovals(d.pendingApprovals ?? []);
      setTeamTimeToday(d.teamTimeToday ?? []);
    } catch {
      setPendingApprovals([]);
      setTeamTimeToday([]);
    }
  }, []);

  useEffect(() => {
    void loadPortal();
  }, [loadPortal]);

  const handleRefresh = useCallback(() => {
    void onRefresh?.();
    void loadPortal();
  }, [onRefresh, loadPortal]);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerClassName="pb-10 pt-2"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined
      }
    >
      <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
        <View className="flex-row items-start justify-between">
          <View className="min-w-0 flex-1 flex-row items-start gap-2 pr-2">
            <MenuHeaderButton />
            <View className="min-w-0 flex-1">
              <Text className="text-2xl font-bold text-indigo-700">
                Agency Dashboard
              </Text>
              <Text className="mt-1 text-sm text-slate-600">
                Projects, team, and delivery overview
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
            className="flex-row items-center rounded-lg bg-indigo-600 px-3 py-2 active:bg-indigo-700"
            onPress={() => void onNavigatePath?.('/projects')}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">
              New project
            </Text>
          </Pressable>
          <Pressable
            className="flex-row items-center rounded-lg border border-indigo-600 px-3 py-2 active:bg-indigo-50"
            onPress={() => void onNavigatePath?.('/users')}
          >
            <Ionicons name="person-add-outline" size={18} color="#4f46e5" />
            <Text className="ml-1 text-sm font-semibold text-indigo-700">
              Add member
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-3 px-4">
        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-indigo-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Projects</Text>
            <Ionicons name="folder-open-outline" size={16} color="#4f46e5" />
          </View>
          <Text className="mt-2 text-xl font-bold text-indigo-700">
            {stats.totalProjects}
          </Text>
          <Text className="text-xs text-slate-500">Total engagements</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-violet-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Running</Text>
            <Ionicons name="pulse-outline" size={16} color="#7c3aed" />
          </View>
          <Text className="mt-2 text-xl font-bold text-violet-600">
            {stats.activeProjects}
          </Text>
          <Text className="text-xs text-slate-500">Active projects</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-emerald-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Completed</Text>
            <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          </View>
          <Text className="mt-2 text-xl font-bold text-emerald-600">
            {stats.completedProjects}
          </Text>
          <Text className="text-xs text-slate-500">{completionRate}% done</Text>
        </View>

        <View className="min-w-[45%] flex-1 rounded-xl border-l-4 border-l-purple-500 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-600">Team</Text>
            <Ionicons name="people-outline" size={16} color="#9333ea" />
          </View>
          <Text className="mt-2 text-xl font-bold text-purple-600">
            {stats.activeTeamMembers || stats.totalTeamMembers}
          </Text>
          <Text className="text-xs text-slate-500">Active members</Text>
        </View>
      </View>

      <View className="mt-4 gap-4 px-4">
        {pendingApprovals.length > 0 ? (
          <View className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="alert-circle-outline" size={20} color="#d97706" />
                <Text className="text-base font-semibold text-slate-900">
                  Pending approvals ({pendingApprovals.length})
                </Text>
              </View>
              <Pressable onPress={() => void onNavigatePath?.('/employee-portal/approvals')}>
                <Text className="text-sm font-semibold text-indigo-600">Review</Text>
              </Pressable>
            </View>
            {pendingApprovals.slice(0, 3).map((item) => (
              <View key={item.id} className="mt-3 rounded-lg border border-slate-100 bg-amber-50 p-3">
                <Text className="font-medium text-slate-900">{item.employeeName}</Text>
                <Text className="text-xs capitalize text-slate-600">
                  {item.leaveType} · {item.totalDays} days
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {teamTimeToday.length > 0 ? (
          <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Ionicons name="time-outline" size={20} color="#4f46e5" />
                <Text className="text-base font-semibold text-slate-900">Team time today</Text>
              </View>
              <Pressable onPress={() => void onNavigatePath?.('/employee-portal/time')}>
                <Text className="text-sm font-semibold text-indigo-600">Details</Text>
              </Pressable>
            </View>
            {teamTimeToday.slice(0, 5).map((row) => (
              <View
                key={row.employeeId}
                className="mt-3 flex-row items-center justify-between border-b border-slate-100 pb-2"
              >
                <Text className="font-medium text-slate-900">{row.name}</Text>
                <Text className="text-sm font-semibold text-indigo-600">{row.hoursToday}h</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="briefcase-outline" size={20} color="#4f46e5" />
              <Text className="text-base font-semibold text-slate-900">
                Running projects
              </Text>
            </View>
            <Pressable onPress={() => void onNavigatePath?.('/projects')}>
              <Text className="text-sm font-semibold text-indigo-600">View all</Text>
            </Pressable>
          </View>

          {displayedProjects.length === 0 ? (
            <Text className="mt-4 text-center text-sm text-slate-500">
              No projects yet. Create one to get started.
            </Text>
          ) : (
            displayedProjects.map((project) => (
              <View
                key={project.id}
                className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
              >
                <Text className="font-medium text-slate-900">{project.name}</Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-xs capitalize text-slate-500">
                    {formatStatus(project.status)}
                  </Text>
                  <Text className="text-sm font-semibold text-indigo-600">
                    {project.completionPercent ?? 0}%
                  </Text>
                </View>
                <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                  <View
                    className="h-2 rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, project.completionPercent ?? 0))}%`,
                    }}
                  />
                </View>
              </View>
            ))
          )}

          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-lg bg-indigo-50 p-3">
              <Text className="text-center text-sm font-bold text-indigo-700">
                {stats.averageProgress}%
              </Text>
              <Text className="text-center text-xs text-slate-600">Avg progress</Text>
            </View>
            <View className="flex-1 rounded-lg bg-amber-50 p-3">
              <Text className="text-center text-sm font-bold text-amber-700">
                {stats.onHoldProjects}
              </Text>
              <Text className="text-center text-xs text-slate-600">On hold</Text>
            </View>
          </View>
        </View>

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Ionicons name="people-outline" size={20} color="#7c3aed" />
              <Text className="text-base font-semibold text-slate-900">Team</Text>
            </View>
            <Pressable onPress={() => void onNavigatePath?.('/users')}>
              <Text className="text-sm font-semibold text-violet-600">Manage</Text>
            </Pressable>
          </View>

          {activeMembers.length === 0 ? (
            <Text className="mt-4 text-center text-sm text-slate-500">
              No team members yet.
            </Text>
          ) : (
            activeMembers.slice(0, 6).map((member) => (
              <View
                key={member.id}
                className="mt-3 flex-row items-center justify-between border-b border-slate-100 pb-3"
              >
                <View className="min-w-0 flex-1 pr-2">
                  <Text className="font-medium text-slate-900">{member.name}</Text>
                  <Text className="text-xs text-slate-500">{member.role}</Text>
                </View>
                <Text className="text-xs font-medium text-emerald-600">Active</Text>
              </View>
            ))
          )}

          <Pressable
            className="mt-4 items-center rounded-lg border border-violet-600 py-2.5 active:bg-violet-50"
            onPress={() => void onNavigatePath?.('/hrm/employees')}
          >
            <Text className="font-semibold text-violet-700">View employees</Text>
          </Pressable>
        </View>

        <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Text className="text-base font-semibold text-slate-900">Quick actions</Text>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {[
              { path: '/projects', label: 'Projects', icon: 'folder-open-outline' as const },
              { path: '/tasks', label: 'Tasks', icon: 'checkbox-outline' as const },
              { path: '/employee-portal/approvals', label: 'Approvals', icon: 'checkmark-done-outline' as const },
              { path: '/employee-portal/manage-devices', label: 'Devices', icon: 'laptop-outline' as const },
            ].map((action) => (
              <Pressable
                key={action.path}
                className="min-w-[45%] flex-1 items-center rounded-lg border border-slate-200 bg-slate-50 py-4 active:bg-slate-100"
                onPress={() => void onNavigatePath?.(action.path)}
              >
                <Ionicons name={action.icon} size={22} color="#4f46e5" />
                <Text className="mt-2 text-sm font-medium text-slate-700">
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
