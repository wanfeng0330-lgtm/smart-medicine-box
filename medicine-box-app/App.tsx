import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { AppNavigator } from '@/navigation/AppNavigator';
import { AppProvider } from '@/contexts/AppContext';
import theme from '@/constants/theme';
import { loadFonts } from '@/constants/fonts';
import { 
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '@/services/notificationService';

/**
 * 智能药盒APP - 主应用组件
 */
export default function App(): React.JSX.Element | null {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    const load = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true);
      }
    };

    load();
  }, []);

  React.useEffect(() => {
    const responseListener = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data as any;
      const actionId = response.actionIdentifier;
      
      console.log('Notification response:', { actionId, data });

      if (actionId === 'take') {
        console.log('User confirmed taking medication:', data.medicineName);
      } else if (actionId === 'skip') {
        console.log('User skipped medication:', data.medicineName);
      } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        console.log('Notification tapped, navigating to home');
      }
    });

    const receivedListener = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content.title);
    });

    return () => {
      responseListener.remove();
      receivedListener.remove();
    };
  }, []);

  if (!fontsLoaded) {
    return <></>;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar style="dark" hidden={false} />
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
