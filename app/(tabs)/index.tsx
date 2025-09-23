import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/src/components/ui/CourseCard';
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { colors, spacing, typography } from '@/src/config/theme';
import { useOffline } from '@/src/contexts/OfflineContext';
import { getAllLevels, getLevelProgress } from '@/src/db/index';
import { logger } from '@/src/utils/logger';
// CommonJS to avoid TS named export issues for platform module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const downloadManager = require('@/src/services/downloadManager');

export default function HomeScreen() {
  type LevelItem = {
    id: string | number;
    _id?: string;
    title: string;
    description?: string;
    order_index?: number;
    progress?: number;
    totalLessons?: number;
    completedLessons?: number;
  };

  const [levels, setLevels] = useState<LevelItem[]>([]);
  const [levelsWithProgress, setLevelsWithProgress] = useState<LevelItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline, offlineData, refreshOfflineData } = useOffline();

  const loadLevelsWithProgress = async () => {
    const timer = logger.startTimer('Load levels with progress');
    try {
      setError(null);
      setLoading(true);
      logger.db.query('levels', 'Loading levels with progress calculations');
      let levelsData: any[];

      // Try to load from local database first
      try {
        levelsData = await getAllLevels();
        logger.db.query('levels', `Loaded ${levelsData.length} levels from local database`);
      } catch (dbError: any) {
        logger.db.error('levels_load', `Local database failed: ${dbError?.message ?? String(dbError)}`);
        console.warn('Could not load from local database, trying offline cache:', dbError);

        // Fallback to offline cached data
        if (offlineData?.levels) {
          levelsData = offlineData.levels as any[];
          logger.db.query('levels', `Loaded ${levelsData.length} levels from offline cache`);
        } else {
          throw new Error('No data available offline');
        }
      }

      // Normalize IDs from Bubble (_id) -> id if necessary
      const normalizedLevels: LevelItem[] = (levelsData || []).map((level: any) => ({
        ...level,
        id: level?.id ?? level?._id,
      }));

      // If offline, hide levels with no downloaded lessons on this device
      let levelsForDisplay: LevelItem[] = normalizedLevels;
      if (!isOnline) {
        try {
          const keepFlags = await Promise.all(
            normalizedLevels.map(async (lvl: LevelItem) => {
              const items = await downloadManager.getOfflineLessons(String(lvl.id));
              return Array.isArray(items) && items.length > 0;
            })
          );
          levelsForDisplay = normalizedLevels.filter((_, idx) => keepFlags[idx]);
          logger.db.query('levels', `Offline filter kept ${levelsForDisplay.length} of ${normalizedLevels.length} levels`);
        } catch (e: any) {
          logger.offline.syncError(String(e?.message ?? e));
        }
      }

      const levelsWithProgressData: LevelItem[] = await Promise.all(
        levelsForDisplay.map(async (level: LevelItem) => {
          try {
            const progress = await getLevelProgress(level.id);
            logger.db.query('progress', `Level ${level.id}: ${progress.completed}/${progress.total} lessons (${progress.percentage}%)`);
            return {
              ...level,
              progress: progress.percentage,
              totalLessons: progress.total,
              completedLessons: progress.completed,
            };
          } catch (progressError: any) {
            logger.db.error('progress_calc', `Failed to load progress for level ${level.id}: ${progressError?.message ?? String(progressError)}`);
            console.warn(`Could not load progress for level ${level.id}:`, progressError);
            return {
              ...level,
              progress: 0,
              totalLessons: 0,
              completedLessons: 0,
            };
          }
        })
      );

      setLevels(levelsForDisplay);
      setLevelsWithProgress(levelsWithProgressData);
      timer();
      logger.db.query('levels', `Successfully loaded ${levelsWithProgressData.length} levels with progress calculations`);
    } catch (error: any) {
      timer();
      logger.db.error('levels_load', `Complete failure loading levels: ${error?.message ?? String(error)}`);
      console.error('Error loading levels:', error);
      setError(`Failed to load courses: ${error?.message ?? String(error)}`);
      // Set empty state if all loading methods fail
      setLevels([]);
      setLevelsWithProgress([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLevelsWithProgress();
  }, []);

  // Reload when connectivity changes so offline filter applies immediately
  useEffect(() => {
    loadLevelsWithProgress();
  }, [isOnline]);

  useFocusEffect(
    React.useCallback(() => {
      loadLevelsWithProgress();
      return () => {};
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);

    // If online, try to refresh offline data first
    if (isOnline) {
      await refreshOfflineData();
    }

    await loadLevelsWithProgress();
    setRefreshing(false);
  };

  const navigateToCourse = (levelId: string | number) => {
    router.push(`/course/${String(levelId)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="BalangaAI Academy" showLogo={true} />
      <OfflineIndicator />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to your learning journey</Text>
          <Text style={styles.subtitleText}>
            Master AI skills through our comprehensive curriculum
          </Text>
        </View>

        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>Your Courses</Text>

          {loading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading courses...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Text style={styles.retryText} onPress={loadLevelsWithProgress}>
                Tap to retry
              </Text>
            </View>
          )}

          {!loading && !error && levelsWithProgress.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No courses available</Text>
              <Text style={styles.emptySubtext}>
                {isOnline ? 'Courses will appear here once content is available' : 'Connect to the internet to load courses'}
              </Text>
            </View>
          )}

          {!loading && !error && levelsWithProgress.map((level) => (
            <CourseCard
              key={String(level.id ?? level._id)}
              title={level.title}
              description={level.description || ''}
              progress={level.progress ?? 0}
              totalLessons={level.totalLessons ?? 0}
              completedLessons={level.completedLessons ?? 0}
              level={level.order_index ?? 0}
              onPress={() => navigateToCourse(level.id ?? level._id)}
              accessibilityLabel={`${level.title} course, level ${level.order_index}, ${level.progress}% complete`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  content: ViewStyle;
  header: ViewStyle;
  welcomeText: TextStyle;
  subtitleText: TextStyle;
  coursesSection: ViewStyle;
  sectionTitle: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  errorContainer: ViewStyle;
  errorText: TextStyle;
  retryText: TextStyle;
  emptyContainer: ViewStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
}>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  welcomeText: {
    ...(typography.h2 as any),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitleText: {
    ...(typography.body1 as any),
    color: colors.textSecondary,
  },
  coursesSection: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...(typography.h3 as any),
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...(typography.body1 as any),
    color: colors.textSecondary,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: (colors.error as any) + '10',
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...(typography.body1 as any),
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryText: {
    ...(typography.body2 as any),
    color: colors.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  emptyText: {
    ...(typography.h3 as any),
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...(typography.body2 as any),
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
