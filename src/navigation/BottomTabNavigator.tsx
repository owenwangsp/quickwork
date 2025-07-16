import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Stack navigators for each tab
import EstimatesStackNavigator from './EstimatesStackNavigator';
import InvoicesStackNavigator from './InvoicesStackNavigator';
import ClientsStackNavigator from './ClientsStackNavigator';
import SettingsStackNavigator from './SettingsStackNavigator';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'EstimatesTab':
              iconName = 'description';
              break;
            case 'InvoicesTab':
              iconName = 'receipt';
              break;
            case 'ClientsTab':
              iconName = 'people';
              break;
            case 'SettingsTab':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2D6A4F',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="EstimatesTab" 
        component={EstimatesStackNavigator}
        options={{ tabBarLabel: '报价单' }}
      />
      <Tab.Screen 
        name="InvoicesTab" 
        component={InvoicesStackNavigator}
        options={{ tabBarLabel: '发票' }}
      />
      <Tab.Screen 
        name="ClientsTab" 
        component={ClientsStackNavigator}
        options={{ tabBarLabel: '客户' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={SettingsStackNavigator}
        options={{ tabBarLabel: '设置' }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator; 