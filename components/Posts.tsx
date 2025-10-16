import { colors } from "@/lib/colors";
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { postService, Post } from "@/lib/database";
import { router } from "expo-router";

interface PostWithLiked extends Post {
  liked?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PostCardProps {
  post: PostWithLiked;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
}

function PostCard({ post, onLike, onComment }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked || false);
  const scale = useSharedValue(1);

  const handleLike = async () => {
    scale.value = withSpring(1.1, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    
    if (liked) {
      await postService.unlikePost(post.id);
    } else {
      await postService.likePost(post.id);
    }
    
    setLiked(!liked);
    onLike(post.id);
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <Pressable style={styles.postCard} onPress={() => onComment(post.id)}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.authorName}>
            {post.is_anonymous ? 'Anonymous' : (post.author_name || 'Anonymous')}
          </Text>
          <Text style={styles.timestamp}>{formatTimeAgo(post.created_at)}</Text>
        </View>
        <Pressable hitSlop={8}>
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.text.tertiary}
          />
        </Pressable>
      </View>

      {/* Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Tags */}
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

      {/* Interactions */}
      <View style={styles.interactionsContainer}>
        <AnimatedPressable
          onPress={handleLike}
          style={[styles.interactionItem, animatedHeartStyle]}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={18}
            color={liked ? colors.accent.pink : colors.text.secondary}
          />
          <Text
            style={[
              styles.interactionCount,
              liked && { color: colors.accent.pink },
            ]}
          >
            {post.likes_count}
          </Text>
        </AnimatedPressable>

        <Pressable 
          style={styles.interactionItem}
          onPress={() => onComment(post.id)}
        >
          <MaterialCommunityIcons
            name="message-outline"
            size={18}
            color={colors.text.secondary}
          />
          <Text style={styles.interactionCount}>{post.comments_count}</Text>
        </Pressable>

        <Pressable style={styles.interactionItem}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

export function Posts() {
  const [posts, setPosts] = useState<PostWithLiked[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPosts = async () => {
    try {
      const { data, error } = await postService.getPosts();
      if (error) {
        console.error('Error loading posts:', error);
        return;
      }
      
      // Check which posts are liked by current user
      const postsWithLikes = await Promise.all(
        (data || []).map(async (post) => {
          const { data: isLiked } = await postService.isPostLiked(post.id);
          return { ...post, liked: isLiked };
        })
      );
      
      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleLike = async (id: string) => {
    setPosts(posts.map(post => 
      post.id === id 
        ? { 
            ...post, 
            liked: !post.liked,
            likes_count: post.liked ? post.likes_count - 1 : post.likes_count + 1
          } 
        : post
    ));
  };

  const handleComment = (id: string) => {
    router.push(`/post/${id}`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPosts();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onComment={handleComment}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary[500]}
          />
        }
        ListFooterComponent={
          <Text
            style={{
              color: colors.text.muted,
              marginHorizontal: "auto",
              paddingVertical: 10,
            }}
          >
            End of posts
          </Text>
        }
        ListFooterComponentStyle={{ paddingBottom: 150 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  listContent: {
    paddingTop: 0,
  },
  postCard: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "OpenSans_700Bold",
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
    fontFamily: "OpenSans_400Regular",
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 12,
    fontWeight: "400",
    fontFamily: "OpenSans_400Regular",
  },
  tagsContainer: {
    flexDirection: "row",
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
    fontWeight: "600",
    fontFamily: "OpenSans_600SemiBold",
  },
  interactionsContainer: {
    flexDirection: "row",
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  interactionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  interactionCount: {
    fontSize: 12,
    color: colors.text.secondary,
    fontWeight: "600",
    fontFamily: "OpenSans_600SemiBold",
  },
});
