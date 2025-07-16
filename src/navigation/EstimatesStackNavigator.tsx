import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens when they're created
import EstimatesScreen from '../screens/Estimates/EstimatesScreen';
import EstimateDetailScreen from '../screens/Estimates/EstimateDetailScreen';
import EstimateFormScreen from '../screens/Estimates/EstimateFormScreen';

export type EstimatesStackParamList = {
  EstimatesList: undefined;
  EstimateDetail: { estimateId: string };
  EstimateForm: { estimateId?: string };
};

const Stack = createStackNavigator<EstimatesStackParamList>();

const EstimatesStackNavigator = () => {
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
        name="EstimatesList" 
        component={EstimatesScreen}
        options={{ title: '报价单' }}
      />
      <Stack.Screen 
        name="EstimateDetail" 
        component={EstimateDetailScreen}
        options={{ title: '报价单详情' }}
      />
      <Stack.Screen 
        name="EstimateForm" 
        component={EstimateFormScreen}
        options={({ route }) => ({ 
          title: route.params?.estimateId ? '编辑报价单' : '新建报价单' 
        })}
      />
    </Stack.Navigator>
  );
};

export default EstimatesStackNavigator; 