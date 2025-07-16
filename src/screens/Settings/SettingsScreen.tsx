import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Settings } from '../../models';
import { storageService } from '../../utils';

const SettingsScreen = () => {
  const [settings, setSettings] = useState<Settings>({
    companyName: '',
    phone: '',
    email: '',
    address: '',
    logoUri: '',
    defaultTaxRate: 8.0,
    defaultCurrency: 'USD',
    defaultNote: '',
    enableItemTaxable: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await storageService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('错误', '加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await storageService.saveSettings(settings);
      Alert.alert('成功', '设置已保存');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('错误', '保存设置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '确定要清除所有数据吗？此操作无法撤销，将删除所有报价单、发票、客户和设置。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await storageService.clearAllData();
              // Reset settings to defaults
              const defaultSettings: Settings = {
                companyName: '',
                phone: '',
                email: '',
                address: '',
                logoUri: '',
                defaultTaxRate: 8.0,
                defaultCurrency: 'USD',
                defaultNote: '',
                enableItemTaxable: true,
              };
              setSettings(defaultSettings);
              Alert.alert('成功', '所有数据已清除');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('错误', '清除数据失败');
            }
          },
        },
      ]
    );
  };

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
        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>公司信息</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>公司名称</Text>
            <TextInput
              style={styles.input}
              value={settings.companyName}
              onChangeText={(text) => setSettings(prev => ({ ...prev, companyName: text }))}
              placeholder="输入公司名称"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>邮箱</Text>
            <TextInput
              style={styles.input}
              value={settings.email}
              onChangeText={(text) => setSettings(prev => ({ ...prev, email: text }))}
              placeholder="输入公司邮箱"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>电话</Text>
            <TextInput
              style={styles.input}
              value={settings.phone}
              onChangeText={(text) => setSettings(prev => ({ ...prev, phone: text }))}
              placeholder="输入公司电话"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>地址</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={settings.address}
              onChangeText={(text) => setSettings(prev => ({ ...prev, address: text }))}
              placeholder="输入公司地址"
              multiline
              numberOfLines={3}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Default Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>默认设置</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>默认税率 (%)</Text>
            <TextInput
              style={styles.input}
              value={settings.defaultTaxRate.toString()}
              onChangeText={(text) => setSettings(prev => ({ 
                ...prev, 
                defaultTaxRate: parseFloat(text) || 0 
              }))}
              placeholder="8.0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>默认货币</Text>
            <View style={styles.currencyContainer}>
              {['USD', 'EUR', 'GBP', 'JPY', 'CNY'].map((currency) => (
                <TouchableOpacity
                  key={currency}
                  style={[
                    styles.currencyButton,
                    settings.defaultCurrency === currency && styles.currencyButtonActive,
                  ]}
                  onPress={() => setSettings(prev => ({ ...prev, defaultCurrency: currency }))}
                >
                  <Text
                    style={[
                      styles.currencyText,
                      settings.defaultCurrency === currency && styles.currencyTextActive,
                    ]}
                  >
                    {currency}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>默认备注</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={settings.defaultNote}
              onChangeText={(text) => setSettings(prev => ({ ...prev, defaultNote: text }))}
              placeholder="输入默认备注信息"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>启用项目税收选项</Text>
              <Text style={styles.switchDescription}>
                允许在项目中单独设置是否应税
              </Text>
            </View>
            <Switch
              value={settings.enableItemTaxable}
              onValueChange={(value) => setSettings(prev => ({ ...prev, enableItemTaxable: value }))}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.enableItemTaxable ? '#2D6A4F' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用信息</Text>
          
          <View style={styles.infoRow}>
            <Icon name="info" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>版本</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Icon name="build" size={20} color="#666" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>构建</Text>
              <Text style={styles.infoValue}>React Native</Text>
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
            <Icon name="delete-forever" size={20} color="white" />
            <Text style={styles.dangerButtonText}>清除所有数据</Text>
          </TouchableOpacity>
          
          <Text style={styles.warningText}>
            此操作将删除所有报价单、发票、客户信息和设置，请谨慎操作。
          </Text>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.disabledButton]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? '保存中...' : '保存设置'}
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
  currencyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  currencyButtonActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  currencyText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  currencyTextActive: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  infoValue: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
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

export default SettingsScreen; 