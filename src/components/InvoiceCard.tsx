import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Invoice } from '../models';
import { formatCurrency, formatDate } from '../utils';

interface Props {
  invoice: Invoice;
  clientName: string;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const InvoiceCard: React.FC<Props> = ({ 
  invoice, 
  clientName, 
  onPress, 
  onEdit, 
  onDelete 
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.invoiceInfo}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Text style={styles.clientName}>{clientName}</Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: invoice.paid ? '#4CAF50' : '#FF9800' }
          ]}>
            <Text style={styles.statusText}>
              {invoice.paid ? '已付款' : '未付款'}
            </Text>
          </View>
          <Text style={styles.amount}>{formatCurrency(invoice.total)}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.dateInfo}>
          <View style={styles.dateRow}>
            <Icon name="today" size={14} color="#666" />
            <Text style={styles.dateLabel}>发布: {formatDate(invoice.issueDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Icon name="event" size={14} color="#666" />
            <Text style={styles.dateLabel}>到期: {formatDate(invoice.dueDate)}</Text>
          </View>
        </View>
        
        {(onEdit || onDelete) && (
          <View style={styles.actionsContainer}>
            {onEdit && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={styles.actionButton}
              >
                <Icon name="edit" size={16} color="#666" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.actionButton}
              >
                <Icon name="delete" size={16} color="#f44336" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {invoice.notes && (
        <View style={styles.notesContainer}>
          <Icon name="note" size={12} color="#888" />
          <Text style={styles.notes} numberOfLines={1}>
            {invoice.notes}
          </Text>
        </View>
      )}

      {/* Overdue indicator */}
      {!invoice.paid && new Date(invoice.dueDate) < new Date() && (
        <View style={styles.overdueIndicator}>
          <Icon name="warning" size={12} color="#f44336" />
          <Text style={styles.overdueText}>已逾期</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D6A4F',
    marginBottom: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  notes: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginLeft: 4,
    flex: 1,
  },
  overdueIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  overdueText: {
    fontSize: 10,
    color: '#f44336',
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default InvoiceCard; 