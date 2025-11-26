import React, { useState, useEffect, useRef } from 'react';
import ActionSheet from 'react-native-actions-sheet';

import { View, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Button, Card, ActivityIndicator, FAB, IconButton, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import staffService, { Staff } from '../../services/staff.service';

export default function StaffManagementScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedMember, setSelectedMember] = useState<Staff | null>(null);
  const actionSheetRef = useRef<any>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const data = await staffService.getStaff();
      setStaff(data.staff);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load staff');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const handleEdit = (staffId: string) => {
    router.push(`/settings/edit-staff?id=${staffId}`);
  };

  const handleSuspend = async (staffMember: Staff) => {
    // close any open UI state handled by action sheet
    closeActionSheet();

    Alert.alert(
      'Suspend Staff Member',
      `Are you sure you want to suspend ${staffMember.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.suspendUser(staffMember._id, 'Suspended by owner');
              Alert.alert('Success', 'Staff member suspended successfully');
              loadStaff();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to suspend staff member');
            }
          },
        },
      ]
    );
  };

  const handleUnsuspend = async (staffMember: Staff) => {
    closeActionSheet();

    try {
      await staffService.unsuspendUser(staffMember._id);
      Alert.alert('Success', 'Staff member unsuspended successfully');
      loadStaff();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to unsuspend staff member');
    }
  };

  const handleDelete = async (staffMember: Staff) => {
    closeActionSheet();

    Alert.alert(
      'Delete Staff Member',
      `Are you sure you want to delete ${staffMember.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await staffService.deleteStaff(staffMember._id);
              Alert.alert('Success', 'Staff member deleted successfully');
              loadStaff();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete staff member');
            }
          },
        },
      ]
    );
  };

  // Fixed menu toggle function
  // (menu UI replaced with ActionSheet)

  const openActionSheet = (member: Staff) => {
    setSelectedMember(member);
    try {
      actionSheetRef.current?.setModalVisible(true);
    } catch (e) {
      actionSheetRef.current?.show?.();
    }
  };

  const closeActionSheet = () => {
    try {
      actionSheetRef.current?.setModalVisible(false);
    } catch (e) {
      actionSheetRef.current?.hide?.();
    }
    setSelectedMember(null);
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
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Staff Management
        </Text>
        <View style={{ width: 80 }} />
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
        {staff.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="account-off" size={64} color={colors.textMuted} />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Staff Members
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              Add staff members to help manage your inventory
            </Text>
          </View>
        ) : (
          <View style={styles.staffList}>
            {staff.map((member) => (
              <Card key={member._id} style={styles.staffCard}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.staffHeader}>
                    <View style={styles.avatarContainer}>
                      <LinearGradient
                        colors={member.isSuspended
                          ? [colors.error + '40', colors.error + '20']
                          : [colors.primary + '40', colors.secondary + '40']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatar}
                      >
                        <Text style={styles.avatarText}>
                          {member.name.charAt(0).toUpperCase()}
                        </Text>
                      </LinearGradient>
                    </View>
                    <View style={styles.staffInfo}>
                      <Text variant="titleMedium" style={styles.staffName}>
                        {member.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.staffEmail}>
                        {member.email || member.phone}
                      </Text>
                      <View style={styles.badgeRow}>
                        {member.isSuspended && (
                          <Chip
                            style={styles.suspendedBadge}
                            textStyle={styles.suspendedBadgeText}
                            compact
                          >
                            Suspended
                          </Chip>
                        )}
                        {member.isVerified && (
                          <Chip
                            style={styles.verifiedBadge}
                            textStyle={styles.verifiedBadgeText}
                            compact
                          >
                            Verified
                          </Chip>
                        )}
                      </View>
                    </View>
                    <IconButton
                      icon="dots-vertical"
                      size={24}
                      iconColor={colors.text}
                      onPress={() => openActionSheet(member)}
                    />
                  </View>
                  {member.isSuspended && member.suspensionReason && (
                    <View style={styles.suspensionInfo}>
                      <MaterialCommunityIcons name="information" size={16} color={colors.error} />
                      <Text variant="bodySmall" style={styles.suspensionReason}>
                        {member.suspensionReason}
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
      <ActionSheet ref={actionSheetRef} containerStyle={{ padding: 16 , backgroundColor: colors.background }} >
        <View style={{ paddingVertical: 8 }}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>
            {selectedMember ? selectedMember.name : 'Staff' }
          </Text>
          <Text variant="bodySmall" style={{ marginBottom: 12, color: colors.textSecondary }}>
            {selectedMember ? (selectedMember.email || selectedMember.phone) : ''}
          </Text>

          <Button style={{ display:'flex', gap : 24}} mode="text" onPress={() => { if (selectedMember) { handleEdit(selectedMember._id); } closeActionSheet(); }}>
            <MaterialCommunityIcons name="pencil" size={16} color={colors.text} style={{ marginRight: 28 }} />
            <Text>{" "}Edit</Text>
          </Button>

          {selectedMember && selectedMember.isSuspended ? (
            <Button style={{ display:'flex', gap : 24}} mode="text" onPress={async () => { await handleUnsuspend(selectedMember); closeActionSheet(); }}>
              <MaterialCommunityIcons name="account-outline" size={16} color={colors.text} style={{ marginRight: 28 }} />
              <Text> {" "}Unsuspend</Text>
            </Button>
          ) : (
            <Button style={{ display:'flex', gap : 24}} mode="text" onPress={async () => { if (selectedMember) { await handleSuspend(selectedMember); } closeActionSheet(); }}>
              <MaterialCommunityIcons name="account-off" size={16} color={colors.text} style={{ marginRight: 28 }} />
              <Text> {" "}Suspend</Text>
            </Button>
          )}

          <Button style={{ display:'flex', gap : 24, backgroundColor: colors.error + '20'}} mode="text" textColor={colors.text} onPress={async () => { if (selectedMember) { await handleDelete(selectedMember); } closeActionSheet(); }}>
            <MaterialCommunityIcons name="delete" size={16} color={colors.text} style={{ marginRight: 28 }} />
            <Text> {" "}Delete</Text>
          </Button>

          <Button mode="text" onPress={closeActionSheet}>
            Cancel
          </Button>
        </View>
      </ActionSheet>

      <FAB
        icon="plus"
        style={styles.fab}
        color={colors.text}
        onPress={() => router.push('/settings/add-staff')}
        label="Add Staff"
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
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
  staffList: {
    gap: 12,
  },
  staffCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  cardContent: {
    padding: 16,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  staffEmail: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  suspendedBadge: {
    backgroundColor: colors.error + '20',
    height: 44,
  },
  suspendedBadgeText: {
    color: colors.error,
    fontSize: 11,
  },
  verifiedBadge: {
    backgroundColor: colors.success + '20',
    height: 44, // Fixed height
  },
  verifiedBadgeText: {
    color: colors.success,
    fontSize: 11,
  },
  suspensionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    gap: 8,
  },
  suspensionReason: {
    color: colors.error,
    flex: 1,
  },
  menuContent: {
    backgroundColor: colors.surface,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 64,
    backgroundColor: colors.primary,
  },
});