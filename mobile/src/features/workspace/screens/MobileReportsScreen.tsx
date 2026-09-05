import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { MobileFormSheet } from '../../../components/layout/MobileForm';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopStatCard,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopDatePickerField,
  WS,
} from '../../workshop/components/WorkshopChrome';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appConfirm, appError } from '../../../utils/appDialog';
import {
  deleteSavedReport,
  exportReportsDashboard,
  fetchReportsDashboard,
  listSavedReports,
  renameSavedReport,
  uploadSavedReport,
  type SavedReportItem,
} from '../../../services/reports/reportsMobileApi';

function num(n: unknown): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return new Intl.NumberFormat('en-US').format(Math.round(n * 100) / 100);
  }
  return '0';
}

export function MobileReportsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const { canExportReports } = usePermissions();

  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [saved, setSaved] = useState<SavedReportItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [pickedUri, setPickedUri] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);

  const loadDash = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReportsDashboard({
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      setDash(data);
    } catch (e) {
      setError(extractErrorMessage(e, 'Failed to load reports'));
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const loadSaved = useCallback(async () => {
    try {
      setSavedLoading(true);
      const list = await listSavedReports();
      setSaved(list);
    } catch {
      setSaved([]);
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/reports',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void loadDash();
  }, [loadDash]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadDash(), loadSaved()]);
    setRefreshing(false);
  }, [loadDash, loadSaved]);

  const applyDateFilter = useCallback(() => {
    void loadDash();
  }, [loadDash]);

  const pr = (dash?.projects ?? {}) as Record<string, unknown>;
  const hrm = (dash?.hrm ?? {}) as Record<string, unknown>;
  const inv = (dash?.inventory ?? {}) as Record<string, unknown>;
  const fin = (dash?.financial ?? {}) as Record<string, unknown>;

  const handleExport = useCallback(async () => {
    if (!canExportReports()) {
      appAlert('Reports', 'You do not have permission to export.');
      return;
    }
    try {
      setExportBusy(true);
      const payload = await exportReportsDashboard({
        start_date: startDate.trim() || undefined,
        end_date: endDate.trim() || undefined,
      });
      const json = JSON.stringify(payload, null, 2);
      const fn = `reports-export-${Date.now()}.json`;
      const path = `${FileSystem.cacheDirectory ?? ''}${fn}`;
      await FileSystem.writeAsStringAsync(path, json);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: 'Export reports',
        });
      } else {
        appAlert('Export', 'Saved to app cache. Sharing is not available on this device.');
      }
    } catch (e) {
      appError('Export', extractErrorMessage(e, 'Export failed'));
    } finally {
      setExportBusy(false);
    }
  }, [canExportReports, startDate, endDate]);

  const pickFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const a = res.assets[0];
      const name = a.name || 'report.pdf';
      const lower = name.toLowerCase();
      const type =
        lower.endsWith('.csv') ? 'text/csv' : 'application/pdf';
      setPickedUri({
        uri: a.uri,
        name,
        type,
      });
    } catch (e) {
      appError('Reports', extractErrorMessage(e, 'Could not pick file'));
    }
  }, []);

  const submitUpload = useCallback(async () => {
    if (!newTitle.trim() || !pickedUri) {
      appAlert('Reports', 'Title and file are required.');
      return;
    }
    try {
      setSaveBusy(true);
      await uploadSavedReport(newTitle.trim(), pickedUri);
      setAddOpen(false);
      setNewTitle('');
      setPickedUri(null);
      await loadSaved();
    } catch (e) {
      appError('Reports', extractErrorMessage(e, 'Upload failed'));
    } finally {
      setSaveBusy(false);
    }
  }, [newTitle, pickedUri, loadSaved]);

  const submitRename = useCallback(async () => {
    if (!renameId || !renameTitle.trim()) return;
    try {
      setSaveBusy(true);
      await renameSavedReport(renameId, renameTitle.trim());
      setRenameOpen(false);
      setRenameId(null);
      await loadSaved();
    } catch (e) {
      appError('Reports', extractErrorMessage(e, 'Rename failed'));
    } finally {
      setSaveBusy(false);
    }
  }, [renameId, renameTitle, loadSaved]);

  const confirmDeleteSaved = useCallback(
    (id: string) => {
      appConfirm({
        title: 'Delete report',
        message: 'Remove this stored file?',
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: async () => {
          try {
            await deleteSavedReport(id);
            await loadSaved();
          } catch (e) {
            appError('Reports', extractErrorMessage(e, 'Delete failed'));
          }
        },
      });
    },
    [loadSaved],
  );

  return (
    <>
      <WorkshopChrome
        title="Reports"
        subtitle="Dashboard & stored files"
        right={
          <Pressable
            onPress={() => void handleExport()}
            disabled={exportBusy || !canExportReports()}
            style={{ paddingHorizontal: 8, paddingVertical: 4, opacity: canExportReports() ? 1 : 0.4 }}
          >
            {exportBusy ? (
              <ActivityIndicator size="small" color={WS.primary} />
            ) : (
              <Ionicons
                name="download-outline"
                size={26}
                color={canExportReports() ? WS.primary : WS.textLight}
              />
            )}
          </Pressable>
        }
        scroll={false}
      >
        <ScrollView
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={WS.primary} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
        <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 10 }}>
          Date range
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="Start date" value={startDate} onChange={setStartDate} />
          </View>
          <View style={{ flex: 1 }}>
            <WorkshopDatePickerField label="End date" value={endDate} onChange={setEndDate} />
          </View>
        </View>
        <Pressable
          onPress={applyDateFilter}
          style={{
            marginBottom: 20,
            alignItems: 'center',
            borderRadius: 12,
            backgroundColor: '#f1f5f9',
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontWeight: '700', color: WS.text }}>Apply</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text }}>Stored reports</Text>
          <Pressable
            onPress={() => {
              setNewTitle('');
              setPickedUri(null);
              setAddOpen(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              backgroundColor: WS.primary,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={{ marginLeft: 4, fontWeight: '700', color: '#fff' }}>Add</Text>
          </Pressable>
        </View>

        {savedLoading ? (
          <ActivityIndicator style={{ paddingVertical: 16 }} color={WS.primary} />
        ) : saved.length === 0 ? (
          <Text style={{ marginBottom: 16, fontSize: 13, color: WS.textMuted }}>
            No stored reports. Upload a PDF or CSV (max 10MB).
          </Text>
        ) : (
          saved.map((r) => (
            <WorkshopCard key={r.id}>
              <Text style={{ fontWeight: '700', color: WS.text }}>{r.title}</Text>
              <Text style={{ marginTop: 4, fontSize: 11, color: WS.textMuted }}>
                {r.file_type.toUpperCase()}
                {typeof r.file_size === 'number'
                  ? ` · ${(r.file_size / 1024).toFixed(1)} KB`
                  : ''}
              </Text>
              <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable
                  onPress={() => void Linking.openURL(r.file_url)}
                  style={{
                    borderRadius: 10,
                    backgroundColor: '#f1f5f9',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: WS.text }}>Open</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setRenameId(r.id);
                    setRenameTitle(r.title);
                    setRenameOpen(true);
                  }}
                  style={{
                    borderRadius: 10,
                    backgroundColor: '#f1f5f9',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: WS.text }}>Rename</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDeleteSaved(r.id)}
                  style={{
                    borderRadius: 10,
                    backgroundColor: WS.dangerBg,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: WS.danger }}>Delete</Text>
                </Pressable>
              </View>
            </WorkshopCard>
          ))
        )}

        {error ? (
          <View
            style={{
              marginBottom: 16,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#fecaca',
              backgroundColor: WS.dangerBg,
              padding: 14,
            }}
          >
            <Text style={{ color: '#b91c1c' }}>{error}</Text>
            <Pressable onPress={() => void loadDash()} style={{ marginTop: 8 }}>
              <Text style={{ fontWeight: '700', color: '#991b1b' }}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {loading && !dash ? <WorkshopLoading /> : null}

        {!loading && dash ? (
          <>
            <Text style={{ fontSize: 17, fontWeight: '800', color: WS.text, marginTop: 8, marginBottom: 12 }}>
              Overview
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <WorkshopStatCard
                label="Projects"
                value={num(pr.total_projects)}
                sub={`${num(pr.active_projects)} active`}
                icon="folder-outline"
                accent="#2563eb"
                accentBg="#eff6ff"
              />
              <WorkshopStatCard
                label="Employees"
                value={num(hrm.total_employees)}
                sub={`${num(hrm.active_employees)} active`}
                icon="people-outline"
                accent="#7c3aed"
                accentBg="#f5f3ff"
              />
              <WorkshopStatCard
                label="Inventory value"
                value={num(inv.total_stock_value)}
                sub={`${num(inv.low_stock_products)} low stock`}
                icon="cube-outline"
                accent="#059669"
                accentBg="#ecfdf5"
              />
              <WorkshopStatCard
                label="Net profit"
                value={num(fin.net_profit)}
                sub={`Revenue ${num(fin.total_revenue)} · Expenses ${num(fin.total_expenses)}`}
                icon="cash-outline"
                accent="#d97706"
                accentBg="#fffbeb"
              />
            </View>
          </>
        ) : null}
        </ScrollView>
      </WorkshopChrome>

      <MobileFormSheet
        visible={addOpen}
        title="Upload report"
        onCancel={() => setAddOpen(false)}
        onSave={() => void submitUpload()}
        saveLabel={saveBusy ? 'Uploading…' : 'Upload'}
        saveLoading={saveBusy}
      >
        <Text style={{ marginBottom: 12, fontSize: 13, color: WS.textMuted }}>PDF or CSV</Text>
        <WorkshopFieldLabel>Title</WorkshopFieldLabel>
        <WorkshopTextInput
          value={newTitle}
          onChangeText={setNewTitle}
          placeholder="Report title"
        />
        <Pressable
          onPress={() => void pickFile()}
          style={{
            marginBottom: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: WS.border,
            backgroundColor: '#fafafa',
            paddingVertical: 14,
          }}
        >
          <Text style={{ textAlign: 'center', color: WS.text }}>
            {pickedUri ? pickedUri.name : 'Choose file'}
          </Text>
        </Pressable>
      </MobileFormSheet>

      <MobileFormSheet
        visible={renameOpen}
        title="Rename"
        onCancel={() => setRenameOpen(false)}
        onSave={() => void submitRename()}
        saveLabel="Save"
        saveLoading={saveBusy}
      >
        <WorkshopFieldLabel>Title</WorkshopFieldLabel>
        <WorkshopTextInput value={renameTitle} onChangeText={setRenameTitle} />
      </MobileFormSheet>
    </>
  );
}
