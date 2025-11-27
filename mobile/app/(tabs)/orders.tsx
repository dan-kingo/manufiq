import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, FAB, ActivityIndicator, Chip, Searchbar, Menu, Button, Portal, Modal, TextInput, Divider, SegmentedButtons, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService, { Order, OrderStats } from '../../services/order.service';
import progressService, { ProductionStep } from '../../services/progress.service';
import { useAuth } from '../../contexts/AuthContext';
import itemService, { Item } from '../../services/item.service';
import staffService from '../../services/staff.service';

export default function OrdersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [stepsModalVisible, setStepsModalVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [productionSteps, setProductionSteps] = useState<ProductionStep[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerContact: '',
    items: [{ materialId: '', quantity: 0 }],
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
    assignedTo: [] as string[],
  });

  const loadData = async () => {
    try {
      const [ordersData, statsData, materialsData, staffData] = await Promise.all([
        orderService.listOrders({ limit: 100 }),
        orderService.getOrderStats(),
        itemService.listItems(),
        user?.role === 'owner' ? staffService.getStaff() : Promise.resolve({ staff: [] }),
      ]);
      setOrders(ordersData.orders);
      setFilteredOrders(ordersData.orders);
      setStats(statsData);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setStaffMembers(staffData?.staff || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (assignedToMeFilter) {
      filtered = filtered.filter(o =>
        o.assignedTo?.some(assignee => assignee._id === user?._id)
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.customerName?.toLowerCase().includes(query) ||
        o.customerContact?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [statusFilter, searchQuery, orders, assignedToMeFilter, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

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

  const getStatusLabel = (status: string) => {
    return status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const stepsData = await progressService.getProductionSteps(order._id);
      setProductionSteps(stepsData.steps);
    } catch (error) {
      setProductionSteps([]);
    }
    setDetailModalVisible(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      await loadData();
      setDetailModalVisible(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      const validItems = newOrder.items.filter(item => item.materialId && item.quantity > 0);
      if (validItems.length === 0) {
        return;
      }

      await orderService.createOrder({
        ...newOrder,
        items: validItems,
      });

      setCreateModalVisible(false);
      setNewOrder({
        customerName: '',
        customerContact: '',
        items: [{ materialId: '', quantity: 0 }],
        dueDate: new Date().toISOString().split('T')[0],
        notes: '',
        assignedTo: [],
      });
      loadData();
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    try {
      setTogglingStepId(stepId);
      await progressService.updateProductionStep(stepId, { isCompleted: !currentStatus });
      if (selectedOrder) {
        const stepsData = await progressService.getProductionSteps(selectedOrder._id);
        setProductionSteps(stepsData.steps);
      }
      await loadData();
    } catch (error) {
      console.error('Failed to toggle step:', error);
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleManageSteps = async (order: Order) => {
    setSelectedOrder(order);
    try {
      const stepsData = await progressService.getProductionSteps(order._id);
      setProductionSteps(stepsData.steps);
    } catch (error) {
      setProductionSteps([]);
    }
    setStepsModalVisible(true);
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      setUpdatingStatus(true);
      await progressService.markOrderDelivered(orderId);
      await loadData();
      setDetailModalVisible(false);
    } catch (error) {
      console.error('Failed to mark as delivered:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrderId(orderId);
      await orderService.cancelOrder(orderId, 'Cancelled by user');
      await loadData();
      setDetailModalVisible(false);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setCancellingOrderId(null);
    }
  };

  const addNewItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { materialId: '', quantity: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((_, i) => i !== index),
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
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineMedium" style={styles.title}>Orders</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              Manage your orders efficiently
            </Text>
          </View>
          <IconButton
            icon="refresh"
            size={24}
            onPress={() => onRefresh()}
            iconColor="#FFFFFF"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8 }}
            accessibilityLabel="Refresh"
          />
        </View>
      </LinearGradient>
      {stats && (
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text variant="bodySmall" style={[styles.statLabel, { color: '#FFFFFF' }]}>Active</Text>
            <Text variant="titleMedium" style={[styles.statValue, { color: '#FFFFFF' }]}>
              {stats.statusCounts.not_started + stats.statusCounts.in_progress + stats.statusCounts.halfway}
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text variant="bodySmall" style={[styles.statLabel, { color: '#FFFFFF' }]}>Delivered</Text>
            <Text variant="titleMedium" style={[styles.statValue, { color: '#FFFFFF' }]}>{stats.statusCounts.delivered}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#F97316', '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, marginHorizontal: 6, padding: 12, borderRadius: 12, alignItems: 'center' }}
          >
            <Text variant="bodySmall" style={[styles.statLabel, { color: '#FFFFFF' }]}>Cancelled</Text>
            <Text variant="titleMedium" style={[styles.statValue, { color: '#FFFFFF' }]}>
              {stats.statusCounts.cancelled}
            </Text>
          </LinearGradient>
        </View>
      )}

      <View style={styles.filterContainer}>
        <Searchbar
          placeholder="Search orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Chip
          selected={assignedToMeFilter}
          onPress={() => setAssignedToMeFilter(!assignedToMeFilter)}
          style={[
            styles.assignedToMeChip,
            assignedToMeFilter && styles.assignedToMeChipActive,
          ]}
          textStyle={[
            styles.assignedToMeText,
            assignedToMeFilter && styles.assignedToMeTextActive,
          ]}
          icon={assignedToMeFilter ? 'account-check' : 'account'}
        >
          Assigned to Me
        </Chip>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statusFilterRow}>
            {[
              { value: 'all', label: 'All' },
              { value: 'not_started', label: 'Not Started' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'halfway', label: 'Halfway' },
              { value: 'completed', label: 'Completed' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'cancelled', label: 'Cancelled' },
            ].map((status) => (
              <Chip
                key={status.value}
                selected={statusFilter === status.value}
                onPress={() => setStatusFilter(status.value)}
                style={[
                  styles.statusFilterChip,
                  statusFilter === status.value && styles.statusFilterChipActive,
                ]}
                textStyle={[
                  styles.statusFilterText,
                  statusFilter === status.value && styles.statusFilterTextActive,
                ]}
              >
                {status.label}
              </Chip>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={64} color={colors.text} />
            <Text variant="titleMedium" style={styles.emptyText}>No orders found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>Create your first order to get started</Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <TouchableOpacity key={order._id} onPress={() => handleViewDetails(order)}>
              <Card style={styles.orderCard}>
                <Card.Content>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderLeft}>
                      <Text variant="titleMedium" style={styles.orderNumber}>{order.orderNumber}</Text>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: getStatusColor(order.status) }]}
                        textStyle={styles.statusChipText}
                      >
                        {getStatusLabel(order.status)}
                      </Chip>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
                  </View>

                  {order.customerName && (
                    <View style={styles.orderRow}>
                      <MaterialCommunityIcons name="account" size={16} color={colors.textMuted} />
                      <Text variant="bodyMedium" style={styles.orderInfo}>{order.customerName}</Text>
                    </View>
                  )}

                  <View style={styles.orderRow}>
                    <MaterialCommunityIcons name="calendar" size={16} color={colors.textMuted} />
                    <Text variant="bodyMedium" style={styles.orderInfo}>
                      Due: {new Date(order.dueDate).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.orderRow}>
                    <MaterialCommunityIcons name="package-variant" size={16} color={colors.textMuted} />
                    <Text variant="bodyMedium" style={styles.orderInfo}>
                      {order.items.length} item(s)
                    </Text>
                  </View>

                  {order.completionPercentage > 0 && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${order.completionPercentage}%` }]} />
                      </View>
                      <Text variant="bodySmall" style={styles.progressText}>{order.completionPercentage}%</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

   {user?.role === 'owner' &&    <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/order/create-order')}
        label="New Order"
      />}

      <Portal>
        <Modal visible={detailModalVisible} onDismiss={() => setDetailModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView>
            {selectedOrder && (
              <>
                <Text variant="headlineSmall" style={styles.modalTitle}>{selectedOrder.orderNumber}</Text>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getStatusColor(selectedOrder.status) }]}
                  textStyle={styles.statusChipText}
                >
                  {getStatusLabel(selectedOrder.status)}
                </Chip>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>Customer Details</Text>
                <Text variant="bodyMedium">Name: {selectedOrder.customerName || 'N/A'}</Text>
                <Text variant="bodyMedium">Contact: {selectedOrder.customerContact || 'N/A'}</Text>

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>Items</Text>
                {selectedOrder.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text variant="bodyMedium">{item.materialName}</Text>
                    <Text variant="bodyMedium">{item.quantity} {item.unit}</Text>
                  </View>
                ))}

                <Divider style={styles.divider} />

                <Text variant="titleMedium" style={styles.sectionTitle}>Assigned Staff</Text>
                {selectedOrder.assignedTo && selectedOrder.assignedTo.length > 0 ? (
                  <View style={styles.staffList}>
                    {selectedOrder.assignedTo.map((staff) => (
                      <Chip key={staff._id} style={styles.staffChip}>
                        {staff.name}
                      </Chip>
                    ))}
                  </View>
                ) : (
                  <Text variant="bodyMedium" style={styles.emptyText}>No staff assigned</Text>
                )}

                {user?.role === 'owner' && staffMembers.length > 0 && (
                  <Button mode="outlined" onPress={() => {
                    setDetailModalVisible(false);
                    router.push(`/order/assign-staff?orderId=${selectedOrder._id}`);
                  }} style={styles.modalButton}>
                    Assign Staff
                  </Button>
                )}

                <Divider style={styles.divider} />


                <View style={styles.buttonRow}>
                  <Button mode="outlined" onPress={() => {
                    setDetailModalVisible(false);
                    router.push(`/order/manage-steps?orderId=${selectedOrder._id}`);
                  }} style={styles.halfButton} icon="format-list-checks">
                    Steps
                  </Button>
                  <Button mode="outlined" onPress={() => {
                    setDetailModalVisible(false);
                    router.push(`/order/order-history?orderId=${selectedOrder._id}`);
                  }} style={styles.halfButton} icon="history">
                    History
                  </Button>
                </View>

                <Divider style={styles.divider} />

                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Update Status</Text>
                    <View style={styles.statusUpdateContainer}>
                      <Menu
                      style={styles.statusMenu}
                        visible={statusMenuVisible}
                        onDismiss={() => setStatusMenuVisible(false)}
                        anchor={
                          <Button
                            mode="contained"
                            onPress={() => setStatusMenuVisible(true)}
                            style={styles.statusUpdateButton}
                            icon="update"
                            loading={updatingStatus}
                            disabled={updatingStatus}
                          >
                            Update Status
                          </Button>
                        }
                      >
                        {selectedOrder.status !== 'in_progress' && selectedOrder.status !== 'halfway' && selectedOrder.status !== 'completed' && (
                          <Menu.Item
                            onPress={() => {
                              setStatusMenuVisible(false);
                              handleUpdateStatus(selectedOrder._id, 'in_progress');
                            }}
                            title="Mark In Progress"
                            leadingIcon="play-circle"
                          />
                        )}
                        {selectedOrder.status !== 'halfway' && selectedOrder.status !== 'completed' && (
                          <Menu.Item
                            onPress={() => {
                              setStatusMenuVisible(false);
                              handleUpdateStatus(selectedOrder._id, 'halfway');
                            }}
                            title="Mark Halfway"
                            leadingIcon="progress-half"
                          />
                        )}
                        {selectedOrder.status !== 'completed' && (
                          <Menu.Item
                            onPress={() => {
                              setStatusMenuVisible(false);
                              handleUpdateStatus(selectedOrder._id, 'completed');
                            }}
                            title="Mark Completed"
                            leadingIcon="check-circle"
                          />
                        )}
                        {selectedOrder.status === 'completed' && (
                          <Menu.Item
                            onPress={() => {
                              setStatusMenuVisible(false);
                              handleMarkDelivered(selectedOrder._id);
                            }}
                            title="Mark Delivered"
                            leadingIcon="truck-delivery"
                          />
                        )}
                      </Menu>
                    </View>
                    <Divider style={styles.divider} />
                  </>
                )}


                <View style={styles.actionButtons}>
                  {user?.role === 'owner' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <Button mode="contained" onPress={() => {
                      setDetailModalVisible(false);
                      router.push(`/order/edit-order?orderId=${selectedOrder._id}`);
                    }} style={styles.actionButton} icon="pencil">
                      Edit Order
                    </Button>
                  )}
                  {user?.role === 'owner' && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <Button
                      mode="outlined"
                      onPress={() => handleCancelOrder(selectedOrder._id)}
                      style={styles.actionButton}
                      loading={cancellingOrderId === selectedOrder._id}
                      disabled={cancellingOrderId === selectedOrder._id}
                    >
                      Cancel Order
                    </Button>
                  )}
                  {selectedOrder.status === 'delivered' && selectedOrder.receiptId && (
                    <Button mode="contained" onPress={() => {
                      setDetailModalVisible(false);
                      router.push(`/order/receipt-detail?receiptId=${selectedOrder.receiptId}&orderId=${selectedOrder._id}`);
                    }} style={styles.actionButton} icon="receipt">
                      View Receipt
                    </Button>
                  )}
                  <Button mode="text" onPress={() => setDetailModalVisible(false)}>Close</Button>
                </View>
              </>
            )}
          </ScrollView>
        </Modal>

        <Modal visible={createModalVisible} onDismiss={() => setCreateModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView>
            <Text variant="headlineSmall" style={styles.modalTitle}>Create New Order</Text>

            <TextInput
              label="Customer Name"
              value={newOrder.customerName}
              onChangeText={(text) => setNewOrder({ ...newOrder, customerName: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Customer Contact"
              value={newOrder.customerContact}
              onChangeText={(text) => setNewOrder({ ...newOrder, customerContact: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Due Date (YYYY-MM-DD)"
              value={newOrder.dueDate}
              onChangeText={(text) => setNewOrder({ ...newOrder, dueDate: text })}
              style={styles.input}
              mode="outlined"
            />

            <Text variant="titleMedium" style={styles.sectionTitle}>Items</Text>
            {newOrder.items.map((item, idx) => (
              <View key={idx} style={styles.itemInputRow}>
                <View style={styles.itemInputs}>
                  <TextInput
                    label="Material ID"
                    value={item.materialId}
                    onChangeText={(text) => updateItem(idx, 'materialId', text)}
                    style={styles.itemInput}
                    mode="outlined"
                  />
                  <TextInput
                    label="Quantity"
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateItem(idx, 'quantity', parseFloat(text) || 0)}
                    style={styles.itemInput}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity onPress={() => removeItem(idx)}>
                  <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}

            <Button mode="outlined" onPress={addNewItem} style={styles.modalButton}>Add Item</Button>

            <TextInput
              label="Notes"
              value={newOrder.notes}
              onChangeText={(text) => setNewOrder({ ...newOrder, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />

            <View style={styles.actionButtons}>
              <Button mode="contained" onPress={handleCreateOrder} style={styles.actionButton}>Create</Button>
              <Button mode="text" onPress={() => setCreateModalVisible(false)}>Cancel</Button>
            </View>
          </ScrollView>
        </Modal>

        <Modal visible={stepsModalVisible} onDismiss={() => setStepsModalVisible(false)} contentContainerStyle={styles.modal}>
          <ScrollView>
            {selectedOrder && (
              <>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  Production Steps - {selectedOrder.orderNumber}
                </Text>

                {productionSteps.length === 0 ? (
                  <Text variant="bodyMedium" style={styles.emptyText}>No steps added yet</Text>
                ) : (
                  productionSteps.map(step => (
                    <View key={step._id} style={styles.stepDetailRow}>
                      <TouchableOpacity onPress={() => handleToggleStep(step._id, step.isCompleted)}>
                        <MaterialCommunityIcons
                          name={step.isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={28}
                          color={step.isCompleted ? colors.success : colors.textMuted}
                        />
                      </TouchableOpacity>
                      <View style={styles.stepDetailContent}>
                        <Text variant="titleMedium">{step.stepNumber}. {step.description}</Text>
                        {step.notes && <Text variant="bodySmall" style={styles.stepNotes}>{step.notes}</Text>}
                        {step.isCompleted && step.completedBy && (
                          <Text variant="bodySmall" style={styles.completedBy}>
                            Completed by {step.completedBy.name}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))
                )}

                <Button mode="text" onPress={() => setStepsModalVisible(false)} style={styles.modalButton}>Close</Button>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
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
    flexDirection: 'column',
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  statusMenu : {
    backgroundColor: colors.surface,
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: 12
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '700',
    color: colors.text,
  },
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  searchbar: {
    backgroundColor: colors.surface,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  statusFilterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusFilterText: {
    color: colors.text,
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  assignedToMeChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  assignedToMeChipActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  assignedToMeText: {
    color: colors.text,
  },
  assignedToMeTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    color: colors.text,
  },
  emptySubtext: {
    marginTop: 8,
    color: colors.text,
  },
  orderCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderNumber: {
    fontWeight: '700',
    color: colors.text,
  },
  statusChip: {
    height: 34,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  orderInfo: {
    color: colors.text,
  },
  progressContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.text,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderColor: colors.border,
    backgroundColor: colors.primary,
    color: colors.text
  },
  modal: {
    backgroundColor: colors.surface,
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
    color: colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  stepText: {
    flex: 1,
    color: colors.text,
  },
  staffList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  staffChip: {
    backgroundColor: colors.primary,
  },
  stepDetailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  stepDetailContent: {
    flex: 1,
  },
  stepNotes: {
    color: colors.textMuted,
    marginTop: 4,
  },
  completedBy: {
    color: colors.success,
    marginTop: 4,
    fontStyle: 'italic',
  },
  modalButton: {
    marginTop: 12,
    color: colors.text,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  halfButton: {
    flex: 1,
    color: colors.text,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  statusUpdateContainer: {
    marginBottom: 12,
  },
  statusUpdateButton: {
    backgroundColor: colors.primary,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  itemInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  itemInputs: {
    flex: 1,
    gap: 8,
  },
  itemInput: {
    backgroundColor: colors.background,
  },
});
