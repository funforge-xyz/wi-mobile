
export type RootStackParamList = {
  Onboarding: undefined;
  Root: undefined;
  Login: undefined;
  Home: undefined;
  Chat: { userId: string };
  ChatImages: { chatId: string };
  Profile: undefined;
  ProfileView: { userId: string };
  ProfileInterestAdd: undefined;
  Settings: undefined;
  DeleteAccount: undefined;
  ChangePassword: undefined;
  Terms: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Nearby: undefined;
  Add: undefined;
  Chats: undefined;
  Profile: undefined;
};
