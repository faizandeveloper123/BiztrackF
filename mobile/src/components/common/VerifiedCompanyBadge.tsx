import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPANY_REGISTRATION } from '../../constants/companyRegistration';

type VerifiedCompanyBadgeProps = {
  align?: 'left' | 'center';
};

export function VerifiedCompanyBadge({ align = 'center' }: VerifiedCompanyBadgeProps) {
  const [open, setOpen] = useState(false);

  return (
    <View className={align === 'center' ? 'items-center' : 'items-start'}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={COMPANY_REGISTRATION.badgeLabel}
        accessibilityHint="Shows registered company details"
        className="flex-row items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 active:bg-emerald-100"
      >
        <Ionicons name="shield-checkmark" size={18} color="#059669" />
        <Text className="text-xs font-semibold text-emerald-900">
          {COMPANY_REGISTRATION.badgeLabel}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'information-circle-outline'}
          size={16}
          color="#047857"
        />
      </Pressable>

      {open ? (
        <View className="mt-2 w-full max-w-sm rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <Text className="mb-2 text-xs font-semibold text-slate-900">
            Verified Company
          </Text>
          <View className="gap-2">
            <View>
              <Text className="text-xs font-medium text-slate-800">
                Registered Company
              </Text>
              <Text className="text-xs text-slate-600">
                {COMPANY_REGISTRATION.registeredCompany}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-medium text-slate-800">Authority</Text>
              <Text className="text-xs text-slate-600">
                {COMPANY_REGISTRATION.authority}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-medium text-slate-800">
                Company Number
              </Text>
              <Text className="text-xs text-slate-600">
                {COMPANY_REGISTRATION.companyNumber}
              </Text>
            </View>
            <View>
              <Text className="text-xs font-medium text-slate-800">
                Registered Office Address
              </Text>
              <Text className="text-xs leading-5 text-slate-600">
                {COMPANY_REGISTRATION.registeredOfficeAddress}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
