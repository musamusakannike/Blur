// colors.ts - Dark Theme Color Palette for Social Media App

export const colors = {
  // Primary Colors - Vibrant accents for CTAs and interactive elements
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary - vibrant sky blue
    600: '#0284c7',
    700: '#0369a1',
  },

  // Secondary Colors - Purple/Magenta for additional accents
  secondary: {
    400: '#d946ef',
    500: '#a855f7', // Vibrant purple
    600: '#9333ea',
    700: '#7e22ce',
  },

  // Accent Colors - For likes, reactions, highlights
  accent: {
    pink: '#ec4899',
    rose: '#f43f5e',
    orange: '#f97316',
    amber: '#f59e0b',
    green: '#10b981',
  },

  // Background Colors - Dark theme base
  background: {
    primary: '#0f0f0f', // Deep black
    secondary: '#1a1a1a', // Card backgrounds
    tertiary: '#262626', // Hover states
    overlay: 'rgba(0, 0, 0, 0.5)',
    modal: 'rgba(0, 0, 0, 0.8)',
  },

  // Text Colors
  text: {
    primary: '#ffffff', // Main text
    secondary: '#d1d5db', // Secondary text
    tertiary: '#9ca3af', // Disabled or muted text
    muted: '#6b7280', // Placeholder text
  },

  // Border Colors
  border: {
    light: '#374151', // Subtle borders
    medium: '#4b5563', // Standard borders
    focus: '#0ea5e9', // Focus state
  },

  // Status Colors
  status: {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  },

  // Semantic Colors for Social Features
  social: {
    like: '#ec4899', // Like/Heart
    comment: '#0ea5e9', // Comment/Reply
    share: '#10b981', // Share
    saved: '#f59e0b', // Saved/Bookmark
    follow: '#a855f7', // Follow button
  },

  // Gradient bases (use with LinearGradient)
  gradients: {
    primary: ['#0ea5e9', '#a855f7'], // Sky blue to purple
    accent: ['#ec4899', '#f43f5e'], // Pink to rose
    sunset: ['#f97316', '#f59e0b'], // Orange to amber
    cool: ['#0ea5e9', '#10b981'], // Blue to green
  },

  // Opacity utilities
  opacity: {
    disabled: 0.5,
    hover: 0.7,
    active: 0.9,
  },
};

// Type definitions for theme
export type ColorKey = keyof typeof colors;
export type ColorValue = string | number;

// Helper function for opacity
export const withOpacity = (color: string, opacity: number): string => {
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};