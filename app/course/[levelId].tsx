import { useFocusEffect } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { LessonCard } from '@/src/components/ui/LessonCard';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { colors, spacing, typography } from '@/src/config/theme';
import {
  getLessonsByLevel,
  getLevelById,
  getLevelProgress,
  getProgress
} from '@/src/db/index';
import type { TextStyle, ViewStyle } from 'react-native';
// CommonJS module, prefer require to avoid TS named export issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const downloadManager = require('@/src/services/downloadManager');

type Level = {
  id: string | number;
  title: string;
  description?: string;
};

type Lesson = {
  id: string | number;
  title: string;
  description?: string;
  estimated_duration?: number;
  is_downloaded?: boolean;
  order_index?: number;
};

type LessonWithProgress = Lesson & { isCompleted: boolean };

export default function CourseLevelScreen() {
  const { levelId } = useLocalSearchParams();
  const [level, setLevel] = useState<Level | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [lessonsWithProgress, setLessonsWithProgress] = useState<LessonWithProgress[]>([]);
  const [levelProgress, setLevelProgress] = useState<{ total: number; completed: number; percentage: number }>({ total: 0, completed: 0, percentage: 0 });
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLevelData = async () => {
    try {
  const levelData = await getLevelById(String(levelId));
  const lessonsData = await getLessonsByLevel(String(levelId));
  const progress = await getLevelProgress(String(levelId));
      
      const lessonsWithProgressData: LessonWithProgress[] = await Promise.all(
        (lessonsData as Lesson[]).map(async (lesson: Lesson) => {
          const progressData: any[] = await getProgress(lesson.id as any);
          const isCompleted = progressData.length > 0 && progressData[0].is_completed;
          return {
            ...lesson,
            isCompleted,
          };
        })
      );

      setLevel(levelData);
      setLessons(lessonsData);
      setLessonsWithProgress(lessonsWithProgressData);
      setLevelProgress(progress);
    } catch (error) {
      console.error('Error loading level data:', error);
    }
  };

  useEffect(() => {
    if (levelId) {
      loadLevelData();
    }
  }, [levelId]);

  useFocusEffect(
    React.useCallback(() => {
      if (levelId) {
        loadLevelData();
      }
      return () => {};
    }, [levelId])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLevelData();
    setRefreshing(false);
  };

  const handleDownloadAll = async () => {
    if (downloading) return;

    const undownloadedLessons = lessons.filter((lesson: Lesson) => !lesson.is_downloaded);
    
    if (undownloadedLessons.length === 0) {
      Alert.alert('Already Downloaded', 'All lessons in this level are already downloaded.');
      return;
    }

    setDownloading(true);
    
    try {
      const results = await downloadManager.downloadAllLessonsInLevel(
        undownloadedLessons,
        (progress: any) => {
          console.log('Download progress:', progress);
        },
        (lesson: Lesson, result: any) => {
          console.log(`Lesson ${lesson.title} download:`, result.success ? 'Success' : 'Failed');
        }
      );

      const successCount = results.filter((r: any) => r.success).length;
      const failureCount = results.filter((r: any) => !r.success && !r.skipped).length;

      if (successCount > 0) {
        Alert.alert(
          'Download Complete',
          `Successfully downloaded ${successCount} lesson(s).${failureCount > 0 ? ` ${failureCount} failed.` : ''}`
        );
        await loadLevelData(); // Refresh to show updated download status
      } else {
        Alert.alert('Download Failed', 'Failed to download lessons. Please check your connection.');
      }
    } catch (error) {
      console.error('Error downloading lessons:', error);
      Alert.alert('Download Error', 'An error occurred while downloading lessons.');
    } finally {
      setDownloading(false);
    }
  };

  const handleLessonDownload = async (lesson: Lesson) => {
    if (lesson.is_downloaded) {
      router.push(`/lesson/${lesson.id}`);
      return;
    }

    try {
      const result = await downloadManager.downloadLesson(lesson);
      if (result.success) {
        Alert.alert('Downloaded', `${lesson.title} has been downloaded for offline access.`);
        await loadLevelData(); // Refresh to show updated download status
      } else {
        Alert.alert('Download Failed', result.message || 'Failed to download lesson.');
      }
    } catch (error) {
      console.error('Error downloading lesson:', error);
      Alert.alert('Download Error', 'An error occurred while downloading the lesson.');
    }
  };

  const navigateToLesson = (lessonId: string | number) => {
    router.push(`/lesson/${String(lessonId)}`);
  };

  const hasUndownloadedLessons = lessons.some((lesson: Lesson) => !lesson.is_downloaded);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title={level?.title || 'Course Level'}
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.content as any}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {level && (
          <View style={styles.header as any}>
            <Text style={styles.levelTitle as any}>{level.title}</Text>
            <Text style={styles.levelDescription as any}>{level.description}</Text>
            
            <View style={styles.progressSection as any}>
              <View style={styles.progressInfo as any}>
                <Text style={styles.progressText as any}>
                  Progress: {levelProgress.completed} of {levelProgress.total} lessons
                </Text>
                <Text style={styles.progressPercentage as any}>{levelProgress.percentage}%</Text>
              </View>
              <ProgressBar 
                progress={levelProgress.percentage} 
                style={styles.progressBar as any}
              />
            </View>

            {hasUndownloadedLessons && (
              <Button
                title={downloading ? 'Downloading...' : 'Download All Lessons'}
                onPress={handleDownloadAll}
                loading={downloading}
                disabled={downloading}
                style={styles.downloadAllButton as any}
                accessibilityLabel="Download all lessons for offline access"
              />
            )}
          </View>
        )}

        <View style={styles.lessonsSection as any}>
          <Text style={styles.sectionTitle as any}>Lessons</Text>
          
          {lessonsWithProgress.map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              description={lesson.description ?? ''}
              duration={lesson.estimated_duration ?? 0}
              isCompleted={!!lesson.isCompleted}
              isDownloaded={!!lesson.is_downloaded}
              order={lesson.order_index ?? 0}
              onPress={() => navigateToLesson(lesson.id)}
              onDownload={() => handleLessonDownload(lesson)}
              accessibilityLabel={`Lesson ${lesson.order_index}: ${lesson.title}, ${lesson.estimated_duration} minutes, ${lesson.isCompleted ? 'completed' : 'not completed'}, ${lesson.is_downloaded ? 'downloaded' : 'not downloaded'}`}
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
  } as ViewStyle,
  content: {
    flex: 1,
  } as ViewStyle,
  header: {
    padding: spacing.lg,
  } as ViewStyle,
  levelTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  } as TextStyle,
  levelDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  } as TextStyle,
  progressSection: {
    marginBottom: spacing.lg,
  } as ViewStyle,
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  } as ViewStyle,
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
  } as TextStyle,
  progressPercentage: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  progressBar: {
    height: 8,
  } as ViewStyle,
  downloadAllButton: {
    marginTop: spacing.md,
  } as ViewStyle,
  lessonsSection: {
    paddingBottom: spacing.xl,
  } as ViewStyle,
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  } as TextStyle,
});