import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { postService } from '@/lib/database';
import { useAuth } from '@/lib/auth';

const POST_TYPES = [
  { key: 'confession', label: 'Confession', icon: 'heart-outline', color: colors.accent.pink },
  { key: 'secret', label: 'Secret', icon: 'lock-closed-outline', color: colors.accent.rose },
  { key: 'oops', label: 'Oops', icon: 'alert-circle-outline', color: colors.accent.orange },
  { key: 'general', label: 'General', icon: 'chatbubble-outline', color: colors.primary[500] },
  { key: 'question', label: 'Question', icon: 'help-circle-outline', color: colors.accent.amber },
  { key: 'vent', label: 'Vent', icon: 'thunderstorm-outline', color: colors.accent.green },
];

const POPULAR_TAGS = [
  '#anxiety', '#relationships', '#work', '#family', '#friends', '#school',
  '#health', '#money', '#future', '#past', '#dreams', '#fears'
];

export default function CreatePost() {
  const [content, setContent] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags([...selectedTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something before posting');
      return;
    }

    if (content.length < 10) {
      Alert.alert('Error', 'Your post must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await postService.createPost({
        content: content.trim(),
        post_type: selectedType as any,
        tags: selectedTags,
        is_anonymous: isAnonymous,
        author_name: isAnonymous ? undefined : user?.user_metadata?.username || 'Anonymous',
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Reset form
      setContent('');
      setSelectedTags([]);
      setCustomTag('');
      Alert.alert('Success', 'Your post has been published!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <Pressable
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? 'Publishing...' : 'Publish'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.contentContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind? Share it anonymously..."
              placeholderTextColor={colors.text.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              maxLength={1000}
            />
            
            <Text style={styles.characterCount}>
              {content.length}/1000
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post Type</Text>
            <View style={styles.typeGrid}>
              {POST_TYPES.map((type) => (
                <Pressable
                  key={type.key}
                  style={[
                    styles.typeButton,
                    selectedType === type.key && styles.typeButtonSelected,
                    { borderColor: type.color }
                  ]}
                  onPress={() => setSelectedType(type.key)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={selectedType === type.key ? '#ffffff' : type.color}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.key && styles.typeButtonTextSelected,
                      { color: selectedType === type.key ? '#ffffff' : type.color }
                    ]}
                  >
                    {type.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {POPULAR_TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagButton,
                    selectedTags.includes(tag) && styles.tagButtonSelected
                  ]}
                  onPress={() => handleTagToggle(tag)}
                >
                  <Text
                    style={[
                      styles.tagButtonText,
                      selectedTags.includes(tag) && styles.tagButtonTextSelected
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.customTagContainer}>
              <TextInput
                style={styles.customTagInput}
                placeholder="Add custom tag"
                placeholderTextColor={colors.text.muted}
                value={customTag}
                onChangeText={setCustomTag}
                onSubmitEditing={handleAddCustomTag}
              />
              <Pressable
                style={styles.addTagButton}
                onPress={handleAddCustomTag}
              >
                <Ionicons name="add" size={16} color={colors.primary[500]} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy</Text>
            <Pressable
              style={styles.privacyOption}
              onPress={() => setIsAnonymous(!isAnonymous)}
            >
              <Ionicons
                name={isAnonymous ? "checkbox" : "square-outline"}
                size={20}
                color={colors.primary[500]}
              />
              <View style={styles.privacyInfo}>
                <Text style={styles.privacyTitle}>Post anonymously</Text>
                <Text style={styles.privacyDescription}>
                  Your identity will be hidden from other users
                </Text>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'OpenSans_700Bold',
    color: colors.text.primary,
  },
  submitButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: colors.text.muted,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
  contentContainer: {
    margin: 16,
  },
  contentInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'OpenSans_400Regular',
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary[500],
  },
  typeButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tagButtonSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  tagButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
  tagButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customTagInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text.primary,
    fontFamily: 'OpenSans_400Regular',
    marginRight: 8,
  },
  addTagButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    padding: 8,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 2,
  },
  privacyDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
});
