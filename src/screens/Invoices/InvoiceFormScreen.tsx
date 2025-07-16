import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Invoice, LineItem, Client, Settings, Estimate } from '../../models';
import { storageService, formatCurrency, getCurrentDate, addDays } from '../../utils';
import LineItemForm from '../../components/LineItemForm';
import { InvoicesStackParamList } from '../../navigation/InvoicesStackNavigator';

type NavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoiceForm'>;
type InvoiceFormRouteProp = RouteProp<InvoicesStackParamList, 'InvoiceForm'>;

const InvoiceFormScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<InvoiceFormRouteProp>();
  const { invoiceId, fromEstimateId } = route.params || {};

  const [invoice, setInvoice] = useState<Partial<Invoice>>({
    items: [],
    taxRate: 0.08,
    notes: '',
    paid: false,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLineItemModal, setShowLineItemModal] = useState(false);
  const [editingLineItem, setEditingLineItem] = useState<LineItem | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, settingsData] = await Promise.all([
        storageService.getClients(),
        storageService.getSettings(),
      ]);

      setClients(clientsData);
      setSettings(settingsData);

      if (invoiceId) {
        // Editing existing invoice
        const invoices = await storageService.getInvoices();
        const existingInvoice = invoices.find(i => i.id === invoiceId);
        if (existingInvoice) {
          setInvoice(existingInvoice);
          const client = clientsData.find(c => c.id === existingInvoice.clientId);
          setSelectedClient(client || null);
        }
      } else if (fromEstimateId) {
        // Creating invoice from estimate
        const estimates = await storageService.getEstimates();
        const sourceEstimate = estimates.find(e => e.id === fromEstimateId);
        if (sourceEstimate) {
          const invoiceNumber = await storageService.generateInvoiceNumber();
          setInvoice({
            invoiceNumber,
            issueDate: getCurrentDate(),
            dueDate: addDays(getCurrentDate(), 30),
            items: sourceEstimate.items,
            taxRate: sourceEstimate.taxRate,
            notes: sourceEstimate.notes,
            paid: false,
          });
          const client = clientsData.find(c => c.id === sourceEstimate.clientId);
          setSelectedClient(client || null);
        }
      } else {
        // Creating new invoice
        const invoiceNumber = await storageService.generateInvoiceNumber();
        setInvoice(prev => ({
          ...prev,
          invoiceNumber,
          issueDate: getCurrentDate(),
          dueDate: addDays(getCurrentDate(), 30),
          taxRate: settingsData.defaultTaxRate,
          notes: settingsData.defaultNote || '',
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('错误', '加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (items: LineItem[], taxRate: number) => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const taxableAmount = items
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const tax = taxableAmount * (taxRate / 100);
    return subtotal + tax;
  };

  const handleSave = async () => {
    if (!selectedClient) {
      Alert.alert('错误', '请选择客户');
      return;
    }

    if (!invoice.items || invoice.items.length === 0) {
      Alert.alert('错误', '请至少添加一个项目');
      return;
    }

    try {
      const total = calculateTotal(invoice.items, invoice.taxRate || 0);
      
      const invoiceToSave: Invoice = {
        id: invoiceId || Date.now().toString(),
        clientId: selectedClient.id,
        invoiceNumber: invoice.invoiceNumber!,
        estimateNumber: invoice.estimateNumber || '',
        issueDate: invoice.issueDate!,
        validUntil: invoice.validUntil || '',
        dueDate: invoice.dueDate!,
        items: invoice.items,
        taxRate: invoice.taxRate || 0,
        notes: invoice.notes || '',
        status: 'sent' as const,
        total,
        paid: invoice.paid || false,
      };

      await storageService.saveInvoice(invoiceToSave);
      Alert.alert('成功', '发票已保存', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving invoice:', error);
      Alert.alert('错误', '保存发票失败');
    }
  };

  const handleAddLineItem = () => {
    setEditingLineItem(undefined);
    setShowLineItemModal(true);
  };

  const handleEditLineItem = (item: LineItem) => {
    setEditingLineItem(item);
    setShowLineItemModal(true);
  };

  const handleSaveLineItem = (item: LineItem) => {
    const items = invoice.items || [];
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }

    setInvoice(prev => ({ ...prev, items }));
    setShowLineItemModal(false);
  };

  const handleDeleteLineItem = (itemId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这个项目吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            const items = (invoice.items || []).filter(i => i.id !== itemId);
            setInvoice(prev => ({ ...prev, items }));
          },
        },
      ]
    );
  };

  const renderLineItem = ({ item }: { item: LineItem }) => (
    <View style={styles.lineItemCard}>
      <View style={styles.lineItemHeader}>
        <Text style={styles.lineItemDescription}>{item.description}</Text>
        <View style={styles.lineItemActions}>
          <TouchableOpacity onPress={() => handleEditLineItem(item)}>
            <Icon name="edit" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteLineItem(item.id)}
            style={styles.deleteButton}
          >
            <Icon name="delete" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.lineItemDetails}>
        <Text style={styles.lineItemText}>
          {item.quantity} {item.unit === 'hours' ? '小时' : '天'} × {formatCurrency(item.unitPrice)}
        </Text>
        <Text style={styles.lineItemTotal}>
          {formatCurrency(item.quantity * item.unitPrice)}
        </Text>
      </View>
      {item.taxable && (
        <Text style={styles.taxableLabel}>应税</Text>
      )}
    </View>
  );

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={styles.clientItem}
      onPress={() => {
        setSelectedClient(item);
        setShowClientModal(false);
      }}
    >
      <Text style={styles.clientName}>{item.name}</Text>
      {item.company && <Text style={styles.clientCompany}>{item.company}</Text>}
      {item.email && <Text style={styles.clientEmail}>{item.email}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>发票编号</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={invoice.invoiceNumber}
                editable={false}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>付款状态</Text>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  invoice.paid ? styles.paidButton : styles.unpaidButton,
                ]}
                onPress={() => setInvoice(prev => ({ ...prev, paid: !prev.paid }))}
              >
                <Icon 
                  name={invoice.paid ? "check-circle" : "schedule"} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.statusButtonText}>
                  {invoice.paid ? '已付款' : '未付款'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>客户 *</Text>
            <TouchableOpacity
              style={styles.clientSelector}
              onPress={() => setShowClientModal(true)}
            >
              <Text style={selectedClient ? styles.selectedClientText : styles.placeholderText}>
                {selectedClient ? selectedClient.name : '选择客户'}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>发布日期</Text>
              <TextInput
                style={styles.input}
                value={invoice.issueDate}
                onChangeText={(text) => setInvoice(prev => ({ ...prev, issueDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>到期日期</Text>
              <TextInput
                style={styles.input}
                value={invoice.dueDate}
                onChangeText={(text) => setInvoice(prev => ({ ...prev, dueDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>项目列表</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddLineItem}>
              <Icon name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>添加项目</Text>
            </TouchableOpacity>
          </View>

          {invoice.items && invoice.items.length > 0 ? (
            <FlatList
              data={invoice.items}
              renderItem={renderLineItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.emptyText}>暂无项目，点击添加项目按钮开始</Text>
          )}
        </View>

        {/* Tax and Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>税率和备注</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>税率 (%)</Text>
            <TextInput
              style={styles.input}
              value={invoice.taxRate?.toString()}
              onChangeText={(text) => setInvoice(prev => ({ ...prev, taxRate: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="8.0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={invoice.notes}
              onChangeText={(text) => setInvoice(prev => ({ ...prev, notes: text }))}
              placeholder="输入备注信息"
              multiline
            />
          </View>
        </View>

        {/* Total */}
        {invoice.items && invoice.items.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>总金额:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(calculateTotal(invoice.items, invoice.taxRate || 0))}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存发票</Text>
        </TouchableOpacity>
      </View>

      {/* Client Selection Modal */}
      <Modal visible={showClientModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>选择客户</Text>
            <TouchableOpacity onPress={() => setShowClientModal(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={clients}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.id}
            style={styles.clientList}
          />
        </View>
      </Modal>

      {/* Line Item Form Modal */}
      <Modal visible={showLineItemModal} animationType="slide">
        <View style={styles.modalContainer}>
          <LineItemForm
            item={editingLineItem}
            onSave={handleSaveLineItem}
            onCancel={() => setShowLineItemModal(false)}
            enableTaxable={settings?.enableItemTaxable || false}
          />
        </View>
      </Modal>
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  paidButton: {
    backgroundColor: '#4CAF50',
  },
  unpaidButton: {
    backgroundColor: '#FF9800',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  selectedClientText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2D6A4F',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  lineItemCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  lineItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lineItemDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  lineItemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    marginLeft: 8,
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
  taxableLabel: {
    fontSize: 10,
    color: '#2D6A4F',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  totalSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  bottomContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#2D6A4F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clientList: {
    flex: 1,
  },
  clientItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  clientCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
  },
});

export default InvoiceFormScreen; 