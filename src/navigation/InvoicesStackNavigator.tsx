import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens when they're created
import InvoicesScreen from '../screens/Invoices/InvoicesScreen';
import InvoiceDetailScreen from '../screens/Invoices/InvoiceDetailScreen';
import InvoiceFormScreen from '../screens/Invoices/InvoiceFormScreen';
import EstimateDetailScreen from '../screens/Estimates/EstimateDetailScreen';

export type InvoicesStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId: string };
  InvoiceForm: { invoiceId?: string; fromEstimateId?: string };
  EstimateDetail: { estimateId: string };
};

const Stack = createStackNavigator<InvoicesStackParamList>();

const InvoicesStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2D6A4F',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="InvoicesList" 
        component={InvoicesScreen}
        options={{ title: '发票' }}
      />
      <Stack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen}
        options={{ title: '发票详情' }}
      />
      <Stack.Screen 
        name="InvoiceForm" 
        component={InvoiceFormScreen}
        options={({ route }) => ({ 
          title: route.params?.invoiceId ? '编辑发票' : '新建发票' 
        })}
      />
      <Stack.Screen 
        name="EstimateDetail" 
        component={EstimateDetailScreen}
        options={{ title: '报价单详情' }}
      />
    </Stack.Navigator>
  );
};

export default InvoicesStackNavigator; 