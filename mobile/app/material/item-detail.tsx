import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, Button, ActivityIndicator, Dialog, Portal, TextInput, SegmentedButtons, Card, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService, { Item } from '../../services/item.service';
import { useAuth } from '../../contexts/AuthContext';
export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<Item | null>(null);
  const [adjustDialogVisible, setAdjustDialogVisible] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustAction, setAdjustAction] = useState<'added' | 'sold' | 'used' | 'adjusted'>('sold');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);
const { user } = useAuth();
  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    try {
      const data = await itemService.getItem(id as string);
      setItem(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load material details');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustQuantity = async () => {
    if (!adjustAmount || parseInt(adjustAmount) === 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    setAdjusting(true);
    try {
      let delta = parseInt(adjustAmount);
      if (adjustAction === 'sold' || adjustAction === 'used') {
        delta = -delta;
      }

      await itemService.adjustQuantity(id as string, {
        delta,
        action: adjustAction,
        reason: adjustReason || undefined,
      });

      setAdjustDialogVisible(false);
      setAdjustAmount('');
      setAdjustReason('');
      loadItem();
      Alert.alert('Success', 'Quantity adjusted successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to adjust quantity');
    } finally {
      setAdjusting(false);
    }
  };

  const getStockStatus = () => {
    if (!item) return { label: 'Unknown', color: colors.textMuted };
    if (item.quantity === 0) return { label: 'Out of Stock', color: colors.error };
    if (item.quantity <= (item.minThreshold || 0)) return { label: 'Low Stock', color: colors.warning };
    return { label: 'In Stock', color: colors.success };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleLarge" style={styles.errorText}>
          Material not found
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
      </View>
    );
  }

  const status = getStockStatus();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <LinearGradient
         colors={[colors.secondary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}> 
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor="#FFFFFF"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8 }}
            accessibilityLabel="Back"
          />

          <Text variant="titleMedium" style={[styles.headerTitle, { color: '#FFFFFF' }]}>
            Material Details
          </Text>

          {user?.role === 'owner' ? (
            <IconButton
              icon="pencil"
              size={22}
              onPress={() => router.push(`/material/edit-item?id=${id}`)}
              iconColor="#FFFFFF"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 8 }}
              accessibilityLabel="Edit"
            />
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {item.image && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.label}
          </Text>
        </View>

        <Text variant="headlineMedium" style={styles.itemName}>
          {item.name}
        </Text>

        {item.sku && (
          <Text variant="bodyLarge" style={styles.itemSku}>
            SKU: {item.sku}
          </Text>
        )}

        {item.description && (
          <Text variant="bodyMedium" style={styles.itemDescription}>
            {item.description}
          </Text>
        )}

        <Card style={styles.quantityCard}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quantityGradient}
          >
            <Text variant="titleMedium" style={styles.quantityLabel}>
              Current Quantity
            </Text>
            <View style={styles.quantityRow}>
              <Text variant="displaySmall" style={styles.quantityValue}>
                {item.quantity}
              </Text>
              <Text variant="headlineSmall" style={styles.quantityUnit}>
                {item.unit}
              </Text>
            </View>
          </LinearGradient>
        </Card>

        <View style={styles.detailsSection}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Details
          </Text>

          {item.category && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={24} color={colors.text} />
              <View style={styles.detailContent}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Category
                </Text>
                <Text variant="bodyLarge" style={styles.detailValue}>
                  {item.category}
                </Text>
              </View>
            </View>
          )}

          {item.location && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="map-marker" size={24} color={colors.text} />
              <View style={styles.detailContent}>
                <Text variant="bodySmall" style={styles.detailLabel}>
                  Location
                </Text>
                <Text variant="bodyLarge" style={styles.detailValue}>
                  {item.location}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="alert-circle" size={24} color={colors.text} />
            <View style={styles.detailContent}>
              <Text variant="bodySmall" style={styles.detailLabel}>
                Minimum Threshold
              </Text>
              <Text variant="bodyLarge" style={styles.detailValue}>
                {item.minThreshold} {item.unit}
              </Text>
            </View>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={() => setAdjustDialogVisible(true)}
          style={styles.adjustButton}
          labelStyle={styles.adjustButtonLabel}
          contentStyle={styles.buttonContent}
          icon={() => <MaterialCommunityIcons name="plus-minus" size={20} color={colors.text} />}
        >
          Adjust Quantity
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={adjustDialogVisible}
          onDismiss={() => setAdjustDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Adjust Quantity</Dialog.Title>
            <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Amount"
              value={adjustAmount}
              onChangeText={setAdjustAmount}
              mode="outlined"
              keyboardType="numeric"
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <View style={styles.actionContainer}>
              <Text variant="bodyMedium" style={styles.actionLabel}>
                Action
              </Text>
              <SegmentedButtons
                value={adjustAction}
                onValueChange={(value) => setAdjustAction(value as any)}
                buttons={[
                  { value: 'added', label: 'Add' },
                  { value: 'sold', label: 'Sell' },
                  { value: 'used', label: 'Use' },
                ]}
                style={styles.segmentedButtons}
                theme={{
                  colors: {
                    secondaryContainer: colors.primary,
                    onSecondaryContainer: colors.text,
                  },
                }}
              />
            </View>

            <TextInput
              label="Reason (Optional)"
              value={adjustReason}
              onChangeText={setAdjustReason}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.dialogInput}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <View style={styles.actionRow}>
              <Button
                mode="outlined"
                onPress={() => setAdjustDialogVisible(false)}
                disabled={adjusting}
                style={styles.cancelButton}
                contentStyle={styles.cancelButtonContent}
                labelStyle={styles.cancelButtonLabel}
                icon={() => <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleAdjustQuantity}
                loading={adjusting}
                disabled={adjusting}
                style={styles.confirmButton}
                contentStyle={styles.confirmButtonContent}
                labelStyle={styles.confirmButtonLabel}
                icon={() => <MaterialCommunityIcons name="plus-minus" size={18} color={colors.text} />}
              >
                Adjust
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 12
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
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
    fontSize: 22
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
    marginBottom: 20,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemName: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  itemSku: {
    color: colors.textSecondary,
    marginBottom: 16,
  },
  itemDescription: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  quantityCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 32,
  },
  quantityGradient: {
    padding: 24,
    alignItems: 'center',
  },
  quantityLabel: {
    color: colors.text,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  quantityValue: {
    color: colors.text,
    fontWeight: 'bold',
  },
  quantityUnit: {
    color: colors.text + 'CC',
  },
  detailsSection: {
    gap: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: colors.text,
    marginBottom: 4,
  },
  detailValue: {
    color: colors.text,
    fontWeight: '500',
  },
  adjustButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
     borderWidth: 1,
    borderColor:colors.border,
    marginBottom:12,
  },
  adjustButtonLabel: {
    fontSize: 16,

    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
  dialog: {
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    color: colors.text,
  },
  dialogContent: {
    gap: 16,
  },
  dialogInput: {
    backgroundColor: colors.surfaceVariant,
  },
  // Adjust dialog actions
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelButtonContent: {
    height: 48,
  },
  cancelButtonLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  confirmButtonContent: {
    height: 48,
  },
  confirmButtonLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  actionContainer: {
    marginVertical: 8,
  },
  actionLabel: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: colors.surfaceVariant,
  },
});
