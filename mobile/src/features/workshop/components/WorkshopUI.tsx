import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppModal } from '../../../components/layout/AppModal';
import { KeyboardBottomSheetShell } from '../../../components/layout/KeyboardBottomSheetShell';
import { WS, cardShadow, statusTone, fmtLabel } from './workshopTheme';

type IonName = ComponentProps<typeof Ionicons>['name'];

export function WorkshopSearchBar(props: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: props.compact ? 0 : 12,
      }}
    >
      <Ionicons name="search" size={18} color={WS.textLight} />
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder ?? 'Search…'}
        placeholderTextColor={WS.textLight}
        style={{ flex: 1, marginLeft: 10, fontSize: 15, color: WS.text }}
      />
      {props.value.length > 0 ? (
        <Pressable onPress={() => props.onChangeText('')} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={WS.textLight} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function WorkshopChipSelect(props: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: WS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: 8,
        }}
      >
        {props.label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 2 }}>
          {props.options.map((opt) => {
            const active = props.value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => props.onChange(opt)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: active ? WS.primary : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: active ? WS.primary : WS.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: active ? '#fff' : '#475569',
                    textTransform: 'capitalize',
                  }}
                >
                  {fmtLabel(opt)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function WorkshopFilterPanel(props: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <View
      style={{
        backgroundColor: WS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: WS.border,
        padding: 14,
        marginBottom: 12,
        ...cardShadow,
      }}
    >
      {props.count != null ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: WS.textMuted,
            marginBottom: 10,
          }}
        >
          {props.count} result{props.count === 1 ? '' : 's'}
        </Text>
      ) : null}
      {props.children}
    </View>
  );
}

export function countActiveFilters(values: string[], defaultValue = 'all') {
  return values.filter(
    (v) => v !== defaultValue && v !== '' && v !== '__all__',
  ).length;
}

export function WorkshopFilterBar(props: {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
  resultCount?: number;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  onApply?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const active = props.activeFilterCount ?? 0;
  const hasSearch = props.onSearchChange != null;

  const closeSheet = () => {
    props.onApply?.();
    setOpen(false);
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        {hasSearch ? (
          <View style={{ flex: 1 }}>
            <WorkshopSearchBar
              compact
              value={props.searchValue ?? ''}
              onChangeText={props.onSearchChange!}
              placeholder={props.searchPlaceholder}
            />
          </View>
        ) : null}
        <Pressable
          onPress={() => setOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: active > 0 ? WS.primary : WS.border,
            backgroundColor: active > 0 ? WS.primaryLight : WS.card,
            paddingHorizontal: hasSearch ? 12 : 14,
            paddingVertical: 11,
            flex: hasSearch ? undefined : 1,
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={active > 0 ? WS.primary : WS.textMuted}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: active > 0 ? WS.primaryDark : WS.text,
            }}
          >
            Filters
          </Text>
          {active > 0 ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: WS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                {active}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {props.resultCount != null ? (
        <Text
          style={{
            fontSize: 12,
            fontWeight: '600',
            color: WS.textMuted,
            marginBottom: 10,
          }}
        >
          {props.resultCount} result{props.resultCount === 1 ? '' : 's'}
        </Text>
      ) : null}

      <AppModal visible={open} transparent animationType="slide" onClose={() => setOpen(false)}>
        <KeyboardBottomSheetShell
          overlayColor="rgba(15,23,42,0.55)"
          onOverlayPress={() => setOpen(false)}
        >
          <Pressable
            style={{
              maxHeight: '82%',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: WS.card,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                alignItems: 'center',
                paddingTop: 10,
                paddingBottom: 4,
              }}
            >
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
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: WS.border,
              }}
            >
              <Text style={{ flex: 1, fontSize: 18, fontWeight: '800', color: WS.text }}>
                Filters
              </Text>
              {props.onResetFilters ? (
                <Pressable onPress={props.onResetFilters} hitSlop={8} style={{ marginRight: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: WS.textMuted }}>
                    Reset
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={24} color={WS.textMuted} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ paddingHorizontal: 20, paddingTop: 16 }}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {props.children}
              <Pressable
                onPress={closeSheet}
                style={{
                  marginTop: 8,
                  borderRadius: 14,
                  backgroundColor: WS.primary,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontWeight: '800', fontSize: 16, color: '#fff' }}>
                  Apply filters
                </Text>
              </Pressable>
            </ScrollView>
          </Pressable>
        </KeyboardBottomSheetShell>
      </AppModal>
    </>
  );
}

export function WorkshopBadge(props: {
  label: string;
  tone?: 'status' | 'priority' | 'neutral';
  value?: string;
}) {
  const tone =
    props.tone === 'priority'
      ? statusTone(props.label)
      : props.tone === 'status'
        ? statusTone(props.label)
        : { bg: WS.primaryLight, text: WS.primaryDark, dot: WS.primary };
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: tone.bg,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        gap: 5,
      }}
    >
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: tone.dot,
        }}
      />
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: tone.text,
          textTransform: 'capitalize',
        }}
      >
        {fmtLabel(props.label)}
      </Text>
    </View>
  );
}

type ListAction = {
  icon: IonName;
  onPress: () => void;
  danger?: boolean;
  loading?: boolean;
  label?: string;
};

type CardKind =
  | 'job-card'
  | 'vehicle'
  | 'quality'
  | 'mot'
  | 'default';

const CARD_KIND: Record<
  CardKind,
  {
    label: string;
    headerBg: string;
    headerBorder: string;
    labelColor: string;
    accent: string;
    icon: IonName;
    iconColor: string;
  }
> = {
  'job-card': {
    label: 'Job card',
    headerBg: '#eff6ff',
    headerBorder: '#bfdbfe',
    labelColor: '#1d4ed8',
    accent: '#2563eb',
    icon: 'clipboard',
    iconColor: '#2563eb',
  },
  vehicle: {
    label: 'Vehicle',
    headerBg: '#f5f3ff',
    headerBorder: '#ddd6fe',
    labelColor: '#6d28d9',
    accent: '#7c3aed',
    icon: 'car',
    iconColor: '#7c3aed',
  },
  quality: {
    label: 'Quality',
    headerBg: '#ecfdf5',
    headerBorder: '#a7f3d0',
    labelColor: '#047857',
    accent: '#059669',
    icon: 'shield-checkmark',
    iconColor: '#059669',
  },
  mot: {
    label: 'MOT',
    headerBg: '#ccfbf1',
    headerBorder: '#99f6e4',
    labelColor: '#0f766e',
    accent: '#0d9488',
    icon: 'car-sport',
    iconColor: '#0d9488',
  },
  default: {
    label: 'Record',
    headerBg: '#f8fafc',
    headerBorder: WS.border,
    labelColor: WS.textMuted,
    accent: WS.primary,
    icon: 'document-text',
    iconColor: WS.primary,
  },
};

function CompactActionButton(props: ListAction & { accent: string }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.loading}
      hitSlop={6}
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: props.danger ? WS.dangerBg : '#f8fafc',
        opacity: props.loading ? 0.5 : 1,
      }}
    >
      <Ionicons
        name={props.icon}
        size={15}
        color={props.danger ? WS.danger : props.accent}
      />
    </Pressable>
  );
}

export function WorkshopListCard(props: {
  kind?: CardKind;
  icon: IonName;
  iconColor?: string;
  iconBg?: string;
  kicker?: string;
  accentColor?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badges?: { label: string; tone?: 'status' | 'priority' }[];
  progress?: number;
  onPress?: () => void;
  actions?: ListAction[];
}) {
  const kind = props.kind ?? 'default';
  const theme = CARD_KIND[kind];
  const iconColor = props.iconColor ?? theme.iconColor;
  const statusBadge = props.badges?.find((b) => b.tone === 'status');
  const priorityBadge = props.badges?.find((b) => b.tone === 'priority');
  const extraBadges =
    props.badges?.filter((b) => b !== statusBadge && b !== priorityBadge) ?? [];
  const accent =
    props.accentColor ??
    (statusBadge ? statusTone(statusBadge.label).dot : theme.accent);
  const showHeader = Boolean(props.kicker || kind !== 'default');

  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
      <View style={{ width: 3, backgroundColor: accent }} />
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 9 }}>
        {showHeader ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
              <Ionicons name={props.icon ?? theme.icon} size={13} color={theme.accent} />
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                  color: theme.labelColor,
                  textTransform: 'uppercase',
                }}
              >
                {theme.label}
              </Text>
              {props.kicker ? (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: WS.textMuted,
                    flex: 1,
                  }}
                  numberOfLines={1}
                >
                  {props.kicker}
                </Text>
              ) : null}
            </View>
            {statusBadge ? (
              <WorkshopBadge label={statusBadge.label} tone="status" />
            ) : null}
          </View>
        ) : null}

        {!showHeader ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: '#f8fafc',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={props.icon} size={16} color={iconColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: WS.text }} numberOfLines={1}>
                {props.title}
              </Text>
              {props.subtitle ? (
                <Text style={{ fontSize: 12, color: WS.textMuted, marginTop: 1 }} numberOfLines={1}>
                  {props.subtitle}
                </Text>
              ) : null}
            </View>
          </View>
        ) : (
          <>
            <Text style={{ fontSize: 15, fontWeight: '800', color: WS.text, lineHeight: 20 }} numberOfLines={2}>
              {props.title}
            </Text>
            {props.subtitle ? (
              <Text style={{ fontSize: 12, color: WS.textMuted, marginTop: 2, lineHeight: 16 }} numberOfLines={1}>
                {props.subtitle}
              </Text>
            ) : null}
          </>
        )}

        {props.meta ? (
          <Text style={{ fontSize: 11, color: WS.textLight, marginTop: 5, lineHeight: 15 }} numberOfLines={1}>
            {props.meta}
          </Text>
        ) : null}

        {props.progress != null ? (
          <View style={{ marginTop: 7 }}>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: '#f1f5f9', overflow: 'hidden' }}>
              <View
                style={{
                  height: 3,
                  borderRadius: 2,
                  width: `${Math.min(100, Math.max(0, props.progress))}%`,
                  backgroundColor: accent,
                }}
              />
            </View>
          </View>
        ) : null}

        {(priorityBadge || extraBadges.length > 0 || (props.actions && props.actions.length > 0)) ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 7,
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 }}>
              {priorityBadge ? (
                <WorkshopBadge label={priorityBadge.label} tone="priority" />
              ) : null}
              {extraBadges.map((b) => (
                <WorkshopBadge key={b.label} label={b.label} tone={b.tone ?? 'status'} />
              ))}
            </View>
            {props.actions && props.actions.length > 0 ? (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {props.actions.map((a, i) => (
                  <CompactActionButton key={`${a.icon}-${i}`} {...a} accent={theme.accent} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  const cardStyle: ViewStyle = {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8ecf1',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  };

  if (props.onPress) {
    return (
      <Pressable
        onPress={props.onPress}
        style={({ pressed }) => [
          cardStyle,
          pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] },
        ]}
      >
        {content}
      </Pressable>
    );
  }
  return <View style={cardStyle}>{content}</View>;
}

export function WorkshopEmptyState(props: {
  icon: IonName;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: WS.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name={props.icon} size={36} color={WS.primary} />
      </View>
      <Text style={{ fontSize: 17, fontWeight: '700', color: WS.text, textAlign: 'center' }}>
        {props.title}
      </Text>
      {props.subtitle ? (
        <Text
          style={{
            fontSize: 14,
            color: WS.textMuted,
            textAlign: 'center',
            marginTop: 8,
            lineHeight: 20,
          }}
        >
          {props.subtitle}
        </Text>
      ) : null}
      {props.actionLabel && props.onAction ? (
        <Pressable
          onPress={props.onAction}
          style={{
            marginTop: 20,
            backgroundColor: WS.primary,
            borderRadius: 12,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            {props.actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function WorkshopFAB(props: { onPress: () => void; label?: string }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        position: 'absolute',
        right: 20,
        bottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: WS.primary,
        borderRadius: 28,
        paddingHorizontal: props.label ? 18 : 16,
        paddingVertical: 14,
        shadowColor: WS.primary,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      }}
    >
      <Ionicons name="add" size={24} color="#fff" />
      {props.label ? (
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
          {props.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function WorkshopHeaderButton(props: { onPress: () => void }) {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        backgroundColor: WS.primary,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <Ionicons name="add" size={18} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>New</Text>
    </Pressable>
  );
}

export function WorkshopLoading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
      <ActivityIndicator size="large" color={WS.primary} />
    </View>
  );
}

export function WorkshopSegmentTabs<T extends string>(props: {
  tabs: { key: T; label: string; icon?: IonName }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#e2e8f0',
        borderRadius: 14,
        padding: 4,
        marginBottom: 14,
      }}
    >
      {props.tabs.map((t) => {
        const active = props.active === t.key;
        return (
          <Pressable
            key={t.key}
            onPress={() => props.onChange(t.key)}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              paddingVertical: 10,
              borderRadius: 11,
              backgroundColor: active ? WS.card : 'transparent',
              ...(active ? cardShadow : {}),
            }}
          >
            {t.icon ? (
              <Ionicons
                name={t.icon}
                size={14}
                color={active ? WS.primary : WS.textMuted}
              />
            ) : null}
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: active ? WS.primaryDark : WS.textMuted,
              }}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function WorkshopStatCard(props: {
  label: string;
  value: string | number;
  sub?: string;
  icon: IonName;
  accent: string;
  accentBg: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: '46%',
        backgroundColor: WS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: WS.border,
        padding: 14,
        ...cardShadow,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: WS.textMuted }}>
          {props.label}
        </Text>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: props.accentBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={props.icon} size={16} color={props.accent} />
        </View>
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: WS.text, marginTop: 8 }}>
        {props.value}
      </Text>
      {props.sub ? (
        <Text style={{ fontSize: 11, color: WS.textLight, marginTop: 2 }}>{props.sub}</Text>
      ) : null}
    </View>
  );
}

export function WorkshopFieldLabel(props: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: '700',
        color: WS.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6,
        marginTop: 4,
      }}
    >
      {props.children}
    </Text>
  );
}

export function WorkshopTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={WS.textLight}
      {...props}
      style={[
        {
          borderWidth: 1,
          borderColor: WS.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: WS.text,
          backgroundColor: '#fafafa',
          marginBottom: 10,
        },
        props.style,
      ]}
    />
  );
}

export function WorkshopPickerField(props: {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
}) {
  return (
    <>
      <WorkshopFieldLabel>{props.label}</WorkshopFieldLabel>
      <Pressable
        onPress={props.onPress}
        style={{
          borderWidth: 1,
          borderColor: WS.border,
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 13,
          backgroundColor: '#fafafa',
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 15,
            color: props.value ? WS.text : WS.textLight,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {props.value || props.placeholder || 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={WS.textMuted} />
      </Pressable>
    </>
  );
}

export function WorkshopPrimaryButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={{
        alignItems: 'center',
        borderRadius: 14,
        paddingVertical: 15,
        backgroundColor: props.disabled ? '#cbd5e1' : WS.primary,
      }}
    >
      <Text style={{ fontWeight: '700', fontSize: 16, color: '#fff' }}>{props.label}</Text>
    </Pressable>
  );
}

export function WorkshopFormSheet(props: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <AppModal
      visible={props.visible}
      animationType="slide"
      transparent
      onClose={props.onClose}
    >
      <KeyboardBottomSheetShell>
        <View
          style={{
            maxHeight: '92%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: WS.card,
            paddingHorizontal: 20,
            paddingBottom: 28,
            paddingTop: 12,
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            <View
              style={{
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#e2e8f0',
              }}
            />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: WS.text, marginBottom: 16 }}>
            {props.title}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: '75%' }}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {props.children}
          </ScrollView>
          <View style={{ marginTop: 16 }}>{props.footer}</View>
        </View>
      </KeyboardBottomSheetShell>
    </AppModal>
  );
}

export function WorkshopDetailRow(props: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
      }}
    >
      <Text style={{ fontSize: 14, color: WS.textMuted }}>{props.label}</Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: WS.text,
          maxWidth: '58%',
          textAlign: 'right',
          textTransform: 'capitalize',
        }}
        numberOfLines={2}
      >
        {fmtLabel(props.value)}
      </Text>
    </View>
  );
}

export { WS, fmtLabel, statusTone };
