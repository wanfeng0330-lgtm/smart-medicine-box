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
  IconButton,
  Menu,
  Divider,
  Portal,
  Dialog,
  List,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseFamilyStore } from '@/stores/useCloudBaseFamilyStore';
import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { LoadingSpinner } from '@/components/ui';
import { FamilyMember } from '@/types/family';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

export const FamilyMembersScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { familyId } = route.params;
  const { user, userProfile } = useCloudBaseAuthStore();
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
  } = useCloudBaseFamilyStore();

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (familyId) {
      fetchFamily(familyId);
      fetchFamilyMembers();
    }
  }, [familyId, fetchFamily, fetchFamilyMembers]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

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

  const handleLeaveFamily = async () => {
    if (!user?.uid) return;
    setShowLeaveDialog(false);
    await leaveFamily(user.uid);
    Alert.alert('成功', '已退出家庭组');
    navigation.goBack();
  };

  const handleDeleteFamily = async () => {
    setShowDeleteDialog(false);
    await deleteFamily();
    Alert.alert('成功', '家庭组已删除');
    navigation.goBack();
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

  const isAdmin = currentFamily?.adminId === userProfile?.id;
  const adminCount = members.filter((m) => m.role === 'admin').length;

  const renderMemberCard = (member: FamilyMember) => {
    const isCurrentUser = member.userId === userProfile?.id;
    const canManage = isAdmin && !isCurrentUser;

    return (
      <Card key={member.userId} style={styles.memberCard} elevation={2}>
        <Card.Content style={styles.memberContent}>
          <View style={styles.memberLeft}>
            <Avatar.Text
              size={56}
              label={member.name?.charAt(0) || '?'}
              style={[
                styles.memberAvatar,
                member.role === 'admin' && styles.adminAvatar,
              ]}
              labelStyle={styles.memberAvatarLabel}
            />
            <View style={styles.memberInfo}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                {isCurrentUser && (
                  <Chip mode="flat" style={styles.selfChip} textStyle={styles.selfChipText}>
                    我
                  </Chip>
                )}
              </View>
              <View style={styles.memberTags}>
                <Chip
                  mode="flat"
                  style={[
                    styles.roleChip,
                    member.role === 'admin' ? styles.adminRoleChip : styles.memberRoleChip,
                  ]}
                  textStyle={styles.roleChipText}
                  icon={member.role === 'admin' ? 'crown' : 'account'}
                >
                  {member.role === 'admin' ? '管理员' : '成员'}
                </Chip>
                {member.deviceId && (
                  <Chip
                    mode="outlined"
                    style={styles.deviceChip}
                    textStyle={styles.deviceChipText}
                    icon="grid"
                  >
                    已连接药盒
                  </Chip>
                )}
              </View>
            </View>
          </View>

          {canManage && (
            <Menu
              visible={menuVisible === member.userId}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={28}
                  onPress={() => setMenuVisible(member.userId)}
                  iconColor={COLORS.textSecondary}
                />
              }
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                leadingIcon="account-edit"
                onPress={() => handleChangeRole(member)}
                title={member.role === 'admin' ? '设为成员' : '设为管理员'}
                titleStyle={styles.menuItemTitle}
              />
              <Divider />
              <Menu.Item
                leadingIcon="account-remove"
                onPress={() => handleRemoveMember(member)}
                titleStyle={[styles.menuItemTitle, { color: COLORS.error }]}
                title="移除成员"
              />
            </Menu>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderInviteSection = () => {
    if (!isAdmin) return null;

    return (
      <Card style={styles.inviteCard} elevation={2}>
        <Card.Content>
          <View style={styles.inviteHeader}>
            <Avatar.Icon
              size={48}
              icon="account-plus"
              style={styles.inviteIcon}
              color={COLORS.primary}
            />
            <View style={styles.inviteText}>
              <Text style={styles.inviteTitle}>邀请新成员</Text>
              <Text style={styles.inviteSubtitle}>
                分享邀请码让家人加入
              </Text>
            </View>
          </View>

          <View style={styles.inviteCodeContainer}>
            <Text style={styles.inviteCodeLabel}>邀请码</Text>
            <Text style={styles.inviteCode}>{currentFamily?.inviteCode}</Text>
          </View>

          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShareInvite}
            style={styles.shareButton}
            contentStyle={styles.shareButtonContent}
            buttonColor={COLORS.primary}
          >
            分享邀请码
          </Button>
        </Card.Content>
      </Card>
    );
  };

  const renderDangerZone = () => (
    <Card style={styles.dangerCard} elevation={1}>
      <Card.Content>
        <Text style={styles.dangerTitle}>危险操作</Text>

        {isAdmin ? (
          <>
            <List.Item
              title="解散家庭组"
              description="解散后所有成员将被移除，此操作不可撤销"
              left={(props) => <List.Icon {...props} icon="delete" color={COLORS.error} />}
              right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
              onPress={() => setShowDeleteDialog(true)}
              style={styles.dangerItem}
              titleStyle={{ color: COLORS.error, fontSize: 16 }}
              descriptionStyle={{ fontSize: 14 }}
            />
          </>
        ) : (
          <List.Item
            title="退出家庭组"
            description="退出后您将无法访问该家庭组的数据"
            left={(props) => <List.Icon {...props} icon="logout" color={COLORS.warning} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" color={COLORS.textSecondary} />}
            onPress={() => setShowLeaveDialog(true)}
            style={styles.dangerItem}
            titleStyle={{ color: COLORS.warning, fontSize: 16 }}
            descriptionStyle={{ fontSize: 14 }}
          />
        )}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={GRADIENTS.header}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>{currentFamily?.name || '家庭成员'}</Text>
            <Text style={styles.headerSubtitle}>
              {members.length} 位成员 · {adminCount} 位管理员
            </Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="account-group"
            style={styles.headerIcon}
            color="#FFFFFF"
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderInviteSection()}

        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>成员列表</Text>
          {members.map(renderMemberCard)}
        </View>

        {renderDangerZone()}
      </ScrollView>

      <Portal>
        <Dialog
          visible={showLeaveDialog}
          onDismiss={() => setShowLeaveDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>确认退出？</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              退出后，您将无法访问该家庭组的共享数据。确定要退出吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button onPress={handleLeaveFamily} mode="contained" buttonColor={COLORS.warning}>
              确认退出
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>确认删除？</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              删除家庭组后，所有成员都将失去访问权限，此操作不可恢复。确定要删除吗？
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button onPress={handleDeleteFamily} mode="contained" buttonColor={COLORS.error}>
              确认删除
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
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Nunito_ExtraBold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: 'Lato_Regular',
  },
  headerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  inviteCard: {
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  inviteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteIcon: {
    backgroundColor: COLORS.primaryLight + '30',
    marginRight: 16,
  },
  inviteText: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 2,
  },
  inviteSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  inviteCodeContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 4,
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Nunito_ExtraBold',
    letterSpacing: 8,
  },
  shareButton: {
    borderRadius: 16,
  },
  shareButtonContent: {
    height: 48,
  },

  membersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 12,
  },

  memberCard: {
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  memberContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  memberLeft: {
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
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  selfChip: {
    marginLeft: 8,
    height: 24,
    backgroundColor: COLORS.primary + '20',
  },
  selfChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'Lato_Medium',
  },
  memberTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleChip: {
    height: 28,
    borderRadius: 8,
  },
  adminRoleChip: {
    backgroundColor: COLORS.warning + '20',
  },
  memberRoleChip: {
    backgroundColor: COLORS.primaryLight + '30',
  },
  roleChipText: {
    fontSize: 13,
    fontFamily: 'Lato_Medium',
  },
  deviceChip: {
    height: 28,
    borderRadius: 8,
    borderColor: COLORS.success,
    backgroundColor: COLORS.successLight + '20',
  },
  deviceChipText: {
    fontSize: 13,
    color: COLORS.success,
    fontFamily: 'Lato_Medium',
  },

  menuContent: {
    borderRadius: 12,
  },
  menuItemTitle: {
    fontSize: 16,
    fontFamily: 'Lato_Regular',
  },

  dangerCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    ...SHADOWS.small,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Medium',
    marginBottom: 8,
  },
  dangerItem: {
    paddingVertical: 8,
  },

  dialog: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  dialogText: {
    fontSize: 16,
    color: COLORS.text,
    fontFamily: 'Lato_Regular',
    lineHeight: 24,
  },
});
