import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import orderService, { Order } from '../../services/order.service';
import staffService from '../../services/staff.service';

export default function AssignStaffScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderData, staffData] = await Promise.all([
        orderService.getOrder(orderId),
        staffService.getStaff(),
      ]);
      setOrder(orderData);
      setStaffMembers(staffData?.staff || []);
      setSelectedStaff(orderData.assignedTo?.map(s => s._id) || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStaffMember = (staffId: string) => {
    if (selectedStaff.includes(staffId)) {
      setSelectedStaff(selectedStaff.filter(id => id !== staffId));
    } else {
      setSelectedStaff([...selectedStaff, staffId]);
    }
  };

  const handleAssignStaff = async () => {
    try {
      setSubmitting(true);
      await orderService.assignStaff(orderId, selectedStaff);
      Alert.alert('Success', 'Staff assigned successfully');
      router.back();
    } catch (error: any) {
      console.error('Failed to assign staff:', error);
      Alert.alert('Error', error.message || 'Failed to assign staff');
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
            <Text variant="headlineMedium" style={styles.title}>Assign Staff</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              {order?.orderNumber || 'Order'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Select Staff Members ({selectedStaff.length} selected)
            </Text>
            {staffMembers.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No staff members available
              </Text>
            ) : (
              <View style={styles.staffList}>
                {staffMembers.map((staff) => (
                  <Chip
                    key={staff._id}
                    selected={selectedStaff.includes(staff._id)}
                    onPress={() => toggleStaffMember(staff._id)}
                    style={[
                      styles.staffChip,
                      selectedStaff.includes(staff._id) && styles.staffChipSelected,
                    ]}
                    textStyle={[
                      styles.staffChipText,
                      selectedStaff.includes(staff._id) && styles.staffChipTextSelected,
                    ]}
                    icon={selectedStaff.includes(staff._id) ? 'check' : undefined}
                  >
                    {staff.name}
                  </Chip>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.actionButtons}>
          <Button
            mode="contained"
            onPress={handleAssignStaff}
            style={styles.assignButton}
            loading={submitting}
            disabled={submitting}
          >
            Assign Staff
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
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
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
  },
  assignButton: {
    backgroundColor: colors.primary,
  },
});
