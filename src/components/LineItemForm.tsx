import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineItem } from '../models';
import { formatCurrency } from '../utils';

interface Props {
  item?: LineItem;
  onSave: (item: LineItem) => void;
  onCancel: () => void;
  enableTaxable: boolean;
}

const LineItemForm: React.FC<Props> = ({ 
  item, 
  onSave, 
  onCancel, 
  enableTaxable 
}) => {
  const [description, setDescription] = useState(item?.description || '');
  const [quantity, setQuantity] = useState(item?.quantity?.toString() || '1');
  const [unit, setUnit] = useState<'hours' | 'days'>(item?.unit || 'hours');
  const [unitPrice, setUnitPrice] = useState(item?.unitPrice?.toString() || '');
  const [taxable, setTaxable] = useState(item?.taxable || false);

  const handleSave = () => {
    if (!description.trim()) {
      Alert.alert('错误', '请输入项目描述');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('错误', '请输入有效的数量');
      return;
    }

    if (isNaN(price) || price < 0) {
      Alert.alert('错误', '请输入有效的单价');
      return;
    }

    const newItem: LineItem = {
      id: item?.id || Date.now().toString(),
      description: description.trim(),
      quantity: qty,
      unit,
      unitPrice: price,
      taxable: enableTaxable ? taxable : false,
    };

    onSave(newItem);
  };

  const total = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {item ? '编辑项目' : '新增项目'}
      </Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>项目描述 *</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="输入项目描述"
          multiline
        />
      </View>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <Text style={styles.label}>数量 *</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            placeholder="1"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfWidth}>
          <Text style={styles.label}>单位</Text>
          <View style={styles.unitContainer}>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === 'hours' && styles.unitButtonActive,
              ]}
              onPress={() => setUnit('hours')}
            >
              <Text
                style={[
                  styles.unitText,
                  unit === 'hours' && styles.unitTextActive,
                ]}
              >
                小时
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.unitButton,
                unit === 'days' && styles.unitButtonActive,
              ]}
              onPress={() => setUnit('days')}
            >
              <Text
                style={[
                  styles.unitText,
                  unit === 'days' && styles.unitTextActive,
                ]}
              >
                天
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>单价 * ($)</Text>
        <TextInput
          style={styles.input}
          value={unitPrice}
          onChangeText={setUnitPrice}
          placeholder="0.00"
          keyboardType="numeric"
        />
      </View>

      {enableTaxable && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setTaxable(!taxable)}
        >
          <Icon
            name={taxable ? 'check-box' : 'check-box-outline-blank'}
            size={24}
            color="#2D6A4F"
          />
          <Text style={styles.checkboxLabel}>应税项目</Text>
        </TouchableOpacity>
      )}

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>小计: </Text>
        <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>保存</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  halfWidth: {
    flex: 0.48,
  },
  unitContainer: {
    flexDirection: 'row',
  },
  unitButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  unitText: {
    color: '#666',
  },
  unitTextActive: {
    color: 'white',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 0.48,
    backgroundColor: '#2D6A4F',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default LineItemForm; 