import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import notificationService from '../services/notification.service';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';

// Configure notification handler with proper TypeScript types
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string>('');
  const [notification, setNotification] = useState<Notifications.Notification | undefined>(undefined);
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token && user) {
        setExpoPushToken(token);
        registerDevice(token);
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
      console.log('Notification received:', notification);
    });

    // Listen for notification responses
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      handleNotificationResponse(response);
    });

    return () => {
      // Properly clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user, isAuthenticated]);

  const registerDevice = async (token: string) => {
    if (!user) return;

    try {
      const platform = Platform.OS as 'ios' | 'android' | 'web';
      await notificationService.registerDevice(token, platform, Device.modelName ?? undefined);
      console.log('Device registered for push notifications');
    } catch (error) {
      console.error('Error registering device:', error);
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as any;

    const materialId = data.materialId || data.itemId;

    if (data.type === 'low_stock' || data.type === 'out_of_stock') {
      if (materialId) {
        router.push(`/material/item-detail?id=${materialId}`);
      } else {
        router.push('/(tabs)/materials');
      }
    } else if (data.type === 'expiry_warning') {
      if (materialId) {
        router.push(`/material/item-detail?id=${materialId}`);
      } else {
        router.push('/(tabs)/materials');
      }
    } else if (data.type === 'critical') {
      if (materialId) {
        router.push(`/material/item-detail?id=${materialId}`);
      } else {
        router.push('/(tabs)/materials');
      }
    } else {
      router.push('/notifications');
    }
  };

  return {
    expoPushToken,
    notification,
  };
};

async function registerForPushNotificationsAsync(): Promise<string> {
  let token = '';

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return '';
    }
    
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.log('Project ID not found');
        return '';
      }
      
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log('Expo push token:', token);
    } catch (error) {
      console.error('Error getting push token:', error);
      token = '';
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}