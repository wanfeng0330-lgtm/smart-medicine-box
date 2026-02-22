# 智能药盒APP (Smart Medicine Box)

这是一个使用Expo + TypeScript + Firebase开发的智能药盒管理应用，帮助老人和慢性病患者管理日常服药。

## 项目概述

本项目是按照**Spec规范编程**流程开发的完整移动应用，包含：
- 用户认证（Firebase Auth）
- 家庭组管理（多用户共享）
- 药品信息管理（支持条形码扫描和OCR）
- 用药计划管理（日历视图，每日/每周/疗程）
- 蓝牙连接智能药盒（BLE）
- 多级提醒系统（T-10分钟、T时刻、T+5分钟）
- 家庭协作与状态监控
- 数据统计与PDF报告导出

## 技术栈

### 核心框架
- **Expo SDK 54+** (Managed Workflow)
- **TypeScript 5.0+**
- **React Native 0.73+**

### 后端服务
- **Firebase Authentication** (Email/Password, Phone)
- **Firebase Firestore** (实时NoSQL数据库)
- **Firebase Storage** (文件存储)
- **Firebase Cloud Messaging** (推送通知)

### 状态管理
- **Zustand** (轻量级状态管理)

### 导航
- **React Navigation v7** (Stack + Bottom Tabs)

### UI组件
- **React Native Paper** (Material Design 3)
- **适老化设计** (大字体、大按钮、高对比度)

### 设备API
- **react-native-ble-plx** (蓝牙低功耗)
- **expo-barcode-scanner** (条形码扫描)
- **expo-image-picker** (图片选择)
- **expo-camera** (相机和OCR)
- **expo-notifications** (本地通知)

### 工具库
- **date-fns** (日期时间处理)
- **react-native-pdf-lib** (PDF生成)
- **@react-native-async-storage/async-storage** (本地存储)

## 快速开始

### 前置要求

- Node.js 18+
- npm 或 yarn
- Expo CLI

### 安装步骤

1. **克隆项目**
   ```bash
   cd medicine-box-app
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置Firebase**

   a. 创建Firebase项目：
   - 访问 [Firebase Console](https://console.firebase.google.com/)
   - 创建新项目

   b. 启用服务：
   - Authentication (Email/Password, Phone)
   - Firestore Database
   - Storage
   - Cloud Messaging

   c. 复制Firebase配置：
   - 项目设置 > 常规 > 您的应用程序
   - 复制配置信息

   d. 创建`.env`文件：
   ```bash
   cp .env.example .env
   ```

   e. 编辑`.env`文件，填入Firebase配置：
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. **启动应用**
   ```bash
   npx expo start
   ```

5. **运行在设备/模拟器**
   - iOS: 按 `i` 键
   - Android: 按 `a` 键
   - Web: 按 `w` 键

## 项目结构

```
medicine-box-app/
├── src/
│   ├── components/        # 可复用UI组件
│   ├── config/            # 配置文件
│   ├── constants/         # 常量定义
│   ├── hooks/             # 自定义React Hooks
│   ├── navigation/        # 导航配置
│   ├── screens/           # 屏幕组件
│   ├── services/          # 服务层（Firebase API等）
│   ├── stores/            # Zustand状态管理
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── specs/                 # Spec规范文档
│   └── medicine-box-app/
│       ├── requirements.md   # 需求文档
│       ├── design.md        # 技术设计
│       └── tasks.md         # 任务分解
├── .env.example          # 环境变量模板
├── .gitignore
├── app.json              # Expo配置
├── package.json
├── tsconfig.json         # TypeScript配置
└── README.md             # 本文件
```

## 功能模块

### 已实现功能

- ✅ Phase 1: 项目初始化与基础设施
- ✅ Phase 2: UI基础与主题配置（适老化设计，Material Design 3）
- ✅ Phase 3: 认证模块（LoginScreen, RegisterScreen）
- ✅ Phase 4: 家庭组管理（FamilyScreen, FamilyMembersScreen）
- ✅ Phase 5: 药品管理（MedicinesScreen, AddMedicineScreen, MedicineDetailScreen）
- ✅ Phase 6: 用药计划管理（ScheduleScreen, AddScheduleScreen）
- ✅ Phase 9: 主屏幕与用药状态（HomeScreen）

### 计划中功能

- 📋 Phase 7: BLE设备连接与控制（ConnectBox, BoxControl）
- 📋 Phase 8: 通知系统（FCM集成，本地提醒）
- 📋 Phase 10: 家庭协作与监控（FamilyStatusScreen）
- 📋 Phase 11: 数据统计与报告（StatisticsScreen）
- 📋 Phase 12: 设置与用户配置文件（SettingsScreen）

## UI设计规范

本项目采用**适老化设计**原则：

- **最小字体**: 18pt
- **最小触摸目标**: 48x48 dp
- **配色方案**:
  - 主色: #FFA726 (柔和琥珀色)
  - 辅助色1: #29B6F6 (淡蓝色)
  - 辅助色2: #66BB6A (薄荷绿)
  - 背景色: #FAFAFA (极浅灰)
  - 文本色: #37474F (深灰蓝)
- **字体**: Nunito (标题) + Lato (正文)
- **设计风格**: Soft/pastel (柔和粉彩)

## 开发进度

当前开发阶段：**核心功能已完成**

已完成的Phases:
- ✅ Phase 1-6: 核心功能模块
- ✅ Phase 9: 主屏幕与用药状态

TODO:
- 📋 蓝牙设备连接（Phase 7）
- 📋 通知系统集成（Phase 8）
- 📋 家庭协作功能（Phase 10）
- 📋 数据统计与报告（Phase 11）
- 📋 设置界面（Phase 12）

## 测试

```bash
# 运行单元测试
npm test

# 运行E2E测试（需要Detox配置）
npm run detox
```

## 构建

```bash
# 构建Android APK
eas build --platform android

# 构建iOS IPA
eas build --platform ios
```

## 贡献

本项目按照**Spec规范编程**流程开发，所有需求、设计和任务都在`specs/`目录中。

## 许可证

MIT License

## 联系方式

如有问题或建议，请联系开发团队。

---

**注意**: 本项目仅用于学习和演示目的，实际生产环境部署前请确保：
1. 完成Firebase安全规则配置
2. 实施适当的错误处理和日志记录
3. 进行充分的安全测试
4. 遵守GDPR、HIPAA等相关法规
