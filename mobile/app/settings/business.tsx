import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, ActivityIndicator, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import businessService, { Business } from '../../services/business.service';

export default function BusinessScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [language, setLanguage] = useState<'en' | 'am' | 'om'>('en');

  useEffect(() => {
    if (user?.businessId) {
      loadBusiness();
    }
  }, [user?.businessId]);

  const loadBusiness = async () => {
    try {
      const data = await businessService.getBusiness(user!.businessId!);
      setBusiness(data);
      setName(data.name);
      setLocation(data.location || '');
      setContactPhone(data.contactPhone || '');
      setLanguage(data.language);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if(user!.role !== 'owner') {
      Alert.alert('Error', 'You do not have permission to update business details');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Error', 'Business name is required');
      return;
    }

    setSaving(true);
    try {
      await businessService.updateBusiness(user!.businessId!, {
        name: name.trim(),
        location: location.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        language,
      });

      Alert.alert('Success', 'Business details updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update business details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="titleLarge" style={styles.errorText}>
          Business not found
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
          Go Back
        </Button>
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            Business Details
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.statusCard}>
            <LinearGradient
              colors={
                business.status === 'approved'
                  ? [colors.success + '40', colors.success + '20']
                  : business.status === 'pending'
                  ? [colors.warning + '40', colors.warning + '20']
                  : [colors.error + '40', colors.error + '20']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusGradient}
            >
              <MaterialCommunityIcons
                name={
                  business.status === 'approved'
                    ? 'check-circle'
                    : business.status === 'pending'
                    ? 'clock-outline'
                    : 'close-circle'
                }
                size={32}
                color={
                  business.status === 'approved'
                    ? colors.success
                    : business.status === 'pending'
                    ? colors.warning
                    : colors.error
                }
              />
              <Text variant="titleMedium" style={styles.statusText}>
                Status: {business.status.charAt(0).toUpperCase() + business.status.slice(1)}
              </Text>
              {business.rejectionReason && (
                <Text variant="bodySmall" style={styles.statusReason}>
                  {business.rejectionReason}
                </Text>
              )}
            </LinearGradient>
          </Card>

          <View style={styles.form}>
            <TextInput
              label="Business Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Location"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Contact Phone"
              value={contactPhone}
              onChangeText={setContactPhone}
              mode="outlined"
              keyboardType="phone-pad"
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <View style={styles.languageContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Language
              </Text>
              <SegmentedButtons
                value={language}
                onValueChange={(value) => setLanguage(value as 'en' | 'am' | 'om')}
                buttons={[
                  { value: 'en', label: 'English' },
                  { value: 'am', label: 'Amharic' },
                  { value: 'om', label: 'Oromo' },
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

            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={saving}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  errorText: {
    color: colors.text,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: colors.primary,
    marginTop: 16,
  },
  keyboardView: {
    flex: 1,
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
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: colors.text,
    fontWeight: '600',
  },
  statusReason: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  languageContainer: {
    marginVertical: 8,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 16,
  },
  saveButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
});
