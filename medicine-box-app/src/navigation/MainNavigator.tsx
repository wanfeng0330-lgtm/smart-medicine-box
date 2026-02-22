import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

import { MainTabNavigator } from './MainTabNavigator';
import { FamilyMembersScreen } from '@screens/family/FamilyMembersScreen';
import { AddMedicineScreen } from '@screens/main/AddMedicineScreen';
import { ScanBarcodeScreen } from '@screens/main/ScanBarcodeScreen';
import { OCRScreen } from '@screens/main/OCRScreen';
import { MedicineDetailScreen } from '@screens/main/MedicineDetailScreen';
import { AddScheduleScreen } from '@screens/main/AddScheduleScreen';
import { ReportScreen } from '@screens/main/ReportScreen';
import { NotificationSettingsScreen } from '@screens/settings/NotificationSettingsScreen';
import { AccessibilitySettingsScreen } from '@screens/settings/AccessibilitySettingsScreen';

import { MainStackParamList } from './types';

const Stack = createStackNavigator<MainStackParamList>();

/**
 * MainNavigator - 主功能导航器
 * 包含底部Tab导航和所有功能页面的Stack导航
 */
export const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
          height: 72, // 高头部（适老化）
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 24, // 大标题字体（适老化）
          fontWeight: '700',
        },
        headerBackTitle: '',
        headerTitleAlign: 'center',
        headerLeftContainerStyle: {
          paddingLeft: 16,
        },
        headerRightContainerStyle: {
          paddingRight: 16,
        },
      }}
    >
      {/* 主Tab导航（已认证用户的主界面） */}
      <Stack.Screen
        name="MainTab"
        component={MainTabNavigator}
        options={{
          headerShown: false, // Tab不显示头部
        }}
      />

      {/* 家庭成员页面 */}
      <Stack.Screen
        name="FamilyMembers"
        component={FamilyMembersScreen}
        options={{ title: '家庭成员' }}
      />

      {/* 报告页面 */}
      <Stack.Screen
        name="Report"
        component={ReportScreen}
        options={{ headerShown: false }}
      />

      {/* 药品管理页面 */}
      <Stack.Screen
        name="AddMedicine"
        component={AddMedicineScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ScanBarcode"
        component={ScanBarcodeScreen}
        options={{ title: '扫码添加' }}
      />

      <Stack.Screen
        name="OCRScreen"
        component={OCRScreen}
        options={{ title: 'OCR识别' }}
      />

      <Stack.Screen
        name="MedicineDetail"
        component={MedicineDetailScreen}
        options={{ headerShown: false }}
      />

      {/* 用药计划页面 */}
      <Stack.Screen
        name="AddSchedule"
        component={AddScheduleScreen}
        options={{ headerShown: false }}
      />

      {/* 设置页面 */}
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="AccessibilitySettings"
        component={AccessibilitySettingsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
