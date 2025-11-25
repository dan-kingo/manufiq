import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';

export default function LogoWithText({
  imageSource,
  size = 80,
  title = 'Invenza',
  subtitle = 'smart inventory management',
  compact = false,
}: {
  imageSource?: any;
  size?: number;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <View style={compact ? styles.containerCompact : styles.container}>
      {imageSource ? (
        <Image source={imageSource} style={[styles.image, { width: size, height: size, borderRadius: size * 0.18 }]} resizeMode="contain" />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.secondary] as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.logoGradient, { width: size, height: size, borderRadius: Math.max(8, size * 0.18) }]}
        >
          <Text style={[styles.logoText, { fontSize: Math.round(size * 0.6) }]}>I</Text>
        </LinearGradient>
      )}

      <View style={styles.textContainer}>
        <Text variant={compact ? 'titleMedium' : 'displaySmall'} style={styles.title}>
          {title}
        </Text>
        {!compact && <Text variant="bodyLarge" style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 4,
  },
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoGradient: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontWeight: 'bold',
    color: colors.text,
  },
  image: {
    backgroundColor: 'transparent',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
