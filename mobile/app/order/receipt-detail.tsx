import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import { Text, Card, ActivityIndicator, IconButton, Button, Divider, Chip } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import progressService, { Receipt } from '../../services/progress.service';

export default function ReceiptDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;
  const receiptId = params.receiptId as string;

  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const loadData = async () => {
    try {
      if (!orderId) {
        throw new Error('Missing order ID');
      }
      const data = await progressService.getReceipt(orderId);
      setReceipt(data);
    } catch (error) {
      console.error('Failed to load receipt:', error);
      Alert.alert('Error', 'Failed to load receipt details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleShare = async () => {
    if (!receipt) return;

    const message = `
Receipt: ${receipt.receiptNumber}
Customer: ${receipt.customerName || 'N/A'}
Contact: ${receipt.customerContact || 'N/A'}
Issued: ${formatDate(receipt.issuedAt)}
Issued By: ${receipt.issuedBy.name}

Items:
${receipt.items.map(item => `- ${item.materialName}: ${item.quantity} ${item.unit}`).join('\n')}

Completed Steps (${receipt.completedSteps.length}):
${receipt.completedSteps.map((step, idx) => `${idx + 1}. ${step.description}`).join('\n')}
    `.trim();

    try {
      await Share.share({
        message,
        title: `Receipt ${receipt.receiptNumber}`,
      });
    } catch (error) {
      console.error('Failed to share receipt:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="receipt" size={64} color={colors.textMuted} />
        <Text variant="titleMedium" style={styles.emptyText}>Receipt not found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
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
            <Text variant="headlineMedium" style={styles.title}>Receipt</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              {receipt.receiptNumber}
            </Text>
          </View>
          <IconButton
            icon="share-variant"
            size={24}
            iconColor="#FFFFFF"
            onPress={handleShare}
          />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.receiptHeader}>
              <View style={styles.receiptIconContainer}>
                <MaterialCommunityIcons name="receipt" size={48} color={colors.primary} />
              </View>
              <View style={styles.receiptHeaderText}>
                <Text variant="headlineSmall" style={styles.receiptNumber}>
                  {receipt.receiptNumber}
                </Text>
                <Chip
                  icon="check-circle"
                  style={styles.deliveredChip}
                  textStyle={styles.deliveredChipText}
                >
                  Delivered
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account" size={20} color={colors.textMuted} />
              <Text variant="bodyLarge" style={styles.infoText}>
                {receipt.customerName || 'N/A'}
              </Text>
            </View>
            {receipt.customerContact && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={20} color={colors.textMuted} />
                <Text variant="bodyLarge" style={styles.infoText}>
                  {receipt.customerContact}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="calendar-check" size={20} color={colors.textMuted} />
              <View style={styles.infoColumn}>
                <Text variant="bodySmall" style={styles.infoLabel}>Issued At</Text>
                <Text variant="bodyLarge" style={styles.infoText}>
                  {formatDate(receipt.issuedAt)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-check" size={20} color={colors.textMuted} />
              <View style={styles.infoColumn}>
                <Text variant="bodySmall" style={styles.infoLabel}>Issued By</Text>
                <Text variant="bodyLarge" style={styles.infoText}>
                  {receipt.issuedBy.name}
                </Text>
                <Text variant="bodySmall" style={styles.infoEmail}>
                  {receipt.issuedBy.email}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Items Delivered</Text>
            {receipt.items.map((item, index) => (
              <View key={index}>
                <View style={styles.itemRow}>
                  <View style={styles.itemIconContainer}>
                    <MaterialCommunityIcons name="package-variant" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text variant="titleSmall" style={styles.itemName}>
                      {item.materialName}
                    </Text>
                    <Text variant="bodyMedium" style={styles.itemQuantity}>
                      Quantity: {item.quantity} {item.unit}
                    </Text>
                  </View>
                </View>
                {index < receipt.items.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Completed Production Steps ({receipt.completedSteps.length})
            </Text>
            {receipt.completedSteps.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptySteps}>
                No production steps recorded
              </Text>
            ) : (
              receipt.completedSteps.map((step, index) => (
                <View key={step._id || `step-${index}`}>
                  <View style={styles.stepRow}>
                    <View style={styles.stepNumberContainer}>
                      <Text style={styles.stepNumber}>{step.stepNumber}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text variant="titleSmall" style={styles.stepDescription}>
                        {step.description}
                      </Text>
                      {step.notes && (
                        <Text variant="bodySmall" style={styles.stepNotes}>
                          {step.notes}
                        </Text>
                      )}
                      {step.completedBy && (
                        <View style={styles.completedByRow}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} />
                          <Text variant="bodySmall" style={styles.completedByText}>
                            Completed by {step.completedBy.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {index < receipt.completedSteps.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
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
    padding: 24,
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
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  receiptIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptHeaderText: {
    flex: 1,
  },
  receiptNumber: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  deliveredChip: {
    backgroundColor: colors.success + '20',
    alignSelf: 'flex-start',
  },
  deliveredChipText: {
    color: colors.success,
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoText: {
    color: colors.text,
  },
  infoEmail: {
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  itemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    color: colors.textMuted,
  },
  divider: {
    marginVertical: 8,
  },
  emptySteps: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumber: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepNotes: {
    color: colors.textMuted,
    marginBottom: 4,
  },
  completedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  completedByText: {
    color: colors.success,
    fontStyle: 'italic',
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    color: colors.textMuted,
  },
  backButton: {
    backgroundColor: colors.primary,
  },
});
