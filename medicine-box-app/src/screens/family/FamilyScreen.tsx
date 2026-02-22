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
  Divider,
  Portal,
  Dialog,
  TextInput,
  Avatar,
  IconButton,
  Chip,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseFamilyStore } from '@/stores/useCloudBaseFamilyStore';
import { LoadingSpinner } from '@/components/ui';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

export const FamilyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile } = useCloudBaseAuthStore();
  const {
    currentFamily,
    members,
    isLoading,
    error,
    createFamily,
    joinFamily,
    fetchFamilyMembers,
    clearError,
  } = useCloudBaseFamilyStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

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
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭组名称');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('错误', '用户信息不完整');
      return;
    }

    setShowCreateDialog(false);

    try {
      await createFamily(familyName.trim(), userProfile.id);
      setFamilyName('');
      Alert.alert('成功', '家庭组创建成功！');
    } catch (error) {
      Alert.alert('错误', '创建家庭组失败');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }

    if (!userProfile?.id) {
      Alert.alert('错误', '用户信息不完整');
      return;
    }

    setShowJoinDialog(false);

    try {
      await joinFamily(inviteCode.trim().toUpperCase(), userProfile.id);
      setInviteCode('');
      Alert.alert('成功', '成功加入家庭组！');
    } catch (error) {
      Alert.alert('错误', '加入家庭组失败');
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

  const isAdmin = currentFamily?.adminId === userProfile?.id;

  const renderFamilyInfo = () => (
    <>
      <Card style={styles.familyCard} elevation={4}>
        <LinearGradient
          colors={['#FFFFFF', '#F7F3EB']}
          style={styles.familyGradient}
        >
          <Card.Content>
            <View style={styles.familyHeader}>
              <View style={styles.familyIconContainer}>
                <Avatar.Icon
                  size={64}
                  icon="home"
                  style={styles.familyIcon}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.familyInfo}>
                <Text style={styles.familyName}>{currentFamily?.name}</Text>
                <Text style={styles.familyMembers}>
                  {members.length} 位成员
                </Text>
              </View>
              {isAdmin && (
                <Chip
                  mode="flat"
                  style={styles.adminChip}
                  textStyle={styles.adminChipText}
                  icon="crown"
                >
                  管理员
                </Chip>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.inviteCodeSection}>
              <Text style={styles.inviteCodeLabel}>邀请码</Text>
              <View style={styles.inviteCodeContainer}>
                <Text style={styles.inviteCode}>{currentFamily?.inviteCode}</Text>
                <IconButton
                  icon="share-variant"
                  size={24}
                  onPress={handleShareInvite}
                  iconColor={COLORS.primary}
                  style={styles.shareButton}
                />
              </View>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>

      <Card style={styles.membersCard} elevation={2}>
        <Card.Content>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>家庭成员</Text>
            <Button
              mode="text"
              onPress={() => navigation.navigate('FamilyMembers', { familyId: currentFamily?.id })}
              textColor={COLORS.primary}
              labelStyle={styles.viewAllButton}
            >
              查看全部
            </Button>
          </View>

          <View style={styles.membersList}>
            {members.slice(0, 4).map((member) => (
              <View key={member.userId} style={styles.memberItem}>
                <Avatar.Text
                  size={44}
                  label={member.name?.charAt(0) || '?'}
                  style={[
                    styles.memberAvatar,
                    member.role === 'admin' && styles.adminAvatar,
                  ]}
                  labelStyle={styles.memberAvatarLabel}
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'admin' ? '管理员' : '成员'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.actionsSection}>
        <Button
          mode="contained"
          icon="account-group"
          onPress={() => navigation.navigate('FamilyMembers', { familyId: currentFamily?.id })}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
          labelStyle={styles.actionButtonLabel}
          buttonColor={COLORS.primary}
        >
          管理家庭成员
        </Button>

        {isAdmin && (
          <Button
            mode="outlined"
            icon="account-plus"
            onPress={handleShareInvite}
            style={styles.actionButton}
            contentStyle={styles.actionButtonContent}
            labelStyle={styles.actionButtonLabel}
            textColor={COLORS.primary}
          >
            邀请新成员
          </Button>
        )}
      </View>
    </>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Avatar.Icon
          size={100}
          icon="home-group"
          style={styles.emptyIcon}
          color={COLORS.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>加入家庭组</Text>
      <Text style={styles.emptySubtitle}>
        创建或加入一个家庭组，与家人共享智能药盒，一起管理用药健康
      </Text>

      <Card style={styles.actionCard} elevation={2}>
        <Card.Content style={styles.actionCardContent}>
          <Avatar.Icon
            size={56}
            icon="plus-circle"
            style={styles.actionIcon}
            color={COLORS.primary}
          />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>创建家庭组</Text>
            <Text style={styles.actionDescription}>
              创建新家庭组，您将成为管理员
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => setShowCreateDialog(true)}
            style={styles.actionButtonSmall}
            buttonColor={COLORS.primary}
          >
            创建
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.actionCard} elevation={2}>
        <Card.Content style={styles.actionCardContent}>
          <Avatar.Icon
            size={56}
            icon="link-variant"
            style={styles.actionIcon}
            color={COLORS.secondary}
          />
          <View style={styles.actionTextContainer}>
            <Text style={styles.actionTitle}>加入家庭组</Text>
            <Text style={styles.actionDescription}>
              通过邀请码加入已有家庭组
            </Text>
          </View>
          <Button
            mode="contained"
            onPress={() => setShowJoinDialog(true)}
            style={styles.actionButtonSmall}
            buttonColor={COLORS.secondary}
          >
            加入
          </Button>
        </Card.Content>
      </Card>
    </View>
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
            <Text style={styles.headerTitle}>家庭管理</Text>
            <Text style={styles.headerSubtitle}>
              {currentFamily ? '与家人共享用药管理' : '创建或加入家庭组'}
            </Text>
          </View>
          <Avatar.Icon
            size={48}
            icon="home-group"
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
        {currentFamily ? renderFamilyInfo() : renderEmptyState()}
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
              label="家庭组名称"
              value={familyName}
              onChangeText={setFamilyName}
              mode="outlined"
              autoFocus
              style={styles.textInput}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              placeholder="例如：温馨小家"
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
          visible={showJoinDialog}
          onDismiss={() => setShowJoinDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>加入家庭组</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              请输入家庭成员提供的邀请码
            </Text>
            <TextInput
              label="邀请码"
              value={inviteCode}
              onChangeText={setInviteCode}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={6}
              autoFocus
              style={styles.textInput}
              outlineColor={COLORS.border}
              activeOutlineColor={COLORS.primary}
              placeholder="输入6位邀请码"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowJoinDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button onPress={handleJoinFamily} mode="contained" buttonColor={COLORS.primary}>
              加入
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

  familyCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  familyGradient: {
    borderRadius: 24,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  familyIconContainer: {
    marginRight: 16,
  },
  familyIcon: {
    backgroundColor: COLORS.primary,
  },
  familyInfo: {
    flex: 1,
  },
  familyName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 4,
  },
  familyMembers: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  adminChip: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 12,
  },
  adminChipText: {
    fontSize: 14,
    color: COLORS.warning,
    fontFamily: 'Lato_Medium',
  },
  divider: {
    marginVertical: 16,
  },
  inviteCodeSection: {
    alignItems: 'center',
  },
  inviteCodeLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 8,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Nunito_ExtraBold',
    letterSpacing: 6,
  },
  shareButton: {
    marginLeft: 12,
  },

  membersCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
  },
  viewAllButton: {
    fontSize: 14,
    fontFamily: 'Lato_Medium',
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 16,
  },
  memberAvatar: {
    backgroundColor: COLORS.primaryLight + '30',
    marginRight: 12,
  },
  adminAvatar: {
    backgroundColor: COLORS.warning + '30',
  },
  memberAvatarLabel: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  memberRole: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  actionsSection: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 20,
  },
  actionButtonContent: {
    height: 56,
  },
  actionButtonLabel: {
    fontSize: 18,
    fontFamily: 'Nunito_SemiBold',
  },

  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIconContainer: {
    marginBottom: 20,
  },
  emptyIcon: {
    backgroundColor: COLORS.primaryLight + '20',
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
  },

  actionCard: {
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    backgroundColor: 'transparent',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  actionButtonSmall: {
    borderRadius: 12,
    paddingHorizontal: 8,
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
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
});
