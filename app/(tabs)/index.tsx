import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CourseCard } from '@/src/components/ui/CourseCard';
import { OfflineIndicator } from '@/src/components/ui/OfflineIndicator';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { colors, spacing, typography } from '@/src/config/theme';
import { useOffline } from '@/src/contexts/OfflineContext';
import { getAllLevels, getLevelProgress } from '@/src/db/index';

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
  const { isOnline, offlineData, refreshOfflineData } = useOffline();

  const loadLevelsWithProgress = async () => {
    try {
  let levelsData: any[];

      // Try to load from local database first
      try {
  levelsData = await getAllLevels();
      } catch (dbError) {
        console.warn('Could not load from local database, trying offline cache:', dbError);

        // Fallback to offline cached data
        if (offlineData?.levels) {
          levelsData = offlineData.levels as any[];
        } else {
          throw new Error('No data available offline');
        }
      }

      // Normalize IDs from Bubble (_id) -> id if necessary
      const normalizedLevels: LevelItem[] = (levelsData || []).map((level: any) => ({
        ...level,
        id: level?.id ?? level?._id,
      }));

      const levelsWithProgressData: LevelItem[] = await Promise.all(
        normalizedLevels.map(async (level: LevelItem) => {
          try {
            const progress = await getLevelProgress(level.id);
            return {
              ...level,
              progress: progress.percentage,
              totalLessons: progress.total,
              completedLessons: progress.completed,
            };
          } catch (progressError) {
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
      setLevels(normalizedLevels);
      setLevelsWithProgress(levelsWithProgressData);
    } catch (error) {
      console.error('Error loading levels:', error);
      // Set empty state if all loading methods fail
      setLevels([]);
      setLevelsWithProgress([]);
    }
  };

  useEffect(() => {
    loadLevelsWithProgress();
  }, []);

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

  const navigateToCourse = (levelId) => {
    router.push(`/course/${String(levelId)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="BalangaAI Academy" />
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
          
          {levelsWithProgress.map((level) => (
            <CourseCard
              key={String(level.id ?? level._id)}
              title={level.title}
              description={level.description}
              progress={level.progress}
              totalLessons={level.totalLessons}
              completedLessons={level.completedLessons}
              level={level.order_index}
              onPress={() => navigateToCourse(level.id ?? level._id)}
              accessibilityLabel={`${level.title} course, level ${level.order_index}, ${level.progress}% complete`}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitleText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  coursesSection: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});
