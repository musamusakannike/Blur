import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/colors';
import { useAuth } from '@/lib/auth';
import { profileService, Profile as ProfileType } from '@/lib/database';
import { router } from 'expo-router';

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    display_name: '',
    bio: '',
  });

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await profileService.getProfile(user.id);
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      setProfile(data);
      if (data) {
        setEditData({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    try {
      const { error } = await updateProfile(editData);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      setEditing(false);
      loadProfile();
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            }
            router.replace("/auth/login")
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => setEditing(!editing)}
          >
            <Ionicons
              name={editing ? "close" : "create-outline"}
              size={20}
              color={colors.primary[500]}
            />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={colors.text.tertiary} />
            </View>
          </View>

          {editing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  value={editData.username}
                  onChangeText={(text) => setEditData({ ...editData, username: text })}
                  placeholder="Enter username"
                  placeholderTextColor={colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name</Text>
                <TextInput
                  style={styles.input}
                  value={editData.display_name}
                  onChangeText={(text) => setEditData({ ...editData, display_name: text })}
                  placeholder="Enter display name"
                  placeholderTextColor={colors.text.muted}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={editData.bio}
                  onChangeText={(text) => setEditData({ ...editData, bio: text })}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.text.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.editActions}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                
                <Pressable
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.profileInfo}>
              <Text style={styles.username}>
                @{profile?.username || 'username'}
              </Text>
              <Text style={styles.displayName}>
                {profile?.display_name || 'Display Name'}
              </Text>
              <Text style={styles.bio}>
                {profile?.bio || 'No bio yet'}
              </Text>
              <Text style={styles.memberSince}>
                Member since {new Date(profile?.created_at || '').toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Pressable style={styles.menuItem}>
            <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>{user?.email}</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Help Center</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="mail-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.secondary} />
            <Text style={styles.menuItemText}>About</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </Pressable>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.status.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </ScrollView>
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
  editButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: colors.background.secondary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editForm: {
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 8,
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
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
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
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'OpenSans_600SemiBold',
  },
  profileInfo: {
    alignItems: 'center',
  },
  username: {
    fontSize: 16,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'OpenSans_700Bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'OpenSans_400Regular',
    textAlign: 'center',
    marginBottom: 12,
  },
  memberSince: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontFamily: 'OpenSans_400Regular',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'OpenSans_400Regular',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.status.error,
  },
  signOutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'OpenSans_600SemiBold',
    color: colors.status.error,
  },
});