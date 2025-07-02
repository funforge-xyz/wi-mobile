export type RootStackParamList = {
  Root: undefined;
  Login: undefined;
  Onboarding: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  Terms: undefined;
  ChatImages: { chatId: string };
  SinglePost: { postId: string };
  Profile: { userId: string };
  ProfileSettings: undefined;
  UserProfile: { 
    userId: string;
    firstName?: string;
    lastName?: string;
    photoURL?: string;
    bio?: string;
  };
  Notifications: undefined;
  HelpSupport: undefined;
  Chat: {
    userId: string;
    userName: string;
    userPhotoURL?: string;
  };
  PrivacyPolicy: undefined;
  Camera: undefined;
  MediaPreview: {
    mediaUri: string;
    mediaType: 'image' | 'video';
  };
  CreatePost: {
    mediaUri: string;
    mediaType: 'image' | 'video';
  };
};

export type BottomTabParamList = {
  Home: undefined;
  Nearby: undefined;
  Add: undefined;
  Chats: undefined;
  Profile: undefined;
};