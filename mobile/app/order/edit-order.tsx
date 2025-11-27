import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService, { Order } from '../../services/order.service';
import itemService, { Item } from '../../services/item.service';

export default function EditOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [materials, setMaterials] = useState<Item[]>([]);

  const [orderData, setOrderData] = useState({
    customerName: '',
    customerContact: '',
    items: [{ materialId: '', quantity: 0 }],
    dueDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderData, materialsData] = await Promise.all([
        orderService.getOrder(orderId),
        itemService.listItems(),
      ]);

      setOrder(orderData);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);

      setOrderData({
        customerName: orderData.customerName || '',
        customerContact: orderData.customerContact || '',
        items: orderData.items.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity,
        })),
        dueDate: orderData.dueDate.split('T')[0],
        notes: orderData.notes || '',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const addNewItem = () => {
    setOrderData({
      ...orderData,
      items: [...orderData.items, { materialId: '', quantity: 0 }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...orderData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setOrderData({ ...orderData, items: updatedItems });
  };

  const removeItem = (index: number) => {
    setOrderData({
      ...orderData,
      items: orderData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateOrder = async () => {
    if (!orderData.customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    const validItems = orderData.items.filter(item => item.materialId && item.quantity > 0);
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with valid material and quantity');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.updateOrder(orderId, {
        ...orderData,
        items: validItems,
      });
      Alert.alert('Success', 'Order updated successfully');
      router.back();
    } catch (error: any) {
      console.error('Failed to update order:', error);
      Alert.alert('Error', error.message || 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
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
            <Text variant="headlineMedium" style={styles.title}>Edit Order</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              {order?.orderNumber}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Customer Information</Text>

            <TextInput
              label="Customer Name *"
              value={orderData.customerName}
              onChangeText={(text) => setOrderData({ ...orderData, customerName: text })}
              style={styles.input}
              mode="outlined"
            />

            <TextInput
              label="Customer Contact"
              value={orderData.customerContact}
              onChangeText={(text) => setOrderData({ ...orderData, customerContact: text })}
              style={styles.input}
              mode="outlined"
              keyboardType="phone-pad"
            />

            <TextInput
              label="Due Date (YYYY-MM-DD)"
              value={orderData.dueDate}
              onChangeText={(text) => setOrderData({ ...orderData, dueDate: text })}
              style={styles.input}
              mode="outlined"
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Items *</Text>
              <Button mode="outlined" onPress={addNewItem} icon="plus">
                Add Item
              </Button>
            </View>

            {orderData.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemInputs}>
                  <View style={styles.pickerContainer}>
                    <Text variant="bodySmall" style={styles.pickerLabel}>Material *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.materialChips}>
                        {materials.map((material) => (
                          <Chip
                            key={material._id}
                            selected={item.materialId === material._id}
                            onPress={() => updateItem(idx, 'materialId', material._id)}
                            style={[
                              styles.materialChip,
                              item.materialId === material._id && styles.materialChipSelected,
                            ]}
                            textStyle={[
                              styles.materialChipText,
                              item.materialId === material._id && styles.materialChipTextSelected,
                            ]}
                          >
                            {material.name}
                          </Chip>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  <TextInput
                    label="Quantity *"
                    value={item.quantity.toString()}
                    onChangeText={(text) => updateItem(idx, 'quantity', parseFloat(text) || 0)}
                    style={styles.quantityInput}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                </View>
                {orderData.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)} style={styles.deleteButton}>
                    <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              label="Notes"
              value={orderData.notes}
              onChangeText={(text) => setOrderData({ ...orderData, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
            />
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleUpdateOrder}
            style={styles.updateButton}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Updating...' : 'Update Order'}
          </Button>
          <Button mode="outlined" onPress={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
        </View>
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
  card: {
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text,
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInputs: {
    flex: 1,
    gap: 12,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  pickerLabel: {
    color: colors.text,
    marginBottom: 8,
  },
  materialChips: {
    flexDirection: 'row',
    gap: 8,
  },
  materialChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  materialChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  materialChipText: {
    color: colors.text,
  },
  materialChipTextSelected: {
    color: '#FFFFFF',
  },
  quantityInput: {
    backgroundColor: colors.background,
  },
  deleteButton: {
    marginLeft: 12,
    marginTop: 8,
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
  },
  updateButton: {
    backgroundColor: colors.primary,
  },
});
