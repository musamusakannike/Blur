import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { groupService, Group } from '@/lib/database';
import { useAuth } from '@/lib/auth';
import { router } from 'expo-router';

export const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    is_private: true,
  });
  const { user } = useAuth();

  const loadGroups = async () => {
    try {
      const { data, error } = await groupService.getGroups();
      if (error) {
        console.error('Error loading groups:', error);
        return;
      }
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      Alert.alert('Error', 'Please enter a name for your group');
      return;
    }

    try {
      const { data, error } = await groupService.createGroup(newGroup);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      setNewGroup({
        name: '',
        description: '',
        is_private: true,
      });
      setShowCreateForm(false);
      loadGroups();
      Alert.alert('Success', 'Group created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create group');
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

  const renderGroup = ({ item }: { item: Group }) => (
    <Pressable 
      style={styles.groupCard}
      onPress={() => router.push(`/group/${item.id}`)}
    >
      <View style={styles.groupHeader}>
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{item.name}</Text>
          <Text style={styles.groupDescription}>{item.description}</Text>
          <Text style={styles.groupCreated}>
            Created {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        <View style={styles.groupSettings}>
          <Ionicons 
            name={item.is_private ? "lock-closed" : "globe"} 
            size={16} 
            color={colors.text.tertiary} 
          />
        </View>
      </View>

      <View style={styles.groupFooter}>
        <View style={styles.groupType}>
          <Text style={styles.groupTypeText}>
            {item.is_private ? 'Private' : 'Public'}
          </Text>
        </View>
        
        <Ionicons 
          name="chevron-forward" 
          size={16} 
          color={colors.text.tertiary} 
        />
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Groups</Text>
        <Pressable
          style={styles.createButton}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Ionicons name="add" size={20} color="#ffffff" />
        </Pressable>
      </View>

      {showCreateForm && (
        <View style={styles.createForm}>
          <Text style={styles.formTitle}>Create New Group</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor={colors.text.muted}
            value={newGroup.name}
            onChangeText={(text) => setNewGroup({ ...newGroup, name: text })}
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.text.muted}
            value={newGroup.description}
            onChangeText={(text) => setNewGroup({ ...newGroup, description: text })}
            multiline
            numberOfLines={3}
          />

          <View style={styles.checkboxContainer}>
            <Pressable
              style={styles.checkbox}
              onPress={() => setNewGroup({ ...newGroup, is_private: !newGroup.is_private })}
            >
              <Ionicons
                name={newGroup.is_private ? "checkbox" : "square-outline"}
                size={20}
                color={colors.primary[500]}
              />
              <Text style={styles.checkboxText}>Private group</Text>
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
              style={styles.createGroupButton}
              onPress={handleCreateGroup}
            >
              <Text style={styles.createGroupButtonText}>Create Group</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadGroups();
            }}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.text.muted} />
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyText}>
              Create your first group to start anonymous conversations
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
  createGroupButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
  },
  listContent: {
    padding: 16,
  },
  groupCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 4,
  },
  groupCreated: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  groupSettings: {
    marginLeft: 12,
  },
  groupFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  groupType: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  groupTypeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.secondary,
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
