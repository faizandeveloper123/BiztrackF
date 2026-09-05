import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { MenuHeaderButton } from './MenuHeaderButton';
import { WS, cardShadow } from '../../features/workshop/components/workshopTheme';

type IonName = ComponentProps<typeof Ionicons>['name'];

export type HubStat = {
  label: string;
  value: string | number;
  sub?: string;
  icon: IonName;
  accent: string;
  accentBg: string;
};

export type HubLink = {
  path: string;
  label: string;
  icon: IonName;
  color?: string;
  bg?: string;
};

export function ModuleHubScreen(props: {
  title: string;
  subtitle?: string;
  accent?: string;
  right?: React.ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  stats?: HubStat[];
  links?: HubLink[];
  onNavigate: (path: string) => void;
  children?: React.ReactNode;
  linksTitle?: string;
}) {
  const accent = props.accent ?? WS.primary;

  return (
    <View style={{ flex: 1, backgroundColor: WS.bg }}>
      <View
        style={{
          backgroundColor: accent,
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 24,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MenuHeaderButton />
          <View style={{ flex: 1, paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#fff' }}>{props.title}</Text>
            {props.subtitle ? (
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {props.subtitle}
              </Text>
            ) : null}
          </View>
          {props.right}
        </View>
      </View>

      {props.loading && !props.refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            props.onRefresh ? (
              <RefreshControl
                refreshing={!!props.refreshing}
                onRefresh={props.onRefresh}
                tintColor={accent}
              />
            ) : undefined
          }
        >
          {props.stats && props.stats.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: -18 }}>
              {props.stats.map((s) => (
                <HubStatCard key={s.label} {...s} />
              ))}
            </View>
          ) : null}

          {props.children}

          {props.links && props.links.length > 0 ? (
            <View style={{ marginTop: props.stats?.length ? 20 : 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: WS.text, marginBottom: 12 }}>
                {props.linksTitle ?? 'Quick access'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {props.links.map((l) => (
                  <Pressable
                    key={l.path}
                    onPress={() => props.onNavigate(l.path)}
                    style={{
                      width: '47%',
                      backgroundColor: WS.card,
                      borderRadius: 16,
                      padding: 14,
                      borderWidth: 1,
                      borderColor: WS.border,
                      ...cardShadow,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: l.bg ?? WS.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name={l.icon} size={20} color={l.color ?? accent} />
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: WS.text }}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function HubStatCard(props: HubStat) {
  const cardStyle: ViewStyle = {
    flex: 1,
    minWidth: '46%',
    backgroundColor: WS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: WS.border,
    ...cardShadow,
  };
  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: WS.textMuted }}>{props.label}</Text>
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
      <Text style={{ fontSize: 26, fontWeight: '800', color: WS.text, marginTop: 8 }}>{props.value}</Text>
      {props.sub ? (
        <Text style={{ fontSize: 11, color: WS.textLight, marginTop: 2 }}>{props.sub}</Text>
      ) : null}
    </View>
  );
}
