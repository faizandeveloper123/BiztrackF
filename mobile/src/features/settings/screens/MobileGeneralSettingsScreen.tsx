import { useCallback, useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { OptionSheet, type OptionItem } from '../../../components/crm/OptionSheet';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getInvoiceCustomization,
  updateInvoiceCustomization,
} from '../../../services/settings/invoiceCustomizationMobileApi';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopLoading,
  WorkshopPickerField,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

const CURRENCIES: OptionItem<string>[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
];

export function MobileGeneralSettingsScreen() {
  const { workspacePath, setSidebarActivePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const c = await getInvoiceCustomization();
      setCurrency(c.default_currency || 'USD');
      setDirty(false);
    } catch (e) {
      appError('Settings', extractErrorMessage(e, 'Could not load settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSidebarActivePath(
      workspacePath === '/dashboard' ? '/dashboard' : '/settings',
    );
  }, [setSidebarActivePath, workspacePath]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      await updateInvoiceCustomization({ default_currency: currency });
      setDirty(false);
      appAlert('Settings', 'Saved.');
    } catch (e) {
      appError('Settings', extractErrorMessage(e, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }, [currency]);

  return (
    <>
      <WorkshopChrome title="Settings" subtitle="General preferences" scroll>
        {loading ? (
          <WorkshopLoading />
        ) : (
          <>
            <WorkshopCard>
              <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 4 }}>
                Currency
              </Text>
              <Text style={{ fontSize: 14, color: WS.textMuted, marginBottom: 14 }}>
                Default currency for invoices and financial displays.
              </Text>
              <WorkshopPickerField
                label="Default currency"
                value={CURRENCIES.find((c) => c.value === currency)?.label ?? currency}
                onPress={() => setSheetOpen(true)}
              />
            </WorkshopCard>
            <WorkshopPrimaryButton
              label={saving ? 'Saving…' : 'Save'}
              onPress={() => void save()}
              disabled={!dirty || saving}
            />
          </>
        )}
      </WorkshopChrome>

      <OptionSheet
        visible={sheetOpen}
        title="Default currency"
        options={CURRENCIES}
        onSelect={(v) => {
          setCurrency(v);
          setDirty(true);
          setSheetOpen(false);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </>
  );
}
