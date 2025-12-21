# Blur Frontend Setup Guide

## Prerequisites

Before running the application, ensure you have the following installed:
- Node.js (v18 or higher)
- npm, yarn, or pnpm package manager

## Installation Steps

### 1. Install Dependencies

First, install the required Firebase package:

```bash
npm install firebase
# or
yarn add firebase
# or
pnpm add firebase
```

All other dependencies are already listed in `package.json`.

### 2. Configure Environment Variables

1. Copy the `.env.example` file to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the `.env.local` file with your actual values:
   - **API_URL**: Your backend API URL (default: `http://localhost:5000/api`)
   - **Firebase Configuration**: Get these from your Firebase Console

### 3. Firebase Setup

To enable Google Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication → Sign-in method → Google
4. Copy your Firebase configuration values to `.env.local`
5. Add your domain to the authorized domains list in Firebase

### 4. Backend Configuration

Ensure your backend server is running and configured to:
- Accept requests from your frontend domain
- Have Firebase Admin SDK configured with the same project
- Have the `/api/auth/google` endpoint enabled

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features Implemented

### Create Room Flow

The create room page (`/create-room`) implements a multi-step form with:

1. **Step 1**: Room name input (required, max 100 characters)
2. **Step 2**: Room description (optional, max 500 characters, skippable)
3. **Step 3**: Room lifetime selection (1-6 hours with animated time picker)
4. **Step 4**: Google authentication
5. **Step 5**: Success screen with room code

### Key Features

- ✨ Smooth animations using Framer Motion
- 🎨 Responsive design matching landing page aesthetics
- 🔐 Google OAuth authentication with Firebase
- 💾 Persistent authentication using localStorage
- 🔄 Automatic retry for API requests using axios-retry
- 📱 Mobile-friendly UI with touch interactions
- ⌨️ Keyboard navigation support (Enter to proceed)
- 🎯 Progress indicator showing current step
- ↩️ Back button to navigate between steps

## Project Structure

```
src/
├── app/
│   ├── create-room/
│   │   └── page.tsx          # Multi-step create room component
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── LandingPage/
│       ├── Hero.tsx
│       ├── Experience.tsx
│       └── AutoScrollingText.tsx
└── lib/
    ├── api.ts                 # Axios instance with retry config
    ├── auth.ts                # Authentication utilities
    └── firebase.ts            # Firebase configuration
```

## API Integration

The app integrates with the following backend endpoints:

- `POST /api/auth/google` - Google OAuth login
- `POST /api/rooms` - Create a new room (requires authentication)

## Troubleshooting

### Firebase Errors

If you see Firebase-related errors:
1. Ensure Firebase is installed: `npm install firebase`
2. Verify your `.env.local` has correct Firebase credentials
3. Check that Google sign-in is enabled in Firebase Console

### API Connection Issues

If API requests fail:
1. Verify backend server is running
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Ensure CORS is configured on the backend

### Authentication Issues

If Google login doesn't work:
1. Check Firebase configuration
2. Verify authorized domains in Firebase Console
3. Ensure backend has Firebase Admin SDK configured

## Development Notes

- The app uses TypeScript for type safety
- Tailwind CSS for styling with custom gradient backgrounds
- Framer Motion for smooth animations and transitions
- Axios with exponential backoff retry logic
- LocalStorage for token persistence

## Next Steps

After setting up the create room flow, you may want to:
- Implement the room view page (`/room/[code]`)
- Add real-time messaging with Socket.io
- Implement room joining functionality
- Add user profile management
