# Blur - Anonymous Social App

A React Native social app built with Expo and Supabase that allows users to share anonymously through portals, posts, and groups.

## Features

### 🔐 Authentication
- **Email/Password Authentication** - Traditional sign-up and sign-in
- **Google OAuth** - One-click authentication with Google
- **Optional Registration** - Users can browse anonymously without creating an account

### 🌐 Portals
- **Create Anonymous Portals** - Generate shareable links for anonymous messaging
- **Customizable Settings** - Choose between anonymous, identified, or both message types
- **Expiration Control** - Set expiration dates for portals
- **Real-time Messaging** - Send and receive messages instantly

### 📱 Anonymous Feed
- **Post Types** - Confession, Secret, Oops, General, Question, Vent
- **Tag System** - Categorize posts with custom and predefined tags
- **Threaded Comments** - Nested comment system with replies
- **Like System** - Like posts and comments
- **Anonymous by Default** - All posts are anonymous unless specified otherwise

### 👥 Groups
- **Private Groups** - Create invite-only groups for specific communities
- **Anonymous Group Chat** - Send messages anonymously within groups
- **Member Management** - Add and manage group members
- **Group Settings** - Customize group privacy and settings

### 🎨 Modern UI/UX
- **Dark Theme** - Beautiful dark purple theme optimized for social media
- **Smooth Animations** - React Native Reanimated for fluid interactions
- **Responsive Design** - Works on all screen sizes
- **Intuitive Navigation** - Tab-based navigation with smooth transitions

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Navigation**: Expo Router
- **Animations**: React Native Reanimated
- **State Management**: React Context + Hooks
- **Styling**: StyleSheet with custom design system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- Supabase account
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blur
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Follow the detailed setup guide in `SUPABASE_SETUP.md`
   - Create a new Supabase project
   - Run the provided SQL schema
   - Configure authentication providers

4. **Configure environment variables**
   ```bash
   # Create .env file
   EXPO_PUBLIC_SUPABASE_PROJECT_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Project Structure

```
blur/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Main feed screen
│   │   ├── add.tsx        # Create post screen
│   │   └── profile.tsx    # User profile screen
│   ├── auth/              # Authentication screens
│   │   ├── login.tsx      # Login screen
│   │   └── register.tsx   # Registration screen
│   ├── portal/            # Portal detail screen
│   │   └── [id].tsx       # Dynamic portal route
│   ├── post/              # Post detail screen
│   │   └── [id].tsx       # Dynamic post route
│   └── group/             # Group detail screen
│       └── [id].tsx       # Dynamic group route
├── components/            # Reusable components
│   ├── Posts.tsx          # Posts feed component
│   ├── Portal.tsx         # Portal management component
│   └── Groups.tsx         # Groups management component
├── lib/                   # Utilities and services
│   ├── auth.tsx           # Authentication context
│   ├── database.ts        # Database service functions
│   ├── colors.ts          # Design system colors
│   └── supabase.ts        # Supabase client configuration
├── assets/                # Static assets
└── SUPABASE_SETUP.md      # Detailed Supabase setup guide
```

## Database Schema

The app uses a comprehensive PostgreSQL schema with the following main tables:

- **profiles** - User profile information
- **portals** - Anonymous messaging portals
- **portal_messages** - Messages sent to portals
- **posts** - Anonymous social media posts
- **comments** - Post comments with threading support
- **groups** - Private group information
- **group_members** - Group membership management
- **group_messages** - Group chat messages
- **likes** - Post and comment likes

## Key Features Implementation

### Anonymous Messaging
- All messages are anonymous by default
- Users can choose to identify themselves
- Portal owners can configure message types allowed

### Real-time Updates
- Supabase real-time subscriptions for live updates
- Automatic refresh on data changes
- Optimistic UI updates for better UX

### Security
- Row Level Security (RLS) enabled on all tables
- Proper authentication checks
- Data validation and sanitization

### Performance
- Optimized database queries
- Image lazy loading
- Efficient state management
- Minimal re-renders

## Customization

### Colors
The app uses a comprehensive color system defined in `lib/colors.ts`. You can customize:
- Primary colors (purple theme)
- Accent colors (pink, rose, orange, etc.)
- Background colors (dark theme)
- Text colors
- Status colors

### Post Types
Add new post types by updating the `POST_TYPES` array in `app/(tabs)/add.tsx`:
```typescript
const POST_TYPES = [
  { key: 'confession', label: 'Confession', icon: 'heart-outline', color: colors.accent.pink },
  // Add your custom post type here
];
```

### Tags
Modify the `POPULAR_TAGS` array in `app/(tabs)/add.tsx` to add or remove default tags.

## Deployment

### Mobile App
1. **Build for production**
   ```bash
   expo build:android
   expo build:ios
   ```

2. **Deploy to app stores**
   - Follow Expo's deployment guide
   - Configure app store listings
   - Set up app signing certificates

### Web App
1. **Build for web**
   ```bash
   expo build:web
   ```

2. **Deploy to hosting**
   - Deploy the `web-build` folder to your hosting provider
   - Configure custom domain if needed

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **Metro bundler issues**
   ```bash
   npx expo start --clear
   ```

2. **Supabase connection issues**
   - Check environment variables
   - Verify Supabase project is active
   - Check network connectivity

3. **Authentication issues**
   - Verify Google OAuth configuration
   - Check Supabase auth settings
   - Ensure redirect URLs are correct

4. **Database permission errors**
   - Check RLS policies
   - Verify user authentication status
   - Check table permissions

### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Review the [Supabase documentation](https://supabase.com/docs)
- Open an issue in this repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Expo](https://expo.dev/) for the amazing React Native platform
- [Supabase](https://supabase.com/) for the backend-as-a-service
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for smooth animations
- [Expo Router](https://expo.github.io/router/) for file-based routing

---

**Note**: This is a demo application. For production use, ensure you implement proper security measures, data validation, and error handling.