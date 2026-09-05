import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopSearchBar,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopOutlineButton,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { usePermissions } from '../../../hooks/usePermissions';
import { useAuth } from '../../../contexts/AuthContext';
import type { ProjectRecord, ProjectTeamMemberRef } from '../../../models/project';
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjectsPaged,
  fetchProjectTeamMembers,
  updateProjectApi,
} from '../../../services/projects/projectMobileApi';

const PAGE_SIZE = 15;

const PROJECT_STATUSES = [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
] as const;

const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileProjectsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageProjects } = usePermissions();
  const { user } = useAuth();

  const [items, setItems] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [teamPool, setTeamPool] = useState<ProjectTeamMemberRef[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectRecord | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [managerId, setManagerId] = useState('');
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [statusPick, setStatusPick] = useState<string>('planning');
  const [priorityPick, setPriorityPick] = useState<string>('medium');
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetchProjectTeamMembers();
      setTeamPool(res.teamMembers ?? []);
    } catch {
      setTeamPool([]);
    }
  }, []);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectsPaged(page, PAGE_SIZE, {
        search: search.trim() || undefined,
      });
      setItems(res.projects ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      appError('Projects', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/projects',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadTeam(), loadPage()]);
    setRefreshing(false);
  }, [loadPage, loadTeam]);

  const openCreate = useCallback(() => {
    setName('');
    setDescription('');
    const selfId = user?.id;
    const defaultManager =
      selfId && teamPool.some((m) => m.id === selfId)
        ? selfId
        : teamPool[0]?.id ?? '';
    setManagerId(defaultManager);
    setMemberIds(new Set());
    setStatusPick('planning');
    setPriorityPick('medium');
    setCreateOpen(true);
  }, [teamPool, user?.id]);

  const openEdit = useCallback((p: ProjectRecord) => {
    setSelected(p);
    setName(p.name);
    setDescription(p.description ?? '');
    setManagerId(p.projectManagerId);
    setMemberIds(new Set((p.teamMembers ?? []).map((m) => m.id)));
    setStatusPick(p.status);
    setPriorityPick(p.priority);
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!name.trim() || !managerId) {
      appAlert('Projects', 'Name and project manager are required.');
      return;
    }
    try {
      await createProjectApi({
        name: name.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectManagerId: managerId,
        teamMemberIds: Array.from(memberIds),
      });
      setCreateOpen(false);
      setPage(1);
      await loadPage();
    } catch (e) {
      appError('Projects', extractErrorMessage(e, 'Could not create'));
    }
  }, [name, description, managerId, memberIds, statusPick, priorityPick, loadPage]);

  const submitEdit = useCallback(async () => {
    if (!selected || !name.trim() || !managerId) {
      return;
    }
    try {
      await updateProjectApi(selected.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectManagerId: managerId,
        teamMemberIds: Array.from(memberIds),
      });
      setEditOpen(false);
      setSelected(null);
      await loadPage();
    } catch (e) {
      appError('Projects', extractErrorMessage(e, 'Could not update'));
    }
  }, [selected, name, description, managerId, memberIds, statusPick, priorityPick, loadPage]);

  const confirmDelete = useCallback(
    (p: ProjectRecord) => {
      appConfirm({
        title: 'Delete project',
        message: `Remove "${p.name}"?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteProjectApi(p.id);
            setDetailOpen(false);
            await loadPage();
          } catch (e) {
            appError('Projects', extractErrorMessage(e, 'Could not delete'));
          }
        },
      });
    },
    [loadPage],
  );

  const managerOptions = useMemo(
    () => teamPool.map((m) => ({ value: m.id, label: m.name })),
    [teamPool],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProjectRecord }) => (
      <WorkshopListCard
        icon="folder-open"
        iconColor="#f97316"
        iconBg="#fff7ed"
        title={item.name}
        subtitle={item.projectManager?.name ?? 'No manager'}
        meta={`${statusLabel(item.priority)} priority`}
        badges={[{ label: item.status, tone: 'status' }]}
        progress={item.completionPercent}
        onPress={() => {
          setSelected(item);
          setDetailOpen(true);
        }}
        actions={
          canManageProjects()
            ? [{ icon: 'create-outline', onPress: () => openEdit(item) }]
            : undefined
        }
      />
    ),
    [canManageProjects, openEdit],
  );

  const formFields = (
    <>
      <WorkshopFieldLabel>Name</WorkshopFieldLabel>
      <WorkshopTextInput value={name} onChangeText={setName} placeholder="Project name" />
      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Optional"
        multiline
        style={{ minHeight: 72 }}
      />
      <WorkshopPickerField
        label="Status"
        value={statusLabel(statusPick)}
        onPress={() => setStatusOpen(true)}
      />
      <WorkshopPickerField
        label="Priority"
        value={statusLabel(priorityPick)}
        onPress={() => setPriorityOpen(true)}
      />
      <WorkshopPickerField
        label="Project manager"
        value={teamPool.find((m) => m.id === managerId)?.name ?? 'Select'}
        onPress={() => setManagerOpen(true)}
      />
      <WorkshopFieldLabel>Team members</WorkshopFieldLabel>
      <View
        style={{
          marginBottom: 10,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: WS.border,
          backgroundColor: '#fafafa',
          overflow: 'hidden',
        }}
      >
        {teamPool.length === 0 ? (
          <Text style={{ paddingHorizontal: 14, paddingVertical: 12, color: WS.textMuted }}>
            No users available
          </Text>
        ) : (
          teamPool.map((m, idx) => {
            const on = memberIds.has(m.id);
            return (
              <Pressable
                key={m.id}
                onPress={() => {
                  setMemberIds((prev) => {
                    const n = new Set(prev);
                    if (n.has(m.id)) n.delete(m.id);
                    else n.add(m.id);
                    return n;
                  });
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: idx < teamPool.length - 1 ? 1 : 0,
                  borderBottomColor: WS.border,
                }}
              >
                <Ionicons
                  name={on ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={on ? WS.primary : WS.textLight}
                />
                <Text style={{ marginLeft: 10, flex: 1, color: WS.text }}>{m.name}</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </>
  );

  return (
    <>
    <WorkshopChrome
      title="Projects"
      subtitle="Track delivery & progress"
      right={
        canManageProjects() ? (
          <WorkshopHeaderButton onPress={openCreate} />
        ) : (
          <View style={{ width: 72 }} />
        )
      }
      scroll={false}
    >
      <WorkshopSearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search projects…"
      />

      {loading && items.length === 0 ? (
        <WorkshopLoading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => x.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="folder-open-outline"
              title="No projects"
              subtitle="Create a project to organize workshop work."
              actionLabel={canManageProjects() ? 'New project' : undefined}
              onAction={canManageProjects() ? openCreate : undefined}
            />
          }
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 10 }}>
        <View style={{ flex: 1 }}>
          <WorkshopOutlineButton
            label="Previous"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
          />
        </View>
        <Text style={{ fontWeight: '600', color: WS.textMuted }}>
          {page} / {totalPages}
        </Text>
        <View style={{ flex: 1 }}>
          <WorkshopOutlineButton label="Next" onPress={() => setPage((p) => p + 1)} />
        </View>
      </View>

    </WorkshopChrome>

      <WorkshopFormSheet
        visible={detailOpen}
        title="Project"
        onClose={() => setDetailOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {canManageProjects() && selected ? (
                <View style={{ flex: 1 }}>
                  <WorkshopPrimaryButton
                    label="Edit"
                    onPress={() => {
                      setDetailOpen(false);
                      openEdit(selected);
                    }}
                  />
                </View>
              ) : null}
              {canManageProjects() && selected ? (
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => selected && confirmDelete(selected)}
                    style={{
                      alignItems: 'center',
                      borderRadius: 14,
                      paddingVertical: 15,
                      backgroundColor: WS.danger,
                    }}
                  >
                    <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>Delete</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
            <Pressable
              onPress={() => setDetailOpen(false)}
              style={{ alignItems: 'center', paddingVertical: 10 }}
            >
              <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
            </Pressable>
          </View>
        }
      >
        {selected ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginBottom: 8 }}>
              {selected.name}
            </Text>
            <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 16 }}>
              {selected.description || '—'}
            </Text>
            <WorkshopDetailRow label="Status" value={selected.status} />
            <WorkshopDetailRow label="Priority" value={selected.priority} />
            <WorkshopDetailRow
              label="Progress"
              value={`${selected.completionPercent}%`}
            />
            <WorkshopDetailRow
              label="Manager"
              value={selected.projectManager?.name ?? '—'}
            />
          </>
        ) : null}
      </WorkshopFormSheet>

      <MobileFormSheet
        visible={createOpen}
        title="New project"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
        {formFields}
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit project"
        onCancel={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSave={() => void submitEdit()}
      >
        {formFields}
      </MobileFormSheet>

      <OptionSheet
        visible={statusOpen}
        title="Status"
        options={PROJECT_STATUSES.map((s) => ({
          value: s,
          label: statusLabel(s),
        }))}
        onSelect={(v) => {
          setStatusPick(v);
          setStatusOpen(false);
        }}
        onClose={() => setStatusOpen(false)}
      />
      <OptionSheet
        visible={priorityOpen}
        title="Priority"
        options={PROJECT_PRIORITIES.map((s) => ({
          value: s,
          label: statusLabel(s),
        }))}
        onSelect={(v) => {
          setPriorityPick(v);
          setPriorityOpen(false);
        }}
        onClose={() => setPriorityOpen(false)}
      />
      <OptionSheet
        visible={managerOpen}
        title="Project manager"
        options={managerOptions}
        onSelect={(v) => {
          setManagerId(v);
          setManagerOpen(false);
        }}
        onClose={() => setManagerOpen(false)}
      />
    </>
  );
}
