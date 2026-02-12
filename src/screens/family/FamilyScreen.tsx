import React, { useState, useEffect } from 'react';
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
  Divider,
  Portal,
  Dialog,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { LoadingSpinner } from '@/components/ui';

/**
 * FamilyScreen - 家庭组主界面
 * 适老化设计 - 大字体、高对比度
 */
export const FamilyScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const theme = useTheme();
  const {
    currentFamily,
    isLoading,
    error,
    createFamily,
    joinFamily,
    clearError,
  } = useFamilyStore();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // 清除错误
  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      clearError();
    }
  }, [error, clearError]);

  // 处理创建家庭组
  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('提示', '请输入家庭组名称');
      return;
    }

    setShowCreateDialog(false);
    await createFamily(familyName.trim());
    setFamilyName('');

    if (currentFamily) {
      Alert.alert('成功', '家庭组创建成功！');
    }
  };

  // 处理加入家庭组
  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }

    setShowJoinDialog(false);
    await joinFamily(inviteCode.trim().toUpperCase());
    setInviteCode('');

    if (currentFamily) {
      Alert.alert('成功', '成功加入家庭组！');
    }
  };

  // 无家庭组时显示选项
  if (!currentFamily) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="headlineLarge" style={styles.title}>
              家庭组
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              创建或加入一个家庭组，与家人共享智能药盒
            </Text>

            <Card style={styles.card} elevation={2}>
              <Card.Content>
                <Icon
                  source="account-group"
                  size={64}
                  color={theme.colors.primary}
                  style={styles.icon}
                />
                <Text variant="titleLarge" style={styles.cardTitle}>
                  创建家庭组
                </Text>
                <Text variant="bodyLarge" style={styles.cardText}>
                  创建一个新的家庭组，您将成为管理员
                </Text>
                <Button
                  mode="contained"
                  onPress={() => setShowCreateDialog(true)}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  创建家庭组
                </Button>
              </Card.Content>
            </Card>

            <Card style={styles.card} elevation={2}>
              <Card.Content>
                <Icon
                  source="qrcode"
                  size={64}
                  color={theme.colors.secondary}
                  style={styles.icon}
                />
                <Text variant="titleLarge" style={styles.cardTitle}>
                  加入家庭组
                </Text>
                <Text variant="bodyLarge" style={styles.cardText}>
                  通过邀请码加入家庭成员已创建的家庭组
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowJoinDialog(true)}
                  style={styles.button}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  加入家庭组
                </Button>
              </Card.Content>
            </Card>
          </View>
        </ScrollView>

        {/* 创建家庭组对话框 */}
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
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setShowCreateDialog(false)}
                labelStyle={styles.dialogButtonLabel}
              >
                取消
              </Button>
              <Button
                onPress={handleCreateFamily}
                mode="contained"
                labelStyle={styles.dialogButtonLabel}
              >
                创建
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* 加入家庭组对话框 */}
        <Portal>
          <Dialog
            visible={showJoinDialog}
            onDismiss={() => setShowJoinDialog(false)}
            style={styles.dialog}
          >
            <Dialog.Title style={styles.dialogTitle}>加入家庭组</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyLarge" style={styles.dialogText}>
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
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => setShowJoinDialog(false)}
                labelStyle={styles.dialogButtonLabel}
              >
                取消
              </Button>
              <Button
                onPress={handleJoinFamily}
                mode="contained"
                labelStyle={styles.dialogButtonLabel}
              >
                加入
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <LoadingSpinner loading={isLoading} />
      </View>
    );
  }

  // 已有家庭组 - 显示家庭信息
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineLarge" style={styles.title}>
            家庭组
          </Text>

          <Card style={styles.infoCard} elevation={2}>
            <Card.Content>
              <Icon
                source="account-group"
                size={48}
                color={theme.colors.primary}
                style={styles.icon}
              />
              <Text variant="displaySmall" style={styles.familyName}>
                {currentFamily.name}
              </Text>
              <Text variant="bodyLarge" style={styles.infoText}>
                成员数量: {currentFamily.members.length}
              </Text>
              <Divider style={styles.divider} />
              <Text variant="bodyLarge" style={styles.infoText}>
                邀请码: {currentFamily.inviteCode}
              </Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            icon="account-group-outline"
            onPress={() => navigation.navigate('FamilyMembers', { familyId: currentFamily.id })}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            管理家庭成员
          </Button>
        </View>
      </ScrollView>

      <LoadingSpinner loading={isLoading} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 16,
    color: '#37474F',
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 32,
    lineHeight: 26,
  },
  card: {
    marginBottom: 16,
    minHeight: 200,
  },
  infoCard: {
    marginBottom: 16,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    color: '#37474F',
  },
  cardText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
    color: '#666666',
  },
  button: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 16,
  },
  buttonContent: {
    height: 56,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  familyName: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFA726',
  },
  infoText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    color: '#666666',
  },
  divider: {
    marginVertical: 12,
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
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  dialogButtonLabel: {
    fontSize: 18,
    paddingHorizontal: 16,
  },
});
