import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || `${title} course, ${progress}% complete`}
      accessibilityRole="button"
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
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.medium,
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
    color: colors.background,
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