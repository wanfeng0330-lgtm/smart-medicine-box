# Requirements Document - 智能药盒APP

## Introduction

智能药盒APP是一款为老人和慢性病患者设计的服药管理应用，通过蓝牙连接智能药盒硬件，提供家庭共享、定时提醒、远程开格等核心功能。APP采用Expo + TypeScript + Firebase技术栈开发，UI采用React Native Paper实现适老化设计（大字体、大按钮、高对比度）。

---

## Requirements

### Requirement 1 - 用户认证与家庭组管理

**User Story:** 作为用户，我希望能够通过手机号或邮箱注册登录，并创建或加入家庭组，与家人共享药盒管理权限。

#### Acceptance Criteria

1. While the app is installed, when the user opens the app for the first time, the app shall display the login/registration screen with phone number and email options.

2. While on the login screen, when the user enters valid credentials (phone/email + verification code or password), the app shall authenticate the user via Firebase Authentication and navigate to the main interface.

3. While the app is authenticated, when the user selects "Create Family", the app shall create a new family group in Firestore with a unique family ID.

4. While a family group exists, when the user selects "Invite Family Member", the app shall generate a QR code containing the family ID that other users can scan to join.

5. While a family group exists, when a user scans or manually enters a valid family ID, the app shall add the user to the family member list in Firestore.

6. While the user is in a family group, when the user selects "Family Members", the app shall display all family members with their roles (admin, member) and their current medication status.

7. While the user has admin permissions, when the user selects a family member, the app shall allow changing their role or removing them from the family.

---

### Requirement 2 - 药品信息管理

**User Story:** 作为用户，我希望能够添加药品信息，支持手动输入、条形码扫描和OCR识别，并管理处方照片和用药禁忌。

#### Acceptance Criteria

1. While on the "Medicines" screen, when the user selects "Add Medicine", the app shall display options: Manual Entry, Scan Barcode, OCR Recognition.

2. When the user selects "Manual Entry", the app shall display form fields for medicine name, description, dosage, stock quantity, prescription photo, and contraindications.

3. When the user selects "Scan Barcode", the app shall open the camera view via expo-barcode-scanner to scan the medicine barcode.

4. While scanning a barcode, when a valid barcode is detected, the app shall automatically retrieve medicine information from the database or display a form to complete the missing details.

5. When the user selects "OCR Recognition", the app shall open expo-image-picker to select a medicine package photo.

6. While a medicine photo is selected, when the user confirms, the app shall upload the photo to Firebase Storage and use OCR API to extract medicine name and dosage information.

7. While adding or editing a medicine, when the user uploads a prescription photo, the app shall upload the image to Firebase Storage and store the download URL in Firestore.

8. On the medicine detail screen, when the user tags a contraindication (e.g., "Take with water", "Avoid alcohol"), the app shall save this tag in Firestore and display it prominently when the medicine is scheduled.

---

### Requirement 3 - 用药计划与日程管理

**User Story:** 作为用户，我希望能够创建可视化的用药计划，设置每日/每周/疗程计划，并关联药盒的特定格子（1-8号）。

#### Acceptance Criteria

1. While on the "Schedule" screen, when the user creates a medication plan, the app shall display a calendar view with the current month selected.

2. While creating a plan, when the user selects a date and time, the app shall allow setting repeat patterns: daily, weekly, or specific course duration.

3. While setting a medication schedule, when the user selects a medicine, the app shall display the medicine name, dosage, and available stock quantity.

4. While scheduling a medication, when the user selects "Before Meal" or "After Meal", the app shall save this label in Firestore and display it on the reminder notification.

5. While creating a medication schedule, when the user selects "Box Slot", the app shall display slots 1-8 and allow associating the medication with a specific slot.

6. While a medication schedule is set, when the user views the calendar, the app shall display scheduled medications with color indicators for scheduled, completed, and missed doses.

7. When a one-time medication task is created, when the scheduled time arrives, the app shall send a local notification via expo-notifications and trigger the smart box to unlock the associated slot.

---

### Requirement 4 - 智能药盒蓝牙连接与控制

**User Story:** 作为用户，我希望能够通过蓝牙连接、配对并控制智能药盒，包括发送开格指令和接收开盒状态。

#### Acceptance Criteria

1. While the app is running, when the user selects "Connect Box", the app shall scan for available BLE devices using expo-ble-plx.

2. While scanning, when a compatible smart medicine box is detected, the app shall display the device name and signal strength.

3. When the user selects a device to connect, when the connection is successful, the app shall store the device ID in Firestore under the user profile and box management collection.

4. While the device is connected, when the user selects "Remote Open", the app shall display a list of box slots (1-8) with their medication assignments.

5. While viewing box slots, when the user selects a slot, the app shall send a BLE command to unlock the specific slot and wait for confirmation.

6. When the slot is unlocked, when the user opens the box lid, the app shall receive a status update from the device and log the opening time in Firestore.

7. While the device is connected, when a medication reminder is triggered, the app shall automatically send the unlock command for the assigned slot and log the event.

8. While the app is in the background, when the device sends a low battery warning, the app shall display a push notification and save the alert timestamp in Firestore.

---

### Requirement 5 - 主页与待服药提醒

**User Story:** 作为用户，我希望在主页上看到当前待服用的药品、倒计时、已服/未服标记，并能直接远程开格。

#### Acceptance Criteria

1. When the user opens the app, when the main screen loads, the app shall display a list of upcoming medications within the next 24 hours sorted by time.

2. While viewing upcoming medications, when a medication is due within 30 minutes, the app shall display a prominent countdown timer.

3. For each medication on the main screen, when the medication is marked as taken, the app shall display a green checkmark and "TAKEN" status.

4. For medication not yet taken, when the scheduled time has passed without confirmation, the app shall display a "MISSED" status in red.

5. While viewing the main screen, when the user taps a medication, the app shall display details: medicine name, dosage, time, box slot, and medication instructions.

6. On the medication detail view, when the user selects "Mark as Taken", the app shall update the Firestore record with the timestamp taken and update the main screen status.

7. On the medication detail view, when the user selects "Open Box Slot", the app shall send a BLE command to unlock the associated box slot and wait for confirmation.

8. While the main screen is active, when new data is received from Firestore, the app shall update the medication list in real-time.

---

### Requirement 6 - 多级提醒系统

**User Story:** 作为用户，我希望在服药时间前10分钟收到预提醒，时间到达时收到强提醒，5分钟未响应时触发二次提醒并通知家人。

#### Acceptance Criteria

1. When a medication is scheduled at time T, when T-10 minutes is reached, the app shall send a gentle local notification with "Medication coming up" message and medication name.

2. When the scheduled time T is reached, if the box slot has not been opened, the app shall send a high-priority local notification with sound + vibration, and trigger the box to unlock.

3. After the scheduled time T+5 minutes, if the box slot remains unopened, the app shall send a second urgent notification to the user and send a push notification (via Firebase Cloud Messaging) to all family members.

4. While a push notification is sent to family members, when a family member taps the notification, the app shall open to the main screen showing the missed medication and the medication status.

5. While the reminder system is active, when the user taps "Snooze" (within 5 minutes after reminder), the app shall reschedule the notification for an additional 10 minutes and log the snooze action.

6. When the user marks a medication as taken, the app shall cancel all pending notifications for that medication.

7. In the app settings, when the user enables "Quiet Mode", the app shall suppress sound and vibration but continue to display notification banners.

---

### Requirement 7 - 家庭协作与状态监控

**User Story:** 作为家庭管理员，我希望能够查看所有家庭成员的用药状态，接收异常提醒，并了解谁错过了服药。

#### Acceptance Criteria

1. While logged in as a family admin, when the user selects "Family Status", the app shall display a dashboard showing all family members with their medication calendar.

2. On the family status dashboard, when a family member has missed a medication, the app shall display a red indicator next to their name with the medication name and time.

3. While viewing a family member's calendar, when the user selects a day, the app shall show all medications scheduled for that day with status (taken, missed, upcoming).

4. While monitoring the family status, when a family member has not taken a medication within the expected window, the app shall display a "Check in" alert.

5. When a family member marks a medication as taken, when the family status is viewed, the app shall update their status in real-time via Firestore listeners.

6. In the settings, when the user enables "Abnormal Alerts", the app shall send push notifications to admins when family members miss medications or box shows low battery.

7. While the app is in the background, when receiving a family medication status update, the app shall update the local data and show a banner notification if abnormal.

---

### Requirement 8 - 数据统计与报告导出

**User Story:** 作为用户，我希望能够查看服药依从率统计、周报趋势图，并导出PDF报告分享给医生。

#### Acceptance Criteria

1. When the user selects "Statistics", the app shall display a weekly calendar with adherence rate (percentage of medications taken on time).

2. On the statistics screen, when the user selects a week, the app shall display a bar chart showing daily adherence rates using react-native-charts-wrapper.

3. While viewing statistics, when the user selects a specific day, the app shall show detailed breakdown: total medications, taken on time, taken late, missed.

4. When the user selects "Export Report", the app shall generate a PDF report using react-native-pdf-lib containing:
   - Patient information
   - Selected date range
   - Medication list with prescribed frequency
   - Adherence statistics (total, on-time rate, late rate, missed rate)
   - Missed medication details
   - Notes/comments

5. While the PDF is generating, when the generation is complete, the app shall display options: Share, Save to Device, Send via Email.

6. When the user selects "Share", the app shall open the native share sheet allowing share to messaging apps, email, or other applications.

7. On the statistics screen, when the user selects "Trend View", the app shall display a line chart showing adherence trends over the past 4 weeks.

---

### Requirement 9 - 硬件监控与预警

**User Story:** 作为用户，我希望在药盒电量低或缺少药品时收到预警，以便及时处理。

#### Acceptance Criteria

1. While the medicine box is connected, when the device reports battery level below 20%, the app shall display a persistent banner notification "Low Battery: Charge the box" on the main screen.

2. When battery level falls below 10%, the app shall send an urgent push notification to all family members: "Critical: Box battery below 10%".

3. While monitoring medication stock, when any medicine stock quantity falls below the threshold (configurable, default 5 doses), the app shall display a "Low Stock" indicator on the medicine card.

4. When the user selects the "Low Stock" indicator, the app shall filter the medicine list showing only medicines that need replenishment.

5. While the box is disconnected, when the app detects no connection for over 24 hours, the app shall display a warning "Box Disconnected: Check Bluetooth connectivity" and notify family members.

6. In the settings, when the user adjusts the low stock threshold, the app shall save the preference in Firestore and apply the new threshold for future stock alerts.

---

### Requirement 10 - 附加功能与用户设置

**User Story:** 作为用户，我希望能够配置静音模式、查看免责声明，并管理个人账户设置。

#### Acceptance Criteria

1. In the app settings, when the user enables "Quiet Mode", the app shall suppress sound and vibration for all notifications but still display visual notifications.

2. While Quiet Mode is enabled, when a critical alert (e.g., box low battery) occurs, the app shall override Quiet Mode and play sound + vibration.

3. When the user selects "Disclaimer" from settings, the app shall display a legal disclaimer page stating that the app is for medication management assistance and not a substitute for professional medical advice.

4. On the disclaimer page, when the user scrolls to the bottom, the app shall display an "Agree and Continue" button that must be tapped to proceed.

5. While viewing settings, when the user selects "Account", the app shall display options: Edit Profile, Change Password, Log Out, Delete Account.

6. When the user selects "Log Out", the app shall clear the Firebase Authentication session and clear the local cache.

7. When the user selects "Delete Account", the app shall show a confirmation dialog warning that all data will be permanently deleted, and delete the user's account and Firestore records on confirmation.

8. While in settings, when the user adjusts the notification sound, the app shall play a preview of the selected sound.

9. On the main screen, when errors occur (e.g., BLE connection failed, network error), the app shall display clear error messages in large, high-contrast text with a "Retry" button.

10. While the app is loading data, when a loading operation is in progress, the app shall display a loading spinner with descriptive text in large font (minimum 18pt).

---

## Technical Constraints & Non-Functional Requirements

### UI Design Requirements
- Minimum font size: 18pt across all screens (适老化设计)
- Large buttons with minimum touch target of 48x48 dp
- High contrast colors: Light background (#FAFAFA) with dark text (#37474F)
- Simplified navigation: Maximum 2-3 levels deep
- Loading states and error messages with clear text and retry options

### Performance Requirements
- BLE connection response time: < 5 seconds
- Real-time Firestore updates: < 2 seconds
- Local notification delivery: Immediate
- App launch time: < 3 seconds

### Accessibility Requirements
- VoiceOver support for iOS
- TalkBack support for Android
- Color contrast ratio: Minimum 4.5:1 for normal text, 3:1 for large text (≥18pt)

### Security Requirements
- All data transmitted over HTTPS
- Firebase Authentication for user identity
- Firestore security rules to prevent unauthorized access
- Medication records are private to family members only

### Platform Requirements
- Expo Managed Workflow
- iOS 13+ / Android 8.0+
- Bluetooth Low Energy (BLE) support required
- Camera permission for barcode/OCR functionality
