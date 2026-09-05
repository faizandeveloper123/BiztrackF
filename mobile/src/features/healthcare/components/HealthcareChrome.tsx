import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { MenuHeaderButton } from '../../../components/layout/MenuHeaderButton';

export function HealthcareChrome(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const body = props.scroll ? (
    <ScrollView
      className="flex-1 px-4 pt-4"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {props.children}
    </ScrollView>
  ) : (
    <View className="flex-1 px-4 pt-4">{props.children}</View>
  );

  return (
    <View className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-2 py-2">
        <MenuHeaderButton />
        <View className="flex-1 px-2">
          <Text className="text-center text-base font-semibold text-slate-900">
            {props.title}
          </Text>
          {props.subtitle ? (
            <Text
              className="text-center text-xs text-slate-500"
              numberOfLines={1}
            >
              {props.subtitle}
            </Text>
          ) : null}
        </View>
        <View className="w-10 items-end">{props.right}</View>
      </View>
      {body}
    </View>
  );
}

export function HealthcareCard(props: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${props.className ?? ''}`}
    >
      {props.children}
    </View>
  );
}

export function HealthcarePrimaryButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      className={`items-center rounded-lg py-3 ${props.disabled ? 'bg-slate-300' : 'bg-teal-600 active:bg-teal-700'}`}
      onPress={props.onPress}
      disabled={props.disabled}
    >
      <Text className="font-semibold text-white">{props.label}</Text>
    </Pressable>
  );
}

export function HealthcareOutlineButton(props: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="items-center rounded-lg border border-slate-300 bg-white py-3 active:bg-slate-50"
      onPress={props.onPress}
    >
      <Text className="font-semibold text-slate-800">{props.label}</Text>
    </Pressable>
  );
}

export function HealthcareFieldLabel(props: { children: React.ReactNode }) {
  return (
    <Text className="mb-1 text-xs font-medium uppercase text-slate-500">
      {props.children}
    </Text>
  );
}
