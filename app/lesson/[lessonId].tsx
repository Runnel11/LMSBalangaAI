import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';
import { getLessonById, getProgress, getQuizByLessonId } from '@/src/db/index';
import { offlineManager } from '@/src/services/offlineManager';
import { logger } from '@/src/utils/logger';
// CommonJS module, prefer require to avoid TS named export issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const downloadManager = require('@/src/services/downloadManager');

// Lightweight types for local safety
type Lesson = { id: string | number; title: string; description?: string; estimated_duration?: number; is_downloaded?: boolean };
type LessonContent = { id: string | number; title: string; content: string; duration?: number } | null;
type Quiz = { id: string | number } | null;

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonContent, setLessonContent] = useState<LessonContent>(null);
  const [quiz, setQuiz] = useState<Quiz>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadLessonData = async () => {
    const timer = logger.startTimer('Load lesson data');
    try {
      setLoading(true);
      const idStr = String(lessonId);
      logger.db.query('lesson', `Loading lesson data for lesson ID: ${idStr}`);

      const lessonData = await getLessonById(idStr);
      const quizData = await getQuizByLessonId(idStr);
      const progressData: any[] = await getProgress(idStr as any);

      setLesson(lessonData as Lesson);
      setQuiz((quizData as any) as Quiz);

      const completionStatus = Array.isArray(progressData) && progressData.length > 0 && !!progressData[0].is_completed;
      setIsCompleted(completionStatus);

      logger.db.query('lesson', `Lesson loaded: ${lessonData?.title || 'Unknown'}, Quiz: ${quizData ? 'Available' : 'None'}, Completed: ${completionStatus}`);

      // Try local content first, then fallback to lesson.content
      let content: LessonContent = null;
      if ((lessonData as any)?.is_downloaded) {
        logger.db.query('lesson', 'Attempting to load local content');
        content = await downloadManager.getLocalLessonContent(lessonData);
      }
      if (!content && lessonData) {
        logger.db.query('lesson', 'Using embedded content or showing download prompt');
        content = {
          id: (lessonData as any).id,
          title: (lessonData as any).title,
          content: (lessonData as any).content || 'Content not available offline. Please download this lesson.',
          duration: (lessonData as any).estimated_duration,
        };
      }
      setLessonContent(content);
      timer();
    } catch (error) {
      timer();
  logger.db.error('lesson_load', `Failed to load lesson ${lessonId}: ${(error as any)?.message || error}`);
      console.error('Error loading lesson data:', error);
      Alert.alert('Error', 'Failed to load lesson data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lessonId) {
      loadLessonData();
    }
  }, [lessonId]);

  const handleDownloadLesson = async () => {
    if (!lesson || downloading) return;

    const networkAvailable = await downloadManager.isNetworkAvailable();
    if (!networkAvailable) {
      Alert.alert('No Internet', 'Please connect to the internet to download lessons.');
      return;
    }

    setDownloading(true);
    try {
      const result = await downloadManager.downloadLesson(lesson);
      if (result.success) {
        Alert.alert('Downloaded', 'Lesson has been downloaded for offline access.');
        await loadLessonData();
      } else {
        Alert.alert('Download Failed', result.message || 'Failed to download lesson.');
      }
    } catch (error) {
      console.error('Error downloading lesson:', error);
      Alert.alert('Download Error', 'An error occurred while downloading the lesson.');
    } finally {
      setDownloading(false);
    }
  };

  const handleMarkComplete = async () => {
    if (!lesson) return;
    const timer = logger.startTimer('Mark lesson complete');
    try {
      logger.db.query('progress', `Marking lesson ${lesson.id} as complete`);
  await offlineManager.saveUserProgress((lesson as any).id, null, null, true);
      setIsCompleted(true);
      timer();
      logger.db.query('progress', `Successfully marked lesson ${lesson.id} as complete`);
      Alert.alert('Completed', 'Lesson marked as complete!');
    } catch (error) {
      timer();
  logger.db.error('progress_save', `Failed to mark lesson ${lesson.id} complete: ${(error as any)?.message || error}`);
      console.error('Error marking lesson complete:', error);
      Alert.alert('Error', 'Failed to mark lesson as complete.');
    }
  };

  const handleStartQuiz = () => {
    if (quiz) {
      router.push(`/quiz/${String((quiz as any).id)}`);
    } else {
      Alert.alert('No Quiz', 'This lesson does not have a quiz.');
    }
  };

  if (loading) {
    return (
  <SafeAreaView style={styles.container as any} edges={['bottom']}>
        <TopAppBar title="Loading..." showBackButton onBackPress={() => router.back()} />
        <View style={styles.loadingContainer as any}>
          <Text style={styles.loadingText as any}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
  <SafeAreaView style={styles.container as any} edges={['bottom']}>
      <TopAppBar title={lesson?.title || 'Lesson'} showBackButton onBackPress={() => router.back()} />

  <ScrollView style={styles.content as any}>
        {lesson && (
          <>
            <View style={styles.header as any}>
              <Text style={styles.lessonTitle as any}>{lesson.title}</Text>
              <Text style={styles.lessonDescription as any}>{lesson.description}</Text>

              <View style={styles.metaInfo as any}>
                <Text style={styles.duration as any}>⏱️ {lesson.estimated_duration} minutes</Text>
                {isCompleted && <Text style={styles.completedBadge as any}>✅ Completed</Text>}
              </View>

              {!lesson.is_downloaded && (
                <Button
                  title={downloading ? 'Downloading...' : 'Download for Offline'}
                  onPress={handleDownloadLesson}
                  variant="tertiary"
                  loading={downloading}
                  disabled={downloading}
                  style={styles.downloadButton as any}
                  accessibilityLabel="Download lesson for offline access"
                />
              )}
            </View>

            <View style={styles.contentSection as any}>
              <Text style={styles.sectionTitle as any}>Lesson Content</Text>

              <View style={styles.contentContainer as any}>
                {lessonContent ? (
                  <Text style={styles.contentText as any}>{lessonContent.content}</Text>
                ) : (
                  <Text style={styles.noContentText as any}>
                    Content not available. Please download this lesson for offline access.
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actionsSection as any}>
              {!isCompleted && (
                <Button
                  title="Mark as Complete"
                  onPress={handleMarkComplete}
                  style={styles.actionButton as any}
                  accessibilityLabel="Mark this lesson as complete"
                />
              )}

              {quiz && (
                <Button
                  title="Take Quiz"
                  onPress={handleStartQuiz}
                  variant="secondary"
                  style={styles.actionButton as any}
                  accessibilityLabel="Take the quiz for this lesson"
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as import('react-native').ViewStyle,
  content: {
    flex: 1,
  } as import('react-native').ViewStyle,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as import('react-native').ViewStyle,
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  } as import('react-native').TextStyle,
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  } as import('react-native').ViewStyle,
  lessonTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  } as import('react-native').TextStyle,
  lessonDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 24,
  } as import('react-native').TextStyle,
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as import('react-native').ViewStyle,
  duration: {
    ...typography.body2,
    color: colors.textSecondary,
  } as import('react-native').TextStyle,
  completedBadge: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
  } as import('react-native').TextStyle,
  downloadButton: {
    marginTop: spacing.sm,
  } as import('react-native').ViewStyle,
  contentSection: {
    padding: spacing.lg,
  } as import('react-native').ViewStyle,
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  } as import('react-native').TextStyle,
  contentContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  } as import('react-native').ViewStyle,
  contentText: {
    ...typography.body1,
    color: colors.textPrimary,
    lineHeight: 24,
  } as import('react-native').TextStyle,
  noContentText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  } as import('react-native').TextStyle,
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  } as import('react-native').ViewStyle,
  actionButton: {
    marginBottom: spacing.sm,
  } as import('react-native').ViewStyle,
});