// @ts-nocheck
// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  // Navigation & general
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',

  // People
  'person.fill': 'person',
  'person.3.fill': 'group',

  // Work / jobs
  'briefcase.fill': 'work',

  // Status / actions
  'checkmark.circle.fill': 'check-circle',
  'clock': 'access-time',
  'wifi.slash': 'wifi-off',

  // Cloud / downloads
  'icloud.and.arrow.down': 'cloud-download',
  'icloud.and.arrow.down.fill': 'cloud-done',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const resolved = MAPPING[name];
  if (!resolved) {
    // Fall back to a generic icon and warn in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`IconSymbol: No MaterialIcon mapping for "${String(name)}". Falling back to 'help-outline'.`);
    }
    return <MaterialIcons color={color} size={size} name={'help-outline'} style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={resolved} style={style} />;
}
