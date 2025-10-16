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
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { portalService, Portal, PortalMessage } from '@/lib/database';
import { useLocalSearchParams, router } from 'expo-router';

export default function PortalDetail() {
  const { id } = useLocalSearchParams();
  const [portal, setPortal] = useState<Portal | null>(null);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'anonymous' | 'identified'>('anonymous');
  const [senderName, setSenderName] = useState('');
  const [sending, setSending] = useState(false);

  const loadPortal = async () => {
    try {
      const { data, error } = await portalService.getPortalByCode(id as string);
      if (error) {
        Alert.alert('Error', 'Portal not found or expired');
        router.back();
        return;
      }
      setPortal(data);
    } catch (error) {
      console.error('Error loading portal:', error);
      Alert.alert('Error', 'Failed to load portal');
    }
  };

  const loadMessages = async () => {
    if (!portal) return;
    
    try {
      const { data, error } = await portalService.getPortalMessages(portal.id);
      if (error) {
        console.error('Error loading messages:', error);
        return;
      }
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, [id]);

  useEffect(() => {
    if (portal) {
      loadMessages();
    }
  }, [portal]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !portal) return;

    if (messageType === 'identified' && !senderName.trim()) {
      Alert.alert('Error', 'Please enter your name for identified messages');
      return;
    }

    setSending(true);
    try {
      const { error } = await portalService.sendMessage(portal.id, {
        content: newMessage.trim(),
        message_type: messageType,
        sender_name: messageType === 'identified' ? senderName.trim() : undefined,
      });

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setNewMessage('');
      setSenderName('');
      loadMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSharePortal = async () => {
    if (!portal) return;
    
    const link = `https://yourapp.com/portal/${portal.link_code}`;
    try {
      await Share.share({
        message: `Check out this anonymous portal: ${portal.title}\n${link}`,
        url: link,
      });
    } catch (error) {
      console.error('Error sharing portal:', error);
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

  const renderMessage = ({ item }: { item: PortalMessage }) => (
    <View style={styles.messageCard}>
      <View style={styles.messageHeader}>
        <Text style={styles.messageAuthor}>
          {item.is_anonymous ? 'Anonymous' : (item.sender_name || 'Anonymous')}
        </Text>
        <Text style={styles.messageTime}>{formatTimeAgo(item.created_at)}</Text>
      </View>
      <Text style={styles.messageContent}>{item.content}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading portal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!portal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.status.error} />
          <Text style={styles.errorTitle}>Portal Not Found</Text>
          <Text style={styles.errorText}>
            This portal may have expired or been deleted.
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
        <View style={styles.headerInfo}>
          <Text style={styles.portalTitle}>{portal.title}</Text>
          <Text style={styles.portalDescription}>{portal.description}</Text>
        </View>
        <Pressable style={styles.shareButton} onPress={handleSharePortal}>
          <Ionicons name="share-outline" size={24} color={colors.primary[500]} />
        </Pressable>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadMessages();
            }}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyText}>
              Be the first to send a message to this portal
            </Text>
          </View>
        }
      />

      <View style={styles.messageInputContainer}>
        <View style={styles.messageTypeSelector}>
          <Pressable
            style={[
              styles.typeButton,
              messageType === 'anonymous' && styles.typeButtonSelected
            ]}
            onPress={() => setMessageType('anonymous')}
          >
            <Text
              style={[
                styles.typeButtonText,
                messageType === 'anonymous' && styles.typeButtonTextSelected
              ]}
            >
              Anonymous
            </Text>
          </Pressable>
          
          {portal.allow_identified && (
            <Pressable
              style={[
                styles.typeButton,
                messageType === 'identified' && styles.typeButtonSelected
              ]}
              onPress={() => setMessageType('identified')}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  messageType === 'identified' && styles.typeButtonTextSelected
                ]}
              >
                Identified
              </Text>
            </Pressable>
          )}
        </View>

        {messageType === 'identified' && (
          <TextInput
            style={styles.nameInput}
            placeholder="Your name"
            placeholderTextColor={colors.text.muted}
            value={senderName}
            onChangeText={setSenderName}
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            placeholderTextColor={colors.text.muted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={sending || !newMessage.trim() ? colors.text.muted : '#ffffff'}
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
  headerInfo: {
    flex: 1,
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
  },
  portalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  messageContent: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    lineHeight: 22,
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
  messageInputContainer: {
    backgroundColor: colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: 16,
  },
  messageTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: 8,
  },
  typeButtonSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.secondary,
  },
  typeButtonTextSelected: {
    color: '#ffffff',
  },
  nameInput: {
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  messageInput: {
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
});