import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { getJobsByLevel, getCompletedLessonsCount, getAllLevels } from '@/src/db/index';
import { colors, typography, spacing, borderRadius, shadows } from '@/src/config/theme';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  requirements: string;
  salary_range: string;
  location: string;
  required_level: number;
}

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadJobsData = async () => {
    try {
      const completedCount = await getCompletedLessonsCount();
      const levels = await getAllLevels();
      
      // Determine user level based on completed lessons
      // Assuming 2 lessons per level for this example
      const lessonsPerLevel = 2;
      const currentUserLevel = Math.min(Math.floor(completedCount / lessonsPerLevel) + 1, 4);
      
      const jobsData = await getJobsByLevel(currentUserLevel);
      
      setCompletedLessonsCount(completedCount);
      setUserLevel(currentUserLevel);
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobsData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobsData();
    setRefreshing(false);
  };

  const handleApplyJob = (job: Job) => {
    Alert.alert(
      'Apply for Job',
      `Would you like to apply for ${job.title} at ${job.company}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            // In a real app, this would open a form or external application
            Alert.alert('Application Submitted', 'Your application has been submitted successfully!');
          }
        }
      ]
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

  const canApplyForJob = (requiredLevel: number) => {
    return userLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <TopAppBar title="Job Board" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="Job Board" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Available Opportunities</Text>
          <Text style={styles.headerSubtitle}>
            Your current level: {getLevelName(userLevel)} (Level {userLevel})
          </Text>
          <Text style={styles.progressText}>
            {completedLessonsCount} lessons completed
          </Text>
        </View>

        <View style={styles.jobsSection}>
          {jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No Jobs Available</Text>
              <Text style={styles.emptyText}>
                Complete more lessons to unlock job opportunities!
              </Text>
            </View>
          ) : (
            jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                canApply={canApplyForJob(job.required_level)}
                onApply={() => handleApplyJob(job)}
                getLevelName={getLevelName}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface JobCardProps {
  job: Job;
  canApply: boolean;
  onApply: () => void;
  getLevelName: (level: number) => string;
}

const JobCard: React.FC<JobCardProps> = ({ job, canApply, onApply, getLevelName }) => {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.company}>{job.company}</Text>
      </View>

      <Text style={styles.jobDescription} numberOfLines={3}>
        {job.description}
      </Text>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{job.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Salary:</Text>
          <Text style={styles.detailValue}>{job.salary_range}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Required Level:</Text>
          <Text style={styles.detailValue}>
            {getLevelName(job.required_level)} (Level {job.required_level})
          </Text>
        </View>
      </View>

      <View style={styles.requirementsSection}>
        <Text style={styles.requirementsTitle}>Requirements:</Text>
        <Text style={styles.requirementsText}>{job.requirements}</Text>
      </View>

      <View style={styles.jobActions}>
        <Button
          title={canApply ? 'Apply Now' : 'Level Required'}
          onPress={onApply}
          disabled={!canApply}
          variant={canApply ? 'primary' : 'tertiary'}
          style={styles.applyButton}
          accessibilityLabel={canApply ? `Apply for ${job.title}` : `Level ${job.required_level} required to apply`}
        />
      </View>
    </View>
  );
};

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
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  jobsSection: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  jobCard: {
    backgroundColor: colors.surface, // White background like CourseCard
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.card, // Card shadow like CourseCard
  },
  jobHeader: {
    marginBottom: spacing.md,
  },
  jobTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  company: {
    ...typography.body1,
    color: colors.primary,
    fontWeight: '600',
  },
  jobDescription: {
    ...typography.body1,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  jobDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  detailLabel: {
    ...typography.body2,
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 80,
  },
  detailValue: {
    ...typography.body2,
    color: colors.textPrimary,
    flex: 1,
  },
  requirementsSection: {
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  requirementsText: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  jobActions: {
    alignItems: 'stretch',
  },
  applyButton: {
    marginTop: spacing.sm,
  },
});