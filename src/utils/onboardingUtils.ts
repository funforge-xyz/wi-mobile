
export const onboardingData = [
  {
    id: 1,
    title: 'Connect with People Nearby',
    description: 'Discover and chat with people in your area',
    image: require('../../assets/images/onboarding1.jpg'),
  },
  {
    id: 2,
    title: 'Share Your Moments',
    description: 'Post photos and updates to share with your community',
    image: require('../../assets/images/onboarding2.jpg'),
  },
  {
    id: 3,
    title: 'Stay Connected',
    description: 'Get notifications about what\'s happening around you',
    image: require('../../assets/images/onboarding3.jpg'),
  },
];

export const getNextButtonText = (currentPage: number, totalPages: number): string => {
  return currentPage === totalPages - 1 ? 'Get Started' : 'Next';
};
