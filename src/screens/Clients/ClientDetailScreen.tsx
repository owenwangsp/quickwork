import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Client, Estimate, Invoice } from '../../models';
import { storageService, formatCurrency, formatDate } from '../../utils';
import { ClientsStackParamList } from '../../navigation/ClientsStackNavigator';

type NavigationProp = StackNavigationProp<ClientsStackParamList, 'ClientDetail'>;
type ClientDetailRouteProp = RouteProp<ClientsStackParamList, 'ClientDetail'>;

const ClientDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClientDetailRouteProp>();
  const { clientId } = route.params;

  const [client, setClient] = useState<Client | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, []);

  const loadClientData = async () => {
    try {
      const [clientsData, estimatesData, invoicesData] = await Promise.all([
        storageService.getClients(),
        storageService.getEstimates(),
        storageService.getInvoices(),
      ]);

      const foundClient = clientsData.find(c => c.id === clientId);
      if (foundClient) {
        setClient(foundClient);
        
        // Filter estimates and invoices for this client
        const clientEstimates = estimatesData.filter(e => e.clientId === clientId);
        const clientInvoices = invoicesData.filter(i => i.clientId === clientId);
        
        setEstimates(clientEstimates);
        setInvoices(clientInvoices);
      } else {
        Alert.alert('错误', '客户未找到', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      Alert.alert('错误', '加载客户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('ClientForm', { clientId: client!.id });
  };

  const handleDelete = () => {
    Alert.alert(
      '确认删除',
      `确定要删除客户 ${client?.name} 吗？此操作将同时删除该客户的所有报价单和发票。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete client
              await storageService.deleteClient(clientId);
              
              // Delete related estimates and invoices
              for (const estimate of estimates) {
                await storageService.deleteEstimate(estimate.id);
              }
              for (const invoice of invoices) {
                await storageService.deleteInvoice(invoice.id);
              }

              Alert.alert('成功', '客户及相关数据已删除', [
                { text: '确定', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('错误', '删除客户失败');
            }
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (client?.phone) {
      Linking.openURL(`tel:${client.phone}`);
    }
  };

  const handleEmail = () => {
    if (client?.email) {
      Linking.openURL(`mailto:${client.email}`);
    }
  };

  const calculateTotalEstimateValue = () => {
    return estimates.reduce((sum, estimate) => sum + estimate.total, 0);
  };

  const calculateTotalInvoiceValue = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  };

  const getPaidInvoicesCount = () => {
    return invoices.filter(invoice => invoice.paid).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!client) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>客户未找到</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.company && <Text style={styles.clientCompany}>{client.company}</Text>}
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Icon name="edit" size={20} color="#2D6A4F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Icon name="delete" size={20} color="#f44336" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系信息</Text>
          
          {client.email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
              <Icon name="email" size={20} color="#2D6A4F" />
              <Text style={styles.contactText}>{client.email}</Text>
              <Icon name="open-in-new" size={16} color="#666" />
            </TouchableOpacity>
          )}
          
          {client.phone && (
            <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
              <Icon name="phone" size={20} color="#2D6A4F" />
              <Text style={styles.contactText}>{client.phone}</Text>
              <Icon name="open-in-new" size={16} color="#666" />
            </TouchableOpacity>
          )}
          
          {client.address && (
            <View style={styles.contactRow}>
              <Icon name="location-on" size={20} color="#2D6A4F" />
              <Text style={[styles.contactText, styles.addressText]}>{client.address}</Text>
            </View>
          )}
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>业务统计</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{estimates.length}</Text>
              <Text style={styles.statLabel}>报价单</Text>
              <Text style={styles.statSubLabel}>{formatCurrency(calculateTotalEstimateValue())}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{invoices.length}</Text>
              <Text style={styles.statLabel}>发票</Text>
              <Text style={styles.statSubLabel}>{formatCurrency(calculateTotalInvoiceValue())}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{getPaidInvoicesCount()}</Text>
              <Text style={styles.statLabel}>已付款</Text>
              <Text style={styles.statSubLabel}>
                {invoices.length > 0 ? Math.round((getPaidInvoicesCount() / invoices.length) * 100) : 0}%
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Estimates */}
        {estimates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近报价单</Text>
            {estimates.slice(0, 3).map((estimate) => (
              <View key={estimate.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNumber}>{estimate.estimateNumber}</Text>
                  <Text style={styles.itemDate}>{formatDate(estimate.issueDate)}</Text>
                </View>
                <Text style={styles.itemAmount}>{formatCurrency(estimate.total)}</Text>
              </View>
            ))}
            {estimates.length > 3 && (
              <Text style={styles.moreText}>还有 {estimates.length - 3} 个报价单...</Text>
            )}
          </View>
        )}

        {/* Recent Invoices */}
        {invoices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近发票</Text>
            {invoices.slice(0, 3).map((invoice) => (
              <View key={invoice.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNumber}>{invoice.invoiceNumber}</Text>
                  <Text style={styles.itemDate}>{formatDate(invoice.issueDate)}</Text>
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemAmount}>{formatCurrency(invoice.total)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: invoice.paid ? '#4CAF50' : '#FFA500' }
                  ]}>
                    <Text style={styles.statusText}>
                      {invoice.paid ? '已付款' : '待付款'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {invoices.length > 3 && (
              <Text style={styles.moreText}>还有 {invoices.length - 3} 个发票...</Text>
            )}
          </View>
        )}

        {/* Empty State */}
        {estimates.length === 0 && invoices.length === 0 && (
          <View style={styles.emptySection}>
            <Icon name="description" size={48} color="#ccc" />
            <Text style={styles.emptyText}>暂无相关业务记录</Text>
            <Text style={styles.emptySubText}>创建报价单或发票后将在此显示</Text>
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clientCompany: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  addressText: {
    marginRight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySection: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default ClientDetailScreen; 