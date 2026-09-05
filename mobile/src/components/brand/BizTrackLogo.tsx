import { Image, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

const logoSource = require('../../../assets/biztrack-logo.png');

const LOGO_ASPECT = 671 / 503;

const HEIGHTS = {
  sm: 28,
  md: 36,
  lg: 48,
  hero: 80,
} as const;

type BizTrackLogoSize = keyof typeof HEIGHTS;

type BizTrackLogoProps = {
  size?: BizTrackLogoSize;
  showText?: boolean;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function BizTrackLogo({
  size = 'md',
  showText = false,
  style,
  imageStyle,
}: BizTrackLogoProps) {
  const height = HEIGHTS[size];
  const width = Math.round(height * LOGO_ASPECT);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 10 }, style]}>
      <Image
        source={logoSource}
        style={[{ width, height }, imageStyle]}
        resizeMode="contain"
        accessibilityLabel="BizTrack"
      />
      {showText ? (
        <Text className="text-xl font-bold text-slate-900">BizTrack</Text>
      ) : null}
    </View>
  );
}
