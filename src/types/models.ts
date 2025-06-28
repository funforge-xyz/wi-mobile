export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  interests?: string[];
  settings?: UserSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  locationSharingEnabled: boolean;
  darkMode: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  attachments?: Attachment[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  likesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  id: string;
  userId: string;
  postId?: string;
  commentId?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  type: 'text' | 'image' | 'video';
  createdAt: Date;
  deliveredAt?: Date;
  seenAt?: Date;
  readAt?: Date;
}

export interface Thread {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  size: number;
  name: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'message' | 'follow';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface NearbyUser {
  id: string;
  name: string;
  photoURL: string;
  lastSeen: Date;
  distance: number;
  isOnline: boolean;
  isSameNetwork: boolean;
}