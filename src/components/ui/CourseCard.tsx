import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/src/config/theme';
import { ProgressBar } from './ProgressBar';

interface CourseCardProps {
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  level: number;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  progress,
  totalLessons,
  completedLessons,
  level,
  onPress,
  accessibilityLabel,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const getLevelColor = () => {
    const levelColors = [
      colors.info,      // Level 1
      colors.success,   // Level 2
      colors.warning,   // Level 3
      colors.primary,   // Level 4
    ];
    return levelColors[level - 1] || colors.primary;
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel || `${title} course, ${progress}% complete`}
        accessibilityRole="button"
        activeOpacity={1}
      >
      <View style={styles.header}>
        <View style={[styles.levelBadge, { backgroundColor: getLevelColor() }]}>
          <Text style={styles.levelText}>Level {level}</Text>
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
      
      <ProgressBar progress={progress} style={styles.progressBar} />
      
      <View style={styles.footer}>
        <Text style={styles.lessonCount}>
          {completedLessons} of {totalLessons} lessons completed
        </Text>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface, // White background
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.card, // Updated card shadow
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  levelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
  },
  levelText: {
    ...typography.caption,
    color: colors.surface, // White text on colored badge
    fontWeight: '600',
    fontSize: 12,
  },
  progressText: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  progressBar: {
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonCount: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});