import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, RefreshControl } from 'react-native';
import { Text, Button, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import syncService from '../../services/sync.service';

export default function SyncStatusScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [deduplicating, setDeduplicating] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const [statusData, conflictsData] = await Promise.all([
        syncService.getStatus(),
        syncService.getConflicts(10),
      ]);
      setStatus(statusData);
      setConflicts(conflictsData.conflicts);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load sync status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStatus();
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
          Sync Status
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
        {status && (
          <Card style={styles.statusCard}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusGradient}
            >
              <MaterialCommunityIcons name="sync" size={48} color={colors.text} />
              <Text variant="titleLarge" style={styles.statusTitle}>
                Sync Service Active
              </Text>
              <Text variant="bodyMedium" style={styles.statusSubtitle}>
                {status.message}
              </Text>
              <View style={styles.statusDetails}>
                <View style={styles.statusDetail}>
                  <Text variant="bodySmall" style={styles.statusLabel}>
                    Server Time
                  </Text>
                  <Text variant="bodyMedium" style={styles.statusValue}>
                    {new Date(status.serverTime).toLocaleString()}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Card>
        )}

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Conflicts
          </Text>
          {conflicts.length === 0 ? (
            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoContent}>
                <MaterialCommunityIcons name="check-circle" size={48} color={colors.success} />
                <Text variant="titleMedium" style={styles.infoTitle}>
                  No Conflicts
                </Text>
                <Text variant="bodyMedium" style={styles.infoMessage}>
                  All sync operations are in sync
                </Text>
              </Card.Content>
            </Card>
          ) : (
            <View style={styles.conflictsList}>
              {conflicts.map((conflict) => (
                <Card key={conflict._id} style={styles.conflictCard}>
                  <Card.Content>
                    <View style={styles.conflictHeader}>
                      <Chip
                        style={styles.conflictChip}
                        textStyle={styles.conflictChipText}
                      >
                        {conflict.type}
                      </Chip>
                      <Text variant="bodySmall" style={styles.conflictDate}>
                        {new Date(conflict.appliedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={styles.conflictReason}>
                      {conflict.conflictReason}
                    </Text>
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
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
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statusGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  statusTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statusSubtitle: {
    color: colors.text + 'CC',
    textAlign: 'center',
  },
  statusDetails: {
    marginTop: 16,
    width: '100%',
  },
  statusDetail: {
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    color: colors.text + 'AA',
  },
  statusValue: {
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  infoContent: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  infoTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  infoMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  conflictsList: {
    gap: 12,
  },
  conflictCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  conflictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  conflictChip: {
    backgroundColor: colors.warning + '20',
    height: 24,
  },
  conflictChipText: {
    color: colors.warning,
    fontSize: 11,
  },
  conflictDate: {
    color: colors.textMuted,
  },
  conflictReason: {
    color: colors.textSecondary,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    borderColor: colors.secondary,
    borderWidth: 2,
    borderRadius: 12,
  },
  actionButtonLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
