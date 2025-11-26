import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import uuid from 'react-native-uuid';
import { Item } from './item.service';

interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'adjust' | 'scan' | 'alert';
  entityType: 'item' | 'tag' | 'alert';
  payload: any;
  timestamp: number;
  synced: boolean;
}

interface StoredItem extends Item {
  _localId?: string;
  _pendingSync?: boolean;
}

const STORAGE_KEYS = {
  ITEMS: '@offline_items',
  OPERATIONS: '@offline_operations',
  ALERTS: '@offline_alerts',
  LAST_SYNC: '@last_sync_time',
};

class OfflineService {
  private syncInProgress = false;

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  }

  async getItems(): Promise<StoredItem[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ITEMS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting offline items:', error);
      return [];
    }
  }

  async saveItems(items: StoredItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving offline items:', error);
    }
  }

  async getItem(id: string): Promise<StoredItem | null> {
    const items = await this.getItems();
    return items.find(item => item._id === id || item._localId === id) || null;
  }

  async addItem(item: Omit<StoredItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<StoredItem> {
    const items = await this.getItems();
    const newItem: StoredItem = {
      ...item,
      _id: '',
      _localId: uuid.v4() as string,
      _pendingSync: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    await this.saveItems(items);

    await this.queueOperation({
      id: uuid.v4() as string,
      type: 'create',
      entityType: 'item',
      payload: newItem,
      timestamp: Date.now(),
      synced: false,
    });

    return newItem;
  }

  async updateItem(id: string, updates: Partial<StoredItem>): Promise<void> {
    const items = await this.getItems();
    const index = items.findIndex(item => item._id === id || item._localId === id);

    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...updates,
        _pendingSync: true,
        updatedAt: new Date().toISOString(),
      };
      await this.saveItems(items);

      await this.queueOperation({
        id: uuid.v4() as string,
        type: 'update',
        entityType: 'item',
        payload: { id, updates },
        timestamp: Date.now(),
        synced: false,
      });
    }
  }

  async adjustQuantity(id: string, delta: number, action: string, reason?: string): Promise<void> {
    const items = await this.getItems();
    const index = items.findIndex(item => item._id === id || item._localId === id);

    if (index !== -1) {
      items[index].quantity += delta;
      items[index]._pendingSync = true;
      items[index].updatedAt = new Date().toISOString();
      await this.saveItems(items);

      await this.queueOperation({
        id: uuid.v4() as string,
        type: 'adjust',
        entityType: 'item',
        payload: { id, delta, action, reason },
        timestamp: Date.now(),
        synced: false,
      });
    }
  }

  async getOperations(): Promise<OfflineOperation[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OPERATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting operations:', error);
      return [];
    }
  }

  async queueOperation(operation: OfflineOperation): Promise<void> {
    const operations = await this.getOperations();
    operations.push(operation);
    await AsyncStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
  }

  async getPendingOperations(): Promise<OfflineOperation[]> {
    const operations = await this.getOperations();
    return operations.filter(op => !op.synced);
  }

  async markOperationSynced(operationId: string): Promise<void> {
    const operations = await this.getOperations();
    const operation = operations.find(op => op.id === operationId);
    if (operation) {
      operation.synced = true;
      await AsyncStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(operations));
    }
  }

  async clearSyncedOperations(): Promise<void> {
    const operations = await this.getOperations();
    const pending = operations.filter(op => !op.synced);
    await AsyncStorage.setItem(STORAGE_KEYS.OPERATIONS, JSON.stringify(pending));
  }

  async getLastSyncTime(): Promise<number> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  async setLastSyncTime(timestamp: number): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp.toString());
  }

  async addLowStockAlert(itemId: string, threshold: number, currentQuantity: number): Promise<void> {
    try {
      const alerts = await this.getAlerts();
      const alert = {
        id: uuid.v4() as string,
        itemId,
        threshold,
        currentQuantity,
        timestamp: Date.now(),
        synced: false,
      };
      alerts.push(alert);
      await AsyncStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));

      await this.queueOperation({
        id: uuid.v4() as string,
        type: 'alert',
        entityType: 'alert',
        payload: alert,
        timestamp: Date.now(),
        synced: false,
      });
    } catch (error) {
      console.error('Error adding alert:', error);
    }
  }

  async getAlerts(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  async mergeServerItems(serverItems: Item[]): Promise<void> {
    const localItems = await this.getItems();
    const pendingItems = localItems.filter(item => item._pendingSync);

    const mergedItems = serverItems.map(serverItem => {
      const pendingUpdate = pendingItems.find(
        item => item._id === serverItem._id
      );
      return pendingUpdate || serverItem;
    });

    const newLocalItems = localItems.filter(
      item => item._pendingSync && !item._id
    );

    await this.saveItems([...mergedItems, ...newLocalItems]);
  }

  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  setSyncInProgress(inProgress: boolean): void {
    this.syncInProgress = inProgress;
  }

  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ITEMS,
      STORAGE_KEYS.OPERATIONS,
      STORAGE_KEYS.ALERTS,
      STORAGE_KEYS.LAST_SYNC,
    ]);
  }
}

export default new OfflineService();
