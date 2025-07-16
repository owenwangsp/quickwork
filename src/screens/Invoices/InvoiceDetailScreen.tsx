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
import { Invoice, Client, Settings, Estimate } from '../../models';
import { storageService, formatCurrency, formatDate, PDFService } from '../../utils';
import { InvoicesStackParamList } from '../../navigation/InvoicesStackNavigator';

type NavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoiceDetail'>;
type InvoiceDetailRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceDetail'>;

const InvoiceDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InvoiceDetailRouteProp>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [relatedEstimate, setRelatedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoiceDetail();
  }, []);

  const loadInvoiceDetail = async () => {
    try {
      const invoices = await storageService.getInvoices();
      const foundInvoice = invoices.find(i => i.id === invoiceId);
      
      if (foundInvoice) {
        setInvoice(foundInvoice);
        
        const [clients, settingsData, estimates] = await Promise.all([
          storageService.getClients(),
          storageService.getSettings(),
          storageService.getEstimates(),
        ]);
        
        const foundClient = clients.find(c => c.id === foundInvoice.clientId);
        setClient(foundClient || null);
        setSettings(settingsData);
        
        // Load related estimate if this invoice was converted from an estimate
        const foundEstimate = estimates.find(e => e.convertedInvoiceId === foundInvoice.id);
        setRelatedEstimate(foundEstimate || null);
      } else {
        Alert.alert('错误', '发票未找到', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading invoice detail:', error);
      Alert.alert('错误', '加载发票详情失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    if (!invoice) return 0;
    return invoice.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    if (!invoice) return 0;
    const taxableAmount = invoice.items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    return taxableAmount * (invoice.taxRate / 100);
  };

  const handleEdit = () => {
    navigation.navigate('InvoiceForm', { invoiceId: invoice!.id });
  };

  const handleTogglePaid = async () => {
    if (!invoice) return;

    const newPaidStatus = !invoice.paid;
    const statusMessage = newPaidStatus ? '标记为已付款' : '标记为未付款';

    Alert.alert(
      '更新付款状态',
      `确定要${statusMessage}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              const updatedInvoice = {
                ...invoice,
                paid: newPaidStatus,
              };
              await storageService.saveInvoice(updatedInvoice);
              setInvoice(updatedInvoice);
              Alert.alert('成功', `已${statusMessage}`);
            } catch (error) {
              console.error('Error updating payment status:', error);
              Alert.alert('错误', '更新失败');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!invoice || !client) return;

    try {
      const shareContent = `
发票: ${invoice.invoiceNumber}
客户: ${client.name}
发布日期: ${formatDate(invoice.issueDate)}
到期日期: ${formatDate(invoice.dueDate)}
总金额: ${formatCurrency(invoice.total)}
付款状态: ${invoice.paid ? '已付款' : '未付款'}

项目详情:
${invoice.items.map(item => 
  `- ${item.description}: ${item.quantity} ${item.unit === 'hours' ? '小时' : '天'} × ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.quantity * item.unitPrice)}`
).join('\n')}

${invoice.notes ? `\n备注: ${invoice.notes}` : ''}
      `;

      await Share.share({
        message: shareContent.trim(),
        title: `发票 ${invoice.invoiceNumber}`,
      });
    } catch (error) {
      console.error('Error sharing invoice:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!invoice || !client || !settings) {
      Alert.alert('错误', '缺少必要信息，无法生成PDF');
      return;
    }

    try {
      const result = await PDFService.generateAndSharePDF(
        invoice,
        client,
        settings,
        'invoice'
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
      `确定要删除发票 ${invoice?.invoiceNumber} 吗？此操作无法撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteInvoice(invoiceId);
              Alert.alert('成功', '发票已删除', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting invoice:', error);
              Alert.alert('错误', '删除失败');
            }
          },
        },
      ]
    );
  };

  const handleViewRelatedEstimate = () => {
    if (relatedEstimate) {
      // Navigate to estimate detail screen within current stack
      navigation.navigate('EstimateDetail', { estimateId: relatedEstimate.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!invoice) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>发票未找到</Text>
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
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: invoice.paid ? '#4CAF50' : '#FF9800' }
            ]}>
              <Text style={styles.statusText}>
                {invoice.paid ? '已付款' : '未付款'}
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

        {/* Invoice Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>发票信息</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>发布日期:</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>到期日期:</Text>
            <Text style={styles.detailValue}>{formatDate(invoice.dueDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>税率:</Text>
            <Text style={styles.detailValue}>{invoice.taxRate}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>付款状态:</Text>
            <TouchableOpacity onPress={handleTogglePaid}>
              <Text style={[
                styles.detailValue,
                { color: invoice.paid ? '#4CAF50' : '#FF9800' }
              ]}>
                {invoice.paid ? '已付款' : '未付款'} (点击切换)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>项目明细</Text>
          {invoice.items.map((item, index) => (
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
                <Text style={styles.lineItemAmount}>
                  {formatCurrency(item.quantity * item.unitPrice)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>金额汇总</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>小计:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>税费 ({invoice.taxRate}%):</Text>
            <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>总计:</Text>
            <Text style={styles.totalValue}>{formatCurrency(subtotal + tax)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备注</Text>
            <Text style={styles.notes}>{invoice.notes}</Text>
          </View>
        )}

        {/* Related Estimate */}
        {relatedEstimate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>关联报价单</Text>
            <TouchableOpacity style={styles.relatedEstimateCard} onPress={handleViewRelatedEstimate}>
              <View style={styles.relatedEstimateHeader}>
                <View style={styles.relatedEstimateInfo}>
                  <Text style={styles.relatedEstimateNumber}>{relatedEstimate.estimateNumber}</Text>
                  <Text style={styles.relatedEstimateDate}>
                    发布: {formatDate(relatedEstimate.issueDate)}
                  </Text>
                  <Text style={styles.relatedEstimateDate}>
                    有效期至: {formatDate(relatedEstimate.validUntil)}
                  </Text>
                </View>
                <View style={styles.relatedEstimateRight}>
                  <View style={[
                    styles.relatedEstimateStatus,
                    { backgroundColor: relatedEstimate.status === 'converted' ? '#4CAF50' : '#2196F3' }
                  ]}>
                    <Text style={styles.relatedEstimateStatusText}>
                      {relatedEstimate.status === 'converted' ? '已转换' : 
                       relatedEstimate.status === 'sent' ? '已发送' : '草稿'}
                    </Text>
                  </View>
                  <Text style={styles.relatedEstimateAmount}>
                    {formatCurrency(relatedEstimate.total)}
                  </Text>
                  <Icon name="arrow-forward-ios" size={16} color="#666" style={styles.arrowIcon} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Convert to Invoice Button */}
      {!invoice.paid && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.convertButton}
            onPress={handleTogglePaid}
          >
            <Text style={styles.convertButtonText}>标记为已付款</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 15,
  },
  clientInfo: {
    marginLeft: 10,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  clientDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  taxableLabel: {
    fontSize: 10,
    color: '#2D6A4F',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  lineItemAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomActions: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  convertButton: {
    backgroundColor: '#2D6A4F',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  convertButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  relatedEstimateCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  relatedEstimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relatedEstimateInfo: {
    flex: 1,
  },
  relatedEstimateNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 4,
  },
  relatedEstimateDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  relatedEstimateRight: {
    alignItems: 'flex-end',
  },
  relatedEstimateStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  relatedEstimateStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  relatedEstimateAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 4,
  },
  arrowIcon: {
    marginLeft: 8,
  },
});

export default InvoiceDetailScreen; 