import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import React from 'react';
import { ActivityIndicator, Animated, StyleProp, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  /**
   * Controls the base typography of the button label. Use header variants for prominent CTA-as-heading designs.
   * Default is 'button'.
   */
  textVariant?: 'button' | 'h3' | 'h2' | 'h1';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  textStyle,
  textVariant = 'button',
}: ButtonProps) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 44,
      flexDirection: 'row',
    };

    const sizeStyles: Record<'small' | 'medium' | 'large', ViewStyle> = {
      small: { 
        paddingHorizontal: spacing.md, 
        paddingVertical: spacing.sm,
        minHeight: 36,
      },
      medium: { 
        paddingHorizontal: spacing.lg, 
        paddingVertical: spacing.md,
        minHeight: 44,
      },
      large: { 
        paddingHorizontal: spacing.xl, 
        paddingVertical: spacing.lg,
        minHeight: 52,
      },
    };

    const variantStyles: Record<'primary' | 'secondary' | 'tertiary' | 'danger', ViewStyle> = {
      primary: {
        backgroundColor: disabled ? colors.disabled : colors.primary,
      },
      secondary: {
        backgroundColor: disabled ? colors.disabled : colors.secondary,
      },
      tertiary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.primary,
      },
      danger: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: disabled ? colors.border : colors.error,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  const getTextStyle = (): TextStyle => {
    // Choose the base token depending on requested textVariant
    const token =
      textVariant === 'h1' ? (typography.h1 as any) :
      textVariant === 'h2' ? (typography.h2 as any) :
      textVariant === 'h3' ? (typography.h3 as any) :
      (typography.button as any);

    const baseStyle: TextStyle = {
      ...token,
      textAlign: 'center',
    };

    const sizeStyles: Record<'small' | 'medium' | 'large', TextStyle> = {
      small: { fontSize: 12 },
      medium: { fontSize: 14 }, // Standard button text size
      large: { fontSize: 16 },
    };

    const variantStyles: Record<'primary' | 'secondary' | 'tertiary' | 'danger', TextStyle> = {
      primary: {
        color: disabled ? colors.disabledText : colors.surface, // White text on primary
      },
      secondary: {
        color: disabled ? colors.disabledText : colors.surface, // White text on secondary
      },
      tertiary: {
        color: disabled ? colors.disabledText : colors.primary, // Primary color text
      },
      danger: {
        color: disabled ? colors.disabledText : colors.error, // Error color text
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <TouchableOpacity
        style={[getButtonStyle(), style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        activeOpacity={1}
      >
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' || variant === 'secondary' ? colors.background :
                   variant === 'danger' ? colors.error : colors.primary}
            style={{ marginRight: spacing.sm }}
          />
        )}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};