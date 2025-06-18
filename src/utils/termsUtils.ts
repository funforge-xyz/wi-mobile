
export const getTheme = (isDarkMode: boolean) => {
  const lightTheme = {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
  };

  const darkTheme = {
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    border: '#333333',
  };

  return isDarkMode ? darkTheme : lightTheme;
};

export const getTermsSections = (t: (key: string, options?: any) => string) => [
  {
    title: t('terms.acceptanceTitle'),
    content: t('terms.acceptanceText'),
  },
  {
    title: t('terms.privacyTitle'),
    content: t('terms.privacyText'),
  },
  {
    title: t('terms.conductTitle'),
    content: t('terms.conductText'),
  },
  {
    title: t('terms.contentTitle'),
    content: t('terms.contentText'),
  },
  {
    title: t('terms.securityTitle'),
    content: t('terms.securityText'),
  },
  {
    title: t('terms.liabilityTitle'),
    content: t('terms.liabilityText'),
  },
  {
    title: t('terms.changesTitle'),
    content: t('terms.changesText'),
  },
];

export const getLastUpdatedText = (t: (key: string, options?: any) => string) => {
  return t('terms.lastUpdated', { date: new Date().toLocaleDateString() });
};
