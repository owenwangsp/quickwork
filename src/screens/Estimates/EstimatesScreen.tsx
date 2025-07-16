import React, { useState, useEffect, useCallback } from 'react';
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
import { Estimate } from '../../models';
import { storageService } from '../../utils';
import EstimateCard from '../../components/EstimateCard';
import { EstimatesStackParamList } from '../../navigation/EstimatesStackNavigator';

type NavigationProp = StackNavigationProp<EstimatesStackParamList, 'EstimatesList'>;

const EstimatesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEstimates = async () => {
    try {
      const data = await storageService.getEstimates();
      setEstimates(data);
      setFilteredEstimates(data);
    } catch (error) {
      console.error('Error loading estimates:', error);
      Alert.alert('错误', '加载报价单列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadEstimates();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadEstimates();
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredEstimates(estimates);
    } else {
      const filtered = estimates.filter(estimate =>
        estimate.estimateNumber.toLowerCase().includes(text.toLowerCase()) ||
        estimate.notes.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredEstimates(filtered);
    }
  };

  const handleEstimatePress = (estimate: Estimate) => {
    navigation.navigate('EstimateDetail', { estimateId: estimate.id });
  };

  const handleEditEstimate = (estimate: Estimate) => {
    navigation.navigate('EstimateForm', { estimateId: estimate.id });
  };

  const handleDeleteEstimate = (estimate: Estimate) => {
    Alert.alert(
      '确认删除',
      `确定要删除报价单 ${estimate.estimateNumber} 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.deleteEstimate(estimate.id);
              loadEstimates();
            } catch (error) {
              console.error('Error deleting estimate:', error);
              Alert.alert('错误', '删除报价单失败');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    navigation.navigate('EstimateForm', {});
  };

  const renderEstimateCard = ({ item }: { item: Estimate }) => (
    <EstimateCard
      estimate={item}
      onPress={() => handleEstimatePress(item)}
      onEdit={() => handleEditEstimate(item)}
      onDelete={() => handleDeleteEstimate(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="description" size={64} color="#ccc" />
      <Text style={styles.emptyText}>暂无报价单</Text>
      <Text style={styles.emptySubText}>点击右下角按钮创建第一个报价单</Text>
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
          placeholder="搜索报价单编号或备注"
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
        data={filteredEstimates}
        renderItem={renderEstimateCard}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
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

export default EstimatesScreen; 