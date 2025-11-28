import React, { useEffect, useState } from 'react';
import { View, StyleSheet, BackHandler, Dimensions, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';

// Define the split between the dark top and white bottom sections
const TOP_HEIGHT_RATIO = 0.5;
const { height: screenHeight, width: screenWidth } = Dimensions.get('window');


export default function WelcomeScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [language, setLanguage] = useState<'en' | 'am' | 'om'>('en');

  // Redirect logic (kept from original)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading]);

  // Disable back button (kept from original)
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text variant="headlineMedium" style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Set the status bar to light content for the dark background */}
      <StatusBar style="light"  backgroundColor={colors.primaryDark}/>

      {/* Top Dark Background Section */}
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topSection}
      >
        <View style={styles.header}>
          <Text style={styles.heroTitle}> MANUFIQ</Text>
          <Text style={styles.heroSubtitle}>
            Streamline your factory operations with ease.
          </Text>
        </View>
      </LinearGradient>

      {/* Bottom White Action Card Section */}
      <View style={styles.bottomSection}>
        <View style={styles.actionCard}>
          {/* Segmented language selector (rounded full) */}
          <View style={styles.segmentedWrapper}>
            <TouchableOpacity
              onPress={() => setLanguage('en')}
              style={[styles.segmentedButton, language === 'en' && styles.segmentedButtonActive]}
            >
              <Text style={[styles.segmentedText, language === 'en' && styles.segmentedTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage('am')}
              style={[styles.segmentedButton, language === 'am' && styles.segmentedButtonActive]}
            >
              <Text style={[styles.segmentedText, language === 'am' && styles.segmentedTextActive]}>Amharic</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setLanguage('om')}
              style={[styles.segmentedButton, language === 'om' && styles.segmentedButtonActive]}
            >
              <Text style={[styles.segmentedText, language === 'om' && styles.segmentedTextActive]}>Afaan Oromo</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={() => router.push('/auth/register')}
            style={styles.primaryButton}
            labelStyle={styles.primaryButtonLabel}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/auth/login')}
            style={styles.secondaryButton}
            labelStyle={styles.secondaryButtonLabel}
            contentStyle={styles.buttonContent}
          >
            Log In
          </Button>
        </View>
      </View>
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
  loadingText: {
    color: colors.text,
  },
  // --- Design Specific Styles ---
  topSection: {
    width: screenWidth,
    height: screenHeight * TOP_HEIGHT_RATIO,
    paddingHorizontal: 30,
    paddingTop: 20, // Adjust based on desired top padding
    justifyContent: 'flex-start',
    // borderBottomLeftRadius: 24,
    // borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 0,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text, // Assuming white text for the top "Manufiq" logo
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.text, // White text
    marginTop:12,
    marginBottom: 18,
  },
  heroSubtitle: {
    fontSize: 24,
    color: colors.text, // White text
    lineHeight: 28,
    width: '100%',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 40,
  },
  actionCard: {
    width: '100%',
    backgroundColor: colors.surface, // White surface for the card
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingTop: 30, // Space inside the card
    paddingBottom: 20,
    position: 'absolute',
    bottom: 0,
    zIndex: 10,
    // Calculated height to push card up from the bottom
    height: screenHeight * (1 - TOP_HEIGHT_RATIO) + 10,
    alignItems: 'center',
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: colors.primary, // Dark Purple
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background, // White text
  },
  secondaryButton: {
    borderColor: colors.primary, // Dark Purple Border
    borderWidth: 1,
    borderRadius: 12,
    width: '100%',
    backgroundColor: colors.surface, // White background
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary, // Dark Purple text
  },
  buttonContent: {
    height: 56,
  },
  languageSelector: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    zIndex: 20, // Ensure it's above the actionCard
  },
  segmentedWrapper: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: 999,
    padding: 4,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    bottom: 32,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },
  segmentedButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentedText: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingHorizontal: 6,
  },
  segmentedTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  languageText: {
    fontSize: 14,
    color: colors.textMuted,
  },
});