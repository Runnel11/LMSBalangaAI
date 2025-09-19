import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/src/config/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
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
}) => {
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

    const sizeStyles = {
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

    const variantStyles = {
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
    const baseStyle: TextStyle = {
      ...typography.button, // 14px / Manrope Bold / Uppercase
      textAlign: 'center',
    };

    const sizeStyles = {
      small: { fontSize: 12 },
      medium: { fontSize: 14 }, // Standard button text size
      large: { fontSize: 16 },
    };

    const variantStyles = {
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