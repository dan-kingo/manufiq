import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import progressService, { Receipt } from '../../services/progress.service';

export default function ReceiptsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterReceipts();
  }, [receipts, searchQuery]);

  const loadData = async () => {
    try {
      const data = await progressService.listReceipts({ limit: 100 });
      setReceipts(data.receipts);
      setFilteredReceipts(data.receipts);
    } catch (error) {
      console.error('Failed to load receipts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterReceipts = () => {
    let filtered = [...receipts];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.receiptNumber.toLowerCase().includes(query) ||
        r.customerName?.toLowerCase().includes(query) ||
        r.customerContact?.toLowerCase().includes(query)
      );
    }

    setFilteredReceipts(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

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
          <Text variant="headlineMedium" style={styles.title}>Receipts</Text>
          <Text variant="bodyMedium" style={styles.subTitle}>
            View all delivery receipts
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search receipts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredReceipts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="receipt" size={64} color={colors.textMuted} />
            <Text variant="titleMedium" style={styles.emptyText}>No receipts found</Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              Receipts are generated when orders are delivered
            </Text>
          </View>
        ) : (
          filteredReceipts.map(receipt => (
            <TouchableOpacity
              key={receipt._id}
              onPress={() => router.push(`/order/receipt-detail?orderId=${receipt.orderId}`)}
            >
              <Card style={styles.receiptCard}>
                <Card.Content>
                  <View style={styles.receiptHeader}>
                    <View style={styles.receiptIconContainer}>
                      <MaterialCommunityIcons name="receipt" size={28} color={colors.primary} />
                    </View>
                    <View style={styles.receiptInfo}>
                      <Text variant="titleMedium" style={styles.receiptNumber}>
                        {receipt.receiptNumber}
                      </Text>
                      <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={colors.textMuted} />
                        <Text variant="bodySmall" style={styles.dateText}>
                          {formatDate(receipt.issuedAt)}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
                  </View>

                  {receipt.customerName && (
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="account" size={16} color={colors.textMuted} />
                      <Text variant="bodyMedium" style={styles.infoText}>
                        {receipt.customerName}
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="package-variant" size={16} color={colors.textMuted} />
                    <Text variant="bodyMedium" style={styles.infoText}>
                      {receipt.items.length} item(s)
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="account-check" size={16} color={colors.textMuted} />
                    <Text variant="bodyMedium" style={styles.infoText}>
                      Issued by {receipt.issuedBy.name}
                    </Text>
                  </View>

                  <View style={styles.stepsRow}>
                    <Chip
                      icon="check-circle"
                      style={styles.stepsChip}
                      textStyle={styles.stepsChipText}
                    >
                      {receipt.completedSteps.length} steps completed
                    </Chip>
                  </View>
                </Card.Content>
              </Card>
            </TouchableOpacity>
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
    flexDirection: 'column',
  },
  title: {
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  subTitle: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    padding: 16,
  },
  searchbar: {
    backgroundColor: colors.surface,
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
  emptySubtext: {
    marginTop: 8,
    color: colors.textMuted,
    textAlign: 'center',
  },
  receiptCard: {
    marginBottom: 12,
    backgroundColor: colors.surface,
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptNumber: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: colors.textMuted,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    color: colors.text,
  },
  stepsRow: {
    marginTop: 12,
  },
  stepsChip: {
    backgroundColor: colors.success + '20',
    alignSelf: 'flex-start',
  },
  stepsChipText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
});
