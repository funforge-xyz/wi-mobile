# Wi Chat - Location-Based Social Mobile App

## Overview

Wi Chat is a React Native mobile application built with Expo that enables users to discover and connect with people nearby. The app features location-based discovery, real-time messaging, multimedia posts, and social connections. Users can find others in their vicinity, send connection requests, chat, and share posts with images/videos. The application supports both iOS and Android platforms with a focus on location-aware social networking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v6 with stack navigation pattern
- **State Management**: Redux Toolkit for global application state
- **UI Components**: Custom component library with consistent theming system
- **Styling**: StyleSheet-based approach with centralized theme configuration
- **Language Support**: i18next for internationalization with multiple language support
- **Camera Integration**: Expo Camera for in-app photo/video capture functionality

### Backend Architecture
- **Database**: Firebase Firestore for real-time data storage and synchronization
- **Authentication**: Firebase Auth with email/password and Google Sign-In integration
- **File Storage**: Firebase Storage for media uploads (images, videos, profile pictures)
- **Push Notifications**: Expo Notifications with Firebase Cloud Messaging integration
- **Location Services**: Expo Location with background location tracking capabilities

### Data Storage Solutions
- **Primary Database**: Firebase Firestore with collections for users, posts, messages, notifications, and connections
- **Local Storage**: AsyncStorage for device-specific preferences and cache
- **Media Storage**: Firebase Storage with optimized image compression and thumbnails
- **Offline Support**: Redux state management for local data caching

### Authentication and Authorization
- **Authentication Methods**: Email/password and Google OAuth integration
- **Session Management**: Firebase Auth automatic token refresh and session persistence
- **Security Rules**: Firestore security rules for data access control
- **User Profiles**: Comprehensive profile system with photo uploads and bio information

### Key Features Architecture
- **Location Discovery**: Real-time nearby user detection using geolocation services
- **Real-time Messaging**: Firebase Firestore real-time listeners for instant chat functionality
- **Connection System**: Friend request workflow with pending/accepted/rejected states
- **Feed System**: Social media-style posts with image/video support and engagement features
- **Notification System**: Real-time push notifications for messages, likes, comments, and connection requests

## External Dependencies

### Firebase Services
- **Firestore**: Real-time database for all application data
- **Authentication**: User authentication and session management
- **Storage**: Media file storage and retrieval
- **Cloud Functions**: Server-side logic execution (configured in ./firebase directory)

### Expo Services
- **Location Services**: GPS and location tracking with background capabilities
- **Camera**: In-app camera functionality for photo/video capture
- **Image Picker**: Media selection from device gallery
- **Notifications**: Push notification delivery system
- **Font Loading**: Custom font management
- **Task Manager**: Background task execution for location services

### Third-party Integrations
- **Google Sign-In**: OAuth authentication through @react-native-google-signin/google-signin
- **Image Processing**: Expo Image Manipulator for media optimization
- **Video Playback**: Expo Video for in-app video playback and thumbnails
- **Maps and Location**: Expo Location for precise positioning and distance calculations

### Development Tools
- **Build System**: EAS Build for iOS and Android app compilation
- **Metro Bundler**: JavaScript bundling with custom configuration for Firebase compatibility
- **TypeScript**: Type safety and enhanced development experience
- **Babel**: JavaScript transformation with module resolution and path aliases