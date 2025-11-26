import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import LogoWithText from '../components/LogoWithText';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login({ email, password });
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log(err)
      setError(err.response?.data?.error || 'Login failed. Please try again.');
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
            <LogoWithText size={96} title="Welcome Back" subtitle="Sign in to your account" imageSource={require("../../assets/images/manufiq.png")}/>
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
              activeOutlineColor={colors.text}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                  color={colors.text}
                />
              }
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
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
              mode="text"
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotButton}
              labelStyle={styles.forgotButtonLabel}
            >
              Forgot Password?
            </Button>

            <Button
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
              labelStyle={styles.loginButtonLabel}
              contentStyle={styles.buttonContent}
            >
              Sign In
            </Button>

            <View style={styles.signupContainer}>
              <Text variant="bodyMedium" style={styles.signupText}>
                Don't have an account?{' '}
              </Text>
              <Button
                mode="text"
                onPress={() => router.push('/auth/register')}
                style={styles.signupButton}
                labelStyle={styles.signupButtonLabel}
              >
                Sign Up
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: colors.text,
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
  errorText: {
    color: colors.error,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotButtonLabel: {
    color: colors.secondary,
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonContent: {
    height: 56,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    color: colors.textSecondary,
  },
  signupButton: {
    marginLeft: -8,
  },
  signupButtonLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
