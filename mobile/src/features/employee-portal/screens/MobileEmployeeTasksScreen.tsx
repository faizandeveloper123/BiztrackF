import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  getPortalTasks,
  createPortalTask,
  logPortalTask,
  completePortalTask,
  getPortalTaskMessages,
  createPortalTaskMessage,
  type PortalTaskMessage,
} from '../../../services/employeePortal/employeePortalMobileApi';
import type { SubTaskRecord } from '../../../models/project/pmApiTypes';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFAB,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WorkshopChipSelect,
  WorkshopPrimaryButton,
  WorkshopBadge,
  WorkshopEmptyState,
  WorkshopDetailRow,
  WS,
} from '../../workshop/components/WorkshopChrome';

const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return value.slice(0, 10);
}

function formatPerson(
  person?: { name?: string; email?: string } | null,
) {
  if (!person) return '—';
  return person.name || person.email || '—';
}

function previewText(value?: string | null, max = 100) {
  const text = (value || '').trim();
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export function MobileEmployeeTasksScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const { hasPermission, isOwner } = usePermissions();
  const canViewTasks =
    isOwner() || hasPermission('projects:tasks:view');
  const canCreateTasks =
    isOwner() || hasPermission('projects:tasks:create');
  const canUpdateTasks =
    isOwner() || hasPermission('projects:tasks:update');
  const [tasks, setTasks] = useState<SubTaskRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState<SubTaskRecord | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [logHours, setLogHours] = useState('1');
  const [logNotes, setLogNotes] = useState('');
  const [messages, setMessages] = useState<PortalTaskMessage[]>([]);
  const [messageBody, setMessageBody] = useState('');
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!canViewTasks) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await getPortalTasks();
      setTasks(res.tasks ?? []);
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [canViewTasks]);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/tasks');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const openDetails = (task: SubTaskRecord) => {
    setSelected(task);
    setDetailOpen(true);
  };

  const create = async () => {
    if (!canCreateTasks) {
      appAlert('Tasks', 'You do not have permission to create tasks');
      return;
    }
    if (!title.trim()) {
      appAlert('Tasks', 'Title is required');
      return;
    }
    setSaving(true);
    try {
      await createPortalTask({
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        priority,
      });
      setCreateOpen(false);
      setTitle('');
      setDescription('');
      await load();
      appAlert('Tasks', 'Task created');
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  const log = async () => {
    if (!selected) return;
    if (!canUpdateTasks) {
      appAlert('Tasks', 'You do not have permission to update tasks');
      return;
    }
    const h = parseFloat(logHours);
    if (!Number.isFinite(h) || h <= 0) {
      appAlert('Tasks', 'Enter valid hours');
      return;
    }
    setSaving(true);
    try {
      await logPortalTask(selected.id, {
        hours: h,
        notes: logNotes.trim() || undefined,
        status: 'in_progress',
      });
      setLogOpen(false);
      setLogNotes('');
      await load();
      appAlert('Tasks', 'Time logged');
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to log'));
    } finally {
      setSaving(false);
    }
  };

  const complete = (task: SubTaskRecord) => {
    if (!canUpdateTasks) {
      appAlert('Tasks', 'You do not have permission to update tasks');
      return;
    }
    appConfirm({
      title: 'Tasks',
      message: `Mark "${task.title}" as done?`,
      confirmLabel: 'Done',
      onConfirm: async () => {
        try {
          await completePortalTask(task.id);
          setDetailOpen(false);
          await load();
        } catch (e) {
          appError('Tasks', extractErrorMessage(e, 'Failed to complete'));
        }
      },
    });
  };

  const openChat = async (task: SubTaskRecord) => {
    setSelected(task);
    setDetailOpen(false);
    setChatOpen(true);
    setMessagesLoading(true);
    try {
      const data = await getPortalTaskMessages(task.id);
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to load messages'));
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async (messageType: 'message' | 'info_request') => {
    if (!canUpdateTasks) {
      appAlert('Tasks', 'You do not have permission to update tasks');
      return;
    }
    if (!selected || !messageBody.trim()) {
      appAlert('Tasks', 'Enter a message');
      return;
    }
    setSaving(true);
    try {
      const created = await createPortalTaskMessage(selected.id, {
        body: messageBody.trim(),
        messageType,
      });
      setMessages((prev) => [...prev, created]);
      setMessageBody('');
      appAlert(
        'Tasks',
        messageType === 'info_request' ? 'Info request sent' : 'Message sent',
      );
    } catch (e) {
      appError('Tasks', extractErrorMessage(e, 'Failed to send message'));
    } finally {
      setSaving(false);
    }
  };

  if (!canViewTasks) {
    return (
      <WorkshopChrome title="My tasks" subtitle="Assigned tasks and logs">
        <WorkshopEmptyState
          icon="lock-closed-outline"
          title="No access"
          subtitle="You do not have permission to view tasks."
        />
      </WorkshopChrome>
    );
  }

  if (loading && tasks.length === 0) return <WorkshopLoading />;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="My tasks" subtitle="Assigned tasks and logs" scroll={false}>
        <FlatList
          style={{ flex: 1 }}
          data={tasks}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <WorkshopEmptyState
              icon="checkbox-outline"
              title="No tasks"
              subtitle={
                canCreateTasks
                  ? 'Create or wait for assigned tasks.'
                  : 'No tasks assigned to you yet.'
              }
              actionLabel={canCreateTasks ? 'Create task' : undefined}
              onAction={canCreateTasks ? () => setCreateOpen(true) : undefined}
            />
          }
          renderItem={({ item }) => {
            const descPreview = previewText(item.description);
            return (
              <Pressable
                className="mb-3 rounded-xl border border-slate-200 bg-white p-4"
                onPress={() => openDetails(item)}
              >
                <View className="flex-row items-start justify-between gap-2">
                  <Text className="flex-1 font-semibold text-slate-900">{item.title}</Text>
                  <WorkshopBadge label={item.status} />
                </View>
                {descPreview ? (
                  <Text className="mt-2 text-sm leading-5 text-slate-600">{descPreview}</Text>
                ) : (
                  <Text className="mt-2 text-sm italic text-slate-400">No description</Text>
                )}
                <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
                  <Text className="text-xs capitalize text-slate-500">{item.priority} priority</Text>
                  {item.dueDate ? (
                    <Text className="text-xs text-indigo-600">Due {formatDate(item.dueDate)}</Text>
                  ) : null}
                  {item.createdBy?.name ? (
                    <Text className="text-xs text-slate-500">By {item.createdBy.name}</Text>
                  ) : null}
                </View>
                <Text className="mt-3 text-xs font-semibold text-indigo-700">Tap to view full details</Text>
              </Pressable>
            );
          }}
        />
      </WorkshopChrome>
      {canCreateTasks ? (
        <WorkshopFAB onPress={() => setCreateOpen(true)} />
      ) : null}

      <WorkshopFormSheet
        visible={detailOpen}
        title="Task details"
        onClose={() => setDetailOpen(false)}
        footer={
          selected ? (
            <View style={{ gap: 8 }}>
              {canUpdateTasks ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <WorkshopPrimaryButton
                      label="Ask / Chat"
                      onPress={() => void openChat(selected)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Pressable
                      onPress={() => {
                        setDetailOpen(false);
                        setLogOpen(true);
                      }}
                      style={{
                        alignItems: 'center',
                        borderRadius: 14,
                        paddingVertical: 15,
                        borderWidth: 1,
                        borderColor: WS.primary,
                        backgroundColor: '#fff',
                      }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 16, color: WS.primary }}>Log time</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {canUpdateTasks && selected.status !== 'completed' ? (
                <WorkshopPrimaryButton
                  label="Mark as done"
                  onPress={() => complete(selected)}
                />
              ) : null}
              <Pressable
                onPress={() => setDetailOpen(false)}
                style={{ alignItems: 'center', paddingVertical: 10 }}
              >
                <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Close</Text>
              </Pressable>
            </View>
          ) : (
            <WorkshopPrimaryButton label="Close" onPress={() => setDetailOpen(false)} />
          )
        }
      >
        {selected ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginBottom: 8 }}>
              {selected.title}
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: WS.textMuted, marginBottom: 6 }}>
              Description
            </Text>
            <View
              style={{
                marginBottom: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                backgroundColor: '#f8fafc',
                padding: 12,
              }}
            >
              <Text style={{ fontSize: 14, lineHeight: 21, color: WS.text }}>
                {(selected.description || '').trim() || 'No description provided.'}
              </Text>
            </View>
            <WorkshopDetailRow label="Status" value={selected.status} />
            <WorkshopDetailRow label="Priority" value={selected.priority} />
            <WorkshopDetailRow label="Due date" value={formatDate(selected.dueDate)} />
            <WorkshopDetailRow
              label="Assigned to"
              value={formatPerson(selected.assignedTo)}
            />
            <WorkshopDetailRow
              label="Assigned by"
              value={formatPerson(selected.createdBy)}
            />
            <WorkshopDetailRow
              label="Estimated hours"
              value={
                selected.estimatedHours != null && selected.estimatedHours !== undefined
                  ? String(selected.estimatedHours)
                  : '—'
              }
            />
            <WorkshopDetailRow
              label="Logged hours"
              value={String(selected.actualHours ?? 0)}
            />
            <WorkshopDetailRow
              label="Tags"
              value={
                selected.tags?.length
                  ? selected.tags.join(', ')
                  : '—'
              }
            />
            <WorkshopDetailRow
              label="Created"
              value={formatDate(selected.createdAt)}
            />
            {selected.completedAt ? (
              <WorkshopDetailRow
                label="Completed"
                value={formatDate(selected.completedAt)}
              />
            ) : null}
          </>
        ) : null}
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={createOpen}
        title="Create task"
        onClose={() => setCreateOpen(false)}
        footer={
          <WorkshopPrimaryButton
            label={saving ? 'Creating...' : 'Create task'}
            onPress={() => void create()}
            disabled={saving}
          />
        }
      >
        <WorkshopFieldLabel>Title</WorkshopFieldLabel>
        <WorkshopTextInput value={title} onChangeText={setTitle} />
        <WorkshopFieldLabel>Description</WorkshopFieldLabel>
        <WorkshopTextInput value={description} onChangeText={setDescription} multiline />
        <WorkshopDatePickerField label="Due date" value={dueDate} onChange={setDueDate} />
        <WorkshopChipSelect label="Priority" options={PRIORITIES} value={priority} onChange={setPriority} />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={logOpen}
        title="Log time"
        onClose={() => setLogOpen(false)}
        footer={
          <WorkshopPrimaryButton
            label={saving ? 'Saving...' : 'Log time'}
            onPress={() => void log()}
            disabled={saving}
          />
        }
      >
        <Text className="mb-3 text-sm text-slate-600">{selected?.title}</Text>
        <WorkshopFieldLabel>Hours</WorkshopFieldLabel>
        <WorkshopTextInput value={logHours} onChangeText={setLogHours} keyboardType="decimal-pad" />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={logNotes} onChangeText={setLogNotes} multiline />
      </WorkshopFormSheet>

      <WorkshopFormSheet
        visible={chatOpen}
        title="Task communication"
        onClose={() => {
          setChatOpen(false);
          setMessageBody('');
        }}
        footer={
          <View className="gap-2">
            <WorkshopPrimaryButton
              label={saving ? 'Sending...' : 'Ask for more info'}
              onPress={() => void sendMessage('info_request')}
              disabled={saving}
            />
            <WorkshopPrimaryButton
              label={saving ? 'Sending...' : 'Send message'}
              onPress={() => void sendMessage('message')}
              disabled={saving}
            />
          </View>
        }
      >
        <Text className="mb-2 text-sm font-medium text-slate-800">{selected?.title}</Text>
        <Text className="mb-3 text-xs text-slate-500">
          Ask the assigner for details or keep the conversation here.
        </Text>
        <ScrollView style={{ maxHeight: 220 }} className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-2">
          {messagesLoading ? (
            <Text className="py-4 text-center text-sm text-slate-500">Loading messages...</Text>
          ) : messages.length === 0 ? (
            <Text className="py-4 text-center text-sm text-slate-500">No messages yet.</Text>
          ) : (
            messages.map((message) => (
              <View
                key={message.id}
                className={`mb-2 rounded-lg px-3 py-2 ${
                  message.isMine ? 'bg-indigo-50' : 'bg-white'
                }`}
              >
                <Text className="text-xs font-semibold text-slate-700">
                  {message.authorName}
                  {message.messageType === 'info_request' ? ' · Info request' : ''}
                </Text>
                <Text className="mt-1 text-sm text-slate-900">{message.body}</Text>
              </View>
            ))
          )}
        </ScrollView>
        <WorkshopFieldLabel>Message</WorkshopFieldLabel>
        <WorkshopTextInput
          value={messageBody}
          onChangeText={setMessageBody}
          multiline
        />
      </WorkshopFormSheet>
    </View>
  );
}
