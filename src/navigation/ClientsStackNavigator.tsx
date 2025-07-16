import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens when they're created
import ClientsScreen from '../screens/Clients/ClientsScreen';
import ClientDetailScreen from '../screens/Clients/ClientDetailScreen';
import ClientFormScreen from '../screens/Clients/ClientFormScreen';

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId: string };
  ClientForm: { clientId?: string };
};

const Stack = createStackNavigator<ClientsStackParamList>();

const ClientsStackNavigator = () => {
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
        name="ClientsList" 
        component={ClientsScreen}
        options={{ title: '客户' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ title: '客户详情' }}
      />
      <Stack.Screen 
        name="ClientForm" 
        component={ClientFormScreen}
        options={({ route }) => ({ 
          title: route.params?.clientId ? '编辑客户' : '新建客户' 
        })}
      />
    </Stack.Navigator>
  );
};

export default ClientsStackNavigator; 