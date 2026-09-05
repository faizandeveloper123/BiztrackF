import { useCallback, useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSidebarDrawer } from '../../../contexts/SidebarDrawerContext';
import { extractErrorMessage } from '../../../utils/errorUtils';
import { appAlert, appError } from '../../../utils/appDialog';
import {
  getInvoiceCustomization,
  updateInvoiceCustomization,
} from '../../../services/settings/invoiceCustomizationMobileApi';
import type { InvoiceCustomizationUpdate } from '../../../models/sales/InvoiceCustomization';
import {
  WorkshopChrome,
  WorkshopCard,
  WorkshopLoading,
  WorkshopFieldLabel,
  WorkshopTextInput,
  WorkshopPrimaryButton,
  WS,
} from '../../workshop/components/WorkshopChrome';

export function MobileInvoiceCustomizationScreen() {
  const { setWorkspacePath } = useSidebarDrawer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<InvoiceCustomizationUpdate>({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_website: '',
    bank_sort_code: '',
    bank_account_number: '',
    payment_instructions: '',
    default_payment_instructions: '',
    footer_text: '',
    thank_you_message: '',
    default_currency: 'USD',
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInvoiceCustomization();
      setData({
        company_name: res.company_name || '',
        company_address: res.company_address || '',
        company_phone: res.company_phone || '',
        company_email: res.company_email || '',
        company_website: res.company_website || '',
        bank_sort_code: res.bank_sort_code || '',
        bank_account_number: res.bank_account_number || '',
        payment_instructions: res.payment_instructions || '',
        default_payment_instructions: res.default_payment_instructions || '',
        footer_text: res.footer_text || '',
        thank_you_message: res.thank_you_message || '',
        default_currency: res.default_currency || 'USD',
      });
    } catch (e) {
      appError('Error', extractErrorMessage(e, 'Failed to load customization'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    try {
      setSaving(true);
      await updateInvoiceCustomization(data);
      appAlert('Success', 'Invoice customization updated successfully');
    } catch (e) {
      appError('Error', extractErrorMessage(e, 'Failed to save changes'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: WS.bg }}>
        <WorkshopLoading />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: WS.bg }}
    >
      <WorkshopChrome
        title="Customization"
        subtitle="Invoice branding"
        scroll
        right={
          <Pressable
            onPress={() => void save()}
            disabled={saving}
            style={{
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 8,
              backgroundColor: saving ? '#cbd5e1' : WS.primary,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontWeight: '700', fontSize: 14, color: '#fff' }}>Save</Text>
            )}
          </Pressable>
        }
      >
        <WorkshopCard>
          <Text style={{ fontSize: 12, fontWeight: '800', color: WS.textLight, letterSpacing: 1, marginBottom: 14 }}>
            BUSINESS DETAILS
          </Text>
          <WorkshopFieldLabel>Company Name</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.company_name}
            onChangeText={(t) => setData({ ...data, company_name: t })}
            placeholder="Business Name"
          />
          <WorkshopFieldLabel>Address</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.company_address}
            onChangeText={(t) => setData({ ...data, company_address: t })}
            placeholder="Physical Address"
            multiline
            style={{ minHeight: 72 }}
          />
          <WorkshopFieldLabel>Phone</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.company_phone}
            onChangeText={(t) => setData({ ...data, company_phone: t })}
            placeholder="Phone Number"
            keyboardType="phone-pad"
          />
          <WorkshopFieldLabel>Business Email</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.company_email}
            onChangeText={(t) => setData({ ...data, company_email: t })}
            placeholder="billing@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <WorkshopFieldLabel>Website</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.company_website}
            onChangeText={(t) => setData({ ...data, company_website: t })}
            placeholder="https://company.com"
            autoCapitalize="none"
          />
        </WorkshopCard>

        <WorkshopCard>
          <Text style={{ fontSize: 12, fontWeight: '800', color: WS.textLight, letterSpacing: 1, marginBottom: 14 }}>
            BANKING DETAILS
          </Text>
          <WorkshopFieldLabel>Sort Code</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.bank_sort_code}
            onChangeText={(t) => setData({ ...data, bank_sort_code: t })}
            placeholder="00-00-00"
          />
          <WorkshopFieldLabel>Account Number</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.bank_account_number}
            onChangeText={(t) => setData({ ...data, bank_account_number: t })}
            placeholder="12345678"
            keyboardType="number-pad"
          />
          <WorkshopFieldLabel>Default Currency</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.default_currency}
            onChangeText={(t) => setData({ ...data, default_currency: t })}
            placeholder="USD"
            autoCapitalize="characters"
          />
        </WorkshopCard>

        <WorkshopCard>
          <Text style={{ fontSize: 12, fontWeight: '800', color: WS.textLight, letterSpacing: 1, marginBottom: 14 }}>
            PAYMENT & FOOTER
          </Text>
          <WorkshopFieldLabel>Payment Instructions</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.payment_instructions}
            onChangeText={(t) => setData({ ...data, payment_instructions: t })}
            placeholder="Instructions for this invoice..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 }}
          />
          <WorkshopFieldLabel>Thank You Message</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.thank_you_message}
            onChangeText={(t) => setData({ ...data, thank_you_message: t })}
            placeholder="Thank you for your business!"
          />
          <WorkshopFieldLabel>Footer Text</WorkshopFieldLabel>
          <WorkshopTextInput
            value={data.footer_text}
            onChangeText={(t) => setData({ ...data, footer_text: t })}
            placeholder="Alternative contact info or legal footer..."
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 }}
          />
        </WorkshopCard>

        <Pressable
          onPress={() => setWorkspacePath('/settings')}
          style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 16 }}
        >
          <Text style={{ color: WS.textMuted, fontWeight: '600' }}>Back to settings</Text>
        </Pressable>
      </WorkshopChrome>
    </KeyboardAvoidingView>
  );
}
