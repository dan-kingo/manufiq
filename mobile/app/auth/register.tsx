import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [language, setLanguage] = useState<'en' | 'am' | 'om'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    setError('');

    if (!name || !email || !password || !businessName) {
      setError('Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        phone,
        password,
        businessName,
        language,
      });
      setSuccess(true);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } catch (err: any) {
      console.log(err)
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.successContent}>
          {/* <Text variant="displaySmall" style={styles.successIcon}>
            ✓
          </Text> */}
          <Text variant="headlineMedium" style={styles.successTitle}>
            Registration Successful!
          </Text>
          <Text variant="bodyLarge" style={styles.successMessage}>
            Please check your email to verify your account.
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text variant="headlineLarge" style={styles.title}>
              Create Account
            </Text>
            
          </View>

          <View style={styles.form}>
            <TextInput
              label="Full Name *"
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
              label="Email *"
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

            <TextInput
              label="Phone (Optional)"
              value={phone}
              onChangeText={setPhone}
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

            <TextInput
              label="Business Name *"
              value={businessName}
              onChangeText={setBusinessName}
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

            <View style={styles.languageContainer}>
              <Text variant="bodyMedium" style={styles.languageLabel}>
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

            <TextInput
              label="Password *"
              value={password}
              onChangeText={setPassword}
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
              label="Confirm Password *"
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
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
              labelStyle={styles.registerButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Create Account
            </Button>

            <View style={styles.loginContainer}>
              <Text variant="bodyMedium" style={styles.loginText}>
                Already have an account?{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => router.push('/auth/login')}
                style={styles.loginButton}
                labelStyle={styles.loginButtonLabel}
              >
                Sign In
              </Button>
            </View>
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
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
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
  languageLabel: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  errorText: {
    color: colors.error,
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  buttonContent: {
    height: 56,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    color: colors.textSecondary,
  },
  loginButton: {
    marginLeft: -8,
  },
  loginButtonLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
