import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Estimate, Client, Settings } from '../../models';
import { storageService, formatCurrency, formatDate, PDFService } from '../../utils';
import { EstimatesStackParamList } from '../../navigation/EstimatesStackNavigator';

type NavigationProp = StackNavigationProp<EstimatesStackParamList, 'EstimateDetail'>;
type EstimateDetailRouteProp = RouteProp<EstimatesStackParamList, 'EstimateDetail'>;

const EstimateDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EstimateDetailRouteProp>();
  const { estimateId } = route.params;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstimateDetail();
  }, []);

  const loadEstimateDetail = async () => {
    try {
      const estimates = await storageService.getEstimates();
      const foundEstimate = estimates.find(e => e.id === estimateId);
      
      if (foundEstimate) {
        setEstimate(foundEstimate);
        
        const clients = await storageService.getClients();
        const foundClient = clients.find(c => c.id === foundEstimate.clientId);
        setClient(foundClient || null);
        
        const settingsData = await storageService.getSettings();
        setSettings(settingsData);
      } else {
        Alert.alert('错误', '报价单未找到', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading estimate detail:', error);
      Alert.alert('错误', '加载报价单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!estimate) return 0;
    return estimate.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    if (!estimate) return 0;
    const taxableAmount = estimate.items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return taxableAmount * (estimate.taxRate / 100);
  };

  const handleEdit = () => {
    navigation.navigate('EstimateForm', { estimateId: estimate!.id });
  };

  const handleConvertToInvoice = () => {
    Alert.alert(
      '转换为发票',
      '确定要将此报价单转换为发票吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '转换',
          onPress: async () => {
            try {
              // Create invoice from estimate
              const invoiceNumber = await storageService.generateInvoiceNumber();
              const invoice = {
                ...estimate!,
                id: Date.now().toString(),
                invoiceNumber,
                dueDate: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
                paid: false,
              };

              await storageService.saveInvoice(invoice);
              
              // Update estimate status to converted
              const updatedEstimate = {
                ...estimate!,
                status: 'converted' as const,
                convertedInvoiceId: invoice.id,
              };
              await storageService.saveEstimate(updatedEstimate);

              Alert.alert('成功', '已转换为发票', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error converting to invoice:', error);
              Alert.alert('错误', '转换失败');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!estimate || !client) return;

    try {
      const shareContent = `
报价单: ${estimate.estimateNumber}
客户: ${client.name}
发布日期: ${formatDate(estimate.issueDate)}
有效期至: ${formatDate(estimate.validUntil)}
总金额: ${formatCurrency(estimate.total)}

项目详情:
${estimate.items.map(item => 
  `- ${item.description}: ${item.quantity} ${item.unit === 'hours' ? '小时' : '天'} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`
).join('\n')}

${estimate.notes ? `\n备注: ${estimate.notes}` : ''}
      `;

      await Share.share({
        message: shareContent.trim(),
        title: `报价单 ${estimate.estimateNumber}`,
      });
    } catch (error) {
      console.error('Error sharing estimate:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!estimate || !client || !settings) {
      Alert.alert('错误', '缺少必要信息，无法生成PDF');
      return;
    }

    try {
      const result = await PDFService.generateAndSharePDF(
        estimate,
        client,
        settings,
        'estimate'
      );

      if (result.success) {
        Alert.alert('成功', 'PDF已生成并可分享');
      } else {
        Alert.alert('错误', result.error || 'PDF生成失败');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('错误', 'PDF生成失败');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除报价单 ${estimate?.estimateNumber} 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteEstimate(estimateId);
              Alert.alert('成功', '报价单已删除', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting estimate:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#FFA500';
      case 'sent':
        return '#2196F3';
      case 'converted':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'sent':
        return '已发送';
      case 'converted':
        return '已转换';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!estimate) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>报价单未找到</Text>
      </View>
    );
  }

  const subtotal = calculateSubtotal();
  const tax = calculateTax();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.estimateNumber}>{estimate.estimateNumber}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(estimate.status) }
            ]}>
              <Text style={styles.statusText}>
                {getStatusText(estimate.status)}
              </Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Icon name="share" size={20} color="#2D6A4F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleGeneratePDF}>
              <Icon name="picture-as-pdf" size={20} color="#2D6A4F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Icon name="edit" size={20} color="#2D6A4F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Icon name="delete" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Client Info */}
        {client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>客户信息</Text>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{client.name}</Text>
              {client.company && <Text style={styles.clientDetail}>{client.company}</Text>}
              {client.email && <Text style={styles.clientDetail}>{client.email}</Text>}
              {client.phone && <Text style={styles.clientDetail}>{client.phone}</Text>}
              {client.address && <Text style={styles.clientDetail}>{client.address}</Text>}
            </View>
          </View>
        )}

        {/* Estimate Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>报价单信息</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>发布日期:</Text>
            <Text style={styles.detailValue}>{formatDate(estimate.issueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>有效期至:</Text>
            <Text style={styles.detailValue}>{formatDate(estimate.validUntil)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>税率:</Text>
            <Text style={styles.detailValue}>{estimate.taxRate}%</Text>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>项目明细</Text>
          {estimate.items.map((item, index) => (
            <View key={item.id} style={styles.lineItem}>
              <View style={styles.lineItemHeader}>
                <Text style={styles.lineItemDescription}>{item.description}</Text>
                {item.taxable && (
                  <Text style={styles.taxableLabel}>应税</Text>
                )}
              </View>
              <View style={styles.lineItemDetails}>
                <Text style={styles.lineItemText}>
                  {item.quantity} {item.unit === 'hours' ? '小时' : '天'} × {formatCurrency(item.unitPrice)}
                </Text>
                <Text style={styles.lineItemTotal}>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>金额汇总</Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>小计:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>税费 ({estimate.taxRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(tax)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>总计:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(estimate.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {estimate.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.notesText}>{estimate.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {estimate.status !== 'converted' && (
          <TouchableOpacity style={styles.convertButton} onPress={handleConvertToInvoice}>
            <Icon name="receipt" size={20} color="white" />
            <Text style={styles.convertButtonText}>转换为发票</Text>
          </TouchableOpacity>
        )}
        {estimate.status === 'converted' && estimate.convertedInvoiceId && (
          <View style={styles.convertedInfo}>
            <Icon name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.convertedText}>已转换为发票</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  estimateNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 12,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  clientInfo: {
    marginTop: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  lineItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
    marginBottom: 12,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  lineItemDescription: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taxableLabel: {
    backgroundColor: '#2D6A4F',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  lineItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineItemText: {
    fontSize: 14,
    color: '#666',
  },
  lineItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomActions: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  convertButton: {
    backgroundColor: '#2D6A4F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  convertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  convertedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  convertedText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EstimateDetailScreen; 