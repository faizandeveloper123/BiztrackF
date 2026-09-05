import React from 'react';
import { View, Text, Pressable, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';
import { WS } from '../../workshop/components/workshopTheme';

export function PickerModal<T extends { id: string; label: string }>(props: {
  visible: boolean;
  title: string;
  items: T[];
  onSelect: (item: T) => void;
  onClose: () => void;
  search?: string;
  onSearchChange?: (q: string) => void;
}) {
  return (
    <AppModal
      visible={props.visible}
      animationType="slide"
      transparent
      onClose={props.onClose}
    >
      <KeyboardBottomSheetShell overlayColor="rgba(15,23,42,0.55)">
        <View
          style={{
            maxHeight: '80%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: WS.card,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 28,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: WS.text }}>
              {props.title}
            </Text>
            <Pressable onPress={props.onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={WS.textMuted} />
            </Pressable>
          </View>
          {props.onSearchChange ? (
            <TextInput
              style={{
                marginBottom: 12,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: WS.border,
                backgroundColor: WS.bg,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 16,
                color: WS.text,
              }}
              placeholder="Search…"
              placeholderTextColor={WS.textLight}
              value={props.search}
              onChangeText={props.onSearchChange}
            />
          ) : null}
          <FlatList
            data={props.items}
            keyExtractor={(x) => x.id}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  props.onSelect(item);
                  props.onClose();
                }}
                style={({ pressed }) => ({
                  borderBottomWidth: 1,
                  borderBottomColor: WS.border,
                  paddingVertical: 14,
                  backgroundColor: pressed ? WS.primaryLight : WS.card,
                })}
              >
                <Text style={{ fontSize: 16, color: WS.text }}>{item.label}</Text>
              </Pressable>
            )}
          />
          <Pressable
            onPress={props.onClose}
            style={{
              marginTop: 14,
              alignItems: 'center',
              borderRadius: 14,
              borderWidth: 1,
              borderColor: WS.border,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontWeight: '700', color: WS.textMuted }}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}
