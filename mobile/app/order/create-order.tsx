import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService from '../../services/order.service';
import itemService, { Item } from '../../services/item.service';
import staffService from '../../services/staff.service';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateOrderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [materialsData, staffData] = await Promise.all([
        itemService.listItems(),
        user?.role === 'owner' ? staffService.getStaff() : Promise.resolve({ staff: [] }),
      ]);
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setStaffMembers(staffData?.staff || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
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

  const toggleStaffMember = (staffId: string) => {
    const currentAssigned = newOrder.assignedTo;
    if (currentAssigned.includes(staffId)) {
      setNewOrder({
        ...newOrder,
        assignedTo: currentAssigned.filter(id => id !== staffId),
      });
    } else {
      setNewOrder({
        ...newOrder,
        assignedTo: [...currentAssigned, staffId],
      });
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return;
    }

    const validItems = newOrder.items.filter(item => item.materialId && item.quantity > 0);
    if (validItems.length === 0) {
      Alert.alert('Error', 'Please add at least one item with valid material and quantity');
      return;
    }

    try {
      setSubmitting(true);
      await orderService.createOrder({
        ...newOrder,
        items: validItems,
      });
      Alert.alert('Success', 'Order created successfully');
      router.back();
    } catch (error: any) {
      Alert.alert( 'Insufficient quantity in stock.' );
    } finally {
      setSubmitting(false);
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
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
              <Text variant="headlineMedium" style={styles.title}>Create New Order</Text>
              <Text variant="bodyMedium" style={styles.subTitle}>
                Fill in order details
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Customer Information</Text>

            <TextInput
              label="Customer Name *"
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
              keyboardType="phone-pad"
            />

            <TextInput
              label="Due Date (YYYY-MM-DD)"
              value={newOrder.dueDate}
              onChangeText={(text) => setNewOrder({ ...newOrder, dueDate: text })}
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

            {newOrder.items.map((item, idx) => (
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
                {newOrder.items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)} style={styles.deleteButton}>
                    <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>

        {user?.role === 'owner' && staffMembers.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>Assign Staff</Text>
              <View style={styles.staffList}>
                {staffMembers.map((staff) => (
                  <Chip
                    key={staff._id}
                    selected={newOrder.assignedTo.includes(staff._id)}
                    onPress={() => toggleStaffMember(staff._id)}
                    style={[
                      styles.staffChip,
                      newOrder.assignedTo.includes(staff._id) && styles.staffChipSelected,
                    ]}
                    textStyle={[
                      styles.staffChipText,
                      newOrder.assignedTo.includes(staff._id) && styles.staffChipTextSelected,
                    ]}
                    icon={newOrder.assignedTo.includes(staff._id) ? 'check' : undefined}
                  >
                    {staff.name}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              label="Notes"
              value={newOrder.notes}
              onChangeText={(text) => setNewOrder({ ...newOrder, notes: text })}
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
            onPress={handleCreateOrder}
            style={styles.createButton}
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create Order'}
          </Button>
          <Button mode="outlined" onPress={() => router.back()} disabled={submitting}>
            Cancel
          </Button>
        </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    color: colors.textMuted,
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
  staffList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  staffChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  staffChipSelected: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  staffChipText: {
    color: colors.text,
  },
  staffChipTextSelected: {
    color: '#FFFFFF',
  },
  actionButtons: {
    marginTop: 16,
    gap: 12,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: colors.primary,
  },
  
});
