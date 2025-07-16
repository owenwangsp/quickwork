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
import { Client } from '../../models';
import { storageService } from '../../utils';
import { ClientsStackParamList } from '../../navigation/ClientsStackNavigator';

type NavigationProp = StackNavigationProp<ClientsStackParamList, 'ClientsList'>;

const ClientsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClients = async () => {
    try {
      const data = await storageService.getClients();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
      Alert.alert('错误', '加载客户列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(text.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(text.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  };

  const handleClientPress = (client: Client) => {
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const handleEditClient = (client: Client) => {
    navigation.navigate('ClientForm', { clientId: client.id });
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert(
      '确认删除',
      `确定要删除客户 ${client.name} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteClient(client.id);
              loadClients();
            } catch (error) {
              console.error('Error deleting client:', error);
              Alert.alert('错误', '删除客户失败');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    navigation.navigate('ClientForm', {});
  };

  const renderClientCard = ({ item }: { item: Client }) => (
    <TouchableOpacity 
      style={styles.clientCard} 
      onPress={() => handleClientPress(item)}
    >
      <View style={styles.clientHeader}>
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          {item.company && <Text style={styles.clientCompany}>{item.company}</Text>}
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            onPress={() => handleEditClient(item)} 
            style={styles.actionButton}
          >
            <Icon name="edit" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => handleDeleteClient(item)} 
            style={styles.actionButton}
          >
            <Icon name="delete" size={20} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.clientDetails}>
        {item.email && (
          <View style={styles.detailRow}>
            <Icon name="email" size={16} color="#666" />
            <Text style={styles.detailText}>{item.email}</Text>
          </View>
        )}
        {item.phone && (
          <View style={styles.detailRow}>
            <Icon name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        )}
        {item.address && (
          <View style={styles.detailRow}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people" size={64} color="#ccc" />
      <Text style={styles.emptyText}>暂无客户</Text>
      <Text style={styles.emptySubText}>点击右下角按钮添加第一个客户</Text>
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
          placeholder="搜索客户姓名、公司或邮箱"
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
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={filteredClients.length === 0 ? styles.emptyList : undefined}
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  clientCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clientCompany: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  clientDetails: {
    padding: 16,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});

export default ClientsScreen; 