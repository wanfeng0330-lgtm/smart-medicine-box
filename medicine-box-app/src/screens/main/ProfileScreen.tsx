import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Avatar,
  Divider,
  Portal,
  Dialog,
  TextInput,
  Chip,
  IconButton,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCloudBaseAuthStore } from '@/stores/useCloudBaseAuthStore';
import { useCloudBaseFamilyStore } from '@/stores/useCloudBaseFamilyStore';
import { useCloudBaseScheduleStore } from '@/stores/useCloudBaseScheduleStore';
import { useAccessibilityStore } from '@/stores/useAccessibilityStore';
import { LoadingSpinner } from '@/components/ui';
import { ModeToggle } from '@/components/ModeToggle';
import { COLORS, GRADIENTS, SHADOWS } from '@/constants/theme';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, userProfile, logout } = useCloudBaseAuthStore();
  const {
    currentFamily,
    members,
    isLoading: familyLoading,
    createFamily,
    joinFamily,
    fetchFamilyMembers,
    leaveFamily,
    deleteFamily,
  } = useCloudBaseFamilyStore();
  const { records, schedules, fetchSchedules } = useCloudBaseScheduleStore();
  const { mode } = useAccessibilityStore();
  const isSeniorMode = mode === 'senior';

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [stats, setStats] = useState({ total: 0, taken: 0, rate: 0, weekRate: 0 });

  useEffect(() => {
    if (currentFamily) {
      fetchFamilyMembers();
      loadStats();
    }
  }, [currentFamily, records]);

  const loadStats = async () => {
    if (!userProfile?.familyId) return;
    
    await fetchSchedules(userProfile.familyId);
    
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);
    const total = todayRecords.length;
    const taken = todayRecords.filter(r => r.status === 'taken').length;
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekRecords = records.filter(r => new Date(r.date) >= weekAgo);
    const weekTaken = weekRecords.filter(r => r.status === 'taken').length;
    
    setStats({
      total,
      taken,
      rate: total > 0 ? Math.round((taken / total) * 100) : 0,
      weekRate: weekRecords.length > 0 ? Math.round((weekTaken / weekRecords.length) * 100) : 0,
    });
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭组名称');
      return;
    }
    if (!userProfile?.id) return;

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
    if (!userProfile?.id) return;

    setShowJoinDialog(false);
    try {
      await joinFamily(inviteCode.trim().toUpperCase(), userProfile.id);
      setInviteCode('');
      Alert.alert('成功', '成功加入家庭组！');
    } catch (error) {
      Alert.alert('错误', '加入家庭组失败，请检查邀请码');
    }
  };

  const handleShareInvite = async () => {
    if (!currentFamily?.inviteCode) return;
    try {
      await Share.share({
        message: `邀请您加入"${currentFamily.name}"家庭组\n邀请码: ${currentFamily.inviteCode}\n\n打开智能药盒APP，在我的页面加入家庭组`,
        title: '加入家庭组',
      });
    } catch (error) {
      Alert.alert('错误', '分享失败');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
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

  const isAdmin = currentFamily?.adminId === userProfile?.id;

  const renderUserSection = () => (
    <Card style={styles.userCard} elevation={4}>
      <LinearGradient
        colors={['#FFFFFF', '#F7F3EB']}
        style={styles.userGradient}
      >
        <Card.Content>
          <View style={styles.userHeader}>
            <Avatar.Text
              size={isSeniorMode ? 80 : 72}
              label={userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
              style={styles.userAvatar}
              labelStyle={styles.userAvatarLabel}
            />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, isSeniorMode && styles.seniorText]}>
                {userProfile?.name || '用户'}
              </Text>
              <Text style={styles.userEmail}>{userProfile?.email || '未设置邮箱'}</Text>
              {currentFamily && (
                <Chip
                  mode="flat"
                  style={styles.familyChip}
                  textStyle={styles.familyChipText}
                  icon="home-group"
                >
                  {currentFamily.name}
                </Chip>
              )}
            </View>
            <View style={styles.headerRight}>
              <ModeToggle compact />
            </View>
          </View>

          {stats.total > 0 && (
            <View style={styles.miniStats}>
              <View style={styles.miniStatItem}>
                <Text style={[styles.miniStatValue, { color: stats.rate >= 80 ? COLORS.success : stats.rate >= 60 ? COLORS.warning : COLORS.error }]}>
                  {stats.rate}%
                </Text>
                <Text style={styles.miniStatLabel}>今日完成</Text>
              </View>
              <Divider style={styles.statDivider} />
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{stats.taken}/{stats.total}</Text>
                <Text style={styles.miniStatLabel}>已服药</Text>
              </View>
              <Divider style={styles.statDivider} />
              <View style={styles.miniStatItem}>
                <Text style={styles.miniStatValue}>{members.length}</Text>
                <Text style={styles.miniStatLabel}>家庭成员</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </LinearGradient>
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('Report')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLight + '30' }]}>
          <Avatar.Icon size={40} icon="chart-bar" color={COLORS.primary} style={{ backgroundColor: 'transparent' }} />
        </View>
        <Text style={styles.quickActionLabel}>用药报告</Text>
        <Text style={styles.quickActionSub}>{stats.weekRate}%本周</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('NotificationSettings')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.warningLight + '30' }]}>
          <Avatar.Icon size={40} icon="bell-ring" color={COLORS.warning} style={{ backgroundColor: 'transparent' }} />
        </View>
        <Text style={styles.quickActionLabel}>提醒设置</Text>
        <Text style={styles.quickActionSub}>通知管理</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.quickActionItem}
        onPress={() => navigation.navigate('AccessibilitySettings')}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: COLORS.successLight + '30' }]}>
          <Avatar.Icon size={40} icon="account-heart" color={COLORS.success} style={{ backgroundColor: 'transparent' }} />
        </View>
        <Text style={styles.quickActionLabel}>模式设置</Text>
        <Text style={styles.quickActionSub}>{isSeniorMode ? '敬老版' : '普通版'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFamilySection = () => {
    if (!currentFamily) {
      return (
        <Card style={styles.familyCard} elevation={2}>
          <Card.Content style={styles.familyEmptyContent}>
            <Avatar.Icon
              size={64}
              icon="home-group"
              style={styles.familyEmptyIcon}
              color={COLORS.primary}
            />
            <Text style={styles.familyEmptyTitle}>加入家庭组</Text>
            <Text style={styles.familyEmptyDesc}>
              创建或加入家庭组，与家人共享用药管理
            </Text>
            <View style={styles.familyButtons}>
              <Button
                mode="contained"
                onPress={() => setShowCreateDialog(true)}
                style={styles.familyButton}
                buttonColor={COLORS.primary}
              >
                创建家庭
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowJoinDialog(true)}
                style={styles.familyButton}
                textColor={COLORS.primary}
              >
                加入家庭
              </Button>
            </View>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.familyCard} elevation={2}>
        <Card.Content>
          <View style={styles.familyHeader}>
            <View style={styles.familyTitleRow}>
              <Avatar.Icon
                size={44}
                icon="home"
                style={styles.familyIcon}
                color="#FFFFFF"
              />
              <View style={styles.familyTitleInfo}>
                <Text style={styles.familyTitle}>{currentFamily.name}</Text>
                <Text style={styles.familySubtitle}>{members.length}位成员</Text>
              </View>
            </View>
            {isAdmin && (
              <Chip
                mode="flat"
                style={styles.adminChip}
                textStyle={styles.adminChipText}
              >
                管理员
              </Chip>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>邀请码</Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCode}>{currentFamily.inviteCode}</Text>
              <IconButton
                icon="share-variant"
                size={22}
                onPress={handleShareInvite}
                iconColor={COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.membersPreview}>
            {members.slice(0, 5).map((member, index) => (
              <Avatar.Text
                key={member.userId}
                size={36}
                label={member.name?.charAt(0) || '?'}
                style={[
                  styles.memberAvatar,
                  { marginLeft: index > 0 ? -8 : 0 },
                  member.role === 'admin' && styles.adminAvatar,
                ]}
                labelStyle={styles.memberAvatarLabel}
              />
            ))}
            {members.length > 5 && (
              <View style={[styles.moreBadge, { marginLeft: -8 }]}>
                <Text style={styles.moreText}>+{members.length - 5}</Text>
              </View>
            )}
          </View>

          <View style={styles.familyActions}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('FamilyMembers', { familyId: currentFamily.id })}
              style={styles.manageButton}
              textColor={COLORS.primary}
              icon="account-group"
            >
              管理成员
            </Button>
            <Button
              mode="text"
              onPress={handleLeaveFamily}
              textColor={COLORS.error}
              icon="logout"
            >
              {isAdmin ? '解散家庭' : '退出家庭'}
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderMenuItems = () => (
    <View style={styles.menuSection}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('About')}
      >
        <Avatar.Icon
          size={44}
          icon="information"
          style={[styles.menuIcon, { backgroundColor: COLORS.textLight + '30' }]}
          color={COLORS.textSecondary}
        />
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, isSeniorMode && styles.seniorText]}>关于我们</Text>
          <Text style={styles.menuDesc}>版本信息和帮助</Text>
        </View>
        <IconButton icon="chevron-right" size={28} iconColor={COLORS.textLight} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate('Disclaimer')}
      >
        <Avatar.Icon
          size={44}
          icon="text-box"
          style={[styles.menuIcon, { backgroundColor: COLORS.textLight + '30' }]}
          color={COLORS.textSecondary}
        />
        <View style={styles.menuText}>
          <Text style={[styles.menuTitle, isSeniorMode && styles.seniorText]}>用户协议</Text>
          <Text style={styles.menuDesc}>使用条款和隐私政策</Text>
        </View>
        <IconButton icon="chevron-right" size={28} iconColor={COLORS.textLight} />
      </TouchableOpacity>
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
          <Text style={[styles.headerTitle, isSeniorMode && styles.seniorHeaderTitle]}>我的</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderUserSection()}
        {renderQuickActions()}
        {renderFamilySection()}
        {renderMenuItems()}

        <Button
          mode="contained"
          icon="logout"
          onPress={() => setShowLogoutDialog(true)}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          labelStyle={[styles.logoutButtonLabel, isSeniorMode && styles.seniorText]}
          buttonColor={COLORS.error}
        >
          退出登录
        </Button>

        <Text style={styles.versionText}>智能药盒 v1.0.0</Text>
      </ScrollView>

      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => setShowLogoutDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>退出登录</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>确定要退出登录吗？</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLogoutDialog(false)} textColor={COLORS.textSecondary}>
              取消
            </Button>
            <Button onPress={handleLogout} mode="contained" buttonColor={COLORS.error}>
              退出
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={showCreateDialog}
          onDismiss={() => setShowCreateDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title>创建家庭组</Dialog.Title>
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
          <Dialog.Title>加入家庭组</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>请输入家庭成员提供的邀请码</Text>
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

      <LoadingSpinner loading={familyLoading} />
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Nunito_ExtraBold',
  },
  seniorHeaderTitle: {
    fontSize: 36,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  userCard: {
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.large,
  },
  userGradient: {
    borderRadius: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    backgroundColor: COLORS.primary,
  },
  userAvatarLabel: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito_Bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 2,
  },
  seniorText: {
    fontSize: 28,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 6,
  },
  familyChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight + '30',
    borderRadius: 12,
    height: 28,
  },
  familyChipText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontFamily: 'Lato_Medium',
  },
  headerRight: {
    marginLeft: 8,
  },

  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  miniStatItem: {
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
  },
  miniStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 4,
    ...SHADOWS.small,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
  },
  quickActionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginTop: 2,
  },

  familyCard: {
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.small,
  },
  familyEmptyContent: {
    alignItems: 'center',
    padding: 20,
  },
  familyEmptyIcon: {
    backgroundColor: COLORS.primaryLight + '20',
    marginBottom: 16,
  },
  familyEmptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
    marginBottom: 8,
  },
  familyEmptyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  familyButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  familyButton: {
    borderRadius: 14,
    minWidth: 100,
  },

  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  familyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyIcon: {
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  familyTitleInfo: {
    flex: 1,
  },
  familyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Nunito_Bold',
  },
  familySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },
  adminChip: {
    backgroundColor: COLORS.warning + '20',
    borderRadius: 10,
    height: 26,
  },
  adminChipText: {
    fontSize: 12,
    color: COLORS.warning,
    fontFamily: 'Lato_Medium',
  },

  divider: {
    marginVertical: 12,
  },

  inviteSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 6,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: 'Nunito_ExtraBold',
    letterSpacing: 4,
  },

  membersPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  memberAvatar: {
    backgroundColor: COLORS.primaryLight + '50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  adminAvatar: {
    backgroundColor: COLORS.warning + '50',
  },
  memberAvatarLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Nunito_Bold',
  },
  moreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.textLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Lato_Medium',
  },

  familyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manageButton: {
    borderRadius: 14,
    flex: 1,
    marginRight: 8,
  },

  menuSection: {
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    ...SHADOWS.small,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Nunito_SemiBold',
    marginBottom: 2,
  },
  menuDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
  },

  logoutButton: {
    borderRadius: 20,
    marginTop: 8,
  },
  logoutButtonContent: {
    height: 56,
  },
  logoutButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Nunito_SemiBold',
  },

  versionText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Lato_Regular',
  },

  dialog: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  dialogText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontFamily: 'Lato_Regular',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
  },
});
