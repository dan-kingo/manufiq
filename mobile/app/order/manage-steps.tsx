import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, IconButton, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme/colors';
import progressService, { ProductionStep } from '../../services/progress.service';
import orderService, { Order } from '../../services/order.service';

export default function ManageStepsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.orderId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingStepId, setDeletingStepId] = useState<string | null>(null);
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [steps, setSteps] = useState<ProductionStep[]>([]);
  const [newStep, setNewStep] = useState({ description: '', notes: '' });

  useEffect(() => {
    if (orderId) {
      loadData();
    }
  }, [orderId]);

  const loadData = async () => {
    try {
      const [orderData, stepsData] = await Promise.all([
        orderService.getOrder(orderId),
        progressService.getProductionSteps(orderId),
      ]);
      setOrder(orderData);
      setSteps(stepsData.steps);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStep = async () => {
    if (!newStep.description.trim()) {
      Alert.alert('Error', 'Step description is required');
      return;
    }

    try {
      setSubmitting(true);
      await progressService.addProductionSteps(orderId, {
        steps: [{ description: newStep.description, notes: newStep.notes, isCompleted: false }],
      });
      setNewStep({ description: '', notes: '' });
      loadData();
      Alert.alert('Success', 'Step added successfully');
    } catch (error: any) {
      console.error('Failed to add step:', error);
      Alert.alert('Error', error.message || 'Failed to add step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStep = async (stepId: string, currentStatus: boolean) => {
    try {
      setTogglingStepId(stepId);
      await progressService.updateProductionStep(stepId, { isCompleted: !currentStatus });
      await loadData();
    } catch (error) {
      console.error('Failed to toggle step:', error);
      Alert.alert('Error', 'Failed to update step');
    } finally {
      setTogglingStepId(null);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this step?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingStepId(stepId);
              await progressService.deleteProductionStep(stepId);
              await loadData();
              Alert.alert('Success', 'Step deleted successfully');
            } catch (error) {
              console.error('Failed to delete step:', error);
              Alert.alert('Error', 'Failed to delete step');
            } finally {
              setDeletingStepId(null);
            }
          },
        },
      ]
    );
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
            <Text variant="headlineMedium" style={styles.title}>Production Steps</Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
              {order?.orderNumber || 'Order'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Add New Step</Text>
            <TextInput
              label="Step Description *"
              value={newStep.description}
              onChangeText={(text) => setNewStep({ ...newStep, description: text })}
              style={styles.input}
              mode="outlined"
              placeholder="e.g., Cut materials"
            />
            <TextInput
              label="Notes"
              value={newStep.notes}
              onChangeText={(text) => setNewStep({ ...newStep, notes: text })}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            <Button
              mode="contained"
              onPress={handleAddStep}
              style={styles.addButton}
              loading={submitting}
              disabled={submitting}
              icon="plus"
            >
              {submitting ? 'Adding...' : 'Add Step'}
            </Button>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Production Steps ({steps.length})
            </Text>
            {steps.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No steps added yet. Add steps to track production progress.
              </Text>
            ) : (
              steps.map((step, index) => (
                <View key={step._id}>
                  <View style={styles.stepRow}>
                    <TouchableOpacity
                      onPress={() => handleToggleStep(step._id, step.isCompleted)}
                      disabled={togglingStepId === step._id || deletingStepId === step._id}
                    >
                      {togglingStepId === step._id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <MaterialCommunityIcons
                          name={step.isCompleted ? 'checkbox-marked' : 'checkbox-blank-outline'}
                          size={28}
                          color={step.isCompleted ? colors.success : colors.textMuted}
                        />
                      )}
                    </TouchableOpacity>
                    <View style={styles.stepContent}>
                      <Text
                        variant="titleMedium"
                        style={[
                          styles.stepDescription,
                          step.isCompleted && styles.stepDescriptionCompleted,
                        ]}
                      >
                        {step.stepNumber}. {step.description}
                      </Text>
                      {step.notes && (
                        <Text variant="bodySmall" style={styles.stepNotes}>
                          {step.notes}
                        </Text>
                      )}
                      {step.isCompleted && step.completedBy && (
                        <Text variant="bodySmall" style={styles.completedBy}>
                          Completed by {step.completedBy.name}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteStep(step._id)}
                      disabled={togglingStepId === step._id || deletingStepId === step._id}
                    >
                      {deletingStepId === step._id ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <MaterialCommunityIcons name="delete" size={24} color={colors.error} />
                      )}
                    </TouchableOpacity>
                  </View>
                  {index < steps.length - 1 && <Divider style={styles.divider} />}
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
  input: {
    marginBottom: 12,
    backgroundColor: colors.background,
  },
  addButton: {
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 24,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepDescription: {
    color: colors.text,
    fontWeight: '600',
  },
  stepDescriptionCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
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
  divider: {
    marginVertical: 8,
  },
});
