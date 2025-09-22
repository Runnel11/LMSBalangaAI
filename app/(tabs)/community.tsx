import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { colors, typography, spacing, borderRadius, shadows } from '@/src/config/theme';

interface CommunityPost {
  id: number;
  author: string;
  title: string;
  content: string;
  timestamp: string;
  replies: number;
  likes: number;
  category: string;
}

export default function CommunityScreen() {
  const [activeTab, setActiveTab] = useState<'discussions' | 'events' | 'resources'>('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  // Mock data - in a real app, this would come from an API
  const mockPosts: CommunityPost[] = [
    {
      id: 1,
      author: 'Maria Santos',
      title: 'Tips for implementing AI chatbots in customer service',
      content: 'I just completed the AI Customer Service Specialist course and wanted to share some practical tips...',
      timestamp: '2 hours ago',
      replies: 8,
      likes: 15,
      category: 'Customer Service'
    },
    {
      id: 2,
      author: 'John Dela Cruz',
      title: 'AI Fundamentals certification - Study group?',
      content: 'Anyone interested in forming a study group for the AI Fundamentals certification exam?',
      timestamp: '5 hours ago',
      replies: 12,
      likes: 23,
      category: 'Study Groups'
    },
    {
      id: 3,
      author: 'Anna Reyes',
      title: 'Success story: Got hired as AI Operations Analyst!',
      content: 'Thanks to BalangaAI Academy, I just landed my dream job! Here\'s my journey...',
      timestamp: '1 day ago',
      replies: 25,
      likes: 89,
      category: 'Success Stories'
    }
  ];

  const mockEvents = [
    {
      id: 1,
      title: 'AI in Healthcare Webinar',
      date: 'March 15, 2024',
      time: '2:00 PM - 4:00 PM',
      description: 'Learn about AI applications in healthcare industry'
    },
    {
      id: 2,
      title: 'Virtual Networking Event',
      date: 'March 20, 2024',
      time: '6:00 PM - 8:00 PM',
      description: 'Connect with fellow AI professionals and students'
    }
  ];

  const mockResources = [
    {
      id: 1,
      title: 'AI Industry Report 2024',
      type: 'PDF',
      description: 'Comprehensive overview of AI trends and opportunities'
    },
    {
      id: 2,
      title: 'Python for AI Beginners',
      type: 'Video Series',
      description: 'Learn Python programming fundamentals for AI development'
    },
    {
      id: 3,
      title: 'AI Ethics Guidelines',
      type: 'Document',
      description: 'Best practices for ethical AI implementation'
    }
  ];

  const handleCreatePost = () => {
    Alert.alert(
      'Create Post',
      'This feature is coming soon! You\'ll be able to create and share posts with the community.',
      [{ text: 'OK' }]
    );
  };

  const handleJoinEvent = (eventTitle: string) => {
    Alert.alert(
      'Join Event',
      `Would you like to register for "${eventTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Register', 
          onPress: () => Alert.alert('Registered', 'You have been registered for the event!')
        }
      ]
    );
  };

  const handleDownloadResource = (resourceTitle: string) => {
    Alert.alert(
      'Download Resource',
      `"${resourceTitle}" will be available for download soon.`,
      [{ text: 'OK' }]
    );
  };

  const renderDiscussions = () => (
    <View style={styles.tabContent}>
      <View style={styles.searchSection}>
        <Input
          placeholder="Search discussions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
        <Button
          title="New Post"
          onPress={handleCreatePost}
          variant="secondary"
          size="small"
          style={styles.newPostButton}
        />
      </View>

      <View style={styles.postsContainer}>
        {mockPosts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.postCard}
            onPress={() => router.push(`/community/${post.id}`)}
            accessibilityLabel={`Post by ${post.author}: ${post.title}`}
            accessibilityRole="button"
          >
            <View style={styles.postHeader}>
              <Text style={styles.postAuthor}>{post.author}</Text>
              <Text style={styles.postTimestamp}>{post.timestamp}</Text>
            </View>
            
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent} numberOfLines={2}>
              {post.content}
            </Text>
            
            <View style={styles.postMeta}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{post.category}</Text>
              </View>
              
              <View style={styles.postStats}>
                <Text style={styles.statText}>👍 {post.likes}</Text>
                <Text style={styles.statText}>💬 {post.replies}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEvents = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>
      
      {mockEvents.map((event) => (
        <View key={event.id} style={styles.eventCard}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventDate}>{event.date} • {event.time}</Text>
          <Text style={styles.eventDescription}>{event.description}</Text>
          
          <Button
            title="Register"
            onPress={() => handleJoinEvent(event.title)}
            variant="tertiary"
            size="small"
            style={styles.eventButton}
          />
        </View>
      ))}
    </View>
  );

  const renderResources = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Learning Resources</Text>
      
      {mockResources.map((resource) => (
        <View key={resource.id} style={styles.resourceCard}>
          <View style={styles.resourceHeader}>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
            <Text style={styles.resourceType}>{resource.type}</Text>
          </View>
          
          <Text style={styles.resourceDescription}>{resource.description}</Text>
          
          <Button
            title="Download"
            onPress={() => handleDownloadResource(resource.title)}
            variant="tertiary"
            size="small"
            style={styles.resourceButton}
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar title="Community Hub" showLogo={true} />
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discussions' && styles.activeTab]}
          onPress={() => setActiveTab('discussions')}
          accessibilityLabel="Discussions tab"
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.activeTabText]}>
            Discussions
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
          accessibilityLabel="Events tab"
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
            Events
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
          onPress={() => setActiveTab('resources')}
          accessibilityLabel="Resources tab"
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
            Resources
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'discussions' && renderDiscussions()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'resources' && renderResources()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body1,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    marginVertical: 0,
  },
  newPostButton: {
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  postsContainer: {
    gap: spacing.md,
  },
  postCard: {
    backgroundColor: colors.surface, // White background like CourseCard
    borderRadius: borderRadius.lg, // Larger border radius like CourseCard
    padding: spacing.lg,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.md,
    ...shadows.card, // Card shadow like CourseCard
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAuthor: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '600',
  },
  postTimestamp: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  postTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  postContent: {
    ...typography.body2,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  postStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  eventTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  eventDate: {
    ...typography.body2,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  eventDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  eventButton: {
    alignSelf: 'flex-start',
  },
  resourceCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.small,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  resourceTitle: {
    ...typography.body1,
    color: colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: spacing.sm,
  },
  resourceType: {
    ...typography.caption,
    color: colors.info,
    fontWeight: '500',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  resourceDescription: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  resourceButton: {
    alignSelf: 'flex-start',
  },
});