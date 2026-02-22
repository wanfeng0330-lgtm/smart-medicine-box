import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseFamilyStore } from '@/stores/useCloudBaseFamilyStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { useCloudBaseScheduleStore } from '@/stores/useCloudBaseScheduleStore';
import { requestNotificationPermissions, setupNotificationCategories } from '@/services/notificationService';
import APP_CONFIG from '@/config/appConfig';

const { DEV_MODE } = APP_CONFIG;

interface AppContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, userProfile, initialize } = useCloudBaseAuthStore();
  const { currentFamily, fetchFamily, setCurrentUserId, createFamily } = useCloudBaseFamilyStore();
  const { fetchMedicines, setCurrentFamilyId: setMedicineFamilyId } = useCloudBaseMedicineStore();
  const { fetchSchedules, setCurrentFamilyId: setScheduleFamilyId, setCurrentUserId: setScheduleUserId, syncAllNotifications } = useCloudBaseScheduleStore();

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing app with CloudBase...');

        if (DEV_MODE) {
          const devUser = {
            uid: 'dev_user_001',
            phone: '13800138000',
            nickname: '测试用户',
          };
          const devProfile = {
            id: devUser.uid,
            name: devUser.nickname,
            email: null,
            phone: devUser.phone,
            avatar: null,
            familyId: 'dev_family_001',
            role: 'admin' as const,
            deviceId: null,
            settings: {
              quietMode: false,
              lowStockThreshold: 5,
              pushNotifications: true,
              notificationSound: 'default',
              language: 'zh-CN',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          useCloudBaseAuthStore.setState({
            user: devUser,
            userProfile: devProfile,
            isLoggedIn: true,
          });
          
          console.log('Dev mode: Auto logged in as', devUser.nickname);
        } else {
          await initialize();
        }

        const notificationPermission = await requestNotificationPermissions();
        console.log('Notification permission:', notificationPermission);

        await setupNotificationCategories();

        setIsInitialized(true);
        console.log('App initialized successfully');
      } catch (err) {
        console.error('App initialization error:', err);
        setError('应用初始化失败，请重试');
        setIsInitialized(true);
      }
    };

    initApp();
  }, [initialize]);

  useEffect(() => {
    if (DEV_MODE && isInitialized) {
      initDevFamily();
    } else if (user && userProfile) {
      loadData();
    }
  }, [user, userProfile, isInitialized]);

  const initDevFamily = async () => {
    setIsLoading(true);
    try {
      const devFamilyId = 'dev_family_001';
      const devUserId = 'dev_user_001';
      
      setCurrentUserId(devUserId);
      setScheduleUserId(devUserId);
      setMedicineFamilyId(devFamilyId);
      setScheduleFamilyId(devFamilyId);
      
      const devFamily = {
        id: devFamilyId,
        name: '测试家庭',
        adminId: devUserId,
        inviteCode: 'TEST01',
        members: [devUserId],
        boxDeviceId: null,
        createdAt: new Date(),
      };

      useCloudBaseFamilyStore.setState({
        currentFamily: devFamily,
        members: [{
          userId: devUserId,
          name: '测试用户',
          avatar: null,
          role: 'admin',
          deviceId: null,
        }],
      });

      await AsyncStorage.setItem('dev_family', JSON.stringify(devFamily));
      
      await fetchMedicines(devFamilyId);
      await fetchSchedules(devFamilyId);
      await syncAllNotifications();
    } catch (err) {
      console.error('Error loading dev data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (DEV_MODE) return;
    if (currentFamily && userProfile) {
      loadFamilyData();
    }
  }, [currentFamily]);

  const loadData = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading user data...', userProfile.id);

      setCurrentUserId(userProfile.id);
      setScheduleUserId(userProfile.id);

      if (userProfile.familyId) {
        await fetchFamily(userProfile.familyId);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFamilyData = async () => {
    if (!currentFamily) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Loading family data...', currentFamily.id);

      setMedicineFamilyId(currentFamily.id);
      setScheduleFamilyId(currentFamily.id);

      await fetchMedicines(currentFamily.id);
      await fetchSchedules(currentFamily.id);
      
      await syncAllNotifications();
    } catch (err) {
      console.error('Error loading family data:', err);
      setError('加载家庭数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (!userProfile) return;

    setIsLoading(true);
    setError(null);

    try {
      await loadData();

      if (currentFamily) {
        await loadFamilyData();
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('刷新数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AppContextType = {
    isInitialized,
    isLoading,
    error,
    refreshData,
  };

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8E1' }}>
        <ActivityIndicator size="large" color="#FFA726" />
        <Text style={{ marginTop: 16, fontSize: 18, color: '#757575' }}>正在初始化应用...</Text>
      </View>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
