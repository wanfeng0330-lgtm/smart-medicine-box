import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from 'react-native';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { LoadingSpinner } from '@/components/ui';
import APP_CONFIG from '@/config/appConfig';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

const { DEV_MODE } = APP_CONFIG;

export const AppNavigator: React.FC = () => {
  const { isLoggedIn, isLoading, clearError } = useCloudBaseAuthStore();
  const [isInitializing, setIsInitializing] = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) {
      setIsInitializing(false);
      return;
    }
    clearError();
  }, [isLoggedIn, clearError]);

  if (isInitializing || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8E1' }}>
        <LoadingSpinner loading={true} text="正在初始化应用..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
