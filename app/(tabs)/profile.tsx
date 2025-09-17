import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { 
  getCompletedLessonsCount, 
  getAllLevels, 
  getLevelProgress
} from '@/src/db/index';
import { getDownloadedLessonsSize as getDownloadSize, clearAllDownloads } from '@/src/services/downloadManager';
import { colors, typography, spacing, borderRadius, shadows } from '@/src/config/theme';

interface UserStats {
  completedLessons: number;
  totalLessons: number;
  currentLevel: number;
  levelProgress: any[];
  downloadedSize: string;
  downloadedCount: number;
}

export default function ProfileScreen() {
  const [userStats, setUserStats] = useState<UserStats>({
    completedLessons: 0,
    totalLessons: 0,
    currentLevel: 1,
    levelProgress: [],
    downloadedSize: '0 B',
    downloadedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      const completedCount = await getCompletedLessonsCount();
      const levels = await getAllLevels();
      
      // Calculate total lessons across all levels
      let totalLessons = 0;
      const levelProgressData = await Promise.all(
        levels.map(async (level) => {
          const progress = await getLevelProgress(level.id);
          totalLessons += progress.total;
          return {
            ...level,
            ...progress,
          };
        })
      );

      // Determine current level (assuming 2 lessons per level)
      const lessonsPerLevel = 2;
      const currentLevel = Math.min(Math.floor(completedCount / lessonsPerLevel) + 1, 4);

      // Get download statistics
      const downloadStats = await getDownloadSize();

      setUserStats({
        completedLessons: completedCount,
        totalLessons,
        currentLevel,
        levelProgress: levelProgressData,
        downloadedSize: downloadStats.formattedSize,
        downloadedCount: downloadStats.fileCount,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStats();
  }, []);

  const handleClearDownloads = () => {
    Alert.alert(
      'Clear Downloads',
      'Are you sure you want to clear all downloaded lessons? You can re-download them later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllDownloads();
              Alert.alert('Cleared', 'All downloads have been cleared.');
              await loadUserStats(); // Refresh stats
            } catch (error) {
              console.error('Error clearing downloads:', error);
              Alert.alert('Error', 'Failed to clear downloads.');
            }
          },
        },
      ]
    );
  };

  const handleExportProgress = () => {
    Alert.alert(
      'Export Progress',
      'Your progress data would be exported here. This feature is coming soon!',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    Alert.alert(
      'Settings',
      'Settings panel is coming soon! Here you\'ll be able to manage notifications, account preferences, and more.',
      [{ text: 'OK' }]
    );
  };

  const getLevelName = (level: number) => {
    const levelNames = [
      'AI Fundamentals',
      'AI Customer Service Specialist',
      'AI Operations Associate',
      'AI Implementation Professional'
    ];
    return levelNames[level - 1] || 'Unknown Level';
  };

  const getOverallProgress = () => {
    return userStats.totalLessons > 0 
      ? Math.round((userStats.completedLessons / userStats.totalLessons) * 100)
      : 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar title="Profile" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar 
        title="Profile" 
        rightComponent={
          <TouchableOpacity 
            onPress={handleSettings}
            style={styles.settingsButton}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>BalangaAI Student</Text>
          <Text style={styles.userLevel}>
            Current Level: {getLevelName(userStats.currentLevel)}
          </Text>
        </View>

        {/* Overall Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Overall Progress</Text>
          <View style={styles.progressCard}>
            <View style={styles.progressInfo}>
              <Text style={styles.progressText}>
                {userStats.completedLessons} of {userStats.totalLessons} lessons completed
              </Text>
              <Text style={styles.progressPercentage}>{getOverallProgress()}%</Text>
            </View>
            <ProgressBar 
              progress={getOverallProgress()} 
              style={styles.progressBar}
            />
          </View>
        </View>

        {/* Level Progress */}
        <View style={styles.levelsSection}>
          <Text style={styles.sectionTitle}>Progress by Level</Text>
          {userStats.levelProgress.map((level) => (
            <View key={level.id} style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelTitle}>{level.title}</Text>
                <Text style={styles.levelPercentage}>{level.percentage}%</Text>
              </View>
              <ProgressBar 
                progress={level.percentage} 
                style={styles.levelProgressBar}
                progressColor={level.percentage === 100 ? colors.success : colors.primary}
              />
              <Text style={styles.levelStats}>
                {level.completed} of {level.total} lessons completed
              </Text>
            </View>
          ))}
        </View>

        {/* Certificates Section */}
        <View style={styles.certificatesSection}>
          <Text style={styles.sectionTitle}>Certificates</Text>
          <View style={styles.certificateCard}>
            <Text style={styles.certificateTitle}>🏆 Certificates</Text>
            <Text style={styles.certificateText}>
              Complete all lessons in a level to earn your certificate!
            </Text>
            <Text style={styles.certificateCount}>
              Earned: {userStats.levelProgress.filter(level => level.percentage === 100).length} of 4
            </Text>
          </View>
        </View>

        {/* Storage & Downloads */}
        <View style={styles.storageSection}>
          <Text style={styles.sectionTitle}>Downloads & Storage</Text>
          <View style={styles.storageCard}>
            <View style={styles.storageInfo}>
              <Text style={styles.storageText}>
                Downloaded lessons: {userStats.downloadedCount}
              </Text>
              <Text style={styles.storageSize}>
                Storage used: {userStats.downloadedSize}
              </Text>
            </View>
            {userStats.downloadedCount > 0 && (
              <Button
                title="Clear Downloads"
                onPress={handleClearDownloads}
                variant="tertiary"
                size="small"
                style={styles.clearButton}
              />
            )}
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.actionsSection}>
          <Button
            title="Export Progress"
            onPress={handleExportProgress}
            variant="tertiary"
            style={styles.actionButton}
          />
          
          <Button
            title="Settings"
            onPress={handleSettings}
            variant="tertiary"
            style={styles.actionButton}
          />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 20,
  },
  userSection: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 40,
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  userLevel: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  progressSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
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
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
  },
  levelsSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  levelCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  levelTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
  },
  levelPercentage: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  levelProgressBar: {
    height: 6,
    marginBottom: spacing.sm,
  },
  levelStats: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  certificatesSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  certificateCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  certificateTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  certificateText: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  certificateCount: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  storageSection: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  storageCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
  },
  storageInfo: {
    marginBottom: spacing.md,
  },
  storageText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  storageSize: {
    ...typography.body2,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  actionsSection: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xl,
  },
  actionButton: {
    marginBottom: spacing.md,
  },
});