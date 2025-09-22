import React, { useEffect, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { borderRadius, colors, shadows, spacing, typography } from '@/src/config/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { getAllLevels, getCompletedLessonsCount, getLevelProgress } from '@/src/db/index';
import { clearAllDownloads, getDownloadedLessonsSize as getDownloadSize } from '@/src/services/downloadManager';
import { useFocusEffect } from '@react-navigation/native';
import { logger } from '@/src/utils/logger';

interface UserStats {
  completedLessons: number;
  totalLessons: number;
  currentLevel: number;
  levelProgress: any[];
  downloadedSize: string;
  downloadedCount: number;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [userStats, setUserStats] = useState<UserStats>({
    completedLessons: 0,
    totalLessons: 0,
    currentLevel: 1,
    levelProgress: [],
    downloadedSize: '0 B',
    downloadedCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const settingsRotation = React.useRef(new Animated.Value(0)).current;

  const loadUserStats = async () => {
    const timer = logger.startTimer('Load user stats');
    try {
      setLoading(true);
      logger.db.query('profile', 'Loading user statistics and progress data');

      // Always prefer local DB counts for accuracy
      const completedCount = await getCompletedLessonsCount();
      const levels = await getAllLevels();

      logger.db.query('profile', `Completed lessons: ${completedCount}, Levels available: ${levels.length}`);

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

      const lessonsPerLevel = 2;
      const currentLevel = Math.min(Math.floor(completedCount / lessonsPerLevel) + 1, levels.length || 4);

      const downloadStats = await getDownloadSize();

      setUserStats({
        completedLessons: completedCount,
        totalLessons,
        currentLevel,
        levelProgress: levelProgressData,
        downloadedSize: downloadStats.formattedSize,
        downloadedCount: downloadStats.fileCount,
      });

      timer();
      logger.db.query('profile', `Profile stats loaded: ${completedCount}/${totalLessons} lessons, Level ${currentLevel}, ${downloadStats.fileCount} downloads (${downloadStats.formattedSize})`);
    } catch (error) {
      timer();
      logger.db.error('profile_load', `Failed to load user stats: ${error.message}`);
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserStats();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      loadUserStats();
      return () => {};
    }, [])
  );

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

  const handleLogout = () => {
    console.log('Logout button pressed');
    // Use modal for consistent experience across platforms
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSettings = () => {
    Animated.timing(settingsRotation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      settingsRotation.setValue(0);
    });

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
        <TopAppBar title="Profile" showLogo={true} />
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
        showLogo={true}
        rightComponent={
          <TouchableOpacity
            onPress={handleSettings}
            style={styles.settingsButton}
            accessibilityLabel="Settings"
            accessibilityRole="button"
          >
            <Animated.Text
              style={[
                styles.settingsIcon,
                {
                  transform: [
                    {
                      rotate: settingsRotation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      })
                    }
                  ]
                }
              ]}
            >
              ⚙️
            </Animated.Text>
          </TouchableOpacity>
        }
      />
      
      <ScrollView style={styles.content}>
        {/* User Info Section */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <Text style={styles.userName}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.email || 'BalangaAI Student'
            }
          </Text>
          <Text style={styles.userLevel}>
            Current Level: {user?.levelName || getLevelName(userStats.currentLevel)}
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
              Earned: {user?.progress?.certificates || userStats.levelProgress.filter(level => level.percentage === 100).length} of 4
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
            variant="secondary"
            style={styles.actionButton}
          />

          <Button
            title="Settings"
            onPress={handleSettings}
            variant="primary"
            style={styles.actionButton}
          />

          <Button
            title="Sign Out"
            onPress={handleLogout}
            variant="danger"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.confirmButtonText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.surface,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.xl,
    margin: spacing.lg,
    minWidth: 280,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalMessage: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.background,
  },
});