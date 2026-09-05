import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../layout/AppModal';
import { KeyboardBottomSheetShell } from '../layout/KeyboardBottomSheetShell';
import { WS } from '../../features/workshop/components/workshopTheme';

const AVATAR_COLORS = ['#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed'];

function avatarColorFromName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
}

export type OptionItem<T extends string> = {
  value: T;
  label: string;
  subtitle?: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  avatarInitials?: string;
  avatarColor?: string;
};

type Props<T extends string> = {
  visible: boolean;
  title: string;
  description?: string;
  options: OptionItem<T>[];
  selectedValue?: T;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function OptionSheet<T extends string>({
  visible,
  title,
  description,
  options,
  selectedValue,
  searchable,
  searchPlaceholder = 'Search…',
  emptyText = 'No results found',
  onSelect,
  onClose,
}: Props<T>) {
  const [query, setQuery] = useState('');

  const showSearch = searchable ?? options.length > 6;

  const filtered = useMemo(() => {
    if (!showSearch || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query, showSearch]);

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (value: T) => {
    setQuery('');
    onSelect(value);
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      transparent
      animationType="slide"
      onClose={handleClose}
    >
      <KeyboardBottomSheetShell
        overlayColor="rgba(15,23,42,0.55)"
        onOverlayPress={handleClose}
      >
        <Pressable
          style={{
            maxHeight: '78%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: WS.card,
            paddingBottom: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: WS.border,
              }}
            />
          </View>

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 8,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: WS.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: WS.text }}>
                  {title}
                </Text>
                {description ? (
                  <Text style={{ marginTop: 4, fontSize: 14, color: WS.textMuted, lineHeight: 20 }}>
                    {description}
                  </Text>
                ) : null}
              </View>
              <Pressable
                onPress={handleClose}
                hitSlop={8}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: WS.bg,
                }}
              >
                <Ionicons name="close" size={20} color={WS.textMuted} />
              </Pressable>
            </View>
          </View>

          {showSearch ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: WS.border,
                  backgroundColor: WS.bg,
                  paddingHorizontal: 12,
                }}
              >
                <Ionicons name="search" size={18} color={WS.textLight} />
                <TextInput
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: WS.text,
                  }}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={WS.textLight}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
                {query.length > 0 ? (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={WS.textLight} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          <FlatList
            data={filtered}
            keyExtractor={(o) => o.value}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 360 }}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="search-outline" size={32} color={WS.textLight} />
                <Text style={{ marginTop: 10, fontSize: 15, color: WS.textMuted }}>
                  {emptyText}
                </Text>
              </View>
            }
            renderItem={({ item: o }) => {
              const selected = selectedValue !== undefined && o.value === selectedValue;
              const initials = o.avatarInitials ?? (o.label ? initialsFromName(o.label) : undefined);
              const avatarBg = o.avatarColor ?? avatarColorFromName(o.label || '?');

              return (
                <Pressable
                  onPress={() => handleSelect(o.value)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginBottom: 6,
                    borderWidth: 1.5,
                    borderColor: selected ? WS.primary : WS.border,
                    backgroundColor: selected
                      ? WS.primaryLight
                      : pressed
                        ? WS.bg
                        : WS.card,
                  })}
                >
                  {o.icon ? (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? '#fff' : WS.bg,
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={o.icon}
                        size={22}
                        color={selected ? WS.primary : WS.textMuted}
                      />
                    </View>
                  ) : initials ? (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? WS.primary : avatarBg,
                        marginRight: 12,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '800',
                          color: '#fff',
                        }}
                      >
                        {initials}
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: selected ? '700' : '600',
                        color: WS.text,
                      }}
                      numberOfLines={1}
                    >
                      {o.label}
                    </Text>
                    {o.subtitle ? (
                      <Text
                        style={{ marginTop: 2, fontSize: 13, color: WS.textMuted }}
                        numberOfLines={1}
                      >
                        {o.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? (
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: WS.primary,
                        marginLeft: 8,
                      }}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={WS.textLight}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </Pressable>
              );
            }}
          />

          <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => ({
                alignItems: 'center',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: WS.border,
                paddingVertical: 14,
                backgroundColor: pressed ? WS.bg : WS.card,
              })}
            >
              <Text style={{ fontWeight: '700', fontSize: 16, color: WS.textMuted }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}
