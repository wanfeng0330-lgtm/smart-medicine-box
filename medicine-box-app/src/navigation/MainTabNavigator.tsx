import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon, useTheme } from 'react-native-paper';

import { HomeScreen } from '@screens/main/HomeScreen';
import { BoxScreen } from '@screens/main/BoxScreen';
import { MedicinesScreen } from '@screens/main/MedicinesScreen';
import { ScheduleScreen } from '@screens/main/ScheduleScreen';
import { ReportScreen } from '@screens/main/ReportScreen';
import { FamilyScreen } from '@screens/family/FamilyScreen';

import { MainTabParamList } from './types';
import { COLORS } from '@/constants/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabBarIcon: React.FC<{
  name: string;
  focused: boolean;
  color: string;
}> = ({ name, focused, color }) => {
  return (
    <Icon
      source={name}
      size={focused ? 32 : 28}
      color={color}
    />
  );
};

export const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 72,
          paddingBottom: 8,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingVertical: 8,
          elevation: 8,
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          fontFamily: 'Lato_Medium',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '今日',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Box"
        component={BoxScreen}
        options={{
          tabBarLabel: '药盒',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="package-variant" focused={focused} color={color} />
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
            <TabBarIcon name="calendar-clock" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: '报告',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="chart-bar" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Family"
        component={FamilyScreen}
        options={{
          tabBarLabel: '家庭',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="account-group" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
