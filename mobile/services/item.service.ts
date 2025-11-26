import apiService from './api.service';
import { API_CONFIG } from '../constants/config';
import offlineService from './offline.service';

export interface Item {
  _id: string;
  businessId: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'ltr';
  category?: string;
  location?: string;
  minThreshold: number;
  image?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemData {
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  unit: 'pcs' | 'kg' | 'ltr';
  category?: string;
  location?: string;
  minThreshold?: number;
  expiryDate?: string;
}

export interface AdjustQuantityData {
  delta: number;
  action: 'added' | 'sold' | 'used' | 'adjusted';
  reason?: string;
}

class ItemService {
  async listItems(params?: { category?: string; tag?: string; lowStock?: boolean }): Promise<Item[]> {
    const isOnline = await offlineService.isOnline();

    if (!isOnline) {
      let items = await offlineService.getItems();

      if (params?.category) {
        items = items.filter(item => item.category === params.category);
      }

      if (params?.lowStock) {
        items = items.filter(item => item.quantity <= (item.minThreshold || 0));
      }

      return items;
    }

    try {
      const serverItems = await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.LIST, { params });
      await offlineService.mergeServerItems(serverItems);
      return serverItems;
    } catch (error) {
      console.log('Falling back to offline items');
      return await offlineService.getItems();
    }
  }

  async createItem(data: CreateItemData, imageFile?: any): Promise<{ message: string; item: Item}> {
    const isOnline = await offlineService.isOnline();

    if (!isOnline) {
      const newItem = await offlineService.addItem({
        businessId: '',
        name: data.name,
        sku: data.sku,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        location: data.location,
        minThreshold: data.minThreshold || 0,
        image: imageFile?.uri,
        expiryDate: data.expiryDate,
      });

      return {
        message: 'Item created offline',
        item: newItem,
      };
    }

    try {
      if (imageFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        formData.append('image', imageFile);

        return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.CREATE, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.CREATE, data);
    } catch (error) {
      console.log('Creating item offline due to error');
      const newItem = await offlineService.addItem({
        businessId: '',
        name: data.name,
        sku: data.sku,
        description: data.description,
        quantity: data.quantity,
        unit: data.unit,
        category: data.category,
        location: data.location,
        minThreshold: data.minThreshold || 0,
        image: imageFile?.uri,
        expiryDate: data.expiryDate,
      });

      return {
        message: 'Item created offline',
        item: newItem,
       
      };
    }
  }

  async getItem(id: string): Promise<Item> {
    const isOnline = await offlineService.isOnline();

    if (!isOnline) {
      const item = await offlineService.getItem(id);
      if (!item) {
        throw new Error('Item not found');
      }
      return item;
    }

    try {
      return await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.GET(id));
    } catch (error) {
      console.log('Falling back to offline item');
      const item = await offlineService.getItem(id);
      if (!item) {
        throw error;
      }
      return item;
    }
  }

  async updateItem(id: string, data: Partial<CreateItemData>, imageFile?: any): Promise<{ message: string; item: Item }> {
    const isOnline = await offlineService.isOnline();

    if (!isOnline) {
      await offlineService.updateItem(id, {
        ...data,
        image: imageFile?.uri || undefined,
      });

      const updatedItem = await offlineService.getItem(id);
      return {
        message: 'Item updated offline',
        item: updatedItem!,
      };
    }

    try {
      if (imageFile) {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) {
            formData.append(key, value.toString());
          }
        });
        formData.append('image', imageFile);

        return await apiService.put(API_CONFIG.ENDPOINTS.ITEMS.UPDATE(id), formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      return await apiService.put(API_CONFIG.ENDPOINTS.ITEMS.UPDATE(id), data);
    } catch (error) {
      console.log('Updating item offline due to error');
      await offlineService.updateItem(id, {
        ...data,
        image: imageFile?.uri || undefined,
      });

      const updatedItem = await offlineService.getItem(id);
      return {
        message: 'Item updated offline',
        item: updatedItem!,
      };
    }
  }

  async adjustQuantity(id: string, data: AdjustQuantityData): Promise<{ message: string; item: Item }> {
    const isOnline = await offlineService.isOnline();

    if (!isOnline) {
      await offlineService.adjustQuantity(id, data.delta, data.action, data.reason);

      const item = await offlineService.getItem(id);
      if (item && item.quantity <= (item.minThreshold || 0)) {
        await offlineService.addLowStockAlert(id, item.minThreshold || 0, item.quantity);
      }

      return {
        message: 'Quantity adjusted offline',
        item: item!,
      };
    }

    try {
      return await apiService.post(API_CONFIG.ENDPOINTS.ITEMS.ADJUST(id), data);
    } catch (error) {
      console.log('Adjusting quantity offline due to error');
      await offlineService.adjustQuantity(id, data.delta, data.action, data.reason);

      const item = await offlineService.getItem(id);
      if (item && item.quantity <= (item.minThreshold || 0)) {
        await offlineService.addLowStockAlert(id, item.minThreshold || 0, item.quantity);
      }

      return {
        message: 'Quantity adjusted offline',
        item: item!,
      };
    }
  }

  async getItemEvents(id: string): Promise<any[]> {
    return await apiService.get(API_CONFIG.ENDPOINTS.ITEMS.EVENTS(id));
  }
}

export default new ItemService();
