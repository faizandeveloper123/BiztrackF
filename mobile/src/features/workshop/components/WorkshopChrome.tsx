import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';
import { WS } from './workshopTheme';

export {
  WorkshopSearchBar,
  WorkshopChipSelect,
  WorkshopFilterPanel,
  WorkshopFilterBar,
  countActiveFilters,
  WorkshopListCard,
  WorkshopEmptyState,
  WorkshopFAB,
  WorkshopHeaderButton,
  WorkshopLoading,
  WorkshopSegmentTabs,
  WorkshopStatCard,
  WorkshopTextInput,
  WorkshopPickerField,
  WorkshopFormSheet,
  WorkshopDetailRow,
  WorkshopBadge,
  WorkshopPrimaryButton,
  WorkshopFieldLabel,
  WS,
} from './WorkshopUI';

export {
  WorkshopDatePickerField,
  WorkshopDateTimePickerField,
  ProductDatePickerField,
} from '../../../components/forms/AppDatePicker';

export function WorkshopChrome(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const body = props.scroll ? (
    <ScrollView
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {props.children}
    </ScrollView>
  ) : (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 14 }}>
      {props.children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: WS.border,
          backgroundColor: WS.card,
          paddingHorizontal: 8,
          paddingVertical: 10,
        }}
      >
        <MenuHeaderButton />
        <View style={{ flex: 1, paddingHorizontal: 8 }}>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 17,
              fontWeight: '800',
              color: WS.text,
            }}
          >
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text
              style={{
                textAlign: 'center',
                fontSize: 12,
                color: WS.textMuted,
                marginTop: 1,
              }}
              numberOfLines={1}
            >
              {props.subtitle}
            </Text>
          ) : null}
        </View>
        <View style={{ minWidth: 72, alignItems: 'flex-end' }}>{props.right}</View>
      </View>
      {body}
    </View>
  );
}

export function WorkshopCard(props: { children: React.ReactNode }) {
  return (
    <View
      style={{
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: WS.border,
        backgroundColor: WS.card,
        padding: 16,
        shadowColor: '#0f172a',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      }}
    >
      {props.children}
    </View>
  );
}

export function WorkshopOutlineButton(props: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: WS.primaryMuted,
        backgroundColor: WS.card,
        paddingVertical: 14,
      }}
    >
      <Text style={{ fontWeight: '700', fontSize: 15, color: WS.primaryDark }}>
        {props.label}
      </Text>
    </Pressable>
  );
}
