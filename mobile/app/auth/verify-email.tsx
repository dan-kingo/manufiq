import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import apiService from '../../services/api.service';
import { API_CONFIG } from '../../constants/config';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setError('Invalid verification link');
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      await apiService.get(`${API_CONFIG.ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${token}`);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {loading ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text variant="headlineMedium" style={styles.loadingText}>
              Verifying your email...
            </Text>
          </>
        ) : success ? (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.success + '40', colors.success + '20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.successIcon}>✓</Text>
              </LinearGradient>
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Email Verified!
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
              Your email has been successfully verified. You can now sign in to your account.
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/auth/login')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.error + '40', colors.error + '20']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Text style={styles.errorIcon}>✕</Text>
              </LinearGradient>
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Verification Failed
            </Text>
            <Text variant="bodyLarge" style={styles.message}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.replace('/auth/login')}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              contentStyle={styles.buttonContent}
            >
              Back to Login
            </Button> 
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: colors.text,
    marginTop: 24,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
    color: colors.success,
    fontWeight: 'bold',
  },
  errorIcon: {
    fontSize: 60,
    color: colors.error,
    fontWeight: 'bold',
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
});
