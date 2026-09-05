import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopLoading,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appError } from '../../../utils/appDialog';
import type { ProjectTeamMemberRef } from '../../../models/project';
import { fetchProjectTeamMembers } from '../../../services/projects/projectMobileApi';

function roleLabel(role?: string): string {
  if (!role) return '';
  return role.replace(/_/g, ' ');
}

export function MobileTeamScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [members, setMembers] = useState<ProjectTeamMemberRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectTeamMembers();
      setMembers(res.teamMembers ?? []);
    } catch (e) {
      appError('Team', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/team',
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

  return (
    <WorkshopChrome
      title="Team members"
      subtitle="Project managers & collaborators"
      right={<View style={{ width: 72 }} />}
      scroll={false}
    >
      {loading && members.length === 0 ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          data={members}
          keyExtractor={(x) => x.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={WS.primary}
            />
          }
          renderItem={({ item }) => (
            <WorkshopListCard
              icon="person"
              iconColor="#4f46e5"
              iconBg="#eef2ff"
              title={item.name}
              subtitle={item.email}
              meta={item.role ? roleLabel(item.role) : '—'}
            />
          )}
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="people-outline"
              title="No team members"
              subtitle="No project managers or team members found."
            />
          }
        />
      )}
    </WorkshopChrome>
  );
}
