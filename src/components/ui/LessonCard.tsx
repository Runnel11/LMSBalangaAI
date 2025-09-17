import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/src/config/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface LessonCardProps {
  title: string;
  description: string;
  duration: number;
  isCompleted: boolean;
  isDownloaded: boolean;
  order: number;
  onPress: () => void;
  onDownload?: () => void;
  accessibilityLabel?: string;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  duration,
  isCompleted,
  isDownloaded,
  order,
  onPress,
  onDownload,
  accessibilityLabel,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isCompleted && styles.completedContainer]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || `Lesson ${order}: ${title}, ${duration} minutes, ${isCompleted ? 'completed' : 'not completed'}`}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <View style={styles.orderContainer}>
          <Text style={styles.orderText}>{order}</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>
        
        <View style={styles.actions}>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
            </View>
          )}
          
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={onDownload}
            accessibilityLabel={isDownloaded ? 'Downloaded' : 'Download lesson'}
            accessibilityRole="button"
          >
            <IconSymbol 
              name={isDownloaded ? "icloud.and.arrow.down.fill" : "icloud.and.arrow.down"} 
              size={20} 
              color={isDownloaded ? colors.success : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.durationContainer}>
          <IconSymbol name="clock" size={14} color={colors.textSecondary} />
          <Text style={styles.durationText}>{duration} min</Text>
        </View>
        
        {isDownloaded && (
          <View style={styles.downloadedIndicator}>
            <IconSymbol name="wifi.slash" size={14} color={colors.success} />
            <Text style={styles.downloadedText}>Available offline</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  completedContainer: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  orderContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  orderText: {
    ...typography.body2,
    color: colors.background,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  completedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  durationText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  downloadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  downloadedText: {
    ...typography.caption,
    color: colors.success,
    fontWeight: '500',
  },
});