import { Pressable, ScrollView, Text, View } from 'react-native';

type Props = {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
};

export function ProductChipSelect({ label, options, value, onChange }: Props) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-2 pb-1">
          {options.map((opt) => (
            <Pressable
              key={opt}
              onPress={() => onChange(opt)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: value === opt ? '#2563eb' : '#f1f5f9',
                borderWidth: 1,
                borderColor: value === opt ? '#2563eb' : '#e2e8f0',
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: value === opt ? '#fff' : '#475569',
                  textTransform: 'capitalize',
                }}
              >
                {opt.replace(/_/g, ' ')}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
