import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    if (isLoading) return null;

    return (
        <View style={styles.container}>
            <Text variant="headlineMedium" style={styles.title}>
                Welcome{user?.name ? `, ${user.name}` : ''}
            </Text>
            <Text variant="bodyMedium" style={styles.subTitle}>
                {user?.role === 'staff' ? 'Staff Dashboard' : 'Home'}
            </Text>

            </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'flex-start',
    },
    title: {
        marginTop: 24,
        marginBottom: 6,
    },
    subTitle: {
        marginBottom: 20,
        color: '#666',
    },
    actions: {
        marginTop: 12,
        width: '100%',
        gap: 12,
    },
    button: {
        height: 48,
        justifyContent: 'center',
    },
});