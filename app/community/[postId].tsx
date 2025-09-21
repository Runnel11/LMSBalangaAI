import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/ui/Button';
import { TopAppBar } from '@/src/components/ui/TopAppBar';
import { borderRadius, colors, spacing, typography } from '@/src/config/theme';

interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  parentId?: number;
}

interface CommunityPost {
  id: number;
  author: string;
  title: string;
  content: string;
  timestamp: string;
  replies: number;
  likes: number;
  isLiked: boolean;
  category: string;
}

export default function CommunityPostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  // Mock post data - in real app, fetch by postId
  const [post, setPost] = useState<CommunityPost>({
    id: parseInt(postId || '1'),
    author: 'Maria Santos',
    title: 'Tips for implementing AI chatbots in customer service',
    content: 'I just completed the AI Customer Service Specialist course and wanted to share some practical tips I learned during my implementation project.\n\n1. Start with clear conversation flows - Map out the most common customer queries and create structured responses.\n\n2. Train your bot with real customer data - The more relevant training data you have, the better your bot will perform.\n\n3. Always provide an escalation path - Customers should always be able to reach a human agent when needed.\n\n4. Test extensively - Run multiple scenarios and edge cases before going live.\n\n5. Monitor and iterate - Continuously analyze conversation logs and improve responses.\n\nHas anyone else implemented chatbots in their organization? Would love to hear about your experiences!',
    timestamp: '2 hours ago',
    replies: 8,
    likes: 15,
    isLiked: false,
    category: 'Customer Service'
  });

  // Mock comments data
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: 'John Dela Cruz',
      content: 'Great tips! We implemented a chatbot last year and point #3 about escalation paths was crucial. Customers get frustrated when they can\'t reach a human.',
      timestamp: '1 hour ago',
      likes: 5,
      isLiked: false,
      replies: [
        {
          id: 2,
          author: 'Maria Santos',
          content: 'Exactly! We learned that the hard way. Always have a clear "speak to agent" option.',
          timestamp: '45 minutes ago',
          likes: 2,
          isLiked: true,
          replies: [],
          parentId: 1
        }
      ]
    },
    {
      id: 3,
      author: 'Anna Reyes',
      content: 'How do you handle multiple languages? We\'re looking to expand our chatbot to support Tagalog and Cebuano.',
      timestamp: '30 minutes ago',
      likes: 3,
      isLiked: false,
      replies: []
    },
    {
      id: 4,
      author: 'Carlos Mendoza',
      content: 'The monitoring part is so important. We use analytics to track where conversations break down and continuously improve.',
      timestamp: '15 minutes ago',
      likes: 7,
      isLiked: true,
      replies: []
    }
  ]);

  const handleLikePost = () => {
    setPost(prev => ({
      ...prev,
      likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1,
      isLiked: !prev.isLiked
    }));
  };

  const handleLikeComment = (commentId: number, isReply = false, parentId?: number) => {
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked
        };
      }

      if (comment.replies.some(reply => reply.id === commentId)) {
        return {
          ...comment,
          replies: comment.replies.map(reply =>
            reply.id === commentId
              ? {
                  ...reply,
                  likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  isLiked: !reply.isLiked,
                }
              : reply
          ),
        };
      }

      return comment;
    }));
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now(),
        author: 'You',
        content: newComment.trim(),
        timestamp: 'Just now',
        likes: 0,
        isLiked: false,
        replies: []
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');

      // Update post reply count
      setPost(prev => ({ ...prev, replies: prev.replies + 1 }));
    }
  };

  const handleAddReply = (parentCommentId: number) => {
    if (replyText.trim()) {
      const newReply: Comment = {
        id: Date.now(),
        author: 'You',
        content: replyText.trim(),
        timestamp: 'Just now',
        likes: 0,
        isLiked: false,
        replies: [],
        parentId: parentCommentId
      };

      setComments(prev => prev.map(comment =>
        comment.id === parentCommentId
          ? { ...comment, replies: [...comment.replies, newReply] }
          : comment
      ));

      setReplyText('');
      setReplyTo(null);

      // Update post reply count
      setPost(prev => ({ ...prev, replies: prev.replies + 1 }));
    }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.id} style={[styles.commentCard, isReply && styles.replyCard]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>{comment.author}</Text>
        <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLikeComment(comment.id, isReply, comment.parentId)}
        >
          <Text style={[styles.actionText, comment.isLiked && styles.likedText]}>
            {comment.isLiked ? '👍' : '👍'} {comment.likes}
          </Text>
        </TouchableOpacity>

        {!isReply && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
          >
            <Text style={styles.actionText}>💬 Reply</Text>
          </TouchableOpacity>
        )}
      </View>

      {replyTo === comment.id && (
        <View style={styles.replyInput}>
          <TextInput
            style={styles.textInput}
            placeholder="Write a reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <View style={styles.replyInputActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setReplyTo(null);
                setReplyText('');
              }}
              variant="tertiary"
              size="small"
            />
            <Button
              title="Reply"
              onPress={() => handleAddReply(comment.id)}
              variant="primary"
              size="small"
            />
          </View>
        </View>
      )}

      {comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map(reply => renderComment(reply, true))}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
      <TopAppBar
        title="Post Details"
        showBackButton
        onBackPress={() => router.back()}
        backgroundColor={colors.surface}
      />

      <ScrollView style={styles.content}>
        {/* Post Content */}
        <View style={styles.postContainer}>
          <View style={styles.postHeader}>
            <Text style={styles.postAuthor}>{post.author}</Text>
            <Text style={styles.postTimestamp}>{post.timestamp}</Text>
          </View>

          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postContent}>{post.content}</Text>

          <View style={styles.postMeta}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{post.category}</Text>
            </View>

            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleLikePost}
              >
                <Text style={[styles.actionText, post.isLiked && styles.likedText]}>
                  {post.isLiked ? '👍' : '👍'} {post.likes}
                </Text>
              </TouchableOpacity>
              <Text style={styles.actionText}>💬 {post.replies}</Text>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>

          {/* Add Comment Input */}
          <View style={styles.addCommentContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Button
              title="Comment"
              onPress={handleAddComment}
              variant="primary"
              size="small"
              style={styles.commentButton}
            />
          </View>

          {/* Comments List */}
          <View style={styles.commentsContainer}>
            {comments.map(comment => renderComment(comment))}
          </View>
        </View>
      </ScrollView>
      </SafeAreaView>
    </>
  );
}

type Styles = {
  container: ViewStyle;
  content: ViewStyle;
  postContainer: ViewStyle;
  postHeader: ViewStyle;
  postAuthor: TextStyle;
  postTimestamp: TextStyle;
  postTitle: TextStyle;
  postContent: TextStyle;
  postMeta: ViewStyle;
  categoryTag: ViewStyle;
  categoryText: TextStyle;
  postActions: ViewStyle;
  actionButton: ViewStyle;
  actionText: TextStyle;
  likedText: TextStyle;
  commentsSection: ViewStyle;
  sectionTitle: TextStyle;
  addCommentContainer: ViewStyle;
  textInput: TextStyle;
  commentButton: ViewStyle;
  commentsContainer: ViewStyle;
  commentCard: ViewStyle;
  replyCard: ViewStyle;
  commentHeader: ViewStyle;
  commentAuthor: TextStyle;
  commentTimestamp: TextStyle;
  commentContent: TextStyle;
  commentActions: ViewStyle;
  replyInput: ViewStyle;
  replyInputActions: ViewStyle;
  repliesContainer: ViewStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  postContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAuthor: {
    ...(typography.body2 as TextStyle),
    color: colors.primary,
    fontWeight: '600',
  },
  postTimestamp: {
    ...(typography.caption as TextStyle),
    color: colors.textSecondary,
  },
  postTitle: {
    ...(typography.h3 as TextStyle),
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  postContent: {
    ...(typography.body1 as TextStyle),
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  categoryText: {
    ...(typography.caption as TextStyle),
    color: colors.textSecondary,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    ...(typography.caption as TextStyle),
    color: colors.textSecondary,
  },
  likedText: {
    color: colors.primary,
    fontWeight: '600',
  },
  commentsSection: {
    padding: spacing.lg,
  },
  sectionTitle: {
    ...(typography.h3 as TextStyle),
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  addCommentContainer: {
    marginBottom: spacing.lg,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...(typography.body2 as TextStyle),
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  commentButton: {
    alignSelf: 'flex-end',
  },
  commentsContainer: {
    gap: spacing.md,
  },
  commentCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replyCard: {
    marginLeft: spacing.lg,
    backgroundColor: colors.background,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  commentAuthor: {
    ...(typography.body2 as TextStyle),
    color: colors.primary,
    fontWeight: '600',
  },
  commentTimestamp: {
    ...(typography.caption as TextStyle),
    color: colors.textSecondary,
  },
  commentContent: {
    ...(typography.body2 as TextStyle),
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  commentActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  replyInput: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
  },
  replyInputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  repliesContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});