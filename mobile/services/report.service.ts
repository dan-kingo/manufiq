import apiService from './api.service';
import { API_CONFIG } from '../constants/config';

export interface SummaryReport {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  materialUsage: {
    materialId: string;
    materialName: string;
    quantityUsed: number;
    unit: string;
    cost: number;
  }[];
  lowStockItems: {
    materialId: string;
    materialName: string;
    currentQuantity: number;
    minThreshold: number;
    unit: string;
  }[];
  period: {
    startDate?: string;
    endDate?: string;
  };
}

export interface MaterialUsageReport {
  materialId?: string;
  materialName?: string;
  usageData: {
    date: string;
    quantityUsed: number;
    ordersCount: number;
    cost: number;
  }[];
  totalUsage: number;
  averageDailyUsage: number;
  period: {
    startDate?: string;
    endDate?: string;
  };
}

export interface TeamProductivityReport {
  teamMembers: {
    userId: string;
    userName: string;
    completedOrders: number;
    pendingOrders: number;
    efficiency: number;
    avgCompletionTime: number; // in hours
  }[];
  overallStats: {
    totalCompletedOrders: number;
    totalPendingOrders: number;
    avgEfficiency: number;
    avgCompletionTime: number;
  };
  period: {
    startDate?: string;
    endDate?: string;
  };
}

export interface ProductionTrends {
  trends: {
    period: string;
    ordersCompleted: number;
    materialsUsed: number;
    revenue: number;
    cost: number;
  }[];
  periodType: string;
  grouping: string;
}

export interface HistoricalData {
  data: any[];
  type: string;
  totalCount: number;
  period?: {
    startDate?: string;
    endDate?: string;
  };
}

class ReportService {
  async getSummaryReport(startDate?: string, endDate?: string): Promise<SummaryReport> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.SUMMARY, {
      params,
    });
  }

  async getMaterialUsageReport(
    startDate?: string, 
    endDate?: string, 
    materialId?: string
  ): Promise<MaterialUsageReport> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (materialId) params.materialId = materialId;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.MATERIAL_USAGE, {
      params,
    });
  }

  async getTeamProductivityReport(startDate?: string, endDate?: string): Promise<TeamProductivityReport> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.TEAM_PRODUCTIVITY, {
      params,
    });
  }

  async getProductionTrends(
    period?: string, 
    groupBy?: string
  ): Promise<ProductionTrends> {
    const params: any = {};
    if (period) params.period = period;
    if (groupBy) params.groupBy = groupBy;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.PRODUCTION_TRENDS, {
      params,
    });
  }

  async exportReportPDF(
    reportType: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<Blob> {
    const params: any = { reportType };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.EXPORT_PDF, {
      params,
      responseType: 'blob',
    });
  }

  async exportReportCSV(
    reportType: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<Blob> {
    const params: any = { reportType };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.EXPORT_CSV, {
      params,
      responseType: 'blob',
    });
  }

  async getHistoricalData(
    dataType: string,
    startDate?: string,
    endDate?: string,
    limit?: number
  ): Promise<HistoricalData> {
    const params: any = { dataType };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (limit) params.limit = limit;

    return await apiService.get(API_CONFIG.ENDPOINTS.REPORTS.HISTORICAL, {
      params,
    });
  }

  // Helper method to download exported files
  async downloadExportedFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  // Helper method to format date for API
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Helper method to get default date range (last 30 days)
  getDefaultDateRange(): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      startDate: this.formatDateForAPI(startDate),
      endDate: this.formatDateForAPI(endDate),
    };
  }
}

export default new ReportService();