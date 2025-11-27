import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService, { Order, OrderHistory } from '../../services/order.service';

export default function OrderHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderHistory[]>([]);

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderData, historyData] = await Promise.all([
        orderService.getOrder(orderId),
        orderService.getOrderHistory(orderId),
      ]);
      setOrder(orderData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return 'plus-circle';
      case 'edited': return 'pencil';
      case 'status_changed': return 'swap-horizontal';
      case 'assigned': return 'account-plus';
      case 'cancelled': return 'cancel';
      default: return 'information';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return colors.success;
      case 'edited': return colors.primary;
      case 'status_changed': return '#F59E0B';
      case 'assigned': return '#8B5CF6';
      case 'cancelled': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getActionLabel = (action: string) => {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor="#FFFFFF"
            onPress={() => router.back()}
          />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>Order History</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              {order?.orderNumber}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {history.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="history" size={64} color={colors.textMuted} />
            <Text variant="titleMedium" style={styles.emptyText}>No history available</Text>
          </View>
        ) : (
          history.map((item, index) => (
            <Card key={item._id} style={styles.historyCard}>
              <Card.Content>
                <View style={styles.historyHeader}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons
                      name={getActionIcon(item.action)}
                      size={24}
                      color={getActionColor(item.action)}
                    />
                  </View>
                  <View style={styles.historyContent}>
                    <View style={styles.actionRow}>
                      <Chip
                        style={[styles.actionChip, { backgroundColor: getActionColor(item.action) + '20' }]}
                        textStyle={[styles.actionChipText, { color: getActionColor(item.action) }]}
                      >
                        {getActionLabel(item.action)}
                      </Chip>
                      <Text variant="bodySmall" style={styles.timestamp}>
                        {formatDate(item.timestamp)}
                      </Text>
                    </View>

                    <View style={styles.userRow}>
                      <MaterialCommunityIcons name="account" size={16} color={colors.textMuted} />
                      <Text variant="bodyMedium" style={styles.userName}>
                        {item.userId.name}
                      </Text>
                    </View>

                    {item.action === 'status_changed' && item.previousStatus && item.newStatus && (
                      <View style={styles.statusChangeRow}>
                        <Chip style={styles.statusChip} textStyle={styles.statusChipText}>
                          {item.previousStatus}
                        </Chip>
                        <MaterialCommunityIcons name="arrow-right" size={20} color={colors.textMuted} />
                        <Chip style={styles.statusChip} textStyle={styles.statusChipText}>
                          {item.newStatus}
                        </Chip>
                      </View>
                    )}

                    {item.notes && (
                      <Text variant="bodySmall" style={styles.notes}>
                        {item.notes}
                      </Text>
                    )}
                  </View>
                </View>

                {index < history.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </Card.Content>
            </Card>
          ))
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: colors.textMuted,
  },
  historyCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  historyHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  actionChip: {
    height: 38,
  },
  actionChipText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  timestamp: {
    color: colors.text,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  userName: {
    color: colors.text,
  },
  statusChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  statusChip: {
    backgroundColor: colors.background,
    height: 38,
  },
  statusChipText: {
    fontSize: 13,
    color: colors.text,
  },
  notes: {
    color: colors.text,
    marginTop: 8,
    fontStyle: 'italic',
  },
  timelineLine: {
    position: 'absolute',
    left: 35,
    top: 60,
    bottom: -12,
    width: 2,
    backgroundColor: colors.border,
  },
});
