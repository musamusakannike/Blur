# Blur - Supabase Setup Guide

This guide will walk you through setting up Supabase for the Blur anonymous social app.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. Expo CLI installed (`npm install -g @expo/cli`)

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `blur-anonymous-social`
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root:

```bash
EXPO_PUBLIC_SUPABASE_PROJECT_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Add `.env` to your `.gitignore` file to keep credentials secure

## Step 4: Database Schema Setup

Run the following SQL commands in your Supabase SQL Editor (Dashboard → SQL Editor):

### 1. Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
```

### 2. Create Custom Types

```sql
-- Create enum for post types
CREATE TYPE post_type AS ENUM ('confession', 'secret', 'oops', 'general', 'question', 'vent');

-- Create enum for message types
CREATE TYPE message_type AS ENUM ('anonymous', 'identified');

-- Create enum for portal status
CREATE TYPE portal_status AS ENUM ('active', 'expired', 'disabled');
```

### 3. Create Tables

#### Users Profile Table

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Portals Table

```sql
CREATE TABLE public.portals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  link_code TEXT UNIQUE NOT NULL,
  status portal_status DEFAULT 'active',
  expires_at TIMESTAMP WITH TIME ZONE,
  allow_anonymous BOOLEAN DEFAULT true,
  allow_identified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active portals" ON public.portals
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can view own portals" ON public.portals
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create portals" ON public.portals
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own portals" ON public.portals
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own portals" ON public.portals
  FOR DELETE USING (auth.uid() = owner_id);
```

#### Portal Messages Table

```sql
CREATE TABLE public.portal_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  portal_id UUID REFERENCES public.portals(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message_type message_type NOT NULL,
  content TEXT NOT NULL,
  sender_name TEXT, -- For identified messages
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.portal_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert portal messages" ON public.portal_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Portal owners can view messages" ON public.portal_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.portals 
      WHERE portals.id = portal_messages.portal_id 
      AND portals.owner_id = auth.uid()
    )
  );
```

#### Posts Table

```sql
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  post_type post_type DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  is_anonymous BOOLEAN DEFAULT true,
  author_name TEXT, -- For identified posts
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view posts" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = author_id);
```

#### Comments Table (with threading support)

```sql
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  author_name TEXT, -- For identified comments
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (auth.uid() = author_id);
```

#### Groups Table

```sql
CREATE TABLE public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Group members can view groups" ON public.groups
  FOR SELECT USING ( is_group_member(auth.uid(), id) );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update groups" ON public.groups
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete groups" ON public.groups
  FOR DELETE USING (auth.uid() = created_by);
```

#### Group Members Table

```sql
CREATE TABLE public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Group members can view other members in their groups" ON public.group_members
  FOR SELECT USING ( is_group_member(auth.uid(), group_id) );

CREATE POLICY "Group admins can add members" ON public.group_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

  ```
  
#### Group Messages Table

```sql
CREATE TABLE public.group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  author_name TEXT, -- For identified messages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Group members can view messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = group_messages.group_id 
      AND group_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_members.group_id = group_messages.group_id 
      AND group_members.user_id = auth.uid()
    )
  );
```

#### Likes Table

```sql
CREATE TABLE public.likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, post_id),
  UNIQUE(user_id, comment_id),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR 
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view likes" ON public.likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE USING (auth.uid() = user_id);
```

```sql
-- Function to check group membership without causing recursion
CREATE OR REPLACE FUNCTION is_group_member(user_id_to_check UUID, group_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with the privileges of the user who defined it, bypassing RLS.
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = user_id_to_check AND group_id = group_id_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Create Functions and Triggers

#### Update timestamps function

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
```

#### Apply triggers

```sql
-- Apply update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portals_updated_at BEFORE UPDATE ON public.portals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Update counters function

```sql
-- Function to update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Function to update comment replies count
CREATE OR REPLACE FUNCTION update_comment_replies_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments 
    SET replies_count = replies_count + 1 
    WHERE id = NEW.parent_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.comments 
    SET replies_count = replies_count - 1 
    WHERE id = OLD.parent_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';
```

#### Apply counter triggers

```sql
-- Apply counter triggers
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

CREATE TRIGGER update_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE TRIGGER update_comment_replies_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_comment_replies_count();
```

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following:

### Email Authentication

- Enable "Enable email confirmations" if desired
- Set "Site URL" to your app's URL (for development: `exp://192.168.1.100:8081`)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret
7. In Supabase, go to **Authentication** → **Providers**
8. Enable Google provider and add your credentials

### Phone Authentication (Optional)

- Enable if you want phone number authentication

## Step 6: Set Up Storage (Optional)

If you want to store images/files:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `avatars`
3. Set it to public
4. Create policies for public access

## Step 7: Test Your Setup

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Test authentication and database operations

## Step 8: Production Deployment

### Environment Variables for Production

```bash
EXPO_PUBLIC_SUPABASE_PROJECT_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

### Security Considerations

1. Enable RLS on all tables (already done in schema)
2. Review and test all policies
3. Set up proper CORS settings
4. Monitor usage and set up alerts
5. Regular backups

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all policies are correctly set up
2. **Authentication Issues**: Check redirect URIs and domain settings
3. **CORS Issues**: Configure allowed origins in Supabase settings
4. **Rate Limiting**: Monitor API usage in Supabase dashboard

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Expo Documentation](https://docs.expo.dev)

## Next Steps

After completing this setup:

1. Test all authentication flows
2. Verify database operations work correctly
3. Set up monitoring and alerts
4. Deploy to production
5. Set up CI/CD pipeline

---

**Note**: Keep your database credentials secure and never commit them to version control. Use environment variables for all sensitive data.
