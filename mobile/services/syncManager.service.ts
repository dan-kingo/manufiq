import NetInfo from '@react-native-community/netinfo';
import offlineService from './offline.service';
import syncService, { SyncOperation } from './sync.service';
import itemService from './item.service';

class SyncManagerService {
  private isInitialized = false;
  private unsubscribeNetInfo?: () => void;

  init() {
    if (this.isInitialized) return;

    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.syncPendingOperations();
      }
    });

    this.isInitialized = true;
    console.log('Sync manager initialized');
  }

  destroy() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
    this.isInitialized = false;
  }

  async syncPendingOperations(): Promise<void> {
    if (offlineService.isSyncInProgress()) {
      console.log('Sync already in progress');
      return;
    }

    const isOnline = await offlineService.isOnline();
    if (!isOnline) {
      console.log('Device is offline, skipping sync');
      return;
    }

    offlineService.setSyncInProgress(true);

    try {
      const pendingOperations = await offlineService.getPendingOperations();

      if (pendingOperations.length === 0) {
        console.log('No pending operations to sync');
        return;
      }

      console.log(`Syncing ${pendingOperations.length} pending operations`);

      const syncOperations: SyncOperation[] = pendingOperations.map(op => ({
        opId: op.id,
        type: this.mapOperationType(op.type),
        entityType: op.entityType === 'alert' ? 'item' : op.entityType,
        payload: this.transformPayload(op),
        clientTimestamp: new Date(op.timestamp).toISOString(),
      }));

      const results = await syncService.push(syncOperations);

      for (const result of results.results) {
        if (result.status === 'applied') {
          await offlineService.markOperationSynced(result.opId);
          await this.handleSuccessfulSync(result);
        } else if (result.status === 'conflict') {
          console.log(`Conflict for operation ${result.opId}:`, result.conflictReason);
          await this.handleConflict(result);
        } else if (result.status === 'failed') {
          console.log(`Failed operation ${result.opId}:`, result.error);
        }
      }

      await offlineService.clearSyncedOperations();
      await offlineService.setLastSyncTime(Date.now());

      const items = await itemService.listItems();
      console.log(`Sync completed successfully. ${items.length} items in local storage`);

    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      offlineService.setSyncInProgress(false);
    }
  }

  private mapOperationType(type: string): 'adjust' | 'create' | 'update' | 'delete' {
    switch (type) {
      case 'adjust':
        return 'adjust';
      case 'create':
        return 'create';
      case 'update':
        return 'update';
      case 'scan':
        return 'update';
      case 'alert':
        return 'update';
      default:
        return 'update';
    }
  }

  private transformPayload(operation: any): Record<string, any> {
    const { payload } = operation;

    switch (operation.type) {
      case 'create':
        return {
          name: payload.name,
          sku: payload.sku,
          description: payload.description,
          quantity: payload.quantity,
          unit: payload.unit,
          category: payload.category,
          location: payload.location,
          tags: payload.tags,
          minThreshold: payload.minThreshold,
          expiryDate: payload.expiryDate,
        };

      case 'update':
        return {
          _id: payload.id || payload._id || payload._localId,
          updates: payload.updates || payload,
        };

      case 'adjust':
        return {
          itemId: payload.id || payload._id || payload._localId,
          delta: payload.delta,
          action: payload.action,
          reason: payload.reason,
        };

      case 'alert':
        return {
          itemId: payload.itemId,
          threshold: payload.threshold,
          currentQuantity: payload.currentQuantity,
        };

      default:
        return payload;
    }
  }

  private async handleSuccessfulSync(result: any): Promise<void> {
    if (result.serverData) {
      const localItems = await offlineService.getItems();
      const index = localItems.findIndex(
        item => item._localId && result.serverData._id
      );

      if (index !== -1) {
        localItems[index] = {
          ...result.serverData,
          _pendingSync: false,
        };
        delete localItems[index]._localId;
        await offlineService.saveItems(localItems);
      }
    }
  }

  private async handleConflict(result: any): Promise<void> {
    if (result.serverData) {
      const localItems = await offlineService.getItems();
      const index = localItems.findIndex(
        item => item._id === result.serverData._id
      );

      if (index !== -1) {
        localItems[index] = {
          ...result.serverData,
          _pendingSync: false,
        };
        await offlineService.saveItems(localItems);
      }
    }
  }

  async manualSync(): Promise<void> {
    await this.syncPendingOperations();
  }

  async getSyncStatus(): Promise<{
    pendingCount: number;
    lastSyncTime: number;
    isOnline: boolean;
  }> {
    const pendingOps = await offlineService.getPendingOperations();
    const lastSync = await offlineService.getLastSyncTime();
    const isOnline = await offlineService.isOnline();

    return {
      pendingCount: pendingOps.length,
      lastSyncTime: lastSync,
      isOnline,
    };
  }
}

export default new SyncManagerService();
