import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useNotifications } from '../../hooks/useNotifications';

export const NotificationHandler: React.FC = () => {
  const router = useRouter();
  const { notification } = useNotifications();

  useEffect(() => {
    // Handle notification interactions when app is opened from notification
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as any;
      
      console.log('Notification response received:', data);
      
      // Navigate based on notification type
      if (data.type === 'low_stock' || data.type === 'out_of_stock') {
        router.push('/(tabs)/material');
      } else if (data.type === 'expiry_warning' && data.itemId) {
        router.push(`/material/item-detail?id=${data.itemId}`);
      } else if (data.type === 'critical') {
        if (data.itemId) {
          router.push(`/material/item-detail?id=${data.itemId}`);
        } else {
          router.push('/(tabs)/material');
        }
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [router]);

  // Handle foreground notifications
  useEffect(() => {
    if (notification) {
      console.log('Foreground notification:', notification);
      const content = notification.request.content;
      const data = (content.data || {}) as any;

      const title = (content.title as string) || (data.title as string) || 'Notification';
      const message = (content.body as string) || (data.body as string) || '';

      const buttons: any[] = [
        { text: 'Dismiss', style: 'cancel' },
      ];

      // If payload suggests a navigation target, add a View button
      if (data?.navigateTo) {
        buttons.unshift({
          text: 'View',
          onPress: () => {
            try {
              router.push(data.navigateTo);
            } catch (e) {
              console.warn('Navigation from notification failed', e);
            }
          },
        });
      } else if (data?.type && (data.type === 'low_stock' || data.type === 'out_of_stock' || data.type === 'critical')) {
        buttons.unshift({ text: 'View', onPress: () => router.push('/(tabs)/material') });
      } else if (data?.type === 'expiry_warning' && data?.itemId) {
        buttons.unshift({ text: 'View', onPress: () => router.push(`/material/item-detail?id=${data.itemId}`) });
      }

      // Show the native alert
      Alert.alert(title, message, buttons, { cancelable: true });
    }
  }, [notification]);

  // Register for push notifications and listen for notifications received while app is foreground
  useEffect(() => {
    let receivedSub: Notifications.Subscription | null = null;

    const setup = async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Push notification permissions not granted.');
          return;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('Expo push token:', tokenData.data);
        // Optionally: send this token to your backend for push targeting
      } catch (err) {
        console.warn('Error setting up notifications:', err);
      }

      // Listen for notifications that arrive while the app is foregrounded
      receivedSub = Notifications.addNotificationReceivedListener(notif => {
        console.log('Received notification (foreground):', notif);
        const data = (notif.request.content.data || {}) as any;
        // Optional: navigate based on a custom navigateTo field in the notification payload
        if (data?.navigateTo) {
          try {
            router.push(data.navigateTo);
          } catch (e) {
            console.warn('Navigation from notification failed', e);
          }
        }
      });
    };

    setup();

    return () => {
      if (receivedSub) receivedSub.remove();
    };
  }, [router]);

  return null;
};