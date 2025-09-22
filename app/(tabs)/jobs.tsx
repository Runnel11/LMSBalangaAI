import React, { useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { borderRadius, colors, shadows, spacing, typography } from '@/src/config/theme';
import { getAllLevels, getCompletedLessonsCount, getJobsByLevel } from '@/src/db/index';

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
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobsData = async () => {
    try {
      const completedCount = await getCompletedLessonsCount();
  const lvls = await getAllLevels();
      
      // Determine user level based on completed lessons
      // Assuming 2 lessons per level for this example
      const lessonsPerLevel = 2;
  const currentUserLevel = Math.max(1, Math.min(Math.floor(completedCount / lessonsPerLevel) + 1, Math.max(4, lvls?.length || 4)));

  const jobsData = await getJobsByLevel(currentUserLevel);

      setCompletedLessonsCount(completedCount);
      setUserLevel(currentUserLevel);
      setJobs(jobsData);
  setLevels(lvls || []);
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

  const levelNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (levels || []).forEach((lvl, idx) => {
      const order = Number(lvl.order_index) || (idx + 1);
      const title = typeof lvl.title === 'string' ? lvl.title : `Level ${order}`;
      map.set(order, title);
    });
    return map;
  }, [levels]);

  const getLevelName = (level: number) => {
    return levelNameMap.get(Number(level)) || `Level ${level}`;
  };

  const canApplyForJob = (requiredLevel: number) => {
    return userLevel >= requiredLevel;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container as ViewStyle} edges={['bottom']}>
        <TopAppBar title="Job Board" showLogo={true} />
        <View style={styles.loadingContainer as ViewStyle}>
          <Text style={styles.loadingText as TextStyle}>Loading jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container as ViewStyle} edges={['bottom']}>
      <TopAppBar title="Job Board" showLogo={true} />
      
      <ScrollView
        style={styles.content as ViewStyle}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header as ViewStyle}>
          <Text style={styles.headerTitle as TextStyle}>Available Opportunities</Text>
          <Text style={styles.headerSubtitle as TextStyle}>
            Your current level: {getLevelName(userLevel)} (Level {userLevel})
          </Text>
          <Text style={styles.progressText as TextStyle}>
            {completedLessonsCount} lessons completed
          </Text>
        </View>

        <View style={styles.jobsSection as ViewStyle}>
          {jobs.length === 0 ? (
            <View style={styles.emptyState as ViewStyle}>
              <Text style={styles.emptyTitle as TextStyle}>No Jobs Available</Text>
              <Text style={styles.emptyText as TextStyle}>
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
    <View style={styles.jobCard as ViewStyle}>
      <View style={styles.jobHeader as ViewStyle}>
        <Text style={styles.jobTitle as TextStyle}>{job.title}</Text>
        <Text style={styles.company as TextStyle}>{job.company}</Text>
      </View>

      <Text style={styles.jobDescription as TextStyle} numberOfLines={3}>
        {job.description}
      </Text>

      <View style={styles.jobDetails as ViewStyle}>
        <View style={styles.detailRow as ViewStyle}>
          <Text style={styles.detailLabel as TextStyle}>Location:</Text>
          <Text style={styles.detailValue as TextStyle}>{job.location}</Text>
        </View>
        
        <View style={styles.detailRow as ViewStyle}>
          <Text style={styles.detailLabel as TextStyle}>Salary:</Text>
          <Text style={styles.detailValue as TextStyle}>{job.salary_range}</Text>
        </View>
        
        <View style={styles.detailRow as ViewStyle}>
          <Text style={styles.detailLabel as TextStyle}>Required Level:</Text>
          <Text style={styles.detailValue as TextStyle}>
            {getLevelName(job.required_level)} (Level {job.required_level})
          </Text>
        </View>
      </View>

      <View style={styles.requirementsSection as ViewStyle}>
        <Text style={styles.requirementsTitle as TextStyle}>Requirements:</Text>
        <Text style={styles.requirementsText as TextStyle}>{job.requirements}</Text>
      </View>

      <View style={styles.jobActions as ViewStyle}>
        <Button
          title={canApply ? 'Apply Now' : 'Level Required'}
          onPress={onApply}
          disabled={!canApply}
          variant={canApply ? 'primary' : 'tertiary'}
          style={styles.applyButton as ViewStyle}
          accessibilityLabel={canApply ? `Apply for ${job.title}` : `Level ${job.required_level} required to apply`}
        />
      </View>
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  header: ViewStyle;
  headerTitle: TextStyle;
  headerSubtitle: TextStyle;
  progressText: TextStyle;
  jobsSection: ViewStyle;
  emptyState: ViewStyle;
  emptyTitle: TextStyle;
  emptyText: TextStyle;
  jobCard: ViewStyle;
  jobHeader: ViewStyle;
  jobTitle: TextStyle;
  company: TextStyle;
  jobDescription: TextStyle;
  jobDetails: ViewStyle;
  detailRow: ViewStyle;
  detailLabel: TextStyle;
  detailValue: TextStyle;
  requirementsSection: ViewStyle;
  requirementsTitle: TextStyle;
  requirementsText: TextStyle;
  jobActions: ViewStyle;
  applyButton: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
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
    ...(typography.body1 as TextStyle),
    color: colors.textSecondary,
  },
  header: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...(typography.h2 as TextStyle),
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  headerSubtitle: {
    ...(typography.body1 as TextStyle),
    color: colors.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  progressText: {
    ...(typography.body2 as TextStyle),
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
    ...(typography.h3 as TextStyle),
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    ...(typography.body1 as TextStyle),
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
    ...(typography.h3 as TextStyle),
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  company: {
    ...(typography.body1 as TextStyle),
    color: colors.primary,
    fontWeight: '600',
  },
  jobDescription: {
    ...(typography.body1 as TextStyle),
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
    ...(typography.body2 as TextStyle),
    color: colors.textSecondary,
    fontWeight: '600',
    minWidth: 80,
  },
  detailValue: {
    ...(typography.body2 as TextStyle),
    color: colors.textPrimary,
    flex: 1,
  },
  requirementsSection: {
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    ...(typography.body1 as TextStyle),
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  requirementsText: {
    ...(typography.body2 as TextStyle),
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