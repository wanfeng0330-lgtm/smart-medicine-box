import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingSpinner } from '@/components/ui';
import { FamilyMember } from '@/types/family';

/**
 * FamilyMembersScreen - 家庭成员管理界面
 * 适老化设计 - 大字体、高对比度
 */
export const FamilyMembersScreen: React.FC<{ route: any }> = ({ route }) => {
  const { familyId } = route.params;
  const theme = useTheme();
  const {
    currentFamily,
    members,
    isLoading,
    error,
    fetchFamily,
    fetchFamilyMembers,
    removeMember,
    updateMemberRole,
    leaveFamily,
    deleteFamily,
    clearError,
  } = useFamilyStore();

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 加载家庭信息和成员列表
  useEffect(() => {
    if (familyId) {
      fetchFamily(familyId);
      fetchFamilyMembers();
    }
  }, [familyId, fetchFamily, fetchFamilyMembers]);

  // 清除错误
  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  // 处理移除成员
  const handleRemoveMember = (member: FamilyMember) => {
    Alert.alert(
      '确认移除',
      `确定要移除成员"${member.name}"吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            await removeMember(member.userId);
            Alert.alert('成功', '成员已移除');
          },
        },
      ]
    );
    setMenuVisible(null);
  };

  // 处理更新成员角色
  const handleChangeRole = (member: FamilyMember) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    const roleText = newRole === 'admin' ? '管理员' : '成员';

    Alert.alert(
      `确认为${roleText}`,
      `确定要将"${member.name}"设置为${roleText}吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            await updateMemberRole(member.userId, newRole);
            Alert.alert('成功', '角色已更新');
          },
        },
      ]
    );
    setMenuVisible(null);
  };

  // 处理退出家庭组
  const handleLeaveFamily = async () => {
    setShowLeaveDialog(false);
    await leaveFamily();
    Alert.alert('成功', '已退出家庭组');
  };

  // 处理删除家庭组
  const handleDeleteFamily = async () => {
    setShowDeleteDialog(false);
    await deleteFamily();
    Alert.alert('成功', '家庭组已删除');
  };

  // 渲染成员卡片
  const renderMember = ({ item }: { item: FamilyMember }) => {
    return (
      <Card style={styles.memberCard} elevation={2}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={64}
            label={item.name.charAt(0).toUpperCase()}
            style={styles.avatar}
          />
          <View style={styles.memberInfo}>
            <Text variant="titleLarge" style={styles.memberName}>
              {item.name}
            </Text>
            <Chip
              icon={item.role === 'admin' ? 'shield-account' : 'account'}
              mode="flat"
              style={[
                styles.roleChip,
                { backgroundColor: item.role === 'admin' ? theme.colors.primaryContainer : theme.colors.secondaryContainer }
              ]}
              textStyle={{ color: item.role === 'admin' ? theme.colors.onPrimaryContainer : theme.colors.onSecondaryContainer, fontSize: 16 }}
            >
              {item.role === 'admin' ? '管理员' : '成员'}
            </Chip>
            {item.deviceId && (
              <Text variant="bodyMedium" style={styles.deviceText}>
                已连接药盒
              </Text>
            )}
          </View>
        </Card.Content>

        {/* 管理员菜单 */}
        {currentFamily && currentFamily.adminId !== item.userId && (
          <View style={styles.menuContainer}>
            <Menu
              visible={menuVisible === item.userId}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={32}
                  onPress={() => setMenuVisible(item.userId)}
                />
              }
            >
              <Menu.Item
                leadingIcon="account-edit"
                onPress={() => handleChangeRole(item)}
                title="修改角色"
                titleStyle={{ fontSize: 18 }}
              />
              <Menu.Item
                leadingIcon="account-remove"
                onPress={() => handleRemoveMember(item)}
                titleStyle={{ fontSize: 18, color: theme.colors.error }}
                title="移除成员"
              />
            </Menu>
          </View>
        )}
      </Card>
    );
  };

  if (isLoading && members.length === 0) {
    return <LoadingSpinner loading={true} text="正在加载..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 头部 */}
      {currentFamily && (
        <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineMedium" style={styles.headerText}>
            {currentFamily.name}
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            {members.length} 位成员
          </Text>
        </View>
      )}

      {/* 成员列表 */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* 底部操作按钮 */}
      {currentFamily && (
        <View style={styles.footer}>
          {/* QR码邀请按钮 */}
          <Button
            mode="contained"
            icon="qrcode"
            onPress={() => Alert.alert('邀请码', `邀请码: ${currentFamily.inviteCode}`)}
            style={styles.footerButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            查看邀请码
          </Button>

          {/* 退出/删除家庭按钮 */}
          {currentFamily.adminId === useAuthStore.getState().user?.uid ? (
            <Button
              mode="outlined"
              icon="delete"
              onPress={() => setShowDeleteDialog(true)}
              style={styles.footerButton}
              contentStyle={styles.buttonContent}
              labelStyle={[styles.buttonLabel, { color: theme.colors.error }]}
            >
              删除家庭组
            </Button>
          ) : (
            <Button
              mode="outlined"
              icon="logout"
              onPress={() => setShowLeaveDialog(true)}
              style={styles.footerButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              退出家庭组
            </Button>
          )}
        </View>
      )}

      {/* 退出家庭组确认对话框 */}
      <Portal>
        <Dialog
          visible={showLeaveDialog}
          onDismiss={() => setShowLeaveDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>确认退出？</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              退出后，您将无法访问该家庭组的共享数据。确定要退出吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveDialog(false)} labelStyle={styles.dialogButtonLabel}>
              取消
            </Button>
            <Button
              onPress={handleLeaveFamily}
              mode="contained"
              labelStyle={styles.dialogButtonLabel}
            >
              确认退出
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* 删除家庭组确认对话框 */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>确认删除？</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyLarge" style={styles.dialogText}>
              删除家庭组后，所有成员都将失去访问权限，此操作不可恢复。确定要删除吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} labelStyle={styles.dialogButtonLabel}>
              取消
            </Button>
            <Button
              onPress={handleDeleteFamily}
              mode="contained"
              buttonColor={theme.colors.error}
              labelStyle={styles.dialogButtonLabel}
            >
              确认删除
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <LoadingSpinner loading={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 48,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scrollContent: {
    flexGrow: 1,
  },
  listContent: {
    padding: 16,
  },
  memberCard: {
    marginBottom: 12,
    minHeight: 120,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#37474F',
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  deviceText: {
    fontSize: 16,
    color: '#66BB6A',
  },
  menuContainer: {
    marginLeft: 8,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    marginBottom: 8,
  },
  buttonContent: {
    height: 56,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  dialog: {
    borderRadius: 12,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  dialogText: {
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 16,
    color: '#666666',
  },
  dialogButtonLabel: {
    fontSize: 18,
    paddingHorizontal: 16,
  },
});
