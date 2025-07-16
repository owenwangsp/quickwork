import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Client } from '../../models';
import { storageService } from '../../utils';
import { ClientsStackParamList } from '../../navigation/ClientsStackNavigator';

type NavigationProp = StackNavigationProp<ClientsStackParamList, 'ClientForm'>;
type ClientFormRouteProp = RouteProp<ClientsStackParamList, 'ClientForm'>;

const ClientFormScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ClientFormRouteProp>();
  const { clientId } = route.params || {};

  const [client, setClient] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  const loadClient = async () => {
    if (!clientId) return;

    try {
      setLoading(true);
      const clients = await storageService.getClients();
      const existingClient = clients.find(c => c.id === clientId);
      if (existingClient) {
        setClient(existingClient);
      } else {
        Alert.alert('错误', '客户未找到', [
          { text: '确定', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      console.error('Error loading client:', error);
      Alert.alert('错误', '加载客户信息失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client.name?.trim()) {
      Alert.alert('错误', '请输入客户姓名');
      return;
    }

    // Validate email format if provided
    if (client.email && client.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(client.email.trim())) {
        Alert.alert('错误', '请输入有效的邮箱地址');
        return;
      }
    }

    try {
      setLoading(true);
      
      const clientToSave: Client = {
        id: clientId || Date.now().toString(),
        name: client.name.trim(),
        phone: client.phone?.trim() || undefined,
        email: client.email?.trim() || undefined,
        address: client.address?.trim() || undefined,
        company: client.company?.trim() || undefined,
      };

      await storageService.saveClient(clientToSave);
      
      Alert.alert('成功', '客户信息已保存', [
        { text: '确定', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('错误', '保存客户信息失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>姓名 *</Text>
            <TextInput
              style={styles.input}
              value={client.name}
              onChangeText={(text) => setClient(prev => ({ ...prev, name: text }))}
              placeholder="输入客户姓名"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>公司</Text>
            <TextInput
              style={styles.input}
              value={client.company}
              onChangeText={(text) => setClient(prev => ({ ...prev, company: text }))}
              placeholder="输入公司名称"
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>联系信息</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={styles.input}
              value={client.email}
              onChangeText={(text) => setClient(prev => ({ ...prev, email: text }))}
              placeholder="输入邮箱地址"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>电话</Text>
            <TextInput
              style={styles.input}
              value={client.phone}
              onChangeText={(text) => setClient(prev => ({ ...prev, phone: text }))}
              placeholder="输入电话号码"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>地址</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={client.address}
              onChangeText={(text) => setClient(prev => ({ ...prev, address: text }))}
              placeholder="输入完整地址"
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? '保存中...' : '保存客户'}
          </Text>
        </TouchableOpacity>
      </View>
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ClientFormScreen; 