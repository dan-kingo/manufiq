import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Text, Button, List, Divider, Card } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

export default function HelpCenterScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs = [
    {
      id: '1',
      question: 'How do I add items to my inventory?',
      answer: 'Navigate to the Stock tab and tap the + button at the bottom right. Fill in the item details including name, quantity, unit, and optional fields like SKU, category, and minimum threshold.',
    },
    {
      id: '2',
      question: 'How do I scan NFC/QR tags?',
      answer: 'Go to the Scan tab and enter the tag ID manually, or use your device camera to scan QR codes. The system will display the associated item details.',
    },
    {
      id: '3',
      question: 'What are low stock alerts?',
      answer: 'Low stock alerts notify you when an item quantity falls below the minimum threshold you set. You can configure these thresholds when creating or editing items.',
    },
    {
      id: '4',
      question: 'How do I adjust item quantities?',
      answer: 'Open an item details page and tap "Adjust Quantity". Choose the action (Add, Sell, Use) and enter the amount. The system will automatically update the inventory and log the event.',
    },
    {
      id: '5',
      question: 'Can I export reports?',
      answer: 'Yes, the Reports tab provides various reports including stock summary, low stock items, and usage trends. Export options are available in CSV and PDF formats.',
    },
    {
      id: '6',
      question: 'How does offline sync work?',
      answer: 'All changes made offline are stored locally and automatically synced when you reconnect to the internet. You can view sync status in Settings > Sync Status.',
    },
  ];

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@invenza.app?subject=Support Request');
  };

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
          Help Center
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
            <MaterialCommunityIcons name="help-circle" size={48} color={colors.primary} />
          </LinearGradient>
        </View>

        <Text variant="bodyLarge" style={styles.description}>
          Find answers to common questions
        </Text>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Frequently Asked Questions
          </Text>

          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <Card key={faq.id} style={styles.faqCard}>
                <List.Accordion
                  title={faq.question}
                  expanded={expandedId === faq.id}
                  onPress={() => handleExpand(faq.id)}
                  titleStyle={styles.faqQuestion}
                  style={styles.accordion}
                  theme={{
                    colors: {
                      primary: colors.primary,
                    },
                  }}
                  left={(props) => (
                    <MaterialCommunityIcons
                      name="help-circle-outline"
                      size={24}
                      color={colors.secondary}
                      style={{ marginLeft: 8 }}
                    />
                  )}
                >
                  <View style={styles.answerContainer}>
                    <Text variant="bodyMedium" style={styles.faqAnswer}>
                      {faq.answer}
                    </Text>
                  </View>
                </List.Accordion>
                {index < faqs.length - 1 && <Divider style={styles.divider} />}
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Quick Links
          </Text>

          <View style={styles.linksCard}>
            <List.Item
              title="User Guide"
              description="Complete guide to using Invenza"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="book-open-variant" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="open-in-new" color={colors.textMuted} />}
              onPress={() => {}}
              titleStyle={styles.linkTitle}
              descriptionStyle={styles.linkDescription}
              style={styles.linkItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Video Tutorials"
              description="Watch how-to videos"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="video" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="open-in-new" color={colors.textMuted} />}
              onPress={() => {}}
              titleStyle={styles.linkTitle}
              descriptionStyle={styles.linkDescription}
              style={styles.linkItem}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Community Forum"
              description="Connect with other users"
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={() => <MaterialCommunityIcons name="forum" size={24} color={colors.primary} />}
                />
              )}
              right={(props) => <List.Icon {...props} icon="open-in-new" color={colors.textMuted} />}
              onPress={() => {}}
              titleStyle={styles.linkTitle}
              descriptionStyle={styles.linkDescription}
              style={styles.linkItem}
            />
          </View>
        </View>

        <Card style={styles.contactCard}>
          <LinearGradient
            colors={[colors.primary + '20', colors.secondary + '20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.contactGradient}
          >
            <MaterialCommunityIcons name="email" size={48} color={colors.primary} />
            <Text variant="titleLarge" style={styles.contactTitle}>
              Still Need Help?
            </Text>
            <Text variant="bodyMedium" style={styles.contactDescription}>
              Our support team is here to assist you
            </Text>
            <Button
              mode="contained"
              onPress={handleContactSupport}
              style={styles.contactButton}
              labelStyle={styles.contactButtonLabel}
              icon={() => <MaterialCommunityIcons name="email-outline" size={20} color={colors.text} />}
            >
              Contact Support
            </Button>
          </LinearGradient>
        </Card>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordion: {
    backgroundColor: 'transparent',
  },
  faqQuestion: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
  faqAnswer: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  divider: {
    backgroundColor: colors.border + '40',
  },
  linksCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border + '40',
    overflow: 'hidden',
  },
  linkItem: {
    paddingVertical: 8,
  },
  linkTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  linkDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  contactCard: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  contactGradient: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  contactTitle: {
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contactDescription: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  contactButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  contactButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
