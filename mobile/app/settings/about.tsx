import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import LogoWithText from '../components/LogoWithText';

export default function AboutScreen() {
  const router = useRouter();

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const appInfo = {
    version: '1.0.0',
    buildNumber: '100',
    releaseDate: 'January 2025',
  };

  const features = [
    {
      icon: 'package-variant',
      title: 'Inventory Tracking',
      description: 'Real-time tracking of all your items',
    },
    {
      icon: 'qrcode-scan',
      title: 'NFC/QR Scanning',
      description: 'Quick access via smart tags',
    },
    {
      icon: 'chart-bar',
      title: 'Reports & Analytics',
      description: 'Insights and data visualization',
    },
    {
      icon: 'bell-alert',
      title: 'Smart Alerts',
      description: 'Low stock and expiry notifications',
    },
    {
      icon: 'sync',
      title: 'Offline Sync',
      description: 'Work offline, sync later',
    },
    {
      icon: 'account-multiple',
      title: 'Team Collaboration',
      description: 'Multi-user support with roles',
    },
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
       
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LogoWithText size={100} imageSource={require("../../assets/images/manufiq.png")} title='Invenza' />


        <Card style={styles.versionCard}>
          <Card.Content style={styles.versionContent}>
            <View style={styles.versionRow}>
              <Text variant="bodyMedium" style={styles.versionLabel}>
                Version
              </Text>
              <Text variant="bodyMedium" style={styles.versionValue}>
                {appInfo.version}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.versionRow}>
              <Text variant="bodyMedium" style={styles.versionLabel}>
                Build Number
              </Text>
              <Text variant="bodyMedium" style={styles.versionValue}>
                {appInfo.buildNumber}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.versionRow}>
              <Text variant="bodyMedium" style={styles.versionLabel}>
                Release Date
              </Text>
              <Text variant="bodyMedium" style={styles.versionValue}>
                {appInfo.releaseDate}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Features
          </Text>

          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Card key={index} style={styles.featureCard}>
                <Card.Content style={styles.featureContent}>
                  <View style={styles.featureIcon}>
                    <MaterialCommunityIcons
                      name={feature.icon as any}
                      size={32}
                      color={colors.primary}
                    />
                  </View>
                  <Text variant="titleSmall" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            About Invenza
          </Text>

          <Text variant="bodyMedium" style={styles.aboutText}>
            Invenza is a comprehensive inventory management solution designed for small to medium-sized businesses. Our mission is to simplify inventory tracking and provide actionable insights to help businesses grow.
          </Text>

          <Text variant="bodyMedium" style={styles.aboutText}>
            With features like real-time tracking, smart alerts, and offline capabilities, Invenza empowers business owners to manage their inventory efficiently from anywhere.
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Connect With Us
          </Text>

          <View style={styles.socialButtons}>
            <Button
              mode="outlined"
              onPress={() => openLink('https://invenza.app')}
              style={styles.socialButton}
              labelStyle={styles.socialButtonLabel}
              icon={() => <MaterialCommunityIcons name="web" size={20} color={colors.secondary} />}
            >
              Website
            </Button>

            <Button
              mode="outlined"
              onPress={() => openLink('mailto:support@invenza.app')}
              style={styles.socialButton}
              labelStyle={styles.socialButtonLabel}
              icon={() => <MaterialCommunityIcons name="email" size={20} color={colors.secondary} />}
            >
              Email
            </Button>

            <Button
              mode="outlined"
              onPress={() => openLink('https://twitter.com/invenza')}
              style={styles.socialButton}
              labelStyle={styles.socialButtonLabel}
              icon={() => <MaterialCommunityIcons name="twitter" size={20} color={colors.secondary} />}
            >
              Twitter
            </Button>
          </View>
        </View>

        <View style={styles.legalSection}>
          <Button
            mode="text"
            onPress={() => {}}
            textColor={colors.textSecondary}
            style={styles.legalButton}
          >
            Terms of Service
          </Button>
          <Button
            mode="text"
            onPress={() => {}}
            textColor={colors.textSecondary}
            style={styles.legalButton}
          >
            Privacy Policy
          </Button>
          <Button
            mode="text"
            onPress={() => {}}
            textColor={colors.textSecondary}
            style={styles.legalButton}
          >
            Open Source Licenses
          </Button>
        </View>

        <Text variant="bodySmall" style={styles.copyright}>
          © 2025 Invenza. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.text,
  },
  appName: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  versionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 32,
  },
  versionContent: {
    padding: 8,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  versionLabel: {
    color: colors.textSecondary,
  },
  versionValue: {
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    backgroundColor: colors.border + '40',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  featureContent: {
    padding: 16,
    gap: 8,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  featureDescription: {
    color: colors.textSecondary,
    lineHeight: 18,
  },
  aboutText: {
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
  },
  socialButtons: {
    gap: 12,
  },
  socialButton: {
    borderColor: colors.secondary,
    borderWidth: 2,
    borderRadius: 12,
  },
  socialButtonLabel: {
    color: colors.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  legalSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  legalButton: {
    marginVertical: 0,
  },
  copyright: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});
