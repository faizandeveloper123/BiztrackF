import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppModal } from './AppModal';
import { useKeyboardBottomInset } from '../../hooks/useKeyboardBottomInset';
import { WS } from '../../features/workshop/components/workshopTheme';

interface FormSectionProps {
  title?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <View style={{ marginBottom: 24 }}>
    {title ? (
      <Text
        style={{
          marginBottom: 12,
          paddingHorizontal: 4,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: WS.textLight,
        }}
      >
        {title}
      </Text>
    ) : null}
    <View
      style={{
        overflow: 'hidden',
        borderRadius: 16,
        backgroundColor: WS.card,
        borderWidth: 1,
        borderColor: WS.border,
      }}
    >
      {children}
    </View>
  </View>
);

interface FormInputProps extends TextInputProps {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  icon,
  last,
  style,
  ...props
}) => (
  <View
    style={{
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: WS.border,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      {icon ? <Ionicons name={icon} size={14} color={WS.textLight} style={{ marginRight: 4 }} /> : null}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: WS.textMuted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
    <TextInput
      style={[{ fontSize: 16, color: WS.text, padding: 0 }, style]}
      placeholderTextColor={WS.textLight}
      {...props}
    />
  </View>
);

interface FormSelectProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  last?: boolean;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  value,
  onPress,
  icon,
  last,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: pressed ? WS.bg : WS.card,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: WS.border,
    })}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      {icon ? <Ionicons name={icon as any} size={14} color={WS.textLight} style={{ marginRight: 4 }} /> : null}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: WS.textMuted,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 16, color: value ? WS.text : WS.textLight }}>
        {value || 'Select option'}
      </Text>
      <Ionicons name="chevron-forward" size={16} color={WS.textLight} />
    </View>
  </Pressable>
);

interface FormHeaderProps {
  title: string;
  onCancel: () => void;
}

export const FormHeader: React.FC<FormHeaderProps> = ({ title, onCancel }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: WS.border,
      backgroundColor: WS.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
    }}
  >
    <Pressable
      onPress={onCancel}
      style={{
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: WS.bg,
      }}
    >
      <Ionicons name="close" size={24} color={WS.textMuted} />
    </Pressable>
    <Text style={{ fontSize: 18, fontWeight: '800', color: WS.text }}>{title}</Text>
    <View style={{ width: 40 }} />
  </View>
);

interface FormFooterActionsProps {
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveLoading?: boolean;
}

export const FormFooterActions: React.FC<FormFooterActionsProps> = ({
  onCancel,
  onSave,
  saveLabel = 'Save',
  saveLoading,
}) => (
  <View
    style={{
      borderTopWidth: 1,
      borderTopColor: WS.border,
      backgroundColor: WS.card,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 12,
    }}
  >
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: WS.border,
          paddingVertical: 14,
        }}
      >
        <Text style={{ fontWeight: '700', color: WS.textMuted }}>Cancel</Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={saveLoading}
        style={{
          flex: 1,
          alignItems: 'center',
          borderRadius: 14,
          backgroundColor: WS.primary,
          paddingVertical: 14,
          opacity: saveLoading ? 0.7 : 1,
        }}
      >
        {saveLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={{ fontWeight: '700', color: '#fff' }}>{saveLabel}</Text>
        )}
      </Pressable>
    </View>
  </View>
);

interface MobileFormSheetProps {
  visible: boolean;
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  saveLoading?: boolean;
  children: React.ReactNode;
}

export const MobileFormSheet: React.FC<MobileFormSheetProps> = ({
  visible,
  title,
  onCancel,
  onSave,
  saveLabel,
  saveLoading,
  children,
}) => {
  const keyboardInset = useKeyboardBottomInset();

  return (
    <AppModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onClose={onCancel}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: WS.bg }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingBottom: keyboardInset }}>
          <FormHeader title={title} onCancel={onCancel} />
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {children}
          </ScrollView>
          <FormFooterActions
            onCancel={onCancel}
            onSave={onSave}
            saveLabel={saveLabel}
            saveLoading={saveLoading}
          />
        </View>
      </SafeAreaView>
    </AppModal>
  );
};
