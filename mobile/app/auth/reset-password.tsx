import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import authService from '../../services/auth.service';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token as string, newPassword);
      setSuccess(true);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.successContent}>
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
          <Text variant="headlineLarge" style={styles.successTitle}>
            Password Reset!
          </Text>
          <Text variant="bodyLarge" style={styles.successMessage}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
        </View>
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
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={[colors.primary + '40', colors.secondary + '40']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerIconGradient}
              >
                <Text style={styles.headerIcon}>🔑</Text>
              </LinearGradient>
            </View>
            <Text variant="headlineLarge" style={styles.title}>
              Reset Password
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter your new password below
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={colors.textMuted}
                />
              }
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
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
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

            {error ? (
              <HelperText type="error" visible={!!error} style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              labelStyle={styles.submitButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Reset Password
            </Button>

            <Button
              mode="text"
              onPress={() => router.replace('/auth/login')}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
            >
              Back to Login
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  headerIconContainer: {
    marginBottom: 24,
  },
  headerIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 40,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  errorText: {
    color: colors.error,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelButtonLabel: {
    color: colors.textSecondary,
  },
  successContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
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
  successTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
