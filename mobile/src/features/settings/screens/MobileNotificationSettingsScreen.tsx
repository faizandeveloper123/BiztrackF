import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  NotificationCategory,
  getCategoryDisplayName,
  type NotificationPreference,
} from '../../../models/notifications';
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from '../../../services/settings/notificationsPreferencesMobileApi';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopLoading,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

const CATEGORIES: NotificationCategory[] = [
  NotificationCategory.SYSTEM,
  NotificationCategory.INVENTORY,
  NotificationCategory.CRM,
  NotificationCategory.HRM,
  NotificationCategory.MAINTENANCE,
  NotificationCategory.QUALITY,
  NotificationCategory.LEDGER,
];

function normalizePref(raw: Record<string, unknown>): NotificationPreference {
  const cat = String(raw.category ?? '');
  return {
    id: String(raw.id ?? ''),
    tenant_id: String(raw.tenant_id ?? ''),
    user_id: String(raw.user_id ?? ''),
    category: cat as NotificationCategory,
    email_enabled: Boolean(raw.email_enabled),
    push_enabled: Boolean(raw.push_enabled),
    in_app_enabled: Boolean(raw.in_app_enabled),
    created_at: String(raw.created_at ?? ''),
    updated_at: String(raw.updated_at ?? ''),
  };
}

export function MobileNotificationSettingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getNotificationPreferences();
      const mapped = (list as unknown as Record<string, unknown>[]).map(
        (x) => normalizePref(x),
      );
      setPrefs(mapped);
    } catch (e) {
      appError('Notifications', extractErrorMessage(e, 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard'
        ? '/dashboard'
        : '/notifications/settings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const getPref = (cat: NotificationCategory) =>
    prefs.find((p) => p.category === cat);

  const patch = (
    cat: NotificationCategory,
    field: 'email_enabled' | 'push_enabled' | 'in_app_enabled',
    val: boolean,
  ) => {
    setPrefs((prev) => {
      const i = prev.findIndex((p) => p.category === cat);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], [field]: val };
        return next;
      }
      return [
        ...prev,
        {
          id: '',
          tenant_id: '',
          user_id: '',
          category: cat,
          email_enabled: field === 'email_enabled' ? val : true,
          push_enabled: field === 'push_enabled' ? val : true,
          in_app_enabled: field === 'in_app_enabled' ? val : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });
  };

  const saveAll = useCallback(async () => {
    try {
      setSaving(true);
      for (const cat of CATEGORIES) {
        const p = prefs.find((x) => x.category === cat);
        await updateNotificationPreference({
          category: cat,
          email_enabled: p?.email_enabled ?? true,
          push_enabled: p?.push_enabled ?? true,
          in_app_enabled: p?.in_app_enabled ?? true,
        });
      }
      await load();
      appAlert('Notifications', 'Saved.');
    } catch (e) {
      appError('Notifications', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }, [prefs, load]);

  return (
    <WorkshopChrome title="Notifications" subtitle="Channel preferences" scroll>
      {loading ? (
        <WorkshopLoading />
      ) : (
        <>
          <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 12 }}>
            Choose channels per category. Tap Save to apply.
          </Text>
          {CATEGORIES.map((cat) => {
            const p = getPref(cat);
            return (
              <WorkshopCard key={cat}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: WS.text, marginBottom: 10 }}>
                  {getCategoryDisplayName(cat)}
                </Text>
                <ToggleRow
                  label="Email"
                  value={p?.email_enabled ?? true}
                  onToggle={(v) => patch(cat, 'email_enabled', v)}
                />
                <ToggleRow
                  label="Push"
                  value={p?.push_enabled ?? true}
                  onToggle={(v) => patch(cat, 'push_enabled', v)}
                />
                <ToggleRow
                  label="In-app"
                  value={p?.in_app_enabled ?? true}
                  onToggle={(v) => patch(cat, 'in_app_enabled', v)}
                />
              </WorkshopCard>
            );
          })}
          <View style={{ marginBottom: 24 }}>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save preferences'}
              onPress={() => void saveAll()}
              disabled={saving}
            />
          </View>
        </>
      )}
    </WorkshopChrome>
  );
}

function ToggleRow(props: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}
    >
      <Text style={{ fontSize: 14, color: WS.text }}>{props.label}</Text>
      <Pressable
        onPress={() => props.onToggle(!props.value)}
        style={{
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 6,
          backgroundColor: props.value ? WS.primary : '#e2e8f0',
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: props.value ? '#fff' : WS.textMuted,
          }}
        >
          {props.value ? 'On' : 'Off'}
        </Text>
      </Pressable>
    </View>
  );
}
