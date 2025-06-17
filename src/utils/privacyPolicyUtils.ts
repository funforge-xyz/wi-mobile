
export interface PrivacySection {
  titleKey: string;
  textKey: string;
}

export const privacySections: PrivacySection[] = [
  { titleKey: 'privacy.infoCollectTitle', textKey: 'privacy.infoCollectText' },
  { titleKey: 'privacy.locationTitle', textKey: 'privacy.locationText' },
  { titleKey: 'privacy.howWeUseTitle', textKey: 'privacy.howWeUseText' },
  { titleKey: 'privacy.sharingTitle', textKey: 'privacy.sharingText' },
  { titleKey: 'privacy.securityTitle', textKey: 'privacy.securityText' },
  { titleKey: 'privacy.retentionTitle', textKey: 'privacy.retentionText' },
  { titleKey: 'privacy.childrenTitle', textKey: 'privacy.childrenText' },
  { titleKey: 'privacy.rightsTitle', textKey: 'privacy.rightsText' },
  { titleKey: 'privacy.changesTitle', textKey: 'privacy.changesText' },
  { titleKey: 'privacy.contactTitle', textKey: 'privacy.contactText' },
];

export const getLastUpdatedText = (t: any) => {
  return t('privacy.lastUpdated', { date: new Date().toLocaleDateString() });
};
