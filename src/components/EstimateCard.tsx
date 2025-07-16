import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Estimate } from '../models';
import { formatCurrency, formatDate } from '../utils';

interface Props {
  estimate: Estimate;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const EstimateCard: React.FC<Props> = ({ 
  estimate, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#FFA500';
      case 'sent':
        return '#2196F3';
      case 'converted':
        return '#4CAF50';
      default:
        return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'sent':
        return '已发送';
      case 'converted':
        return '已转换';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.estimateNumber}>{estimate.estimateNumber}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(estimate.status) }
          ]}>
            <Text style={styles.statusText}>
              {getStatusText(estimate.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.actionsContainer}>
          {onEdit && (
            <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
              <Icon name="edit" size={20} color="#666" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <Icon name="delete" size={20} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>发布日期:</Text>
          <Text style={styles.value}>{formatDate(estimate.issueDate)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>有效期至:</Text>
          <Text style={styles.value}>{formatDate(estimate.validUntil)}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.label}>项目数量:</Text>
          <Text style={styles.value}>{estimate.items.length} 项</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>总金额:</Text>
          <Text style={styles.totalAmount}>
            {formatCurrency(estimate.total)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    margin: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  estimateNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  content: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
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
});

export default EstimateCard; 