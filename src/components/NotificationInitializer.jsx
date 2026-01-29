'use client';

import { useEffect } from 'react';
import { initNotifications } from '@/utils/notificationManager';
import { getProfile } from '@/utils/profileManager';
import { useAppSession } from '@/utils/sessionManager';

export default function NotificationInitializer({ children }) {
  const session = useAppSession();

  useEffect(() => {
    if (session?.role === 'ADMIN') return;
    // Initialize notifications based on user settings
    const profile = getProfile();
    if (profile?.settings?.remindersEnabled) {
      initNotifications(true);
    }
  }, [session?.role]);

  return <>{children}</>;
}
