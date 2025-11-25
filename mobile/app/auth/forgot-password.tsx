import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import authService from '../../services/auth.service';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      console.log(err)
      setError(err.response?.data?.error || 'Failed to send reset email');
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
          
          <Text variant="headlineMedium" style={styles.successTitle}>
            Email Sent!
          </Text>
          <Text variant="bodyLarge" style={styles.successMessage}>
            Check your email for password reset instructions.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.backButton}
            labelStyle={styles.backButtonLabel}
          >
            Back to Login
          </Button>
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
            <Text variant="headlineLarge" style={styles.title}>
              Forgot Password?
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Enter your email to receive reset instructions
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
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
              Send Reset Link
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
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
  successIcon: {
    fontSize: 80,
    color: colors.success,
    marginBottom: 24,
  },
  successTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 32,
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
