import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, List, Divider, Avatar, Dialog, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutDialogVisible(false);
      router.replace('/auth/login');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to logout');
    } finally {
      setLoggingOut(false);
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
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
          <Text variant="headlineSmall" style={styles.userName}>
            {user?.name || 'User'}
          </Text>
          <Text variant="bodyMedium" style={styles.userEmail}>
            {user?.email || user?.phone || 'No contact info'}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {user?.role?.toUpperCase() || 'USER'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            ACCOUNT
          </Text>

          <View style={styles.card}>
            <List.Item
              title="Profile"
              description="Manage your profile information"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="account" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/profile')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Business"
              description="View and update business details"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="domain" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/business')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Change Password"
              description="Update your password"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="lock-reset" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/change-password')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
          </View>
        </View>

        {user?.role === 'owner' && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              STAFF MANAGEMENT
            </Text>

            <View style={styles.card}>
              <List.Item
                title="Manage Staff"
                description="Add, edit, and manage staff members"
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={() => <MaterialCommunityIcons name="account-group" size={24} color={colors.primary} />}
                  />
                )}
                right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
                onPress={() => router.push('/settings/staff-management')}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                style={styles.listItem}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            PREFERENCES
          </Text>

          <View style={styles.card}>
            <List.Item
              title="Notifications"
              description="View and manage notifications"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="bell" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/notifications')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Language"
              description="Choose your language"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="translate" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/language')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            SYNC & DATA
          </Text>

          <View style={styles.card}>
            <List.Item
              title="Sync Status"
              description="View synchronization status"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="sync" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/sync-status')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            SUPPORT
          </Text>

          <View style={styles.card}>
            <List.Item
              title="Help Center"
              description="Get help and support"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="help-circle" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/help-center')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="About"
              description="App version and info"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="information" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={colors.textMuted} />}
              onPress={() => router.push('/settings/about')}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              style={styles.listItem}
            />
          </View>
        </View>

        <Button
          mode="contained"
          onPress={() => setLogoutDialogVisible(true)}
          style={styles.logoutButton}
          labelStyle={styles.logoutButtonLabel}
          contentStyle={styles.logoutButtonContent}
          icon={() => <MaterialCommunityIcons name="logout" size={20} color={colors.text} />}
        >
          Logout
        </Button>

        <Text variant="bodySmall" style={styles.version}>
          Version 1.0.0
        </Text>
      </ScrollView>

      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogContent}>
              Are you sure you want to logout?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <View style={styles.dialogActionRow}>
              <Button
                mode="outlined"
                onPress={() => setLogoutDialogVisible(false)}
                disabled={loggingOut}
                style={styles.cancelBtn}
                contentStyle={styles.cancelBtnContent}
                labelStyle={styles.cancelBtnLabel}
                icon={() => <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />}
              >
                Cancel
              </Button>

              <Button
                mode="contained"
                onPress={handleLogout}
                loading={loggingOut}
                disabled={loggingOut}
                style={styles.logoutConfirmBtn}
                contentStyle={styles.logoutConfirmContent}
                labelStyle={styles.logoutConfirmLabel}
                icon={() => <MaterialCommunityIcons name="logout" size={18} color={colors.text} />}
              >
                Logout
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
  },
  userName: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    color: colors.textSecondary,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: colors.primary + '40',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  roleBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
    overflow: 'hidden',
  },
  listItem: {
    paddingVertical: 8,
  },
  listItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  listItemDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  divider: {
    backgroundColor: colors.border + '40',
    marginLeft: 56,
  },
  logoutButton: {
    backgroundColor: colors.error,
    borderRadius: 12,
    marginHorizontal: 24,
    marginTop: 16,
    elevation: 4,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  logoutButtonContent: {
    height: 56,
  },
  version: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
  dialog: {
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    color: colors.text,
  },
  dialogContent: {
    color: colors.textSecondary,
  },
  dialogActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  cancelBtnContent: {
    height: 48,
  },
  cancelBtnLabel: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  logoutConfirmBtn: {
    flex: 1,
    marginLeft: 12,
    borderRadius: 10,
    backgroundColor: colors.error,
  },
  logoutConfirmContent: {
    height: 48,
  },
  logoutConfirmLabel: {
    color: colors.text,
    fontWeight: '700',
  },
});
