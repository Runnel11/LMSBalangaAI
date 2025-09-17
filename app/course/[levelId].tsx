import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { LessonCard } from '@/src/components/ui/LessonCard';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { 
  getLevelById, 
  getLessonsByLevel, 
  getProgress, 
  getLevelProgress 
} from '@/src/db/index';
import { 
  downloadLesson, 
  downloadAllLessonsInLevel,
  getLocalLessonContent 
} from '@/src/services/downloadManager';
import { colors, typography, spacing } from '@/src/config/theme';

export default function CourseLevelScreen() {
  const { levelId } = useLocalSearchParams();
  const [level, setLevel] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsWithProgress, setLessonsWithProgress] = useState([]);
  const [levelProgress, setLevelProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadLevelData = async () => {
    try {
      const levelData = await getLevelById(Number(levelId));
      const lessonsData = await getLessonsByLevel(Number(levelId));
      const progress = await getLevelProgress(Number(levelId));
      
      const lessonsWithProgressData = await Promise.all(
        lessonsData.map(async (lesson) => {
          const progressData = await getProgress(lesson.id);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLevelData();
    setRefreshing(false);
  };

  const handleDownloadAll = async () => {
    if (downloading) return;

    const undownloadedLessons = lessons.filter(lesson => !lesson.is_downloaded);
    
    if (undownloadedLessons.length === 0) {
      Alert.alert('Already Downloaded', 'All lessons in this level are already downloaded.');
      return;
    }

    setDownloading(true);
    
    try {
      const results = await downloadAllLessonsInLevel(
        undownloadedLessons,
        (progress) => {
          console.log('Download progress:', progress);
        },
        (lesson, result) => {
          console.log(`Lesson ${lesson.title} download:`, result.success ? 'Success' : 'Failed');
        }
      );

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success && !r.skipped).length;

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

  const handleLessonDownload = async (lesson) => {
    if (lesson.is_downloaded) {
      router.push(`/lesson/${lesson.id}`);
      return;
    }

    try {
      const result = await downloadLesson(lesson);
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

  const navigateToLesson = (lessonId) => {
    router.push(`/lesson/${lessonId}`);
  };

  const hasUndownloadedLessons = lessons.some(lesson => !lesson.is_downloaded);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title={level?.title || 'Course Level'}
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {level && (
          <View style={styles.header}>
            <Text style={styles.levelTitle}>{level.title}</Text>
            <Text style={styles.levelDescription}>{level.description}</Text>
            
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  Progress: {levelProgress.completed} of {levelProgress.total} lessons
                </Text>
                <Text style={styles.progressPercentage}>{levelProgress.percentage}%</Text>
              </View>
              <ProgressBar 
                progress={levelProgress.percentage} 
                style={styles.progressBar}
              />
            </View>

            {hasUndownloadedLessons && (
              <Button
                title={downloading ? 'Downloading...' : 'Download All Lessons'}
                onPress={handleDownloadAll}
                loading={downloading}
                disabled={downloading}
                style={styles.downloadAllButton}
                accessibilityLabel="Download all lessons for offline access"
              />
            )}
          </View>
        )}

        <View style={styles.lessonsSection}>
          <Text style={styles.sectionTitle}>Lessons</Text>
          
          {lessonsWithProgress.map((lesson) => (
            <LessonCard
              key={lesson.id}
              title={lesson.title}
              description={lesson.description}
              duration={lesson.estimated_duration}
              isCompleted={lesson.isCompleted}
              isDownloaded={lesson.is_downloaded}
              order={lesson.order_index}
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
  },
  content: {
    flex: 1,
  },
  header: {
    padding: spacing.lg,
  },
  levelTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  levelDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 24,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  progressPercentage: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
  },
  downloadAllButton: {
    marginTop: spacing.md,
  },
  lessonsSection: {
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
});