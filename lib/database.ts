import { supabase } from './supabase';

// Types
export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Portal {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  link_code: string;
  status: 'active' | 'expired' | 'disabled';
  expires_at?: string;
  allow_anonymous: boolean;
  allow_identified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortalMessage {
  id: string;
  portal_id: string;
  sender_id?: string;
  message_type: 'anonymous' | 'identified';
  content: string;
  sender_name?: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  author_id?: string;
  content: string;
  post_type: 'confession' | 'secret' | 'oops' | 'general' | 'question' | 'vent';
  tags: string[];
  is_anonymous: boolean;
  author_name?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string;
  author_id?: string;
  content: string;
  is_anonymous: boolean;
  author_name?: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface GroupMessage {
  id: string;
  group_id: string;
  author_id?: string;
  content: string;
  is_anonymous: boolean;
  author_name?: string;
  created_at: string;
}

// Portal functions
export const portalService = {
  async createPortal(data: {
    title: string;
    description?: string;
    expires_at?: string;
    allow_anonymous?: boolean;
    allow_identified?: boolean;
  }) {
    const linkCode = Math.random().toString(36).substring(2, 15);
    
    const { data: portal, error } = await supabase
      .from('portals')
      .insert({
        ...data,
        link_code: linkCode,
        allow_anonymous: data.allow_anonymous ?? true,
        allow_identified: data.allow_identified ?? false,
      })
      .select()
      .single();

    return { data: portal, error };
  },

  async getPortals() {
    const { data, error } = await supabase
      .from('portals')
      .select('*')
      .eq('owner_id', (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getPortalByCode(linkCode: string) {
    const { data, error } = await supabase
      .from('portals')
      .select('*')
      .eq('link_code', linkCode)
      .eq('status', 'active')
      .single();

    return { data, error };
  },

  async sendMessage(portalId: string, data: {
    content: string;
    message_type: 'anonymous' | 'identified';
    sender_name?: string;
  }) {
    const { data: message, error } = await supabase
      .from('portal_messages')
      .insert({
        portal_id: portalId,
        content: data.content,
        message_type: data.message_type,
        sender_name: data.sender_name,
        is_anonymous: data.message_type === 'anonymous',
      })
      .select()
      .single();

    return { data: message, error };
  },

  async getPortalMessages(portalId: string) {
    const { data, error } = await supabase
      .from('portal_messages')
      .select('*')
      .eq('portal_id', portalId)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async updatePortal(portalId: string, updates: Partial<Portal>) {
    const { data, error } = await supabase
      .from('portals')
      .update(updates)
      .eq('id', portalId)
      .select()
      .single();

    return { data, error };
  },

  async deletePortal(portalId: string) {
    const { error } = await supabase
      .from('portals')
      .delete()
      .eq('id', portalId);

    return { error };
  },
};

// Post functions
export const postService = {
  async createPost(data: {
    content: string;
    post_type: Post['post_type'];
    tags?: string[];
    is_anonymous?: boolean;
    author_name?: string;
  }) {
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        ...data,
        tags: data.tags || [],
        is_anonymous: data.is_anonymous ?? true,
      })
      .select()
      .single();

    return { data: post, error };
  },

  async getPosts(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async getPost(postId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    return { data, error };
  },

  async updatePost(postId: string, updates: Partial<Post>) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    return { data, error };
  },

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    return { error };
  },

  async likePost(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: postId,
      })
      .select()
      .single();

    return { data, error };
  },

  async unlikePost(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    return { error };
  },

  async isPostLiked(postId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: false, error: null };

    const { data, error } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .single();

    return { data: !!data, error };
  },
};

// Comment functions
export const commentService = {
  async createComment(data: {
    post_id: string;
    parent_id?: string;
    content: string;
    is_anonymous?: boolean;
    author_name?: string;
  }) {
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        ...data,
        is_anonymous: data.is_anonymous ?? true,
      })
      .select()
      .single();

    return { data: comment, error };
  },

  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async getCommentReplies(commentId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true });

    return { data, error };
  },

  async likeComment(commentId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        comment_id: commentId,
      })
      .select()
      .single();

    return { data, error };
  },

  async unlikeComment(commentId: string) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('comment_id', commentId);

    return { error };
  },
};

// Group functions
export const groupService = {
  async createGroup(data: {
    name: string;
    description?: string;
    is_private?: boolean;
  }) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        ...data,
        created_by: user.id,
        is_private: data.is_private ?? true,
      })
      .select()
      .single();

    if (!error && group) {
      // Add creator as admin
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        });
    }

    return { data: group, error };
  },

  async getGroups() {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { data: [], error: null };

    // RLS policy will automatically filter groups for the current user.
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async addMember(groupId: string, userId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: userId,
        role: 'member',
      })
      .select()
      .single();

    return { data, error };
  },

  async getGroupMembers(groupId: string) {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        profiles(username, display_name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });

    return { data, error };
  },

  async sendGroupMessage(groupId: string, data: {
    content: string;
    is_anonymous?: boolean;
    author_name?: string;
  }) {
    const { data: message, error } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        content: data.content,
        is_anonymous: data.is_anonymous ?? true,
        author_name: data.author_name,
      })
      .select()
      .single();

    return { data: message, error };
  },

  async getGroupMessages(groupId: string) {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    return { data, error };
  },
};

// Profile functions
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  },

  async updateProfile(updates: Partial<Profile>) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    return { data, error };
  },
};