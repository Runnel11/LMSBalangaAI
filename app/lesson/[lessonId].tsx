import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { getLessonById, getQuizByLessonId, saveProgress, getProgress } from '@/src/db/index';
import { 
  downloadLesson, 
  getLocalLessonContent,
  isNetworkAvailable 
} from '@/src/services/downloadManager';
import { colors, typography, spacing, borderRadius } from '@/src/config/theme';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams();
  const [lesson, setLesson] = useState(null);
  const [lessonContent, setLessonContent] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const loadLessonData = async () => {
    try {
      setLoading(true);
      const lessonData = await getLessonById(Number(lessonId));
      const quizData = await getQuizByLessonId(Number(lessonId));
      const progressData = await getProgress(Number(lessonId));
      
      setLesson(lessonData);
      setQuiz(quizData);
      setIsCompleted(progressData.length > 0 && progressData[0].is_completed);

      // Try to load local content first, fallback to online content
      let content = null;
      if (lessonData?.is_downloaded) {
        content = await getLocalLessonContent(lessonData);
      }
      
      if (!content && lessonData) {
        // Use the content from database as fallback
        content = {
          id: lessonData.id,
          title: lessonData.title,
          content: lessonData.content || 'Content not available offline. Please download this lesson.',
          duration: lessonData.estimated_duration
        };
      }
      
      setLessonContent(content);
    } catch (error) {
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

    const networkAvailable = await isNetworkAvailable();
    if (!networkAvailable) {
      Alert.alert('No Internet', 'Please connect to the internet to download lessons.');
      return;
    }

    setDownloading(true);
    try {
      const result = await downloadLesson(lesson);
      if (result.success) {
        Alert.alert('Downloaded', 'Lesson has been downloaded for offline access.');
        await loadLessonData(); // Refresh to show updated content
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

    try {
      await saveProgress(lesson.id, null, null, true);
      setIsCompleted(true);
      Alert.alert('Completed', 'Lesson marked as complete!');
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      Alert.alert('Error', 'Failed to mark lesson as complete.');
    }
  };

  const handleStartQuiz = () => {
    if (quiz) {
      router.push(`/quiz/${quiz.id}`);
    } else {
      Alert.alert('No Quiz', 'This lesson does not have a quiz.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar
          title="Loading..."
          showBackButton
          onBackPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title={lesson?.title || 'Lesson'}
        showBackButton
        onBackPress={() => router.back()}
      />
      
      <ScrollView style={styles.content}>
        {lesson && (
          <>
            <View style={styles.header}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
              
              <View style={styles.metaInfo}>
                <Text style={styles.duration}>
                  ⏱️ {lesson.estimated_duration} minutes
                </Text>
                {isCompleted && (
                  <Text style={styles.completedBadge}>✅ Completed</Text>
                )}
              </View>

              {!lesson.is_downloaded && (
                <Button
                  title={downloading ? 'Downloading...' : 'Download for Offline'}
                  onPress={handleDownloadLesson}
                  variant="tertiary"
                  loading={downloading}
                  disabled={downloading}
                  style={styles.downloadButton}
                  accessibilityLabel="Download lesson for offline access"
                />
              )}
            </View>

            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>Lesson Content</Text>
              
              <View style={styles.contentContainer}>
                {lessonContent ? (
                  <Text style={styles.contentText}>
                    {lessonContent.content}
                  </Text>
                ) : (
                  <Text style={styles.noContentText}>
                    Content not available. Please download this lesson for offline access.
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.actionsSection}>
              {!isCompleted && (
                <Button
                  title="Mark as Complete"
                  onPress={handleMarkComplete}
                  style={styles.actionButton}
                  accessibilityLabel="Mark this lesson as complete"
                />
              )}
              
              {quiz && (
                <Button
                  title="Take Quiz"
                  onPress={handleStartQuiz}
                  variant="secondary"
                  style={styles.actionButton}
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
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lessonTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lessonDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 24,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  duration: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  completedBadge: {
    ...typography.body2,
    color: colors.success,
    fontWeight: '600',
  },
  downloadButton: {
    marginTop: spacing.sm,
  },
  contentSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  contentContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  contentText: {
    ...typography.body1,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  noContentText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});