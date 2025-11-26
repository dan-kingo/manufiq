import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput as RNTextInput, Image } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, Chip, FAB, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import itemService, { Item } from '../../services/item.service';
import { useAuth } from '../../contexts/AuthContext';
export default function StockScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const { user } = useAuth();
  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory, showLowStock]);

  const loadItems = async () => {
    try {
      const data = await itemService.listItems();
      setItems(data);

      const uniqueCategories = Array.from(new Set(data.map(item => item.category).filter(Boolean))) as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const computeFilteredItems = (overrideShowLowStock?: boolean) => {
    const low = typeof overrideShowLowStock === 'boolean' ? overrideShowLowStock : showLowStock;

    let filtered = [...items];

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (low) {
      filtered = filtered.filter(item => {
        const threshold = item.minThreshold || 0;
        return threshold > 0 && item.quantity <= threshold;
      });
    }

    return filtered;
  };

  const filterItems = () => {
    setFilteredItems(computeFilteredItems());
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
  };

  const toggleLowStockFilter = () => {
    const next = !showLowStock;
    // update state
    setShowLowStock(next);

    // immediately compute and apply filtered items using the new value
    const filtered = computeFilteredItems(next);
    setFilteredItems(filtered);

    // close menu after a tiny delay to avoid race with menu click handling
    setTimeout(() => setMenuVisible(false), 50);
  };

  const getStockStatus = (item: Item) => {
    if (item.quantity === 0) return { label: 'Out', color: colors.error };
    if (item.quantity <= (item.minThreshold || 0)) return { label: 'Low', color: colors.warning };
    return { label: 'OK', color: colors.success };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Stock Management
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search materials..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          iconColor={colors.primary}
          inputStyle={styles.searchInput}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.filterButton,
            showLowStock ? styles.filterButtonActive : styles.filterButtonInactive,
          ]}
          onPress={() => {
            setShowLowStock(true);
            setFilteredItems(computeFilteredItems(true));
          }}
          accessibilityRole="button"
          accessibilityLabel="Filter low stock"
        >
          <MaterialCommunityIcons
            name="alert"
            size={18}
            color={showLowStock ? '#fff' : colors.text}
          />
          <Text style={[styles.filterLabel, showLowStock ? styles.filterLabelActive : {}]}>Low Stock</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.filterButton,
            !showLowStock ? styles.filterButtonActive : styles.filterButtonInactive,
          ]}
          onPress={() => {
            setShowLowStock(false);
            setFilteredItems(computeFilteredItems(false));
          }}
          accessibilityRole="button"
          accessibilityLabel="Show all materials"
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={18}
            color={!showLowStock ? '#fff' : colors.text}
          />
          <Text style={[styles.filterLabel, !showLowStock ? styles.filterLabelActive : {}]}>Show All</Text>
        </TouchableOpacity>
      </View>

      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          <Chip
            selected={selectedCategory === null}
            onPress={() => handleCategoryFilter(null)}
            style={[styles.chip, selectedCategory === null && styles.chipSelected]}
            textStyle={[styles.chipText, selectedCategory === null && styles.chipTextSelected]}
          >
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category}
              selected={selectedCategory === category}
              onPress={() => handleCategoryFilter(category)}
              style={[styles.chip, selectedCategory === category && styles.chipSelected]}
              textStyle={[styles.chipText, selectedCategory === category && styles.chipTextSelected]}
            >
              {category}
            </Chip>
          ))}
        </ScrollView>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant-closed" size={64} color={colors.textMuted} />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No Materials Found
            </Text>
            <Text variant="bodyMedium" style={styles.emptyMessage}>
              {searchQuery || selectedCategory || showLowStock
                ? 'Try adjusting your filters'
                : 'Add your first material to get started'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {filteredItems.map((item) => {
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
                        <Text variant="titleMedium" style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        {item.sku && (
                          <Text variant="bodySmall" style={styles.itemSku}>
                            SKU: {item.sku}
                          </Text>
                        )}
                        <View style={styles.quantityContainer}>
                          <MaterialCommunityIcons name="package-variant" size={20} color={colors.secondary} />
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
            })}
          </View>
        )}
      </ScrollView>

      {user?.role === 'owner' && <FAB
        icon="plus"
        style={styles.fab}
        color={colors.text}
        onPress={() => router.push('/material/add-item')}
      />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 12,
    gap: 16,
  },
  filterButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonInactive: {
    backgroundColor: 'transparent',
  },
  filterLabel: {
    fontSize: 13,
    marginLeft: 8,
    color: colors.text,
  },
  filterLabelActive: {
    color: '#fff',
  },
  menu: {
    backgroundColor: colors.surface,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchbar: {
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  searchInput: {
    color: colors.text,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  itemsGrid: {
    flexDirection: 'column',
    gap: 12,
  },
  itemCard: {
    width: '100%',
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
    fontSize: 11,
    fontWeight: '600',
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
    color: colors.textMuted,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  quantity: {
    color: colors.secondary,
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
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 10,
    backgroundColor: colors.primary,
  },
});
