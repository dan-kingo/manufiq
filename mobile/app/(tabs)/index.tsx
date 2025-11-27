import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView as RNScrollView, Dimensions, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Button, Card, ActivityIndicator, IconButton, Badge } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import reportService from '../../services/report.service';
import itemService, { Item } from '../../services/item.service';
import notificationService from '../../services/notification.service';
import orderService from '../../services/order.service';
import { colors } from '../../theme/colors';

export default function HomeScreen() {
    const router = useRouter();
    const { user, isLoading } = useAuth();
    const [loadingOverview, setLoadingOverview] = useState(true);
    const [activeOrders, setActiveOrders] = useState<number>(0);
    const [lowStockCount, setLowStockCount] = useState<number>(0);
    const [teamTasks, setTeamTasks] = useState<number>(0);
    const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
    const [lowStockItems, setLowStockItems] = useState<Item[]>([]);
    const [recentItems, setRecentItems] = useState<Item[]>([]);
    const { width: screenWidth } = Dimensions.get('window');

    const carouselRef = useRef<any>(null);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const mountedRef = useRef(true);
    const [refreshing, setRefreshing] = useState(false);

    const carouselItems = [
        { 
            id: '1', 
            title: 'Sales Today', 
            subtitle: 'Overview of today\'s sales', 
            route: '/(tabs)/reports',
            color: '#6366F1',
            icon: 'chart-line'
        },
        { 
            id: '2', 
            title: 'Top Materials', 
            subtitle: 'Most used materials', 
            route: '/(tabs)/materials',
            color: '#10B981',
            icon: 'package-variant'
        },
        {
            id: '3',
            title: 'Pending Approvals',
            subtitle: 'Orders waiting approval',
            route: '/(tabs)/orders',
            color: '#F59E0B',
            icon: 'clock-alert'
        },
        { 
            id: '4', 
            title: 'Inventory Alerts', 
            subtitle: 'Low stock warnings', 
            route: '/(tabs)/materials',
            color: '#EF4444',
            icon: 'alert-circle'
        },
    ];

    useEffect(() => {
        // Auto-advance carousel every 4s
        const id = setInterval(() => {
            setCarouselIndex(prev => {
                const next = (prev + 1) % carouselItems.length;
                carouselRef.current?.scrollTo({ x: next * (screenWidth - 32), animated: true });
                return next;
            });
        }, 4000);

        return () => clearInterval(id);
    }, [screenWidth]);

    const loadOverview = async () => {
        try {
            setLoadingOverview(true);

            let summary: any = null;
            let team: any = null;
            let lowItems: Item[] = [];
            let allItems: Item[] = [];
            let unread: any = { count: 0 };

            try {
                summary = await reportService.getSummaryReport();
            } catch (e) {
                console.warn('Summary report fetch failed, will try fallback', e);
            }

            try {
                team = await reportService.getTeamProductivityReport();
            } catch (e) {
                console.warn('Team productivity fetch failed, will try fallback', e);
            }

            try {
                lowItems = await itemService.listItems({ lowStock: true });
            } catch (e) {
                console.warn('Low items fetch failed', e);
            }

            try {
                allItems = await itemService.listItems();
            } catch (e) {
                console.warn('All items fetch failed', e);
            }

            try {
                unread = await notificationService.getUnreadCount();
            } catch (e) {
                console.warn('Unread count fetch failed', e);
            }

            if (!mountedRef.current) return;

            // Active orders: prefer summary, fallback to order stats
            let active = summary?.orders?.active;
            if (typeof active !== 'number') {
                try {
                    const stats = await orderService.getOrderStats();
                    const sc = stats.statusCounts || {};
                    active = (sc.not_started || 0) + (sc.in_progress || 0) + (sc.halfway || 0);
                } catch (e) {
                    console.warn('Order stats fallback failed', e);
                    active = 0;
                }
            }

            setActiveOrders(active || 0);
            setLowStockCount(Array.isArray(lowItems) ? lowItems.length : 0);
            setLowStockItems(Array.isArray(lowItems) ? lowItems.slice(0, 3) : []);

            if (Array.isArray(allItems)) {
                const recent = [...allItems]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 3);
                setRecentItems(recent);
            } else {
                setRecentItems([]);
            }

            // Team tasks: prefer team report; if empty and staff, fetch assigned orders
            let tasks = (team?.teamMembers || []).reduce((s: number, m: any) => s + (m.ordersAssigned || 0), 0);
            if ((!team || (team.teamMembers || []).length === 0) && user?.role === 'staff') {
                try {
                    const userAssigned = await orderService.listOrders({ assignedToMe: true, limit: 100 });
                    tasks = Array.isArray(userAssigned?.orders) ? userAssigned.orders.length : tasks;
                } catch (e) {
                    console.warn('Assigned orders fetch failed', e);
                }
            }

            setTeamTasks(tasks || 0);
            setUnreadNotifications(unread.count || 0);
        } catch (err) {
            console.warn('Failed to load overview', err);
        } finally {
            if (mountedRef.current) setLoadingOverview(false);
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        loadOverview();
        return () => { mountedRef.current = false; };
    }, []);

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await loadOverview();
        } finally {
            setRefreshing(false);
        }
    };

    if (isLoading || loadingOverview) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.text} />
        </View>
    );

     const getStockStatus = (item: Item) => {
        if (item.quantity === 0) return { label: 'Out', color: colors.error };
        if (item.quantity <= (item.minThreshold || 0)) return { label: 'Low', color: colors.warning };
        return { label: 'OK', color: colors.success };
      };
    const onCarouselPress = (item: any) => {
        if (item.route) router.push(item.route as any);
    };

    const onCarouselMomentum = (e: any) => {
        const offsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / (screenWidth - 32));
        setCarouselIndex(index);
    };

    return (
        <View style={styles.container}>
            {/* Header with Gradient Background */}
            <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerRow}>
                    <View style={styles.headerTextContainer}>
                        <Text variant="headlineMedium" style={styles.title}>
                            Welcome{user?.name ? `, ${user.name}` : ''}
                        </Text>
                        <Text variant="bodyMedium" style={styles.subTitle}>
                            Here's your daily overview
                        </Text>
                    </View>

                    <View style={styles.headerActions}>
                        <IconButton
                            icon="refresh"
                            size={22}
                            onPress={() => onRefresh()}
                            style={styles.actionIcon}
                            iconColor="#FFFFFF"
                            accessibilityLabel="Refresh"
                        />
                        <View style={styles.notificationWrap}>
                            <IconButton 
                                icon="bell" 
                                size={26} 
                                onPress={() => router.push('/notifications')} 
                                style={styles.notificationIcon}
                                iconColor="#FFFFFF"
                            />
                            {unreadNotifications > 0 && (
                                <Badge style={styles.badge}>{unreadNotifications}</Badge>
                            )}
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Compact Carousel */}
            <View style={styles.carouselContainer}>
                <RNScrollView
                    ref={carouselRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={onCarouselMomentum}
                    style={styles.carousel}
                    contentContainerStyle={styles.carouselContentContainer}
                >
                    {carouselItems.map((c, idx) => (
                        <TouchableOpacity 
                            key={c.id} 
                            activeOpacity={0.85} 
                            onPress={() => onCarouselPress(c)} 
                            style={[styles.carouselItem, { width: screenWidth - 32 }]}
                            accessible
                            accessibilityRole="button"
                        >
                            <Card style={[styles.carouselCard, { backgroundColor: c.color }]}>
                                <Card.Content style={styles.carouselContent}>
                                    <View style={styles.carouselIconContainer}>
                                        <MaterialCommunityIcons 
                                            name={c.icon as any} 
                                            size={32} 
                                            color="#FFFFFF" 
                                        />
                                    </View>
                                    <View style={styles.carouselTextContainer}>
                                        <Text variant="titleLarge" style={styles.carouselTitle}>{c.title}</Text>
                                        <Text variant="bodyMedium" style={styles.carouselSubtitle}>{c.subtitle}</Text>
                                    </View>
                                    <MaterialCommunityIcons 
                                        name="chevron-right" 
                                        size={24} 
                                        color="#FFFFFF" 
                                        style={styles.chevronIcon}
                                    />
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))}
                </RNScrollView>
            </View>

            {/* Scrollable Stats Cards */}
            <RNScrollView 
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.text}
                        colors={[colors.text]}
                    />
                }
            >
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#EEF2FF' }]}>
                                <MaterialCommunityIcons name="clipboard-list" size={28} color="#6366F1" />
                            </View>
                            <View style={styles.statTextContainer}>
                                <Text variant="titleMedium" style={styles.statLabel}>Active Orders</Text>
                                <Text variant="headlineSmall" style={styles.statValue}>{activeOrders}</Text>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#ECFDF5' }]}>
                                <MaterialCommunityIcons name="package-variant" size={28} color="#10B981" />
                            </View>
                            <View style={styles.statTextContainer}>
                                <Text variant="titleMedium" style={styles.statLabel}>Low Stock</Text>
                                <Text variant="headlineSmall" style={styles.statValue}>{lowStockCount}</Text>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={styles.statCard}>
                        <Card.Content style={styles.statCardContent}>
                            <View style={[styles.statIconContainer, { backgroundColor: '#FFFBEB' }]}>
                                <MaterialCommunityIcons name="account-group" size={28} color="#F59E0B" />
                            </View>
                            <View style={styles.statTextContainer}>
                                <Text variant="titleMedium" style={styles.statLabel}>Team Tasks</Text>
                                <Text variant="headlineSmall" style={styles.statValue}>{teamTasks}</Text>
                            </View>
                        </Card.Content>
                    </Card>
                </View>

                {/* Low stock alerts */}
                {lowStockItems.length > 0 ? (
               
                <View style={styles.sectionHeader}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Low Stock Alerts</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/materials')} accessibilityRole="button">
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>
                ) : null }

                { (
                    lowStockItems.map(item => (
                        <TouchableOpacity key={item._id} style={styles.listCard} onPress={() => router.push(`/material/item-detail?id=${item._id}`)}>
                            <Card style={styles.smallCard}>
                                <Card.Content style={styles.smallCardContent}>
                                    <View style={styles.smallCardText}>
                                        <Text variant="titleMedium" numberOfLines={1}>{item.name}</Text>
                                        <Text variant="bodySmall" style={styles.remainingText}>Only {item.quantity} remaining</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                        </TouchableOpacity>
                    ))
                )}

                {/* Recent items */}
                <View style={[styles.sectionHeader, { marginTop: 12 }] }>
                    <Text variant="titleMedium" style={styles.sectionTitle}>Recent Materials</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/materials')} accessibilityRole="button">
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {recentItems.length === 0 ? (
                    <Text style={styles.emptySmall}>No recent materials</Text>
                ) : (
                      recentItems.map((item) => {
                              const status = getStockStatus(item);
                              return (
                              <TouchableOpacity
                                key={item._id}
                                onPress={() => router.push(`/material/item-detail?id=${item._id}`)}
                                style={styles.itemCard}
                              >
                                <Card style={styles.card}>
                                <LinearGradient
                                  colors={[colors.surface, colors.surfaceVariant]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 1 }}
                                  style={styles.cardGradient}
                                >
                                  {item.image && (
                                  <View style={styles.itemImageContainer}>
                                    <Image
                                    source={{ uri: item.image }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                    />
                                  </View>
                                  )}
                                  <View style={styles.cardHeader}>
                                  <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                                    <Text style={[styles.statusText, { color: status.color }]}>
                                    {status.label}
                                    </Text>
                                  </View>
                                  </View>
                    
                                  <View style={styles.cardContent}>
                                  <View style={styles.idContainer}>
                                    <Text variant="bodySmall" style={styles.itemId} selectable>
                                      ID: {item._id}
                                    </Text>
                                  </View>
                                  <Text variant="titleMedium" style={styles.itemName} numberOfLines={2}>
                                    {item.name}
                                  </Text>
                                  {item.sku && (
                                    <Text variant="bodySmall" style={styles.itemSku}>
                                    SKU: {item.sku}
                                    </Text>
                                  )}
                                  <View style={styles.quantityContainer}>
                                    <MaterialCommunityIcons name="package-variant" size={20} color={colors.text} />
                                    <Text variant="titleMedium" style={styles.quantity}>
                                    {item.quantity} {item.unit}
                                    </Text>
                                  </View>
                                  {item.category && (
                                    <View style={styles.categoryBadge}>
                                    <Text style={styles.categoryText}>{item.category}</Text>
                                    </View>
                                  )}
                                  </View>
                                </LinearGradient>
                                </Card>
                              </TouchableOpacity>
                              );
                            })
                )}
                

            </RNScrollView>

            {/* Floating Add New Order Button */}
           {user?.role === 'owner' &&  <View style={styles.floatingButtonContainer}>
                <Button
                    mode="contained"
                    icon="plus"
                    onPress={() => router.push('/(tabs)/orders' as any)}
                    style={styles.floatingButton}
                    contentStyle={styles.buttonContent}
                    labelStyle={styles.buttonLabel}
                >
                    Add New Order
                </Button>
            </View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // Header Styles
    headerGradient: {
        paddingHorizontal: 16,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTextContainer: {
        flex: 1,
    },
    itemCard: {
    marginBottom: 12,
    width: '90%',
    display: 'flex',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
  },
  itemImageContainer: {
    width: '100%',
    height: 240,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceVariant,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text
  },
  cardContent: {
    gap: 8,
  },
  itemName: {
    color: colors.text,
    fontWeight: '600',
    minHeight: 48,
  },
  itemSku: {
    color: colors.text,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quantity: {
    color: colors.text,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  idContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  itemId: {
    color: colors.textMuted,
    fontFamily: 'monospace',
    fontSize: 11,
  },
    title: {
        marginBottom: 4,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    subTitle: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    notificationWrap: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIcon: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 8,
        marginRight: 8,
    },
    notificationIcon: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: colors.error,
        color: '#FFFFFF',
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        borderRadius: 10,
        fontSize: 12,
        overflow: 'hidden',
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    // Carousel Styles
    carouselContainer: {
        height: 120,
        marginTop: 32,
        paddingBottom:16
    },
    carousel: {
        flex: 1,
    },
    carouselContentContainer: {
        alignItems: 'center',
    },
    carouselItem: {
        paddingHorizontal: 16,
        height: '100%',
    },
    carouselCard: {
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    carouselContent: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        paddingVertical: 0,
        paddingHorizontal: 20,
    },
    carouselIconContainer: {
        marginRight: 16,
    },
    carouselTextContainer: {
        flex: 1,
    },
    carouselTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 18,
    },
    carouselSubtitle: {
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
        fontSize: 14,
    },
    chevronIcon: {
        opacity: 0.9,
    },
    // Scroll Container
    scrollContainer: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 100, // Space for floating button
    },
    // Stats Cards Styles
    statsContainer: {
        padding: 16,
    },

    // Sections (low stock / recent)
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 6,
        marginBottom: 8,
    },
    sectionTitle: {
        fontWeight: '700',
        color: colors.text,
    },
    seeAll: {
        color: colors.text,
        fontWeight: '600',
    },
    listCard: {
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    smallCard: {
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        elevation: 1,
    },
    smallCardContent: {
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    smallCardText: {
        flex: 1,
    },
    remainingText: {
        color: colors.text,
        marginTop: 4,
    },
    emptySmall: {
        color: colors.textMuted,
        paddingHorizontal: 16,
        marginBottom: 6,
    },
    statCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        marginBottom: 12,
    },
    statCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    statIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statTextContainer: {
        flex: 1,
    },
    statLabel: {
        color: colors.text,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontWeight: '700',
        color: colors.text,
        fontSize: 28,
    },
    // Floating Button Styles
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
    },
    floatingButton: {
        backgroundColor: '#1F2937',
        borderRadius: 16,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonContent: {
        height: 56,
        paddingHorizontal: 20,
    },
    buttonLabel: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
});