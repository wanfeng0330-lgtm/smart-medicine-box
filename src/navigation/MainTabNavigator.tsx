import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, useTheme } from 'react-native-paper';

import { HomeScreen } from '@screens/main/HomeScreen';
import { MedicinesScreen } from '@screens/main/MedicinesScreen';
import { ScheduleScreen } from '@screens/main/ScheduleScreen';
import { FamilyStatusScreen } from '@screens/main/FamilyStatusScreen';
import { StatisticsScreen } from '@screens/main/StatisticsScreen';
import { SettingsScreen } from '@screens/main/SettingsScreen';

import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * TabBarIcon组件
 * 适老化设计 - 大图标
 */
const TabBarIcon: React.FC<{
  name: string;
  focused: boolean;
  color: string;
}> = ({ name, focused, color }) => {
  return (
    <Icon
      source={name}
      size={focused ? 32 : 28} // 大图标
      color={color}
    />
  );
};

/**
 * MainTabNavigator - 底部Tab导航器
 * 包含主页、药品、计划、家庭状态、统计、设置
 */
export const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.surfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          height: 72, // 高Tab栏（适老化）
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
        },
        tabStyle: {
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: 16, // 大标签字体
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '主页',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Medicines"
        component={MedicinesScreen}
        options={{
          tabBarLabel: '药品',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="pill" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarLabel: '计划',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FamilyStatus"
        component={FamilyStatusScreen}
        options={{
          tabBarLabel: '家庭',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account-group" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Statistics"
        component={StatisticsScreen}
        options={{
          tabBarLabel: '统计',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chart-bar" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: '设置',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cog" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
