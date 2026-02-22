import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  useTheme,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * SettingsScreen - 设置页面
 * 适老化设计 - Soft/pastel风格
 */
export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile, logout } = useAuthStore();

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
  };

  const confirmLogout = () => {
    Alert.alert(
      '退出登录',
      '确定要退出登录吗？',
      [
        { text: '取消', style: 'cancel' },
        { text: '确定', onPress: handleLogout, style: 'destructive' },
      ]
    );
  };

  const renderSettingSection = (title: string, items: SettingItemProps[]) => {
    return (
      <View key={title} style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>

        {items.map((item, index) => (
          <Card
            key={index}
            style={styles.settingCard}
            elevation={0}
            onPress={item.onPress}
          >
            <Card.Content style={styles.settingContent}>
              <View style={styles.settingLeft}>
                <Avatar.Icon
                  size={48}
                  icon={item.icon}
                  style={styles.settingIcon}
                  color={theme.colors.primary}
                />
                <View style={styles.settingText}>
                  <Text variant="titleMedium" style={styles.settingTitle}>
                    {item.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.settingDescription}>
                    {item.description}
                  </Text>
                </View>
              </View>

              {item.chevron !== false && (
                <IconButton icon="chevron-right" size={32} />
              )}
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  type SettingItemProps = {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    chevron?: boolean;
  };

  const settingItems: { title: string; items: SettingItemProps[] }[] = [
    {
      title: '通知设置',
      items: [
        {
          icon: 'bell-ring',
          title: '通知管理',
          description: '管理提醒方式和时间',
          onPress: () => navigation.navigate('NotificationSettings'),
        },
      ],
    },
    {
      title: '个人信息',
      items: [
        {
          icon: 'account-circle',
          title: '编辑资料',
          description: '修改姓名、头像等信息',
          onPress: () => navigation.navigate('EditProfile'),
        },
        {
          icon: 'lock',
          title: '修改密码',
          description: '更新登录密码',
          onPress: () => {}, // TODO: 实现修改密码
        },
      ],
    },
    {
      title: '关于',
      items: [
        {
          icon: 'information',
          title: '关于应用',
          description: '版本信息和帮助',
          onPress: () => navigation.navigate('About'),
        },
        {
          icon: 'text-box',
          title: '用户协议',
          description: '使用条款和隐私政策',
          onPress: () => navigation.navigate('Disclaimer'),
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Toolbar
          title="设置"
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 用户信息卡片 */}
        <Card style={styles.userCard} elevation={2}>
          <Card.Content style={styles.userCardContent}>
            <Avatar.Text
              size={80}
              label={userProfile?.name?.charAt(0).toUpperCase() || 'U'}
              style={styles.userAvatar}
              labelStyle={styles.userAvatarLabel}
            />
            <View style={styles.userText}>
              <Text variant="headlineMedium" style={styles.userName}>
                {userProfile?.name || '未设置'}
              </Text>
              <Text variant="bodyLarge" style={styles.userEmail}>
                {userProfile?.email || userProfile?.phone || '未设置'}
              </Text>
              {userProfile?.role === 'admin' && (
                <Avatar.Text
                  size={20}
                  label="管"
                  style={styles.roleTag}
                  labelStyle={styles.roleTagText}
                />
              )}
            </View>
          </Card.Content>
        </Card>

        {/* 设置项 */}
        {settingItems.map((section) =>
          renderSettingSection(section.title, section.items)
        )}

        {/* 退出登录 */}
        <Button
          mode="contained"
          icon="logout"
          onPress={confirmLogout}
          style={styles.logoutButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          buttonColor="#EF5350"
        >
          退出登录
        </Button>

        <Text variant="bodyMedium" style={styles.versionText}>
          智能药盒 v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const Toolbar: React.FC<{
  title: string;
}> = ({ title }) => {
  return (
    <View style={toolbarStyles.container}>
      <View style={toolbarStyles.header}>
        <View style={toolbarStyles.titleContainer}>
          <Text variant="headlineMedium" style={toolbarStyles.title}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // 用户信息卡片
  userCard: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userAvatar: {
    backgroundColor: '#FFA726',
    marginRight: 16,
  },
  userAvatarLabel: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  userText: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#37474F',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  roleTag: {
    backgroundColor: '#66BB6A',
    alignSelf: 'flex-start',
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 设置项
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 12,
  },
  settingCard: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    backgroundColor: '#FFF3E0',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#37474F',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
  },

  // 退出登录
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },

  // 版本信息
  versionText: {
    fontSize: 14,
    color: '#BDBDBD',
    textAlign: 'center',
    marginBottom: 16,
  },
});

const toolbarStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
