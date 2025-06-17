
import { Alert, Linking } from 'react-native';

export interface FAQItem {
  id: string;
  questionKey: string;
  answerKey: string;
}

export const faqData: FAQItem[] = [
  {
    id: '1',
    questionKey: 'helpSupport.faqQuestions.howDoesMatchingWork',
    answerKey: 'helpSupport.faqQuestions.howDoesMatchingWorkAnswer',
  },
  {
    id: '2',
    questionKey: 'helpSupport.faqQuestions.howToConnect',
    answerKey: 'helpSupport.faqQuestions.howToConnectAnswer',
  },
  {
    id: '3',
    questionKey: 'helpSupport.faqQuestions.changeProfilePicture',
    answerKey: 'helpSupport.faqQuestions.changeProfilePictureAnswer',
  },
  {
    id: '4',
    questionKey: 'helpSupport.faqQuestions.deletePost',
    answerKey: 'helpSupport.faqQuestions.deletePostAnswer',
  },
  {
    id: '5',
    questionKey: 'helpSupport.faqQuestions.blockOrReport',
    answerKey: 'helpSupport.faqQuestions.blockOrReportAnswer',
  },
  {
    id: '6',
    questionKey: 'helpSupport.faqQuestions.nearbyFeature',
    answerKey: 'helpSupport.faqQuestions.nearbyFeatureAnswer',
  },
  {
    id: '7',
    questionKey: 'helpSupport.faqQuestions.changePassword',
    answerKey: 'helpSupport.faqQuestions.changePasswordAnswer',
  },
  {
    id: '8',
    questionKey: 'helpSupport.faqQuestions.deleteAccount',
    answerKey: 'helpSupport.faqQuestions.deleteAccountAnswer',
  },
  {
    id: '9',
    questionKey: 'helpSupport.faqQuestions.notReceivingNotifications',
    answerKey: 'helpSupport.faqQuestions.notReceivingNotificationsAnswer',
  },
];

export const handleEmailSupport = () => {
  const email = 'support@wichat.app';
  const subject = 'Help Request';
  const body = 'Please describe your issue here...';

  Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
    .catch(() => {
      Alert.alert('Error', 'Unable to open email app. Please contact support@wichat.app directly.');
    });
};

export const handleReportBug = () => {
  const email = 'bugs@wichat.app';
  const subject = 'Bug Report';
  const body = 'Please describe the bug you encountered, including steps to reproduce it...';

  Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
    .catch(() => {
      Alert.alert('Error', 'Unable to open email app. Please contact bugs@wichat.app directly.');
    });
};

export const handleFeatureRequest = () => {
  const email = 'features@wichat.app';
  const subject = 'Feature Request';
  const body = 'Please describe the feature you would like to see added...';

  Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`)
    .catch(() => {
      Alert.alert('Error', 'Unable to open email app. Please contact features@wichat.app directly.');
    });
};
