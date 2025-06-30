
import { getTheme } from '../theme';

export { getTheme };

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
  return t('terms.lastUpdated', { date: 'January 15, 2024' });
};
