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
import { Estimate, LineItem, Client, Settings } from '../../models';
import { storageService, formatCurrency, getCurrentDate, addDays } from '../../utils';
import LineItemForm from '../../components/LineItemForm';
import { EstimatesStackParamList } from '../../navigation/EstimatesStackNavigator';

type NavigationProp = StackNavigationProp<EstimatesStackParamList, 'EstimateForm'>;
type EstimateFormRouteProp = RouteProp<EstimatesStackParamList, 'EstimateForm'>;

const EstimateFormScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EstimateFormRouteProp>();
  const { estimateId } = route.params || {};

  const [estimate, setEstimate] = useState<Partial<Estimate>>({
    items: [],
    taxRate: 0.08,
    notes: '',
    status: 'draft',
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

      if (estimateId) {
        const estimates = await storageService.getEstimates();
        const existingEstimate = estimates.find(e => e.id === estimateId);
        if (existingEstimate) {
          setEstimate(existingEstimate);
          const client = clientsData.find(c => c.id === existingEstimate.clientId);
          setSelectedClient(client || null);
        }
      } else {
        // Set defaults for new estimate
        const estimateNumber = await storageService.generateEstimateNumber();
        setEstimate(prev => ({
          ...prev,
          estimateNumber,
          issueDate: getCurrentDate(),
          validUntil: addDays(getCurrentDate(), 30),
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

    if (!estimate.items || estimate.items.length === 0) {
      Alert.alert('错误', '请至少添加一个项目');
      return;
    }

    try {
      const total = calculateTotal(estimate.items, estimate.taxRate || 0);
      
      const estimateToSave: Estimate = {
        id: estimateId || Date.now().toString(),
        clientId: selectedClient.id,
        estimateNumber: estimate.estimateNumber!,
        issueDate: estimate.issueDate!,
        validUntil: estimate.validUntil!,
        items: estimate.items,
        taxRate: estimate.taxRate || 0,
        notes: estimate.notes || '',
        status: estimate.status as 'draft' | 'sent' | 'converted',
        total,
      };

      await storageService.saveEstimate(estimateToSave);
      Alert.alert('成功', '报价单已保存', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving estimate:', error);
      Alert.alert('错误', '保存报价单失败');
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
    const items = estimate.items || [];
    const existingIndex = items.findIndex(i => i.id === item.id);
    
    if (existingIndex >= 0) {
      items[existingIndex] = item;
    } else {
      items.push(item);
    }

    setEstimate(prev => ({ ...prev, items }));
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
            const items = (estimate.items || []).filter(i => i.id !== itemId);
            setEstimate(prev => ({ ...prev, items }));
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
              <Text style={styles.label}>报价单编号</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={estimate.estimateNumber}
                editable={false}
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>状态</Text>
              <View style={styles.statusContainer}>
                {['draft', 'sent', 'converted'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      estimate.status === status && styles.statusButtonActive,
                    ]}
                                         onPress={() => setEstimate(prev => ({ ...prev, status: status as 'draft' | 'sent' | 'converted' }))}
                   >
                     <Text
                       style={[
                         styles.statusText,
                         estimate.status === status && styles.statusTextActive,
                       ]}
                     >
                       {status === 'draft' ? '草稿' : status === 'sent' ? '已发送' : '已转换'}
                     </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                value={estimate.issueDate}
                onChangeText={(text) => setEstimate(prev => ({ ...prev, issueDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>有效期至</Text>
              <TextInput
                style={styles.input}
                value={estimate.validUntil}
                onChangeText={(text) => setEstimate(prev => ({ ...prev, validUntil: text }))}
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

          {estimate.items && estimate.items.length > 0 ? (
            <FlatList
              data={estimate.items}
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
              value={estimate.taxRate?.toString()}
              onChangeText={(text) => setEstimate(prev => ({ ...prev, taxRate: parseFloat(text) || 0 }))}
              keyboardType="numeric"
              placeholder="8.0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>备注</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={estimate.notes}
              onChangeText={(text) => setEstimate(prev => ({ ...prev, notes: text }))}
              placeholder="输入备注信息"
              multiline
            />
          </View>
        </View>

        {/* Total */}
        {estimate.items && estimate.items.length > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>总金额:</Text>
            <Text style={styles.totalAmount}>
              {formatCurrency(calculateTotal(estimate.items, estimate.taxRate || 0))}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存报价单</Text>
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    flex: 0.48,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    marginRight: 4,
    borderRadius: 4,
  },
  statusButtonActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  statusTextActive: {
    color: 'white',
  },
  clientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  lineItemCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
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
  lineItemActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    marginLeft: 12,
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
    alignSelf: 'flex-start',
    backgroundColor: '#2D6A4F',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  totalSection: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 0,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  bottomContainer: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
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
    color: '#333',
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
  },
  clientCompany: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default EstimateFormScreen; 