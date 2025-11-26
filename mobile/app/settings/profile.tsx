import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

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
            Profile
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={colors.gradient.primary as unknown as readonly [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              editable={false}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              editable={false}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <TextInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              keyboardType="phone-pad"
              editable={false}
              style={styles.input}
              outlineColor={colors.border}
              activeOutlineColor={colors.text}
              textColor={colors.text}
              theme={{
                colors: {
                  onSurfaceVariant: colors.textMuted,
                },
              }}
            />

            <View style={styles.roleContainer}>
              <Text variant="bodyMedium" style={styles.roleLabel}>
                Role
              </Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {user?.role?.toUpperCase() || 'USER'}
                </Text>
              </View>
            </View>

            <Text variant="bodySmall" style={styles.note}>
              Profile information can only be updated by contacting support.
            </Text>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.surface,
  },
  roleContainer: {
    marginTop: 8,
  },
  roleLabel: {
    color: colors.textSecondary,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: colors.primary + '40',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignSelf: 'flex-start',
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
