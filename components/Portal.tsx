import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Share,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { portalService, Portal as PortalType } from '@/lib/database';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';

export const Portal = () => {
  const [portals, setPortals] = useState<PortalType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPortal, setNewPortal] = useState({
    title: '',
    description: '',
    allow_anonymous: true,
    allow_identified: false,
  });
  const { user } = useAuth();

  const loadPortals = async () => {
    try {
      const { data, error } = await portalService.getPortals();
      if (error) {
        console.error('Error loading portals:', error);
        return;
      }
      setPortals(data || []);
    } catch (error) {
      console.error('Error loading portals:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPortals();
  }, []);

  const handleCreatePortal = async () => {
    if (!newPortal.title.trim()) {
      Alert.alert('Error', 'Please enter a title for your portal');
      return;
    }

    try {
      const { data, error } = await portalService.createPortal(newPortal);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setNewPortal({
        title: '',
        description: '',
        allow_anonymous: true,
        allow_identified: false,
      });
      setShowCreateForm(false);
      loadPortals();
      Alert.alert('Success', 'Portal created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create portal');
    }
  };

  const handleSharePortal = async (portal: PortalType) => {
    const link = `https://yourapp.com/portal/${portal.link_code}`;
    try {
      await Share.share({
        message: `Check out my anonymous portal: ${link}`,
        url: link,
      });
    } catch (error) {
      console.error('Error sharing portal:', error);
    }
  };

  const handleDeletePortal = async (portalId: string) => {
    Alert.alert(
      'Delete Portal',
      'Are you sure you want to delete this portal? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await portalService.deletePortal(portalId);
              if (error) {
                Alert.alert('Error', error.message);
                return;
              }
              loadPortals();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete portal');
            }
          },
        },
      ]
    );
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

  const renderPortal = ({ item }: { item: PortalType }) => (
    <View style={styles.portalCard}>
      <View style={styles.portalHeader}>
        <View style={styles.portalInfo}>
          <Text style={styles.portalTitle}>{item.title}</Text>
          <Text style={styles.portalDescription}>{item.description}</Text>
          <Text style={styles.portalCreated}>
            Created {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        <View style={styles.portalStatus}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'active' ? colors.status.success : colors.status.error }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.portalSettings}>
        <View style={styles.settingItem}>
          <Ionicons 
            name={item.allow_anonymous ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.allow_anonymous ? colors.status.success : colors.status.error} 
          />
          <Text style={styles.settingText}>Anonymous messages</Text>
        </View>
        <View style={styles.settingItem}>
          <Ionicons 
            name={item.allow_identified ? "checkmark-circle" : "close-circle"} 
            size={16} 
            color={item.allow_identified ? colors.status.success : colors.status.error} 
          />
          <Text style={styles.settingText}>Identified messages</Text>
        </View>
      </View>

      <View style={styles.portalActions}>
        <Pressable 
          style={styles.actionButton}
          onPress={() => handleSharePortal(item)}
        >
          <Ionicons name="share-outline" size={16} color={colors.primary[500]} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
        
        <Pressable 
          style={styles.actionButton}
          onPress={() => router.push(`/portal/${item.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color={colors.primary[500]} />
          <Text style={styles.actionText}>View</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeletePortal(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color={colors.status.error} />
          <Text style={[styles.actionText, { color: colors.status.error }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading portals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Portals</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </Pressable>
      </View>

      {showCreateForm && (
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>Create New Portal</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Portal title"
            placeholderTextColor={colors.text.muted}
            value={newPortal.title}
            onChangeText={(text) => setNewPortal({ ...newPortal, title: text })}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.text.muted}
            value={newPortal.description}
            onChangeText={(text) => setNewPortal({ ...newPortal, description: text })}
            multiline
            numberOfLines={3}
          />

          <View style={styles.checkboxContainer}>
            <Pressable
              style={styles.checkbox}
              onPress={() => setNewPortal({ ...newPortal, allow_anonymous: !newPortal.allow_anonymous })}
            >
              <Ionicons
                name={newPortal.allow_anonymous ? "checkbox" : "square-outline"}
                size={20}
                color={colors.primary[500]}
              />
              <Text style={styles.checkboxText}>Allow anonymous messages</Text>
            </Pressable>

            <Pressable
              style={styles.checkbox}
              onPress={() => setNewPortal({ ...newPortal, allow_identified: !newPortal.allow_identified })}
            >
              <Ionicons
                name={newPortal.allow_identified ? "checkbox" : "square-outline"}
                size={20}
                color={colors.primary[500]}
              />
              <Text style={styles.checkboxText}>Allow identified messages</Text>
            </Pressable>
          </View>

          <View style={styles.formActions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => setShowCreateForm(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            
            <Pressable
              style={styles.createPortalButton}
              onPress={handleCreatePortal}
            >
              <Text style={styles.createPortalButtonText}>Create Portal</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={portals}
        renderItem={renderPortal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadPortals();
            }}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="link-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No portals yet</Text>
            <Text style={styles.emptyText}>
              Create your first portal to start receiving anonymous messages
            </Text>
          </View>
        }
      />
    </View>
  );
};

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
  createButton: {
    backgroundColor: colors.primary[500],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createForm: {
    backgroundColor: colors.background.secondary,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  input: {
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.medium,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
  },
  createPortalButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  createPortalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
  },
  listContent: {
    padding: 16,
  },
  portalCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  portalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  portalInfo: {
    flex: 1,
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  portalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 4,
  },
  portalCreated: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  portalStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  portalSettings: {
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
  },
  portalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.primary[500],
    fontFamily: 'OpenSans_600SemiBold',
  },
  deleteButton: {
    // Additional styles for delete button if needed
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
});
