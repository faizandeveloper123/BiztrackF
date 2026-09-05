import { View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  ContactLabel,
  LabeledEmailItem,
  LabeledPhoneItem,
} from '../../models/crm/customers';

function normalizeEmailLabel(l: string | undefined): ContactLabel {
  const x = (l || 'personal').toLowerCase();
  if (x === 'work' || x === 'personal' || x === 'other') return x;
  return 'personal';
}

function normalizePhoneLabel(l: string | undefined): ContactLabel {
  const x = (l || 'work').toLowerCase();
  if (x === 'work' || x === 'personal' || x === 'other') return x;
  return 'work';
}

export function defaultEmailRowsFromEntity(entity: {
  email?: string | null;
  emails?: LabeledEmailItem[];
}): LabeledEmailItem[] {
  if (entity.emails && entity.emails.length > 0) {
    return entity.emails.map((e) => ({
      value: e.value,
      label: normalizeEmailLabel(e.label),
    }));
  }
  if (entity.email?.trim()) {
    return [{ value: entity.email.trim(), label: 'personal' }];
  }
  return [{ value: '', label: 'personal' }];
}

export function defaultPhoneRowsFromEntity(entity: {
  phone?: string | null;
  mobile?: string | null;
  phones?: LabeledPhoneItem[];
}): LabeledPhoneItem[] {
  if (entity.phones && entity.phones.length > 0) {
    return entity.phones.map((p) => ({
      value: p.value,
      label: normalizePhoneLabel(p.label),
    }));
  }
  const out: LabeledPhoneItem[] = [];
  if (entity.phone?.trim()) {
    out.push({ value: entity.phone.trim(), label: 'work' });
  }
  if (entity.mobile?.trim()) {
    out.push({ value: entity.mobile.trim(), label: 'personal' });
  }
  if (out.length === 0) {
    out.push({ value: '', label: 'work' });
  }
  return out;
}

const LABEL_OPTIONS: ContactLabel[] = ['personal', 'work', 'other'];

type Props = {
  emails: LabeledEmailItem[];
  phones: LabeledPhoneItem[];
  onEmailsChange: (v: LabeledEmailItem[]) => void;
  onPhonesChange: (v: LabeledPhoneItem[]) => void;
};

export function LabeledContactFieldsMobile({
  emails,
  phones,
  onEmailsChange,
  onPhonesChange,
}: Props) {
  return (
    <View className="gap-4">
      <View>
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Email addresses
        </Text>
        {emails.map((row, idx) => (
          <View key={`e-${idx}`} className="mb-2 flex-row gap-2">
            <View className="w-24 justify-center">
              <Text className="text-xs text-slate-500">Label</Text>
              <View className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-2">
                <Text className="text-xs text-slate-800">{row.label}</Text>
              </View>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs text-slate-500">Email</Text>
              <TextInput
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={row.value}
                onChangeText={(t) => {
                  const next = [...emails];
                  next[idx] = { ...next[idx], value: t };
                  onEmailsChange(next);
                }}
                placeholder="name@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View className="justify-end gap-1">
              <Pressable
                className="rounded-lg bg-slate-100 p-2 active:bg-slate-200"
                onPress={() => {
                  const cur = LABEL_OPTIONS.indexOf(row.label);
                  const nextLabel =
                    LABEL_OPTIONS[(cur + 1) % LABEL_OPTIONS.length];
                  const next = [...emails];
                  next[idx] = { ...next[idx], label: nextLabel };
                  onEmailsChange(next);
                }}
              >
                <Ionicons name="swap-horizontal" size={18} color="#475569" />
              </Pressable>
              {emails.length > 1 ? (
                <Pressable
                  className="rounded-lg bg-red-50 p-2 active:bg-red-100"
                  onPress={() =>
                    onEmailsChange(emails.filter((_, i) => i !== idx))
                  }
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
        <Pressable
          className="mt-1 flex-row items-center gap-1 self-start rounded-lg border border-dashed border-slate-300 px-3 py-2 active:bg-slate-50"
          onPress={() =>
            onEmailsChange([...emails, { value: '', label: 'personal' }])
          }
        >
          <Ionicons name="add" size={18} color="#2563eb" />
          <Text className="text-sm font-medium text-blue-600">Add email</Text>
        </Pressable>
      </View>

      <View>
        <Text className="mb-2 text-sm font-semibold text-slate-700">
          Phone numbers
        </Text>
        {phones.map((row, idx) => (
          <View key={`p-${idx}`} className="mb-2 flex-row gap-2">
            <View className="w-24 justify-center">
              <Text className="text-xs text-slate-500">Label</Text>
              <View className="mt-1 rounded-lg border border-slate-200 bg-white px-2 py-2">
                <Text className="text-xs text-slate-800">{row.label}</Text>
              </View>
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-xs text-slate-500">Phone</Text>
              <TextInput
                className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                value={row.value}
                onChangeText={(t) => {
                  const next = [...phones];
                  next[idx] = { ...next[idx], value: t };
                  onPhonesChange(next);
                }}
                placeholder="Phone"
                keyboardType="phone-pad"
              />
            </View>
            <View className="justify-end gap-1">
              <Pressable
                className="rounded-lg bg-slate-100 p-2 active:bg-slate-200"
                onPress={() => {
                  const cur = LABEL_OPTIONS.indexOf(row.label);
                  const nextLabel =
                    LABEL_OPTIONS[(cur + 1) % LABEL_OPTIONS.length];
                  const next = [...phones];
                  next[idx] = { ...next[idx], label: nextLabel };
                  onPhonesChange(next);
                }}
              >
                <Ionicons name="swap-horizontal" size={18} color="#475569" />
              </Pressable>
              {phones.length > 1 ? (
                <Pressable
                  className="rounded-lg bg-red-50 p-2 active:bg-red-100"
                  onPress={() =>
                    onPhonesChange(phones.filter((_, i) => i !== idx))
                  }
                >
                  <Ionicons name="trash-outline" size={18} color="#b91c1c" />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
        <Pressable
          className="mt-1 flex-row items-center gap-1 self-start rounded-lg border border-dashed border-slate-300 px-3 py-2 active:bg-slate-50"
          onPress={() =>
            onPhonesChange([...phones, { value: '', label: 'work' }])
          }
        >
          <Ionicons name="add" size={18} color="#2563eb" />
          <Text className="text-sm font-medium text-blue-600">Add phone</Text>
        </Pressable>
      </View>
    </View>
  );
}
