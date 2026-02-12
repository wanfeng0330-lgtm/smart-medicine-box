import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AppNavigator } from '@/navigation/AppNavigator';
import theme from '@/constants/theme';
import { loadFonts } from '@/constants/fonts';

/**
 * 智能药盒APP - 主应用组件
 */
export default function App(): React.JSX.Element | null {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  // 加载应用字体
  React.useEffect(() => {
    const load = async () => {
      try {
        await loadFonts();
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // 即使字体加载失败，也继续运行应用
        setFontsLoaded(true);
      }
    };

    load();
  }, []);

  // 字体未加载时显示加载状态
  if (!fontsLoaded) {
    return (
      <></>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <StatusBar barStyle="dark-content" />
          <AppNavigator />
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
