import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from 'react-native';

import { useAuthStore } from '@stores/useAuthStore';
import { LoadingSpinner } from '@components/ui';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

import { RootStackParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * AppNavigator - 根导航器
 * 根据认证状态显示Auth Stack或Main Stack
 */
export const AppNavigator: React.FC = () => {
  const { user, userProfile, isLoading, initialize, clearError } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // 初始化Firebase Auth监听器
  useEffect(() => {
    const initAuth = async () => {
      try {
 await initialize();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, [initialize]);

  // 清除错误当导航状态改变
  useEffect(() => {
    clearError();
  }, [user, clearError]);

  // 显示加载状态
  if (isInitializing || isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
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
        {user && userProfile ? (
          // 已登录：显示Main Stack
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // 未登录：显示Auth Stack
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
