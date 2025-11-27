import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton, Button, Divider, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService, { Order } from '../../services/order.service';
import progressService, { ProductionStep } from '../../services/progress.service';

export default function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!orderId) throw new Error('Missing order id');
      const data = await orderService.getOrder(orderId);
      setOrder(data);
      try {
        const stepsRes = await progressService.getProductionSteps(orderId);
        setSteps(stepsRes.steps);
      } catch (e) {
        setSteps([]);
      }
    } catch (error) {
      console.error('Failed to load order detail:', error);
      Alert.alert('Error', 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(order._id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    try {
      setTogglingStepId(stepId);
      await progressService.updateProductionStep(stepId, { isCompleted: !currentStatus });
      const stepsRes = await progressService.getProductionSteps(orderId);
      setSteps(stepsRes.steps);
      await loadData();
    } catch (error) {
      console.error('Failed to toggle step:', error);
      Alert.alert('Error', 'Failed to update step');
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleMarkDelivered = async () => {
    if (!order) return;
    try {
      setUpdatingStatus(true);
      await progressService.markOrderDelivered(order._id);
      await loadData();
    } catch (error) {
      console.error('Failed to mark delivered:', error);
      Alert.alert('Error', 'Failed to mark delivered');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    try {
      setCancellingOrderId(order._id);
      await orderService.cancelOrder(order._id, 'Cancelled by user');
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to cancel order');
    } finally {
      setCancellingOrderId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="clipboard-alert" size={64} color={colors.text} />
        <Text variant="titleMedium" style={styles.emptyText}>Order not found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>Go Back</Button>
      </View>
    );
  }

  const getStatusLabel = (status: string) => status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return '#6B7280';
      case 'in_progress': return '#3B82F6';
      case 'halfway': return '#F59E0B';
      case 'completed': return '#10B981';
      case 'delivered': return '#059669';
      case 'cancelled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <IconButton icon="arrow-left" size={24} iconColor="#FFFFFF" onPress={() => router.back()} />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.title}>Order</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>{order.orderNumber}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.modalTitle}>{order.orderNumber}</Text>
            <Chip style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]} textStyle={styles.statusChipText}>
              {getStatusLabel(order.status)}
            </Chip>
            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Customer Details</Text>
            <Text variant="bodyMedium">Name: {order.customerName || 'N/A'}</Text>
            <Text variant="bodyMedium">Contact: {order.customerContact || 'N/A'}</Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Items</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text variant="bodyMedium">{item.materialName}</Text>
                <Text variant="bodyMedium">{item.quantity} {item.unit}</Text>
              </View>
            ))}

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Assigned Staff</Text>
            {order.assignedTo && order.assignedTo.length > 0 ? (
              <View style={styles.staffList}>
                {order.assignedTo.map((s) => (
                  <Chip key={s._id} style={styles.staffChip}>{s.name}</Chip>
                ))}
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>No staff assigned</Text>
            )}

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>Production Steps</Text>
            {steps.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>No steps added yet</Text>
            ) : (
              steps.map(step => (
                <View key={step._id} style={styles.stepDetailRow}>
                  <IconButton
                    icon={step.isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={28}
                    onPress={() => handleToggleStep(step._id, step.isCompleted)}
                    disabled={togglingStepId === step._id}
                  />
                  <View style={styles.stepDetailContent}>
                    <Text variant="titleMedium">{step.stepNumber}. {step.description}</Text>
                    {step.notes && <Text variant="bodySmall" style={styles.stepNotes}>{step.notes}</Text>}
                    {step.isCompleted && step.completedBy && (
                      <Text variant="bodySmall" style={styles.completedBy}>Completed by {step.completedBy.name}</Text>
                    )}
                  </View>
                </View>
              ))
            )}

            <Divider style={styles.divider} />

            <View style={styles.actionButtons}>
             {order.status === 'not_started' &&  <Button mode="contained" onPress={() => router.push(`/order/edit-order?orderId=${order._id}`)} style={styles.actionButton} icon="pencil">
                Edit Order
              </Button>}
             {order.status !== 'delivered' &&  <Button mode="outlined" onPress={handleCancelOrder} style={styles.actionButton} loading={cancellingOrderId === order._id} disabled={cancellingOrderId === order._id}>
                Cancel Order
              </Button>}
              {order.status === 'delivered' && order.receiptId && (
                <Button mode="contained" onPress={() => router.push(`/order/receipt-detail?receiptId=${order.receiptId}&orderId=${order._id}`)} style={styles.actionButton} icon="receipt">
                  View Receipt
                </Button>
              )}
            </View>

            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleMedium" style={styles.sectionTitle}>Update Status</Text>
                <View style={styles.buttonRow}>
                  <Button mode="contained" onPress={() => handleUpdateStatus('in_progress')} loading={updatingStatus} disabled={updatingStatus}>Mark In Progress</Button>
                  <Button mode="contained" onPress={() => handleUpdateStatus('halfway')} loading={updatingStatus} disabled={updatingStatus}>Mark Halfway</Button>
                  <Button mode="contained" onPress={() => handleUpdateStatus('completed')} loading={updatingStatus} disabled={updatingStatus}>Mark Completed</Button>
                </View>
                {order.status === 'completed' && (
                  <Button mode="outlined" onPress={handleMarkDelivered} loading={updatingStatus} disabled={updatingStatus} style={{ marginTop: 12 }}>Mark Delivered</Button>
                )}
              </>
            )}

          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  headerGradient: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center' },
  headerTextContainer: { flex: 1, marginLeft: 8 },
  title: { fontWeight: '700', marginBottom: 4, color: '#FFFFFF' },
  subTitle: { color: 'rgba(255, 255, 255, 0.9)' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  card: { marginBottom: 16, backgroundColor: colors.surface },
  modalTitle: { fontWeight: '700', marginBottom: 8, color: colors.text },
  statusChip: { height: 34 },
  statusChipText: { color: '#FFFFFF', fontSize: 12 },
  divider: { marginVertical: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 12, color: colors.text },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  staffList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  staffChip: { backgroundColor: colors.primary },
  stepDetailRow: { flexDirection: 'row', gap: 12, marginBottom: 12, padding: 12, backgroundColor: colors.background, borderRadius: 8 },
  stepDetailContent: { flex: 1 },
  stepNotes: { color: colors.textMuted, marginTop: 4 },
  completedBy: { color: colors.success, marginTop: 4, fontStyle: 'italic' },
  actionButtons: { marginTop: 16, gap: 12 },
  actionButton: { marginBottom: 8 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  emptyText: { marginTop: 16, color: colors.text },
  backButton: { backgroundColor: colors.primary },
});
