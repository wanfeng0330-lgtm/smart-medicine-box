import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Chip,
  Divider,
  Portal,
  Dialog,
  TextInput,
  List,
  Menu,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseFamilyStore } from '@/stores/useCloudBaseFamilyStore';
import { useCloudBaseMedicineStore } from '@/stores/useCloudBaseMedicineStore';
import { useAccessibilityStore } from '@/stores/useAccessibilityStore';
import { FamilyMember, FamilyRole } from '@/types/family';
import { LoadingSpinner } from '@/components/ui';
import { ModeToggle } from '@/components/ModeToggle';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { userProfile, logout } = useCloudBaseAuthStore();
  const {
    currentFamily,
    members,
    fetchFamily,
    fetchFamilyMembers,
    createFamily,
    leaveFamily,
    deleteFamily,
    updateMemberRole,
    removeMember,
    isLoading,
    error,
    clearError,
  } = useCloudBaseFamilyStore();
  const { medicines } = useCloudBaseMedicineStore();
  const { mode } = useAccessibilityStore();
  const isSeniorMode = mode === 'senior';

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [newFamilyName, setNewFamilyName] = useState('');

  useEffect(() => {
    if (currentFamily) {
      fetchFamilyMembers();
    }
  }, [currentFamily]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  const handleCreateFamily = async () => {
    if (!newFamilyName.trim()) {
      Alert.alert('提示', '请输入家庭名称');
      return;
    }

    if (!userProfile?.id) return;

    try {
      await createFamily(newFamilyName.trim(), userProfile.id);
      setShowCreateDialog(false);
      setNewFamilyName('');
      Alert.alert('成功', '家庭组创建成功');
    } catch (error) {
      Alert.alert('错误', '创建失败');
    }
  };

  const handleShareInvite = async () => {
    if (!currentFamily?.inviteCode) return;

    try {
      await Share.share({
        message: `邀请您加入"${currentFamily.name}"家庭组\n邀请码: ${currentFamily.inviteCode}\n\n打开智能药盒APP，在家庭管理中输入邀请码即可加入`,
        title: '加入家庭组',
      });
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
  };

  const handleLeaveFamily = async () => {
    if (!userProfile?.id) return;

    Alert.alert(
      '确认退出',
      '确定要退出当前家庭组吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveFamily(userProfile.id);
              Alert.alert('成功', '已退出家庭组');
            } catch (error) {
              Alert.alert('错误', '退出失败');
            }
          },
        },
      ]
    );
  };

  const handleDeleteFamily = async () => {
    if (currentFamily?.adminId !== userProfile?.id) {
      Alert.alert('提示', '只有管理员可以解散家庭组');
      return;
    }

    Alert.alert(
      '确认解散',
      '解散后所有成员将被移除，此操作不可撤销',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '解散',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFamily();
              Alert.alert('成功', '家庭组已解散');
            } catch (error) {
              Alert.alert('错误', '解散失败');
            }
          },
        },
      ]
    );
  };

  const handleChangeRole = async (member: FamilyMember, newRole: FamilyRole) => {
    if (currentFamily?.adminId !== userProfile?.id) {
      Alert.alert('提示', '只有管理员可以修改权限');
      return;
    }

    if (member.userId === userProfile?.id) {
      Alert.alert('提示', '不能修改自己的权限');
      return;
    }

    try {
      await updateMemberRole(member.userId, newRole);
      setShowMemberMenu(null);
      Alert.alert('成功', '权限已更新');
    } catch (error) {
      Alert.alert('错误', '修改失败');
    }
  };

  const handleRemoveMember = async (member: FamilyMember) => {
    if (currentFamily?.adminId !== userProfile?.id) {
      Alert.alert('提示', '只有管理员可以移除成员');
      return;
    }

    Alert.alert(
      '确认移除',
      `确定要将"${member.name}"移出家庭组吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '移除',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(member.userId);
              setShowMemberMenu(null);
              Alert.alert('成功', '成员已移除');
            } catch (error) {
              Alert.alert('错误', '移除失败');
            }
          },
        },
      ]
    );
  };

  const getMemberAssignedSlots = (userId: string): number => {
    return medicines.filter((m) => m.boxSlot).length;
  };

  const isAdmin = currentFamily?.adminId === userProfile?.id;

  const renderMemberItem = (member: FamilyMember) => {
    const assignedSlots = getMemberAssignedSlots(member.userId);
    const isCurrentUser = member.userId === userProfile?.id;

    return (
      <Card key={member.userId} style={styles.memberCard}>
        <View style={styles.memberContent}>
          <View style={styles.memberInfo}>
            <Avatar.Text
              size={48}
              label={member.name?.charAt(0) || '?'}
              style={[
                styles.memberAvatar,
                member.role === 'admin' && styles.adminAvatar,
              ]}
              labelStyle={styles.memberAvatarLabel}
            />
            <View style={styles.memberDetails}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                {isCurrentUser && (
                  <View style={styles.selfBadge}>
                    <Text style={styles.selfBadgeText}>我</Text>
                  </View>
                )}
              </View>
              <View style={styles.memberTags}>
                <View style={[
                  styles.roleBadge,
                  member.role === 'admin' ? styles.adminBadge : styles.memberBadge,
                ]}>
                  <Text style={[
                    styles.roleBadgeText,
                    member.role === 'admin' ? styles.adminBadgeText : styles.memberBadgeText,
                  ]}>
                    {member.role === 'admin' ? '管理员' : '成员'}
                  </Text>
                </View>
                <Text style={styles.slotsText}>已分配 {assignedSlots} 格</Text>
              </View>
            </View>
          </View>

          {isAdmin && !isCurrentUser && (
            <Menu
              visible={showMemberMenu === member.userId}
              onDismiss={() => setShowMemberMenu(null)}
              anchor={
                <Button
                  mode="text"
                  icon="dots-vertical"
                  onPress={() => setShowMemberMenu(member.userId)}
                  textColor={COLORS.textSecondary}
                />
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  handleChangeRole(member, member.role === 'admin' ? 'member' : 'admin');
                }}
                title={member.role === 'admin' ? '设为成员' : '设为管理员'}
                leadingIcon="account-edit"
              />
              <Divider />
              <Menu.Item
                onPress={() => handleRemoveMember(member)}
                title="移除成员"
                leadingIcon="account-remove"
                titleStyle={{ color: COLORS.error }}
              />
            </Menu>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={GRADIENTS.header}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <ModeToggle compact showLabel />
        </View>
        <View style={styles.headerContent}>
          <Avatar.Text
            size={isSeniorMode ? 80 : 72}
            label={userProfile?.name?.charAt(0) || '?'}
            style={styles.headerAvatar}
            labelStyle={styles.headerAvatarLabel}
          />
          <Text style={[styles.headerName, isSeniorMode && styles.seniorHeaderName]}>{userProfile?.name || '用户'}</Text>
          <Text style={styles.headerPhone}>{userProfile?.phone || ''}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentFamily ? (
          <>
            <Card style={styles.familyCard}>
              <Card.Content>
                <View style={styles.familyHeader}>
                  <View style={styles.familyInfo}>
                    <View style={styles.familyIcon}>
                      <Text style={styles.familyIconText}>🏠</Text>
                    </View>
                    <View>
                      <Text style={styles.familyName}>{currentFamily.name}</Text>
                      <Text style={styles.familyMembers}>
                        {members.length} 位成员
                      </Text>
                    </View>
                  </View>
                  {isAdmin && (
                    <Button
                      mode="contained"
                      icon="account-plus"
                      onPress={() => setShowInviteDialog(true)}
                      style={styles.inviteButton}
                      contentStyle={styles.inviteButtonContent}
                      labelStyle={styles.inviteButtonLabel}
                      buttonColor={COLORS.primary}
                    >
                      邀请成员
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>家庭成员</Text>
              <Text style={styles.sectionSubtitle}>管理家庭成员和权限</Text>
            </View>

            {members.map(renderMemberItem)}

            <Card style={styles.actionCard}>
              <Card.Content>
                {isAdmin ? (
                  <>
                    <List.Item
                      title="家庭设置"
                      description="修改家庭名称、解散家庭"
                      left={(props) => <List.Icon {...props} icon="cog" color={COLORS.primary} />}
                      right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
                      onPress={() => navigation.navigate('FamilySettings')}
                      style={styles.listItem}
                    />
                    <Divider />
                    <List.Item
                      title="解散家庭"
                      description="解散后所有成员将被移除"
                      left={(props) => <List.Icon {...props} icon="delete" color={COLORS.error} />}
                      onPress={handleDeleteFamily}
                      style={styles.listItem}
                      titleStyle={{ color: COLORS.error }}
                    />
                  </>
                ) : (
                  <List.Item
                    title="退出家庭"
                    description="退出当前家庭组"
                    left={(props) => <List.Icon {...props} icon="logout" color={COLORS.error} />}
                    onPress={handleLeaveFamily}
                    style={styles.listItem}
                    titleStyle={{ color: COLORS.error }}
                  />
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <View style={styles.emptyFamily}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>🏠</Text>
            </View>
            <Text style={styles.emptyTitle}>尚未加入家庭组</Text>
            <Text style={styles.emptyText}>
              创建家庭组，邀请家人一起管理用药
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setShowCreateDialog(true)}
              style={styles.createButton}
              contentStyle={styles.createButtonContent}
              labelStyle={styles.createButtonLabel}
              buttonColor={COLORS.primary}
            >
              创建家庭组
            </Button>
          </View>
        )}

        <Card style={styles.settingsCard}>
          <Card.Content>
            <List.Item
              title="模式设置"
              description={isSeniorMode ? '敬老版 · 大字体' : '普通版 · 标准字体'}
              left={(props) => <List.Icon {...props} icon="account-heart" color={COLORS.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
              onPress={() => navigation.navigate('AccessibilitySettings')}
              style={styles.listItem}
              titleStyle={isSeniorMode ? { fontSize: 20, fontWeight: '700' } : undefined}
            />
            <Divider />
            <List.Item
              title="消息通知设置"
              description="提醒方式、免打扰时段"
              left={(props) => <List.Icon {...props} icon="bell" color={COLORS.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
              onPress={() => navigation.navigate('NotificationSettings')}
              style={styles.listItem}
              titleStyle={isSeniorMode ? { fontSize: 20, fontWeight: '700' } : undefined}
            />
            <Divider />
            <List.Item
              title="关于我们"
              description="版本信息、用户协议"
              left={(props) => <List.Icon {...props} icon="information" color={COLORS.primary} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
              onPress={() => {}}
              style={styles.listItem}
              titleStyle={isSeniorMode ? { fontSize: 20, fontWeight: '700' } : undefined}
            />
            <Divider />
            <List.Item
              title="退出登录"
              left={(props) => <List.Icon {...props} icon="logout" color={COLORS.error} />}
              onPress={() => {
                Alert.alert(
                  '确认退出',
                  '确定要退出登录吗？',
                  [
                    { text: '取消', style: 'cancel' },
                    {
                      text: '退出',
                      style: 'destructive',
                      onPress: () => logout(),
                    },
                  ]
                );
              }}
              style={styles.listItem}
              titleStyle={{ color: COLORS.error, fontSize: isSeniorMode ? 20 : 16 }}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showCreateDialog}
          onDismiss={() => setShowCreateDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>创建家庭组</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="家庭名称"
              value={newFamilyName}
              onChangeText={setNewFamilyName}
              mode="outlined"
              placeholder="例如：温馨小家"
              style={styles.dialogInput}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button onPress={handleCreateFamily} mode="contained" buttonColor={COLORS.primary}>
              创建
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showInviteDialog}
          onDismiss={() => setShowInviteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>邀请成员</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              将邀请码分享给家人，对方在「家庭管理」中输入即可加入
            </Text>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCodeLabel}>邀请码</Text>
              <Text style={styles.inviteCode}>{currentFamily?.inviteCode}</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInviteDialog(false)} textColor={COLORS.textSecondary}>
              关闭
            </Button>
            <Button onPress={handleShareInvite} mode="contained" buttonColor={COLORS.primary}>
              分享邀请
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <LoadingSpinner loading={isLoading} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 12,
  },
  headerAvatarLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito_Bold',
  },
  headerName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Nunito_ExtraBold',
  },
  seniorHeaderName: {
    fontSize: 32,
  },
  headerPhone: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Lato_Regular',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  familyCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    ...SHADOWS.medium,
  },
  familyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  familyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  familyIconText: {
    fontSize: 26,
  },
  familyName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: 'Nunito_Bold',
  },
  familyMembers: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  inviteButton: {
    borderRadius: 16,
  },
  inviteButtonContent: {
    paddingHorizontal: 12,
  },
  inviteButtonLabel: {
    fontSize: 14,
    fontFamily: 'Lato_Medium',
  },

  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
    fontFamily: 'Nunito_Bold',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  memberCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    ...SHADOWS.small,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    backgroundColor: COLORS.primaryLight + '30',
    marginRight: 12,
  },
  adminAvatar: {
    backgroundColor: COLORS.warning + '30',
  },
  memberAvatarLabel: {
    fontFamily: 'Nunito_Bold',
    color: COLORS.primaryDark,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    fontFamily: 'Lato_Medium',
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selfBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  selfBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Lato_Medium',
  },
  memberTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  adminBadge: {
    backgroundColor: COLORS.warning + '20',
  },
  memberBadge: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  roleBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Lato_Medium',
  },
  adminBadgeText: {
    color: COLORS.warning,
  },
  memberBadgeText: {
    color: COLORS.primary,
  },
  slotsText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  actionCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    ...SHADOWS.small,
  },
  listItem: {
    paddingVertical: 8,
  },

  emptyFamily: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    fontFamily: 'Nunito_Bold',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Lato_Regular',
  },
  createButton: {
    borderRadius: 20,
  },
  createButtonContent: {
    paddingHorizontal: 32,
    height: 52,
  },
  createButtonLabel: {
    fontSize: 18,
    fontFamily: 'Lato_Medium',
  },

  settingsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },

  dialog: {
    borderRadius: 20,
  },
  dialogTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  dialogText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 16,
    fontFamily: 'Lato_Regular',
  },
  dialogInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  inviteCodeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontFamily: 'Lato_Regular',
  },
  inviteCode: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 8,
    fontFamily: 'Nunito_ExtraBold',
  },

  menuContent: {
    borderRadius: 12,
  },
});
