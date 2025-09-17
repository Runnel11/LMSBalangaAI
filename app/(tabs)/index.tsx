import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { CourseCard } from '@/src/components/ui/CourseCard';
import { getAllLevels, getLevelProgress } from '@/src/db/index';
import { colors, typography, spacing } from '@/src/config/theme';

export default function HomeScreen() {
  const [levels, setLevels] = useState([]);
  const [levelsWithProgress, setLevelsWithProgress] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLevelsWithProgress = async () => {
    try {
      const levelsData = await getAllLevels();
      const levelsWithProgressData = await Promise.all(
        levelsData.map(async (level) => {
          const progress = await getLevelProgress(level.id);
          return {
            ...level,
            progress: progress.percentage,
            totalLessons: progress.total,
            completedLessons: progress.completed,
          };
        })
      );
      setLevels(levelsData);
      setLevelsWithProgress(levelsWithProgressData);
    } catch (error) {
      console.error('Error loading levels:', error);
    }
  };

  useEffect(() => {
    loadLevelsWithProgress();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLevelsWithProgress();
    setRefreshing(false);
  };

  const navigateToCourse = (levelId) => {
    router.push(`/course/${levelId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="BalangaAI Academy" />
      
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
              key={level.id}
              title={level.title}
              description={level.description}
              progress={level.progress}
              totalLessons={level.totalLessons}
              completedLessons={level.completedLessons}
              level={level.order_index}
              onPress={() => navigateToCourse(level.id)}
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
