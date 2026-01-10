'use client';

import { useEffect } from 'react';
import { initNotifications } from '@/utils/notificationManager';
import { getProfile } from '@/utils/profileManager';

export default function NotificationInitializer({ children }) {
  useEffect(() => {
    // Initialize notifications based on user settings
    const profile = getProfile();
    if (profile?.settings?.remindersEnabled) {
      initNotifications(true);
    }
  }, []);

  return <>{children}</>;
}
