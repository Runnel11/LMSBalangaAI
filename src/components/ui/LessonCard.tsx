import { IconSymbol } from '@/components/ui/icon-symbol';
import { borderRadius, colors, shadows, spacing, typography } from '@/src/config/theme';
import React from 'react';
import { Animated, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';

interface LessonCardProps {
  title: string;
  description: string;
  duration: number;
  isCompleted: boolean;
  isDownloaded: boolean;
  order: number;
  onPress: () => void;
  onDownload?: () => void;
  canDownload?: boolean; // optional gate to hide download UI (e.g., when offline)
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
  canDownload = true,
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

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <TouchableOpacity
        style={[styles.container, isCompleted && styles.completedContainer]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel={accessibilityLabel || `Lesson ${order}: ${title}, ${duration} minutes, ${isCompleted ? 'completed' : 'not completed'}`}
        accessibilityRole="button"
        activeOpacity={1}
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
              <IconSymbol name="checkmark.circle.fill" size={16} color={colors.surface} />
              <Text style={styles.completedText}>COMPLETED</Text>
            </View>
          )}

          {/* Show download button only when download is allowed and not already downloaded */}
          {!isDownloaded && canDownload && !!onDownload && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={onDownload}
              accessibilityLabel={'Download lesson'}
              accessibilityRole="button"
            >
              <IconSymbol
                name="icloud.and.arrow.down"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create<{
  container: ViewStyle;
  completedContainer: ViewStyle;
  header: ViewStyle;
  orderContainer: ViewStyle;
  orderText: TextStyle;
  content: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  actions: ViewStyle;
  completedBadge: ViewStyle;
  completedText: TextStyle;
  downloadButton: ViewStyle;
  footer: ViewStyle;
  durationContainer: ViewStyle;
  durationText: TextStyle;
  downloadedIndicator: ViewStyle;
  downloadedText: TextStyle;
}>({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...(shadows.small as any),
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
    ...(typography.body2 as any),
    color: colors.background,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },
  title: {
    ...(typography.body1 as any),
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
    ...(typography.body2 as any),
    color: colors.textSecondary,
    lineHeight: 18,
  },
  actions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  completedText: {
    ...(typography.caption as any),
    color: colors.surface,
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.5,
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
    ...(typography.caption as any),
    color: colors.textSecondary,
  },
  downloadedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  downloadedText: {
    ...(typography.caption as any),
    color: colors.success,
    fontWeight: '500',
  },
});