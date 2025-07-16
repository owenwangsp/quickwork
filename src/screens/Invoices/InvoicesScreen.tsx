import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Invoice, Client } from '../../models';
import { storageService, formatCurrency, formatDate } from '../../utils';
import { InvoicesStackParamList } from '../../navigation/InvoicesStackNavigator';
import InvoiceCard from '../../components/InvoiceCard';

type NavigationProp = StackNavigationProp<InvoicesStackParamList, 'InvoicesList'>;

const InvoicesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = async () => {
    try {
      const [invoicesData, clientsData] = await Promise.all([
        storageService.getInvoices(),
        storageService.getClients(),
      ]);
      
      setInvoices(invoicesData);
      setClients(clientsData);
      setFilteredInvoices(invoicesData);
    } catch (error) {
      console.error('Error loading invoices:', error);
      Alert.alert('错误', '加载发票列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredInvoices(invoices);
    } else {
      const filtered = invoices.filter(invoice => {
        const client = clients.find(c => c.id === invoice.clientId);
        return invoice.invoiceNumber.toLowerCase().includes(text.toLowerCase()) ||
               invoice.notes.toLowerCase().includes(text.toLowerCase()) ||
               (client && client.name.toLowerCase().includes(text.toLowerCase()));
      });
      setFilteredInvoices(filtered);
    }
  };

  const handleInvoicePress = (invoice: Invoice) => {
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
  };

  const handleEditInvoice = (invoice: Invoice) => {
    navigation.navigate('InvoiceForm', { invoiceId: invoice.id });
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    Alert.alert(
      '确认删除',
      `确定要删除发票 ${invoice.invoiceNumber} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteInvoice(invoice.id);
              loadInvoices();
            } catch (error) {
              console.error('Error deleting invoice:', error);
              Alert.alert('错误', '删除发票失败');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    navigation.navigate('InvoiceForm', {});
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : '未知客户';
  };

  const renderInvoiceCard = ({ item }: { item: Invoice }) => (
    <InvoiceCard
      invoice={item}
      clientName={getClientName(item.clientId)}
      onPress={() => handleInvoicePress(item)}
      onEdit={() => handleEditInvoice(item)}
      onDelete={() => handleDeleteInvoice(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="receipt" size={64} color="#ccc" />
      <Text style={styles.emptyText}>暂无发票</Text>
      <Text style={styles.emptySubText}>点击右下角按钮创建第一个发票</Text>
    </View>
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
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索发票编号、客户或备注"
          value={searchText}
          onChangeText={handleSearch}
        />
        {searchText !== '' && (
          <TouchableOpacity
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <Icon name="clear" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredInvoices}
        renderItem={renderInvoiceCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredInvoices.length === 0 ? styles.emptyList : undefined}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreateNew}>
        <Icon name="add" size={24} color="white" />
      </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default InvoicesScreen; 