import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens when they're created
import SettingsScreen from '../screens/Settings/SettingsScreen';

export type SettingsStackParamList = {
  SettingsMain: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

const SettingsStackNavigator = () => {
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
        name="SettingsMain" 
        component={SettingsScreen}
        options={{ title: '设置' }}
      />
    </Stack.Navigator>
  );
};

export default SettingsStackNavigator; 