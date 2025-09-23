import { borderRadius, colors } from '@/src/config/theme';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = colors.surface,
  progressColor = colors.primary,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clampedProgress }}
      accessibilityLabel={`Progress: ${clampedProgress}%`}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress}%`,
            backgroundColor: progressColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
});