import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopPrimaryButton,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { usePermissions } from '../../../hooks/usePermissions';
import type { ProjectRecord, SubTaskRecord } from '../../../models/project';
import {
  createTaskApi,
  deleteTaskApi,
  fetchProjectsPaged,
  fetchProjectTeamMembers,
  fetchTasksPaged,
  updateTaskApi,
} from '../../../services/projects/projectMobileApi';

const TASK_STATUSES = ['todo', 'in_progress', 'completed', 'cancelled'] as const;
const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;

function label(s: string): string {
  return s.replace(/_/g, ' ');
}

export function MobileTasksScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canCreateTasks, canUpdateTasks, canDeleteTasks } = usePermissions();

  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [team, setTeam] = useState<
    { id: string; name: string; role?: string; email?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectSheetOpen, setProjectSheetOpen] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<SubTaskRecord | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignId, setAssignId] = useState<string>('');
  const [due, setDue] = useState('');
  const [statusPick, setStatusPick] = useState('todo');
  const [priorityPick, setPriorityPick] = useState('medium');
  const [statusPickOpen, setStatusPickOpen] = useState(false);
  const [priorityPickOpen, setPriorityPickOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [projectPickOpen, setProjectPickOpen] = useState(false);

  const loadRefs = useCallback(async () => {
    try {
      const [pr, tm] = await Promise.all([
        fetchProjectsPaged(1, 100),
        fetchProjectTeamMembers(),
      ]);
      setProjects(pr.projects ?? []);
      setTeam(
        (tm.teamMembers ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          role: m.role,
          email: m.email,
        })),
      );
    } catch {
      setProjects([]);
      setTeam([]);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchTasksPaged(1, 100, {
        project: projectFilter === 'all' ? undefined : projectFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        main_tasks_only: true,
        include_subtasks: false,
      });
      setTasks(res.tasks ?? []);
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [projectFilter, statusFilter]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/tasks',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRefs(), loadTasks()]);
    setRefreshing(false);
  }, [loadRefs, loadTasks]);

  const openCreate = useCallback(() => {
    const first = projects[0]?.id ?? '';
    setTitle('');
    setDescription('');
    setProjectId(first);
    setAssignId('');
    setDue('');
    setStatusPick('todo');
    setPriorityPick('medium');
    setCreateOpen(true);
  }, [projects]);

  const openEdit = useCallback((t: SubTaskRecord) => {
    setSelected(t);
    setTitle(t.title);
    setDescription(t.description ?? '');
    setProjectId(t.projectId ?? '');
    setAssignId(t.assignedToId ?? '');
    setDue(t.dueDate ?? '');
    setStatusPick(t.status);
    setPriorityPick(t.priority);
    setEditOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!title.trim() || !projectId) {
      appAlert('Tasks', 'Title and project are required.');
      return;
    }
    try {
      await createTaskApi({
        title: title.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        projectId,
        assignedToId: assignId || undefined,
        dueDate: due.trim() || undefined,
      });
      setCreateOpen(false);
      await loadTasks();
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Could not create'));
    }
  }, [title, description, projectId, assignId, due, statusPick, priorityPick, loadTasks]);

  const submitEdit = useCallback(async () => {
    if (!selected || !title.trim()) return;
    try {
      await updateTaskApi(selected.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: statusPick,
        priority: priorityPick,
        assignedToId: assignId || undefined,
        dueDate: due.trim() || undefined,
      });
      setEditOpen(false);
      setSelected(null);
      await loadTasks();
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Could not update'));
    }
  }, [selected, title, description, assignId, due, statusPick, priorityPick, loadTasks]);

  const confirmDelete = useCallback(
    (t: SubTaskRecord) => {
      appConfirm({
        title: 'Delete task',
        message: `Remove "${t.title}"?`,
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteTaskApi(t.id);
            setDetailOpen(false);
            await loadTasks();
          } catch (e) {
            appError('Tasks', extractErrorMessage(e, 'Could not delete'));
          }
        },
      });
    },
    [loadTasks],
  );

  const projectOptions = useMemo(
    () => [
      { value: 'all', label: 'All projects' },
      ...projects.map((p) => ({ value: p.id, label: p.name })),
    ],
    [projects],
  );

  const projectFormOptions = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: p.name,
        icon: 'folder-outline' as const,
        subtitle: `${label(p.status)} · ${p.completionPercent ?? 0}% complete`,
      })),
    [projects],
  );

  const assignOptions = useMemo(
    () => [
      {
        value: '',
        label: 'Unassigned',
        subtitle: 'No one assigned to this task',
        icon: 'person-outline' as const,
      },
      ...team.map((m) => ({
        value: m.id,
        label: m.name,
        subtitle: m.role || m.email || 'Team member',
      })),
    ],
    [team],
  );

  const formBody = (
    <>
      <WorkshopFieldLabel>Title</WorkshopFieldLabel>
      <WorkshopTextInput value={title} onChangeText={setTitle} placeholder="Task title" />
      <WorkshopFieldLabel>Description</WorkshopFieldLabel>
      <WorkshopTextInput
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ minHeight: 72 }}
      />
      {createOpen ? (
        <WorkshopPickerField
          label="Project"
          value={projects.find((p) => p.id === projectId)?.name ?? ''}
          placeholder="Select project"
          onPress={() => setProjectPickOpen(true)}
        />
      ) : null}
      <WorkshopPickerField
        label="Assignee"
        value={
          assignId
            ? team.find((x) => x.id === assignId)?.name ?? ''
            : 'Unassigned'
        }
        onPress={() => setAssignOpen(true)}
      />
      <WorkshopDatePickerField label="Due date" value={due} onChange={setDue} />
      <WorkshopPickerField
        label="Status"
        value={label(statusPick)}
        onPress={() => setStatusPickOpen(true)}
      />
      <WorkshopPickerField
        label="Priority"
        value={label(priorityPick)}
        onPress={() => setPriorityPickOpen(true)}
      />
    </>
  );

  return (
    <>
      <WorkshopChrome
        title="Tasks"
        subtitle="Track work across projects"
        right={
          canCreateTasks() ? (
            <WorkshopHeaderButton onPress={openCreate} />
          ) : (
            <View style={{ width: 72 }} />
          )
        }
        scroll={false}
      >
        <WorkshopFilterBar
          resultCount={tasks.length}
          activeFilterCount={countActiveFilters([projectFilter, statusFilter])}
          onResetFilters={() => {
            setProjectFilter('all');
            setStatusFilter('all');
          }}
        >
          <WorkshopPickerField
            label="Project"
            value={projectOptions.find((o) => o.value === projectFilter)?.label ?? 'All projects'}
            onPress={() => setProjectSheetOpen(true)}
          />
          <WorkshopPickerField
            label="Status"
            value={statusFilter === 'all' ? 'All statuses' : label(statusFilter)}
            onPress={() => setStatusSheetOpen(true)}
          />
        </WorkshopFilterBar>

        {loading && tasks.length === 0 ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={tasks}
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
                icon="checkbox-outline"
                iconColor="#4f46e5"
                iconBg="#eef2ff"
                title={item.title}
                subtitle={item.assignedTo?.name ?? 'Unassigned'}
                meta={`${label(item.status)} · ${label(item.priority)}`}
                badges={[{ label: item.status, tone: 'status' }]}
                onPress={() => {
                  setSelected(item);
                  setDetailOpen(true);
                }}
                actions={
                  canUpdateTasks()
                    ? [{ icon: 'create-outline', onPress: () => openEdit(item) }]
                    : undefined
                }
              />
            )}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="checkbox-outline"
                title="No tasks"
                subtitle="Create a task to track project work."
                actionLabel={canCreateTasks() ? 'New task' : undefined}
                onAction={canCreateTasks() ? openCreate : undefined}
              />
            }
          />
        )}
      </WorkshopChrome>

      <WorkshopFormSheet
        visible={detailOpen}
        title="Task"
        onClose={() => setDetailOpen(false)}
        footer={
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {canUpdateTasks() && selected ? (
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
              {canDeleteTasks() && selected ? (
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
            <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginBottom: 12 }}>
              {selected.title}
            </Text>
            <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 16 }}>
              {selected.description || '—'}
            </Text>
            <WorkshopDetailRow label="Status" value={selected.status} />
            <WorkshopDetailRow label="Priority" value={selected.priority} />
            <WorkshopDetailRow
              label="Assignee"
              value={selected.assignedTo?.name ?? '—'}
            />
            <WorkshopDetailRow label="Due" value={selected.dueDate ?? '—'} />
          </>
        ) : null}
      </WorkshopFormSheet>

      <MobileFormSheet
        visible={createOpen}
        title="New task"
        onCancel={() => setCreateOpen(false)}
        onSave={() => void submitCreate()}
        saveLabel="Create"
      >
        {formBody}
      </MobileFormSheet>

      <MobileFormSheet
        visible={editOpen}
        title="Edit task"
        onCancel={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSave={() => void submitEdit()}
      >
        {formBody}
      </MobileFormSheet>

      <OptionSheet
        visible={projectSheetOpen}
        title="Project"
        options={projectOptions}
        onSelect={(v) => {
          setProjectFilter(v);
          setProjectSheetOpen(false);
        }}
        onClose={() => setProjectSheetOpen(false)}
      />
      <OptionSheet
        visible={statusSheetOpen}
        title="Status"
        options={[
          { value: 'all', label: 'All statuses' },
          ...TASK_STATUSES.map((s) => ({ value: s, label: label(s) })),
        ]}
        onSelect={(v) => {
          setStatusFilter(v);
          setStatusSheetOpen(false);
        }}
        onClose={() => setStatusSheetOpen(false)}
      />
      <OptionSheet
        visible={statusPickOpen}
        title="Status"
        options={TASK_STATUSES.map((s) => ({ value: s, label: label(s) }))}
        onSelect={(v) => {
          setStatusPick(v);
          setStatusPickOpen(false);
        }}
        onClose={() => setStatusPickOpen(false)}
      />
      <OptionSheet
        visible={priorityPickOpen}
        title="Priority"
        options={TASK_PRIORITIES.map((s) => ({ value: s, label: label(s) }))}
        onSelect={(v) => {
          setPriorityPick(v);
          setPriorityPickOpen(false);
        }}
        onClose={() => setPriorityPickOpen(false)}
      />
      <OptionSheet
        visible={assignOpen}
        title="Assign to"
        description="Choose a team member for this task"
        options={assignOptions}
        selectedValue={assignId}
        searchable
        searchPlaceholder="Search team members…"
        emptyText="No team members match your search"
        onSelect={(v) => {
          setAssignId(v);
          setAssignOpen(false);
        }}
        onClose={() => setAssignOpen(false)}
      />
      <OptionSheet
        visible={projectPickOpen}
        title="Select project"
        description="Which project does this task belong to?"
        options={projectFormOptions}
        selectedValue={projectId}
        searchable
        searchPlaceholder="Search projects…"
        emptyText="No projects match your search"
        onSelect={(v) => {
          setProjectId(v);
          setProjectPickOpen(false);
        }}
        onClose={() => setProjectPickOpen(false)}
      />
    </>
  );
}
