import { colors } from "@/lib/colors";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface Post {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  likes: number;
  comments: number;
  tags: string[];
  liked?: boolean;
}

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    author: "Anonymous",
    timestamp: "2h",
    content:
      "I'm so nervous about my upcoming presentation. I've been practicing for weeks, but I still feel like I'm going to mess it up. Any tips for staying calm and confident?",
    likes: 12,
    comments: 5,
    tags: ["#confession"],
  },
  {
    id: "2",
    author: "Anonymous",
    timestamp: "1d",
    content:
      "I have a secret crush on my best friend's sibling. It's been going on for months, and I don't know what to do. I'm afraid of ruining our friendship if I say anything.",
    likes: 25,
    comments: 10,
    tags: ["#secret"],
  },
  {
    id: "3",
    author: "Anonymous",
    timestamp: "3d",
    content:
      "I accidentally sent a text meant for my partner to my boss. It was a silly meme, but I'm mortified. How do I recover from this?",
    likes: 8,
    comments: 3,
    tags: ["#oops"],
  },
  {
    id: "4",
    author: "Anonymous",
    timestamp: "2h",
    content:
      "I'm so nervous about my upcoming presentation. I've been practicing for weeks, but I still feel like I'm going to mess it up. Any tips for staying calm and confident?",
    likes: 12,
    comments: 5,
    tags: ["#confession"],
  },
  {
    id: "5",
    author: "Anonymous",
    timestamp: "1d",
    content:
      "I have a secret crush on my best friend's sibling. It's been going on for months, and I don't know what to do. I'm afraid of ruining our friendship if I say anything.",
    likes: 25,
    comments: 10,
    tags: ["#secret"],
  },
  {
    id: "6",
    author: "Anonymous",
    timestamp: "3d",
    content:
      "I accidentally sent a text meant for my partner to my boss. It was a silly meme, but I'm mortified. How do I recover from this?",
    likes: 8,
    comments: 3,
    tags: ["#oops"],
  },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PostCardProps {
  post: Post;
  onLike: (id: string) => void;
}

function PostCard({ post, onLike }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked || false);
  const scale = useSharedValue(1);

  const handleLike = () => {
    scale.value = withSpring(1.1, { damping: 10 }, () => {
      scale.value = withSpring(1, { damping: 10 });
    });
    setLiked(!liked);
    onLike(post.id);
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.timestamp}>{post.timestamp}</Text>
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
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
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
            {post.likes + (liked ? 1 : 0)}
          </Text>
        </AnimatedPressable>

        <Pressable style={styles.interactionItem}>
          <MaterialCommunityIcons
            name="message-outline"
            size={18}
            color={colors.text.secondary}
          />
          <Text style={styles.interactionCount}>{post.comments}</Text>
        </Pressable>

        <Pressable style={styles.interactionItem}>
          <Ionicons
            name="share-social-outline"
            size={18}
            color={colors.text.secondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function Posts() {
  const [posts, setPosts] = useState(MOCK_POSTS);

  const handleLike = (id: string) => {
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, liked: !post.liked } : post
      )
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item }) => (
          <PostCard post={item} onLike={handleLike} />
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          <Text style={{}}>End of posts</Text>
        }
        ListFooterComponentStyle={{paddingBottom: 50}}
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
    color: colors.text.primary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  postContent: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text.secondary,
    marginBottom: 12,
    fontWeight: "400",
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
  },
});