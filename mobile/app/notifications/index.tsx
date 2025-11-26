import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import notificationService, { Notification } from '../../services/notification.service';

export default function NotificationsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showRead, setShowRead] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [showRead]);

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications(50, showRead);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      loadNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.deleteNotification(id);
              loadNotifications();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'alert';
      case 'out_of_stock':
        return 'alert-octagon';
      case 'expiry_warning':
        return 'clock-alert';
      case 'critical':
        return 'alert-circle';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return colors.warning;
      case 'out_of_stock':
      case 'critical':
        return colors.error;
      case 'expiry_warning':
        return colors.accent;
      default:
        return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.header}>
        <Button
          mode="text"
          onPress={() => router.back()}
          textColor={colors.secondary}
          icon={() => <MaterialCommunityIcons name="arrow-left" size={20} color={colors.secondary} />}
        >
          Back
        </Button>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Notifications
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <View style={styles.actions}>
        <Chip
          selected={!showRead}
          onPress={() => setShowRead(false)}
          style={[styles.chip, !showRead && styles.chipSelected]}
          textStyle={[styles.chipText, !showRead && styles.chipTextSelected]}
        >
          Unread
        </Chip>
        <Chip
          selected={showRead}
          onPress={() => setShowRead(true)}
          style={[styles.chip, showRead && styles.chipSelected]}
          textStyle={[styles.chipText, showRead && styles.chipTextSelected]}
        >
          All
        </Chip>
        {!showRead && notifications.length > 0 && (
          <Button
            mode="text"
            onPress={handleMarkAllAsRead}
            textColor={colors.secondary}
            compact
          >
            Mark all read
          </Button>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={64} color={colors.textMuted} />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Notifications
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              {showRead
                ? 'You have no notifications'
                : 'You have no unread notifications'}
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => {
              const notifColor = getNotificationColor(notification.type);
              const notifIcon = getNotificationIcon(notification.type);

              return (
                <TouchableOpacity
                  key={notification._id}
                  onPress={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  <Card style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}>
                    <Card.Content style={styles.cardContent}>
                      <View style={styles.notificationHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: notifColor + '20' }]}>
                          <MaterialCommunityIcons name={notifIcon as any} size={24} color={notifColor} />
                        </View>
                        <View style={styles.notificationBody}>
                          <View style={styles.titleRow}>
                            <Text variant="titleMedium" style={styles.notificationTitle} numberOfLines={1}>
                              {notification.title}
                            </Text>
                            {!notification.isRead && (
                              <View style={styles.unreadBadge} />
                            )}
                          </View>
                          <Text variant="bodyMedium" style={styles.notificationMessage} numberOfLines={2}>
                            {notification.message}
                          </Text>
                          <Text variant="bodySmall" style={styles.notificationTime}>
                            {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                          </Text>
                        </View>
                        <IconButton
                          icon="close"
                          size={20}
                          iconColor={colors.textMuted}
                          onPress={() => handleDelete(notification._id)}
                        />
                      </View>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  unreadCard: {
    borderColor: colors.primary + '60',
    backgroundColor: colors.surface + 'F0',
  },
  cardContent: {
    paddingVertical: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
  },
  unreadBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  notificationMessage: {
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    color: colors.textMuted,
  },
});
