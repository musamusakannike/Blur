import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { postService, commentService, Post, Comment } from '@/lib/database';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [sending, setSending] = useState(false);
  const [liked, setLiked] = useState(false);

  const loadPost = async () => {
    try {
      const { data, error } = await postService.getPost(id as string);
      if (error) {
        Alert.alert('Error', 'Post not found');
        router.back();
        return;
      }
      setPost(data);
      
      // Check if post is liked
      const { data: isLiked } = await postService.isPostLiked(data.id);
      setLiked(isLiked);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post');
    }
  };

  const loadComments = async () => {
    try {
      const { data, error } = await commentService.getComments(id as string);
      if (error) {
        console.error('Error loading comments:', error);
        return;
      }
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPost();
    loadComments();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;

    const scale = useSharedValue(1);
    scale.value = withSpring(1.2, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });

    try {
      if (liked) {
        await postService.unlikePost(post.id);
        setPost({ ...post, likes_count: post.likes_count - 1 });
      } else {
        await postService.likePost(post.id);
        setPost({ ...post, likes_count: post.likes_count + 1 });
      }
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !post) return;

    setSending(true);
    try {
      const { error } = await commentService.createComment({
        post_id: post.id,
        content: newComment.trim(),
        is_anonymous: isAnonymous,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setNewComment('');
      loadComments();
      // Update post comments count
      setPost({ ...post, comments_count: post.comments_count + 1 });
    } catch (error) {
      Alert.alert('Error', 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentAuthor}>
          {item.is_anonymous ? 'Anonymous' : (item.author_name || 'Anonymous')}
        </Text>
        <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentActions}>
        <Pressable style={styles.commentAction}>
          <Ionicons
            name="heart-outline"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.commentActionText}>{item.likes_count}</Text>
        </Pressable>
        <Pressable style={styles.commentAction}>
          <MaterialCommunityIcons
            name="reply"
            size={16}
            color={colors.text.secondary}
          />
          <Text style={styles.commentActionText}>Reply</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorText}>
            This post may have been deleted.
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.commentsList}
        ListHeaderComponent={
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View>
                <Text style={styles.postAuthor}>
                  {post.is_anonymous ? 'Anonymous' : (post.author_name || 'Anonymous')}
                </Text>
                <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
              </View>
            </View>

            <Text style={styles.postContent}>{post.content}</Text>

            <View style={styles.tagsContainer}>
              {post.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
              <View style={styles.tag}>
                <Text style={styles.tagText}>#{post.post_type}</Text>
              </View>
            </View>

            <View style={styles.postActions}>
              <AnimatedPressable
                onPress={handleLike}
                style={styles.postAction}
              >
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={18}
                  color={liked ? colors.accent.pink : colors.text.secondary}
                />
                <Text
                  style={[
                    styles.postActionText,
                    liked && { color: colors.accent.pink }
                  ]}
                >
                  {post.likes_count}
                </Text>
              </AnimatedPressable>

              <Pressable style={styles.postAction}>
                <MaterialCommunityIcons
                  name="message-outline"
                  size={18}
                  color={colors.text.secondary}
                />
                <Text style={styles.postActionText}>{post.comments_count}</Text>
              </Pressable>

              <Pressable style={styles.postAction}>
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={colors.text.secondary}
                />
              </Pressable>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadComments();
            }}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No comments yet</Text>
            <Text style={styles.emptyText}>
              Be the first to comment on this post
            </Text>
          </View>
        }
      />

      <View style={styles.commentInputContainer}>
        <View style={styles.privacyToggle}>
          <Pressable
            style={styles.privacyOption}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <Ionicons
              name={isAnonymous ? "checkbox" : "square-outline"}
              size={16}
              color={colors.primary[500]}
            />
            <Text style={styles.privacyText}>Comment anonymously</Text>
          </Pressable>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={colors.text.muted}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendComment}
            disabled={sending || !newComment.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={sending || !newComment.trim() ? colors.text.muted : '#ffffff'}
            />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'OpenSans_400Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    textAlign: 'center',
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
  },
  headerSpacer: {
    flex: 1,
  },
  commentsList: {
    padding: 16,
  },
  postCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'OpenSans_700Bold',
    color: colors.text.primary,
  },
  postTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
    fontFamily: 'OpenSans_400Regular',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text.secondary,
    marginBottom: 12,
    fontFamily: 'OpenSans_400Regular',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.medium,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[400],
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
  postActions: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  postActionText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
  commentCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
  },
  commentTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  commentContent: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  commentInputContainer: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: 16,
  },
  privacyToggle: {
    marginBottom: 12,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'OpenSans_400Regular',
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: colors.primary[500],
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  backButton: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
});