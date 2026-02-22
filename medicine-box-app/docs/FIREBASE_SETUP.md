# Firebase配置指南

## 前置要求

- Google账户
- 浏览器访问Firebase控制台

## 配置步骤

### 步骤1: 创建Firebase项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"添加项目"或"创建项目"
3. 输入项目名称：`medicine-box-app`
4. （可选）启用Google Analytics（推荐启用以便追踪应用使用情况）
5. 点击"继续"并完成项目创建

### 步骤2: 创建iOS应用

1. 在项目概览页面，点击iOS图标（⬛方框）
2. 输入Bundle ID：`com.medicinebox.app`
3. （可选）设置应用昵称：`智能药盒-iOS`
4. 下载配置文件 `GoogleService-Info.plist`
5. 将文件放置在：`medicine-box-app/ios/` 目录下
6. 在 `ios/Podfile` 中添加以下内容：
   ```ruby
   # Firebase配置
   pod 'RNFBApp', :path => '../node_modules/@react-native-firebase/app'
   pod 'RNFBAuth', :path => '../node_modules/@react-native-firebase/auth'
   pod 'RNFBFirestore', :path => '../node_modules/@react-native-firebase/firestore'
   pod 'RNFBStorage', :path => '../node_modules/@react-native-firebase/storage'
   pod 'RNFBMessaging', :path => '../node_modules/@react-native-firebase/messaging'
   ```
7. 在iOS项目中添加 `GoogleService-Info.plist` 文件
8. 在 `ios/medicine-box-app/AppDelegate.mm` 中添加导入：
   ```objc
   #import <Firebase.h>
   ```
9. 在 `didFinishLaunchingWithOptions` 方法中添加：
   ```objc
   [FIRApp configure];
   ```

### 步骤3: 创建Android应用

1. 在项目概览页面，点击Android图标（🟩方框）
2. 输入包名：`com.medicinebox.app`
3. （可选）设置应用昵称：`智能药盒-Android`
4. 下载配置文件：`google-services.json`
5. 将文件放置在：`medicine-box-app/android/app/` 目录下

6. 在 `android/app/build.gradle` 中添加：
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

7. 在 `android/build.gradle` 中添加Google Services仓库：
   ```gradle
   buildscript {
     repositories {
       google()
       mavenCentral()
     }
     dependencies {
       classpath 'com.google.gms:google-services:4.3.15'
     }
   }

   allprojects {
     repositories {
       google()
       mavenCentral()
     }
   }
   ```

8. 在 `android/app/build.gradle` 中添加依赖：
   ```gradle
   dependencies {
     // Firebase
     implementation platform('com.google.firebase:firebase-bom:32.7.0')
     implementation 'com.google.firebase:firebase-auth'
     implementation 'com.google.firebase:firebase-firestore'
     implementation 'com.google.firebase:firebase-storage'
     implementation 'com.google.firebase:firebase-messaging'
   }
   ```

### 步骤4: 启用Firebase Authentication

1. 在左侧菜单中，点击"Authentication"
2. 点击"开始使用"
3. 选择"登录方式"标签
4. 启用以下登录方式：
   - ✅ **邮箱/密码** - Email/Password provider
   - ✅ **电话** - Phone provider
5. 对于电话登录，需要设置验证码模板（可选）

### 步骤5: 创建Firestore数据库

1. 在左侧菜单中，点击"Firestore Database"
2. 点击"创建数据库"
3. 选择数据库位置（推荐选择最靠近用户的区域）
4. 选择"以测试模式启动"（开发阶段）或"以生产模式启动"（生产环境）
5. 注意：生产模式需要配置安全规则

### 步骤6: 创建Storage存储桶

1. 在左侧菜单中，点击"Storage"
2. 点击"开始使用"
3. 选择以测试模式启动或生产模式启动
4. 规则设置：
   - 测试模式：允许读写（1个月有效）
   - 生产模式：启用安全规则（参考本仓库的 `firestore.rules` 文件）

### 步骤7: 配置云消息（Cloud Messaging）

1. 在左侧菜单中，点击"Cloud Messaging"
2. 如果需要发送推送通知，配置FCM设置
3. 添加服务器密钥（用于Cloud Functions）

### 步骤8: 复制Firebase配置信息

1. 在项目概览页面，点击iOS或Android应用
2. 向下滚动查看配置信息
3. 复制以下内容并填写到 `.env` 文件中：

```env
# 从Firebase Settings > General > Your App中复制
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 从Firebase设置中复制（项目ID通常在项目URL中）
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com

# 项目ID（在项目URL中：https://console.firebase.google.com/project/YOUR_PROJECT_ID）
EXPO_PUBLIC_FIREBASE_PROJECT_ID=medicine-box-app-xxxxx

# 存储桶名称（通常是 project-id.appspot.com）
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=medicine-box-app-xxxxx.appspot.com

# 消息发送者ID（通常在项目设置中）
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012

# 应用ID（在应用设置中）
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:ios:abcdef123456
```

### 步骤9: 配置Firestore安全规则

1. 在Firestore控制台，点击"规则"标签
2. 将以下安全规则复制并粘贴到编辑器中：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function to check family membership
    function isFamilyMember(familyId) {
      return exists(/databases/$(database)/documents/families/$(familyId))
        && request.auth != null
        && get(/databases/$(database)/documents/families/$(familyId)).data.members.includes(request.auth.uid);
    }

    // Users: Only own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Families: Only family members can read, only admin can write
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/families/$(familyId)).data.adminId == request.auth.uid;
    }

    // Medicines: Only family members can access
    match /medicines/{medicineId} {
      allow read, write: if resource.data.familyId == null
        || isFamilyMember(resource.data.familyId);
    }

    // Schedules: Only family members can access
    match /schedules/{scheduleId} {
      allow read, write: if resource.data.familyId == null
        || isFamilyMember(resource.data.familyId);
    }

    // Medications: Only own records or family admins can read
    match /medications/{medicationId} {
      allow read: if resource.data.userId == request.auth.uid
        || isFamilyMember(resource.data.familyId);
      allow write: if resource.data.userId == request.auth.uid
        || isFamilyMember(resource.data.familyId);
    }

    // Devices: Only family members can access
    match /devices/{deviceId} {
      allow read, write: if resource.data.familyId == null
        || isFamilyMember(resource.data.familyId);
    }

    // Notifications: Only own notifications
    match /notifications/{notificationId} {
      allow read, write: if resource.data.userId == request.auth.uid;
    }
  }
}
```

3. 点击"发布"按钮发布规则

### 步骤10: 配置Storage安全规则

1. 在Storage控制台，点击"规则"标签
2. 添加以下安全规则：

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Helper function to check family membership
    function isFamilyMember(familyId) {
      return firestore.get(/databases/(default)/documents/families/$(familyId))
        .data.members.contains(request.auth.id);
    }

    // User avatars and medicine photos
    match /{collection}/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.id == userId;
    }
  }
}
```

3. 点击"发布"按钮发布规则

### 步骤11: 验证配置

1. 确保 `.env` 文件已正确填写
2. 确保 `GoogleService-Info.plist` (iOS) 和 `google-services.json` (Android) 已放置在正确位置
3. 在Expo应用中测试Firebase连接

## 常见问题

### Q: "Firebase module not found"错误
**A:** 确保已安装所有Firebase依赖并重新构建应用：
```bash
cd ios && pod install && cd ..
npx expo prebuild
```

### Q: 认证失败
**A:**
- 检查 `.env` 文件中的Firebase配置是否正确
- 确保Firebase Console中的Authentication已启用登录方式
- 检查应用包名/Bundle ID是否一致

### Q: Firestore权限错误
**A:**
- 确保Firestore安全规则已正确发布
- 检查用户是否已登录
- 验证用户是否属于相应的family group

### Q: Storage上传失败
**A:**
- 检查Storage安全规则
- 确保Storage已启用
- 验证Firebase Storage配置

## 下一步

- 配置完成后，运行应用测试Firebase连接
- 如果需要，可以配置Firebase Analytics和Crashlytics

## 参考资料

- [Firebase文档](https://firebase.google.com/docs)
- [React Native Firebase文档](https://rnfirebase.io/)
- [Expo Firebase指南](https://docs.expo.dev/guides/using-firebase/)
