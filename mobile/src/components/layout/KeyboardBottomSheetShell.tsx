import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useKeyboardBottomInset } from '../../hooks/useKeyboardBottomInset';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  overlayColor?: string;
  className?: string;
  onOverlayPress?: () => void;
};

export function KeyboardBottomSheetShell({
  children,
  style,
  overlayColor = 'rgba(15, 23, 42, 0.5)',
  className,
  onOverlayPress,
}: Props) {
  const keyboardInset = useKeyboardBottomInset();
  const shellStyle: StyleProp<ViewStyle> = [
    {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: overlayColor,
      paddingBottom: keyboardInset,
    },
    style,
  ];

  if (onOverlayPress) {
    return (
      <Pressable className={className} style={shellStyle} onPress={onOverlayPress}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={className} style={shellStyle}>
      {children}
    </View>
  );
}
