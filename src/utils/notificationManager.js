/**
 * Notification Manager
 * Handles browser notifications for daily reminders
 */

const NOTIFICATION_PERMISSION_KEY = 'ammarTimes_notificationPermission';

// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, permission);
    return permission === 'granted';
  }

  return false;
}

// Check if notifications are enabled
export function areNotificationsEnabled() {
  if (!('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

// Show a notification
export function showNotification(title, options = {}) {
  if (!areNotificationsEnabled()) {
    console.log('Notifications not enabled');
    return;
  }

  const defaultOptions = {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    requireInteraction: false,
    ...options,
  };

  try {
    const notification = new Notification(title, defaultOptions);
    
    notification.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Schedule daily reminder
export function scheduleDailyReminder() {
  if (!areNotificationsEnabled()) {
    return;
  }

  // Check every hour if it's time to send reminder
  const checkInterval = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Send reminder at 9:00 AM
    if (hour === 9 && minute === 0) {
      sendDailyReminder();
    }
  }, 60000); // Check every minute

  return checkInterval;
}

// Send daily reminder notification
function sendDailyReminder() {
  const lastSent = localStorage.getItem('lastReminderSent');
  const today = new Date().toISOString().split('T')[0];

  // Don't send if already sent today
  if (lastSent === today) {
    return;
  }

  showNotification('🎮 New puzzles are ready!', {
    body: 'Start your daily streak on Ammar Times',
    tag: 'daily-reminder',
    onClick: () => {
      window.location.href = '/games';
    },
  });

  localStorage.setItem('lastReminderSent', today);
}

// Initialize notification system
export function initNotifications(enabled = false) {
  if (!enabled) {
    return;
  }

  if (areNotificationsEnabled()) {
    scheduleDailyReminder();
  } else {
    requestNotificationPermission().then(granted => {
      if (granted) {
        scheduleDailyReminder();
      }
    });
  }
}
