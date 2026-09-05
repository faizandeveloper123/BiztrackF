import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getPortalDevices,
  assignPortalDevice,
  updatePortalDevice,
} from '../../../services/employeePortal/employeePortalMobileApi';
import { getEmployees } from '../../../services/hrm/hrmMobileApi';
import type { EmployeeDevice } from '../../../models/employeePortal';
import type { Employee } from '../../../models/hrm';
import { OptionSheet } from '../../../components/crm/OptionSheet';
import {
  WorkshopChrome,
  WorkshopLoading,
  WorkshopFAB,
  WorkshopFormSheet,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopChipSelect,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WorkshopBadge,
  WorkshopEmptyState,
  WorkshopOutlineButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

const DEVICE_TYPES = ['laptop', 'phone', 'tablet', 'other'];

export function MobileManagerDevicesScreen() {
  const { setSidebarActivePath } = useSidebarDrawer();
  const [devices, setDevices] = useState<EmployeeDevice[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [empPickOpen, setEmpPickOpen] = useState(false);
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [deviceType, setDeviceType] = useState('laptop');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [dev, em] = await Promise.all([
        getPortalDevices({ all_devices: true }),
        getEmployees(1, 100),
      ]);
      setDevices(dev.devices ?? []);
      const list = em.employees ?? [];
      setEmployees(list);
      setEmpId((prev) => prev || list[0]?.id || '');
    } catch (e) {
      appError('Devices', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath('/employee-portal/manage-devices');
  }, [setSidebarActivePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const employeeLabel = (id: string) => {
    const e = employees.find((x) => x.id === id);
    return e ? `${e.firstName} ${e.lastName}` : 'Select employee';
  };

  const assign = async () => {
    if (!empId || !name.trim()) {
      appAlert('Devices', 'Employee and device name required');
      return;
    }
    setSaving(true);
    try {
      await assignPortalDevice({
        employeeId: empId,
        name: name.trim(),
        deviceType,
        serialNumber: serialNumber.trim() || undefined,
        model: model.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setOpen(false);
      setName('');
      await load();
      appAlert('Devices', 'Device assigned');
    } catch (e) {
      appError('Devices', extractErrorMessage(e, 'Failed to assign'));
    } finally {
      setSaving(false);
    }
  };

  const returnDevice = async (device: EmployeeDevice) => {
    try {
      await updatePortalDevice(device.id, {
        status: 'returned',
        returnedAt: new Date().toISOString(),
      });
      await load();
    } catch (e) {
      appError('Devices', extractErrorMessage(e, 'Failed to return device'));
    }
  };

  if (loading && devices.length === 0) return <WorkshopLoading />;

  const empItems = employees.map((e) => ({
    id: e.id,
    label: `${e.firstName} ${e.lastName}`,
  }));

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <WorkshopChrome title="Device management" subtitle="Assign and track equipment" scroll={false}>
        <FlatList
          style={{ flex: 1 }}
          data={devices}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={WS.primary} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={
            <WorkshopEmptyState icon="laptop-outline" title="No devices" subtitle="Assign equipment to employees." />
          }
          renderItem={({ item }) => (
            <View className="mb-3 rounded-xl border border-slate-200 bg-white p-4">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-slate-900">{item.name}</Text>
                <WorkshopBadge label={item.status} />
              </View>
              <Text className="mt-1 text-sm text-slate-600">{item.employeeName}</Text>
              {item.serialNumber ? (
                <Text className="text-xs text-slate-500">SN: {item.serialNumber}</Text>
              ) : null}
              {item.status === 'assigned' ? (
                <View className="mt-3">
                  <WorkshopOutlineButton label="Mark returned" onPress={() => void returnDevice(item)} />
                </View>
              ) : null}
            </View>
          )}
        />
      </WorkshopChrome>
      <WorkshopFAB onPress={() => setOpen(true)} />
      <OptionSheet
        visible={empPickOpen}
        title="Employee"
        options={empItems.map((e) => ({ value: e.id, label: e.label }))}
        onSelect={(id) => {
          setEmpId(id);
          setEmpPickOpen(false);
        }}
        onClose={() => setEmpPickOpen(false)}
      />
      <WorkshopFormSheet
        visible={open}
        title="Assign device"
        onClose={() => setOpen(false)}
        footer={
          <WorkshopPrimaryButton
            label={saving ? 'Assigning...' : 'Assign device'}
            onPress={() => void assign()}
            disabled={saving}
          />
        }
      >
        <WorkshopPickerField
          label="Employee"
          value={employeeLabel(empId)}
          onPress={() => setEmpPickOpen(true)}
        />
        <WorkshopFieldLabel>Device name</WorkshopFieldLabel>
        <WorkshopTextInput value={name} onChangeText={setName} placeholder="MacBook Pro 14" />
        <WorkshopChipSelect label="Type" options={DEVICE_TYPES} value={deviceType} onChange={setDeviceType} />
        <WorkshopFieldLabel>Model</WorkshopFieldLabel>
        <WorkshopTextInput value={model} onChangeText={setModel} />
        <WorkshopFieldLabel>Serial number</WorkshopFieldLabel>
        <WorkshopTextInput value={serialNumber} onChangeText={setSerialNumber} />
        <WorkshopFieldLabel>Notes</WorkshopFieldLabel>
        <WorkshopTextInput value={notes} onChangeText={setNotes} multiline />
      </WorkshopFormSheet>
    </View>
  );
}
