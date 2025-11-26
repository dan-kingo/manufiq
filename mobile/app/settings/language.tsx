import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, RadioButton, Card, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';
import businessService from '../../services/business.service';

export default function LanguageScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'am' | 'om'>('en');
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'am' | 'om'>('en');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      if (user?.businessId) {
        const business = await businessService.getBusiness(user.businessId);
        setSelectedLanguage(business.language);
        setCurrentLanguage(business.language);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (selectedLanguage === currentLanguage) {
      router.back();
      return;
    }

    setSaving(true);
    try {
      await businessService.updateBusiness(user!.businessId!, {
        language: selectedLanguage,
      });

      await refreshUser();
      Alert.alert('Success', 'Language updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update language');
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

  const languages = [
    { value: 'en', label: 'English', description: 'English language' },
    { value: 'am', label: 'አማርኛ', description: 'Amharic language' },
    { value: 'om', label: 'Afaan Oromoo', description: 'Oromo language' },
  ];

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
          Language
        </Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.primary + '40', colors.secondary + '40']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <MaterialCommunityIcons name="translate" size={48} color={colors.primary} />
          </LinearGradient>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Choose your preferred language for the app
        </Text>

        <RadioButton.Group
          onValueChange={(value) => setSelectedLanguage(value as 'en' | 'am' | 'om')}
          value={selectedLanguage}
        >
          <View style={styles.languageList}>
            {languages.map((lang) => (
              <Card
                key={lang.value}
                style={[
                  styles.languageCard,
                  selectedLanguage === lang.value && styles.selectedCard,
                ]}
                onPress={() => setSelectedLanguage(lang.value as 'en' | 'am' | 'om')}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.languageInfo}>
                    <Text variant="titleMedium" style={styles.languageLabel}>
                      {lang.label}
                    </Text>
                    <Text variant="bodySmall" style={styles.languageDescription}>
                      {lang.description}
                    </Text>
                  </View>
                  <RadioButton
                    value={lang.value}
                    color={colors.primary}
                    uncheckedColor={colors.textMuted}
                  />
                </Card.Content>
              </Card>
            ))}
          </View>
        </RadioButton.Group>

        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving || selectedLanguage === currentLanguage}
          style={styles.saveButton}
          labelStyle={styles.saveButtonLabel}
          contentStyle={styles.buttonContent}
        >
          Save Changes
        </Button>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  languageList: {
    gap: 12,
    marginBottom: 24,
  },
  languageCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border + '40',
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '10',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  languageInfo: {
    flex: 1,
  },
  languageLabel: {
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  languageDescription: {
    color: colors.textSecondary,
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
