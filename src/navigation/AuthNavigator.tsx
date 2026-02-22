import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

import { LoginScreen } from '@screens/auth/LoginScreen';
import { RegisterScreen } from '@screens/auth/RegisterScreen';

import { AuthStackParamList, AuthStackNavigationProp } from './types';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator - 认证流程导航器
 * 包含登录、注册、忘记密码等认证相关页面
 */
export const AuthNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 24, // 适老化大字体
          fontWeight: '700',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          title: '登录',
          headerShown: false, // 登录页面不显示头部
        }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: '注册',
        }}
      />
    </Stack.Navigator>
  );
};
