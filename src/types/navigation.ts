export type RootStackParamList = {
  Root: undefined;
  Login: undefined;
  Onboarding: undefined;
  Settings: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  Terms: undefined;
  AddPost: undefined;
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
};

export type BottomTabParamList = {
  Home: undefined;
  Nearby: undefined;
  Add: undefined;
  Chats: undefined;
  Profile: undefined;
};