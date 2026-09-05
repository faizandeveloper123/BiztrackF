import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopOutlineButton,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopPickerField,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Employee } from '../../../models/hrm';
import type { ProjectRecord, ProjectTimeEntry, SubTaskRecord } from '../../../models/project';
import { getEmployees } from '../../../services/hrm/hrmMobileApi';
import {
  createProjectTimeEntryApi,
  deleteProjectTimeEntryApi,
  fetchProjectTimeEntriesPaged,
  fetchProjectsPaged,
  fetchTasksPaged,
  updateProjectTimeEntryApi,
} from '../../../services/projects/projectMobileApi';

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildClockInIso(dateYmd: string, timeHm: string): string {
  const t = timeHm.trim();
  if (/^\d{2}:\d{2}$/.test(t)) {
    return `${dateYmd}T${t}:00`;
  }
  return t.length > 0 ? t : `${dateYmd}T09:00:00`;
}

export function MobileTimeTrackingScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canManageProjects } = usePermissions();

  const [entries, setEntries] = useState<ProjectTimeEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [empId, setEmpId] = useState('');
  const [dateStr, setDateStr] = useState(todayYmd);
  const [timeStr, setTimeStr] = useState('09:00');
  const [hoursStr, setHoursStr] = useState('1');
  const [projId, setProjId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [notes, setNotes] = useState('');

  const [empOpen, setEmpOpen] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);

  const loadRefs = useCallback(async () => {
    try {
      const [em, pr] = await Promise.all([
        getEmployees(1, 200),
        fetchProjectsPaged(1, 100),
      ]);
      setEmployees(em.employees ?? []);
      setProjects(pr.projects ?? []);
      setEmpId((prev) => prev || em.employees?.[0]?.id || '');
    } catch {
      setEmployees([]);
      setProjects([]);
    }
  }, []);

  const selectedEmployeeLabel = useMemo(() => {
    const e = employees.find((x) => x.id === empId);
    if (!e) return 'Select';
    return `${e.firstName} ${e.lastName}`.trim() || e.email;
  }, [employees, empId]);

  const loadTasksForProject = useCallback(async (pid: string) => {
    if (!pid) {
      setTasks([]);
      return;
    }
    try {
      const res = await fetchTasksPaged(1, 100, {
        project: pid,
        main_tasks_only: true,
        include_subtasks: false,
      });
      setTasks(res.tasks ?? []);
    } catch {
      setTasks([]);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchProjectTimeEntriesPaged(page, 25);
      setEntries(res.timeEntries ?? []);
      setTotalPages(Math.max(1, res.pagination?.pages ?? 1));
    } catch (e) {
      appError('Time tracking', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/time-tracking',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadRefs();
  }, [loadRefs]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (projId) void loadTasksForProject(projId);
    else {
      setTasks([]);
      setTaskId('');
    }
  }, [projId, loadTasksForProject]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRefs(), loadEntries()]);
    setRefreshing(false);
  }, [loadRefs, loadEntries]);

  const openCreate = useCallback(() => {
    setEditingEntryId(null);
    setDateStr(todayYmd());
    setTimeStr('09:00');
    setHoursStr('1');
    setProjId('');
    setTaskId('');
    setNotes('');
    setCreateOpen(true);
  }, []);

  const openEdit = useCallback((entry: ProjectTimeEntry) => {
    setEditingEntryId(entry.id);
    setEmpId(entry.employeeId);
    setDateStr(entry.date || todayYmd());
    const clockIn = entry.clockIn || '';
    const time = clockIn.includes('T')
      ? clockIn.split('T')[1]?.slice(0, 5) || '09:00'
      : clockIn.slice(0, 5) || '09:00';
    setTimeStr(time);
    setHoursStr(String(entry.totalHours ?? 1));
    setProjId(entry.projectId ?? '');
    setTaskId(entry.taskId ?? '');
    setNotes(entry.notes ?? '');
    setCreateOpen(true);
  }, []);

  const submitCreate = useCallback(async () => {
    if (!empId) {
      appAlert('Time tracking', 'Select an employee.');
      return;
    }
    const h = parseFloat(hoursStr.replace(',', '.'));
    if (Number.isNaN(h) || h <= 0) {
      appAlert('Time tracking', 'Enter valid hours.');
      return;
    }
    try {
      const payload = {
        employeeId: empId,
        date: dateStr,
        clockIn: buildClockInIso(dateStr, timeStr),
        totalHours: h,
        projectId: projId || undefined,
        taskId: taskId || undefined,
        notes: notes.trim() || undefined,
        status: 'active' as const,
      };
      if (editingEntryId) {
        await updateProjectTimeEntryApi(editingEntryId, payload);
      } else {
        await createProjectTimeEntryApi(payload);
      }
      setCreateOpen(false);
      setEditingEntryId(null);
      await loadEntries();
    } catch (e) {
      appError('Time tracking', extractErrorMessage(e, 'Could not save'));
    }
  }, [editingEntryId, empId, dateStr, timeStr, hoursStr, projId, taskId, notes, loadEntries]);

  const removeEntry = useCallback((entry: ProjectTimeEntry) => {
    appConfirm({
      title: 'Delete entry',
      message: `Delete entry on ${entry.date}?`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteProjectTimeEntryApi(entry.id);
          await loadEntries();
        } catch (e) {
          appError('Time tracking', extractErrorMessage(e, 'Could not delete'));
        }
      },
    });
  }, [loadEntries]);

  const empOptions = useMemo(
    () => employees.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName}`.trim() || e.email,
    })),
    [employees],
  );

  const projOptions = useMemo(
    () => [{ value: '', label: 'No project' }, ...projects.map((p) => ({ value: p.id, label: p.name }))],
    [projects],
  );

  const taskOptions = useMemo(
    () => [{ value: '', label: 'No task' }, ...tasks.map((t) => ({ value: t.id, label: t.title }))],
    [tasks],
  );

  const formBody = (
    <>
      <WorkshopPickerField
        label="Employee"
        value={selectedEmployeeLabel}
        onPress={() => setEmpOpen(true)}
      />
      <WorkshopDatePickerField label="Date" value={dateStr} onChange={setDateStr} />
      <WorkshopFieldLabel>Start time</WorkshopFieldLabel>
      <WorkshopTextInput value={timeStr} onChangeText={setTimeStr} placeholder="HH:MM" />
      <WorkshopFieldLabel>Hours</WorkshopFieldLabel>
      <WorkshopTextInput
        value={hoursStr}
        onChangeText={setHoursStr}
        keyboardType="decimal-pad"
      />
      <WorkshopPickerField
        label="Project"
        value={projId ? projects.find((p) => p.id === projId)?.name ?? '' : 'Optional'}
        onPress={() => setProjOpen(true)}
      />
      <WorkshopPickerField
        label="Task"
        value={
          !projId
            ? 'Pick a project first'
            : taskId
              ? tasks.find((t) => t.id === taskId)?.title ?? ''
              : 'Optional'
        }
        onPress={() => {
          if (!projId) {
            appAlert('Time tracking', 'Select a project first to attach a task.');
            return;
          }
          setTaskOpen(true);
        }}
      />
      <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
      <WorkshopTextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        style={{ minHeight: 64 }}
      />
    </>
  );

  return (
    <>
      <WorkshopChrome
        title="Time tracking"
        subtitle="Log hours against projects"
        right={
          canManageProjects() ? (
            <WorkshopHeaderButton onPress={openCreate} />
          ) : (
            <View style={{ width: 72 }} />
          )
        }
        scroll={false}
      >
        {loading && entries.length === 0 ? (
          <WorkshopLoading />
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(x) => x.id}
            contentContainerStyle={{ paddingBottom: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={WS.primary}
              />
            }
            renderItem={({ item }) => (
              <WorkshopListCard
                icon="time-outline"
                iconColor="#4f46e5"
                iconBg="#eef2ff"
                title={item.totalHours != null ? `${item.totalHours} h` : '—'}
                subtitle={item.date}
                meta={item.notes ?? item.clockIn ?? '—'}
                onPress={canManageProjects() ? () => openEdit(item) : undefined}
                actions={
                  canManageProjects()
                    ? [
                        { icon: 'create-outline', onPress: () => openEdit(item) },
                        { icon: 'trash-outline', onPress: () => removeEntry(item), danger: true },
                      ]
                    : undefined
                }
              />
            )}
            ListEmptyComponent={
              <WorkshopEmptyState
                icon="time-outline"
                title="No time entries"
                subtitle="Log time against projects and tasks."
                actionLabel={canManageProjects() ? 'Log time' : undefined}
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

      <MobileFormSheet
        visible={createOpen}
        title={editingEntryId ? 'Edit time entry' : 'Log time'}
        onCancel={() => {
          setCreateOpen(false);
          setEditingEntryId(null);
        }}
        onSave={() => void submitCreate()}
        saveLabel={editingEntryId ? 'Save changes' : 'Save entry'}
      >
        {formBody}
      </MobileFormSheet>

      <OptionSheet
        visible={empOpen}
        title="Employee"
        options={empOptions}
        onSelect={(v) => {
          setEmpId(v);
          setEmpOpen(false);
        }}
        onClose={() => setEmpOpen(false)}
      />
      <OptionSheet
        visible={projOpen}
        title="Project"
        options={projOptions}
        onSelect={(v) => {
          setProjId(v);
          setTaskId('');
          setProjOpen(false);
        }}
        onClose={() => setProjOpen(false)}
      />
      <OptionSheet
        visible={taskOpen}
        title="Task"
        options={taskOptions}
        onSelect={(v) => {
          setTaskId(v);
          setTaskOpen(false);
        }}
        onClose={() => setTaskOpen(false)}
      />
    </>
  );
}
