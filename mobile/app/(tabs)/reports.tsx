import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Alert, 
  Platform,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  Card, 
  ActivityIndicator, 
  Button, 
  IconButton,
  Modal,
  Portal,
  Divider
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';
import reportService, { 
  SummaryReport, 
  MaterialUsageReport, 
  TeamProductivityReport, 
  ProductionTrends 
} from '../../services/report.service';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

type ReportType = 'summary' | 'material-usage' | 'team-productivity' | 'production-trends';

const { width: screenWidth } = Dimensions.get('window');

export default function ReportsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [summaryReport, setSummaryReport] = useState<SummaryReport | null>(null);
  const [materialUsageReport, setMaterialUsageReport] = useState<MaterialUsageReport | null>(null);
  const [teamProductivityReport, setTeamProductivityReport] = useState<TeamProductivityReport | null>(null);
  const [productionTrends, setProductionTrends] = useState<ProductionTrends | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});

  useEffect(() => {
    loadReports();
  }, [reportType, dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      
      const { startDate, endDate } = dateRange;

      switch (reportType) {
        case 'summary':
          const summary = await reportService.getSummaryReport(startDate, endDate);
          setSummaryReport(summary);
          break;
        case 'material-usage':
          const materialUsage = await reportService.getMaterialUsageReport(startDate, endDate);
          setMaterialUsageReport(materialUsage);
          break;
        case 'team-productivity':
          const teamProductivity = await reportService.getTeamProductivityReport(startDate, endDate);
          setTeamProductivityReport(teamProductivity);
          break;
        case 'production-trends':
          const trends = await reportService.getProductionTrends('30d', 'day');
          setProductionTrends(trends);
          break;
      }
    } catch (error: any) {
      console.error('Failed to load reports:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExportModalVisible(false);
    setExporting(true);

    try {
      let blob: Blob;

      if (format === 'pdf') {
        blob = await reportService.exportReportPDF(reportType, dateRange.startDate, dateRange.endDate);
      } else {
        blob = await reportService.exportReportCSV(reportType, dateRange.startDate, dateRange.endDate);
      }

      // Create file URI
      const fileUri = `${FileSystem.cacheDirectory}report-${reportType}-${Date.now()}.${format}`;
      
      // Convert blob to base64 and write to file
      const base64Data = await blobToBase64(blob);
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
          dialogTitle: `Export ${reportType} report`,
        });
      } else {
        // Fallback for when sharing isn't available
        Alert.alert(
          'Export Complete', 
          `Report saved to: ${fileUri}`,
          [{ text: 'OK' }]
        );
      }

    } catch (error: any) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', error?.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  // Helper function to convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data URL prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const setDateRangeLast30Days = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  const clearDateRange = () => {
    setDateRange({});
  };

   if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={64} color={colors.text} />
      <Text variant="titleMedium" style={styles.emptyText}>No data available</Text>
      <Button mode="contained" onPress={loadReports} style={styles.retryButton}>
        Retry
      </Button>
    </View>
  );

  const renderSummaryReport = () => {
    if (!summaryReport) return renderEmptyState();

    const { orders, materials, productivity, period } = summaryReport;

    return (
      <View style={styles.reportContent}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Orders"
            value={orders.total.toString()}
            icon="clipboard-list"
            colors={[colors.primary, colors.secondary]}
          />
          <StatCard
            title="Active Orders"
            value={orders.active.toString()}
            icon="progress-clock"
            colors={[colors.warning, colors.secondaryDark]}
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title="Completed"
            value={orders.completed.toString()}
            icon="check-circle"
            colors={[colors.success, colors.warning]}
          />
          <StatCard
            title="Overdue"
            value={orders.overdue.toString()}
            icon="alert-circle"
            colors={[colors.error, colors.error]}
          />
        </View>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Materials Summary</Text>
            <View style={styles.materialsGrid}>
              <View style={styles.materialStat}>
                <Text variant="titleLarge" style={styles.materialValue}>{materials.totalItems}</Text>
                <Text variant="bodySmall" style={styles.materialLabel}>Total Items</Text>
              </View>
              <View style={styles.materialStat}>
                <Text variant="titleLarge" style={{ color: colors.warning }}>{materials.lowStock}</Text>
                <Text variant="bodySmall" style={styles.materialLabel}>Low Stock</Text>
              </View>
              <View style={styles.materialStat}>
                <Text variant="titleLarge" style={{ color: colors.error }}>{materials.outOfStock}</Text>
                <Text variant="bodySmall" style={styles.materialLabel}>Out of Stock</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Productivity</Text>
            <View style={styles.productivityGrid}>
              <View style={styles.productivityItem}>
                <Text variant="bodySmall">Avg Completion Time</Text>
                <Text variant="titleMedium">{productivity.averageCompletionTime} days</Text>
              </View>
              <View style={styles.productivityItem}>
                <Text variant="bodySmall">On-Time Rate</Text>
                <Text variant="titleMedium">{productivity.onTimeDeliveryRate}%</Text>
              </View>
              <View style={styles.productivityItem}>
                <Text variant="bodySmall">Steps Completed</Text>
                <Text variant="titleMedium">
                  {productivity.completedSteps}/{productivity.totalProductionSteps}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderMaterialUsageReport = () => {
    if (!materialUsageReport) return renderEmptyState();

    return (
      <View style={styles.reportContent}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Events"
            value={materialUsageReport.totalEvents.toString()}
            icon="swap-vertical"
            colors={[colors.primary, colors.secondary]}
          />
          <StatCard
            title="Materials Tracked"
            value={materialUsageReport.materials.length.toString()}
            icon="package-variant"
            colors={[colors.secondary, colors.accent]}
          />
        </View>

        {materialUsageReport.materials.map((material) => (
          <Card key={material.materialId} style={styles.itemCard}>
            <Card.Content>
              <View style={styles.itemHeader}>
                <Text variant="titleMedium" style={styles.itemName}>
                  {material.materialName}
                </Text>
                <View style={[
                  styles.stockBadge,
                  { 
                    backgroundColor: material.currentStock === 0 ? colors.error + '20' : 
                                   material.netChange < 0 ? colors.warning + '20' : colors.success + '20' 
                  }
                ]}>
                  <Text style={[
                    styles.stockText,
                    { 
                      color: material.currentStock === 0 ? colors.error : 
                            material.netChange < 0 ? colors.warning : colors.success 
                    }
                  ]}>
                    Stock: {material.currentStock} {material.unit}
                  </Text>
                </View>
              </View>
              
              <View style={styles.usageGrid}>
                <View style={styles.usageItem}>
                  <MaterialCommunityIcons name="plus-circle" size={16} color={colors.success} />
                  <Text variant="bodySmall">Added: {material.totalAdded}</Text>
                </View>
                <View style={styles.usageItem}>
                  <MaterialCommunityIcons name="minus-circle" size={16} color={colors.warning} />
                  <Text variant="bodySmall">Used: {material.totalUsed}</Text>
                </View>
                <View style={styles.usageItem}>
                  <MaterialCommunityIcons name="cart-arrow-down" size={16} color={colors.secondary} />
                  <Text variant="bodySmall">Sold: {material.totalSold}</Text>
                </View>
                <View style={styles.usageItem}>
                  <MaterialCommunityIcons name="trending-up" size={16} color={material.netChange >= 0 ? colors.success : colors.error} />
                  <Text variant="bodySmall">Net: {material.netChange}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderTeamProductivityReport = () => {
    if (!teamProductivityReport) return renderEmptyState();

    return (
      <View style={styles.reportContent}>
        <View style={styles.statsRow}>
          <StatCard
            title="Total Staff Members"
            value={teamProductivityReport.teamMembers.length.toString()}
            icon="account-group"
            colors={[colors.primary, colors.accent]}
          />
          <StatCard
            title="Total Orders Completed"
            value={teamProductivityReport.teamMembers.reduce((sum, member) => sum + member.ordersCompleted, 0).toString()}
            icon="check-all"
            colors={[colors.success, colors.warning]}
          />
        </View>

        {teamProductivityReport.teamMembers.map((member) => (
          <Card key={member.userId} style={styles.itemCard}>
            <Card.Content>
              <View style={styles.itemHeader}>
                <Text variant="titleMedium" style={styles.itemName}>
                  {member.name}
                </Text>
                <View style={[
                  styles.efficiencyBadge,
                  { 
                    backgroundColor: member.onTimeRate >= 80 ? colors.success + '20' : 
                                   member.onTimeRate >= 60 ? colors.warning + '20' : colors.error + '20' 
                  }
                ]}>
                  <Text style={[
                    styles.efficiencyText,
                    { 
                      color: member.onTimeRate >= 80 ? colors.success : 
                            member.onTimeRate >= 60 ? colors.warning : colors.error 
                    }
                  ]}>
                    {member.onTimeRate}% On Time
                  </Text>
                </View>
              </View>
              
              <View style={styles.teamStatsGrid}>
                <View style={styles.teamStat}>
                  <Text variant="bodySmall" style={styles.teamStatLabel}>Assigned</Text>
                  <Text variant="titleMedium" style={styles.teamStatValue}>
                    {member.ordersAssigned}
                  </Text>
                </View>
                <View style={styles.teamStat}>
                  <Text variant="bodySmall" style={styles.teamStatLabel}>Completed</Text>
                  <Text variant="titleMedium" style={[styles.teamStatValue, { color: colors.success }]}>
                    {member.ordersCompleted}
                  </Text>
                </View>
                <View style={styles.teamStat}>
                  <Text variant="bodySmall" style={styles.teamStatLabel}>Steps Done</Text>
                  <Text variant="titleMedium" style={styles.teamStatValue}>
                    {member.stepsCompleted}
                  </Text>
                </View>
                <View style={styles.teamStat}>
                  <Text variant="bodySmall" style={styles.teamStatLabel}>Avg Time</Text>
                  <Text variant="titleMedium" style={styles.teamStatValue}>
                    {member.averageCompletionTime}d
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  const renderProductionTrends = () => {
    if (!productionTrends) return renderEmptyState();

    return (
      <View style={styles.reportContent}>
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Order Trends</Text>
            {productionTrends.orderTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <Text variant="bodyMedium" style={styles.trendDate}>{trend._id}</Text>
                <View style={styles.trendStats}>
                  <Text variant="bodySmall">Total: {trend.totalOrders}</Text>
                  <Text variant="bodySmall" style={{ color: colors.success }}>Completed: {trend.completed}</Text>
                  <Text variant="bodySmall" style={{ color: colors.error }}>Cancelled: {trend.cancelled}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Material Trends</Text>
            {productionTrends.materialTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <Text variant="bodyMedium" style={styles.trendDate}>{trend._id}</Text>
                <View style={styles.trendStats}>
                  <Text variant="bodySmall" style={{ color: colors.success }}>Added: {trend.added}</Text>
                  <Text variant="bodySmall" style={{ color: colors.warning }}>Used: {trend.used}</Text>
                  <Text variant="bodySmall" style={{ color: colors.secondary }}>Sold: {trend.sold}</Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const StatCard = ({ title, value, icon, colors: gradientColors }: any) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      >
        <MaterialCommunityIcons name={icon} size={24} color={colors.text} />
        <Text variant="headlineMedium" style={styles.statValue}>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.statLabel}>
          {title}
        </Text>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Reports & Analytics
          </Text>
          <IconButton
            icon="download"
            iconColor={colors.text}
            size={24}
            onPress={() => setExportModalVisible(true)}
            disabled={exporting || loading}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.segmentScroll}
          >
            {[
              { value: 'summary', label: 'Summary', icon: 'clipboard-text' },
              { value: 'material-usage', label: 'Materials', icon: 'package-variant' },
              { value: 'team-productivity', label: 'Team', icon: 'account-group' },
              { value: 'production-trends', label: 'Trends', icon: 'chart-line' },
            ].map((opt) => {
              const active = reportType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.segmentButtonTouchable, active && styles.segmentButtonActive]}
                  onPress={() => setReportType(opt.value as ReportType)}
                >
                  <MaterialCommunityIcons
                    name={opt.icon as any}
                    size={16}
                    color={active ? colors.text : colors.text}
                  />
                  <Text style={[styles.segmentButtonText, active && styles.segmentButtonTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.dateFilterContainer}>
          <Button 
            mode="outlined" 
            onPress={setDateRangeLast30Days}
            compact
            icon="calendar-range"
          >
            Last 30 Days
          </Button>
          <Button 
            mode="outlined" 
            onPress={clearDateRange}
            compact
            icon="calendar-remove"
          >
            Clear
          </Button>
          {dateRange.startDate && (
            <Text variant="bodySmall" style={styles.dateRangeText}>
              Data for date range {dateRange.startDate} to {dateRange.endDate}
            </Text>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {(
            <>
              {reportType === 'summary' && renderSummaryReport()}
              {reportType === 'material-usage' && renderMaterialUsageReport()}
              {reportType === 'team-productivity' && renderTeamProductivityReport()}
              {reportType === 'production-trends' && renderProductionTrends()}
            </>
          )}
        </ScrollView>
      </View>

      <Portal>
        <Modal
          visible={exportModalVisible}
          onDismiss={() => setExportModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>Export Report</Text>
          <Text variant="bodyMedium" style={styles.modalSubtitle}>
            Choose format for {reportType} report
          </Text>
          
          <Button 
            mode="contained" 
            onPress={() => handleExport('pdf')} 
            style={styles.exportButton}
            loading={exporting}
            disabled={exporting}
            icon="file-pdf-box"
          >
            Export as PDF
          </Button>
          
          <Button 
            mode="contained" 
            onPress={() => handleExport('csv')} 
            style={styles.exportButton}
            loading={exporting}
            disabled={exporting}
            icon="file-delimited"
          >
            Export as CSV
          </Button>
          
          <Button 
            mode="outlined" 
            onPress={() => setExportModalVisible(false)}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    color: colors.text,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  segmentScroll: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  segmentButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.border,
  },
  segmentButtonText: {
    marginLeft: 8,
    color: colors.text,
  },
  segmentButtonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  segmentedButtons: {
    backgroundColor: colors.surface,
  },
  segmentButton: {
    flex: 1,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dateRangeText: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 24,
    color: colors.text,
    textAlign: 'center',
  },
   loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 8,
  },
  reportContent: {
    gap: 16,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  statValue: {
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 8,
    fontSize: 24,
  },
  statLabel: {
    color: colors.text + 'CC',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  materialsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  materialStat: {
    alignItems: 'center',
  },
  materialValue: {
    color: colors.text,
    fontWeight: 'bold',
  },
  materialLabel: {
    color: colors.text,
    marginTop: 4,
  },
  productivityGrid: {
    gap: 12,
  },
  productivityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemCard: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    elevation: 2,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  efficiencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  efficiencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  teamStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamStat: {
    alignItems: 'center',
  },
  teamStatLabel: {
    color: colors.text,
    fontSize: 12,
  },
  teamStatValue: {
    color: colors.text,
    fontWeight: 'bold',
    marginTop: 4,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  trendDate: {
    color: colors.text,
    flex: 1,
  },
  trendStats: {
    flexDirection: 'row',
    gap: 12,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    margin: 20,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    color: colors.text,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.text,
    marginBottom: 24,
  },
  exportButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginTop: 8,
  },
});