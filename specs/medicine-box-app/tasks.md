# Implementation Plan - 智能药盒APP

## Phase 1: Project Setup & Infrastructure

### 1.1 Project Initialization
- [ ] 1.1.1 Initialize Expo managed project with TypeScript template
  - `npx create-expo-app@latest medicine-box-app --template blank-typescript`
  - Requirement: None (Setup task)

- [ ] 1.1.2 Install core dependencies
  - Firebase: firebase, @react-native-firebase/app, @react-native-firebase/auth, @react-native-firebase/firestore, @react-native-firebase/storage, @react-native-firebase/messaging
  - Navigation: @react-navigation/native, @react-navigation/stack, @react-navigation/bottom-tabs
  - UI: react-native-paper, react-native-safe-area-context, react-native-screens
  - State: zustand
  - BLE: expo-ble-plx
  - Utils: expo-notifications, expo-barcode-scanner, expo-image-picker, expo-camera, date-fns, @react-native-async-storage/async-storage
  - Charts: react-native-charts-wrapper
  - PDF: react-native-pdf-lib
  - Requirement: None (Setup task)

- [ ] 1.1.3 Configure TypeScript with strict mode
  - Update tsconfig.json with strict: true, strictNullChecks: true
  - Add path aliases (@/, @components, @stores, @services, @utils, @types)
  - Requirement: None (Code quality)

- [ ] 1.1.4 Configure Firebase project
  - Create Firebase project in console
  - Enable Authentication (Email/Password, Phone)
  - Create Firestore database
  - Enable Cloud Storage
  - Enable Cloud Messaging
  - Download google-services.json (Android) and GoogleService-Info.plist (iOS)
  - Requirement: None (Setup task)

- [ ] 1.1.5 Implement Firebase initialization
  - Create firebaseConfig.ts configuration file
  - Initialize Firebase app in app initialization
  - Test Firebase connection in dev environment
  - Requirement: None (Setup task)

---

## Phase 2: UI Foundation & Theme

### 2.1 Theme Configuration
- [ ] 2.1.1 Create Material Design 3 theme with适老化 styling
  - Primary color: #FFA726 (amber)
  - Secondary color: #29B6F6 (light blue)
  - Background color: #FAFAFA
  - Text color: #37474F
  - Minimum font size: 18pt
  - Button minimum size: 48x48 dp
  - Requirement: Requirement 10 (UI Design Requirements)

- [ ] 2.1.2 Create custom font configuration
  - Import Nunito (heading) and Lato (body) fonts
  - Configure typography scales for large, medium, small text
  - Set default font size to 18pt
  - Requirement: Requirement 10 (UI Design Requirements)

- [ ] 2.1.3 Create common UI components
  - LoadingSpinner component with descriptive text
  - ErrorMessage component with retry button
  - SuccessMessage component
  - Card component with elevated shadow
  - Button component with large touch target
  - Requirement: Requirement 10 (UI Design Requirements)

---

## Phase 3: Authentication Module

### 3.1 Auth User Interface
- [ ] 3.1.1 Create Login screen
  - Email input with validation
  - Password input with visibility toggle
  - Login button
  - "Forgot password" link
  - Error display with large text
  - Loading state
  - Requirement: Requirement 1.1, Requirement 1.2

- [ ] 3.1.2 Create Registration screen
  - Name input
  - Email input
  - Phone input
  - Password input with strength indicator
  - "Register" button
  - "Already have account? Login" link
  - Validation and error display
  - Requirement: Requirement 1.1

- [ ] 3.1.3 Create Email verification screen
  - Display email verification message
  - "Resend verification email" button
  - Navigate to login after verification
  - Requirement: Requirement 1.2

- [ ] 3.1.4 Implement phone verification
  - Phone number input
  - Phone authentication flow
  - OTP code input and verification
  - Navigate to home after verification
  - Requirement: Requirement 1.2

### 3.2 Auth Logic & State Management
- [ ] 3.2.1 Create auth Zustand store
  - User state (loading, authenticated user, null)
  - Actions: login, register, logout, updateProfile
  - Persist state to AsyncStorage
  - Requirement: Requirement 1.2

- [ ] 3.2.2 Implement Firebase Auth integration
  - Email/password authentication
  - Phone authentication with verification
  - Password reset flow
  - Auth state listener
  - Handle auth errors (network, invalid credentials, etc.)
  - Requirement: Requirement 1.2

- [ ] 3.2.3 Create AuthProvider component
  - Wrap root component with AuthProvider
  - Manage auth state globally
  - Handle auth state changes, redirect to appropriate screen
  - Requirement: Requirement 1.2

---

## Phase 4: Family Group Management

### 4.1 Family UI
- [ ] 4.1.1 Create Family screen (create or join family)
  - "Create Family" button
  - "Join Family" button
  - Display current family info if already joined
  - Requirement: Requirement 1.3, Requirement 1.4

- [ ] 4.1.2 Create CreateFamily screen
  - Family name input
  - "Create" button
  - Loading state
  - Success message
  - Requirement: Requirement 1.3

- [ ] 4.1.3 Create JoinFamily screen
  - QR code scanner to scan family invite code
  - Manual family ID input (fallback)
  - "Join" button
  - Loading state
  - Success message
  - Requirement: Requirement 1.4, Requirement 1.5

- [ ] 4.1.4 Create FamilyMembers screen
  - List all family members
  - Display member name, role, current medication status
  - Admin can change role or remove member
  - QR code display to invite new members
  - Requirement: Requirement 1.6, Requirement 1.7

### 4.2 Family Logic & State
- [ ] 4.2.1 Create family Zustand store
  - Family state (current family, members list)
  - Actions: createFamily, joinFamily, fetchFamily, addMember, removeMember, updateMemberRole
  - Persist to AsyncStorage
  - Requirement: Requirement 1.3 - Requirement 1.7

- [ ] 4.2.2 Implement Firestore family operations
  - Create family document with unique familyId and inviteCode
  - Query family by familyId or inviteCode
  - Add/remove family members
  - Update member roles
  - Real-time sync of family members' medication status
  - Requirement: Requirement 1.3 - Requirement 1.7

- [ ] 4.2.3 Implement QR code generation for family invites
  - Generate QR code containing family invitation code
  - Display QR code on FamilyMembers screen
  - Requirement: Requirement 1.4

---

## Phase 5: Medicine Management

### 5.1 Medicine UI
- [ ] 5.1.1 Create Medicines screen (list view)
  - List all medicines in family
  - Search/filter medicines
  - "Add Medicine" button
  - Display medicine card with name, dosage, stock, box slot
  - Low stock indicator
  - Requirement: Requirement 2.1, Requirement 9.3

- [ ] 5.1.2 Create AddMedicine screen with tabs
  - Manual Entry tab
  - Scan Barcode tab
  - OCR Recognition tab
  - Requirement: Requirement 2.1

- [ ] 5.1.3 Create ManualMedicineForm component
  - Medicine name input (required)
  - Description input (optional)
  - Dosage input (required)
  - Stock quantity input (required, default to 10)
  - Prescription photo upload button
  - Contraindications tags (multi-select from predefined list + custom)
  - Notes input (optional)
  - Save/Cancel buttons
  - Validation
  - Requirement: Requirement 2.2

- [ ] 5.1.4 Create ScanBarcodeScreen component
  - Camera view for barcode scanning via expo-barcode-scanner
  - Display scan success message
  - Auto-fill form with scanned medicine info
  - Manual edit form fields
  - Save medicine
  - Requirement: Requirement 2.3, Requirement 2.4

- [ ] 5.1.5 Create OCRScreen component
  - Image picker via expo-image-picker
  - Camera capture option
  - Upload selected image to Firebase Storage
  - Call OCR API (ML Kit or third-party)
  - Display extracted medicine name and dosage
  - Manual edit form fields
  - Save medicine
  - Requirement: Requirement 2.5, Requirement 2.6

- [ ] 5.1.6 Create MedicineDetail screen
  - Display medicine name, description, dosage, stock
  - Show prescription photo if uploaded
  - Display contraindications prominently
  - Show box slot assignment
  - "Edit Medicine" button (edit mode)
  - Delete option
  - Requirement: Requirement 2.7, Requirement 2.8

### 5.2 Medicine Logic & State
- [ ] 5.2.1 Create medicine Zustand store
  - Medicines state (loading, list, error)
  - Actions: fetchMedicines, addMedicine, updateMedicine, deleteMedicine
  - Persist to AsyncStorage
  - Requirement: Requirement 2.1 - Requirement 2.8

- [ ] 5.2.2 Implement Firestore medicine operations
  - Create medicine document
  - Update medicine fields
  - Delete medicine document
  - Query medicines by familyId
  - Real-time sync of medicine changes
  - Requirement: Requirement 2.1 - Requirement 2.8

- [ ] 5.2.3 Implement medicine photo upload
  - Upload prescription photo to Firebase Storage
  - Get download URL and save to Firestore
  - Delete photo from Storage when medicine is deleted
  - Requirement: Requirement 2.7

- [ ] 5.2.4 Implement barcode/OCR integration
  - Integrate expo-barcode-scanner for barcode scanning
  - Create medicine database or use external API for barcode lookup
  - Integrate ML Kit for OCR (medicine package photo)
  - Parse OCR results and auto-fill form
  - Requirement: Requirement 2.4, Requirement 2.6

---

## Phase 6: Medication Schedule Management

### 6.1 Schedule UI
- [ ] 6.1.1 Create Schedule screen (calendar view)
  - Display monthly calendar
  - Highlight dates with medications
  - "Add Schedule" button
  - Tap date to view day's medications
  - Display medication cards with time, medicine name, dosage, meal label
  - Filter by family member
  - Requirement: Requirement 3.1, Requirement 3.6

- [ ] 6.1.2 Create AddSchedule screen
  - Step 1: Select user from family members
  - Step 2: Select medicine from medicines list
  - Step 3: Set time and date
  - Step 4: Set repeat pattern (daily/weekly/course/once)
    - Weekly: Select days of week checkboxes
    - Course: Start date and end date pickers
  - Step 5: Select box slot (1-8) with visual slot selector
  - Step 6: Select meal label (before/after/none)
  - Preview schedule summary
  - Save/Cancel buttons
  - Validation
  - Requirement: Requirement 3.2 - Requirement 3.5

- [ ] 6.1.3 Create ScheduleDetail screen
  - Display schedule information (user, medicine, time, date, repeat, box slot)
  - Display upcoming dates (next 7 occurrences)
  - "Edit Schedule" button
  - "Delete Schedule" button
  - Requirement: Requirement 3.1 - Requirement 3.5

### 6.2 Schedule Logic & State
- [ ] 6.2.1 Create schedule Zustand store
  - Schedule state (loading, list, error)
  - Actions: fetchSchedules, addSchedule, updateSchedule, deleteSchedule
  - Persist to AsyncStorage
  - Requirement: Requirement 3.1 - Requirement 3.5

- [ ] 6.2.2 Implement Firestore schedule operations
  - Create schedule document
  - Update schedule fields
  - Delete schedule document
  - Query schedules by familyId, userId, date
  - Real-time sync of schedule changes
  - Requirement: Requirement 3.1 - Requirement 3.5

- [ ] 6.2.3 Implement schedule generation logic
  - Generate medication records based on schedule (daily, weekly, course)
  - Create future medication records (up to 30 days)
  - Update medication records when schedule changes
  - Delete medication records when schedule is deleted
  - Requirement: Requirement 3.2

---

## Phase 7: BLE Device Connection & Control

### 7.1 BLE UI
- [ ] 7.1.1 Create ConnectBox screen
  - "Start Scan" button
  - List of discovered BLE devices
  - Display device name, signal strength, connection status
  - "Connect" button per device
  - "Disconnect" button
  - Pairing status
  - Connection error display
  - Requirement: Requirement 4.1, Requirement 4.2

- [ ] 7.1.2 Create BoxControl screen
  - Display connected device info (name, battery level)
  - List of 8 box slots with assigned medicines
  - "Open Slot" button per slot
  - Slot status indicator (locked, unlocked)
  - "Request Status" button
  - Disconnect button
  - Requirement: Requirement 4.3 - Requirement 4.6

### 7.2 BLE Logic & State
- [ ] 7.2.1 Create BLE Zustand store
  - BLE state (scanning, device list, connected device, battery level)
  - Actions: startScan, stopScan, connectToDevice, disconnectDevice, sendCommand, updateBattery
  - Persist device ID to AsyncStorage (auto-reconnect on app start)
  - Requirement: Requirement 4.1 - Requirement 4.6

- [ ] 7.2.2 Implement BLE manager using expo-ble-plx
  - Request BLE permissions
  - Scan for devices (filter by service UUID if available)
  - Connect to device
  - Discover services and characteristics
  - Subscribe to notifications (characteristic for status updates)
  - Write commands to device (unlock, status request)
  - Handle BLE errors (permission denied, connection lost, etc.)
  - Implement auto-reconnect logic
  - Requirement: Requirement 4.1 - Requirement 4.8

- [ ] 7.2.3 Implement BLE command protocol
  - Parse unlock command: [CMD][SLOT][CHECKSUM]
  - Parse status request command: [CMD][CHECKSUM]
  - Parse unlock response: [STATUS][SLOT][BATTERY][CHECKSUM]
  - Parse slot opened event: [EVENT][SLOT][TIMESTAMP][CHECKSUM]
  - Calculate and validate checksums
  - Requirement: Requirement 4.5, Requirement 4.6

- [ ] 7.2.4 Create Firestore device operations
  - Create/update device document when connected
  - Update device battery level
  - Store device logs (connection/disconnection times)
  - Update slot information in device document
  - Real-time sync of device status to Firestore
  - Query device info by familyId
  - Requirement: Requirement 4.3, Requirement 4.8

---

## Phase 8: Notification System

### 8.1 Notification UI
- [ ] 8.1.1 Create Notifications screen (in-app notifications)
  - List of notifications
  - Filter by type (reminder, missed, alert)
  - Mark as read/unread
  - Notification detail view
  - Clear all notifications button
  - Requirement: Requirement 6.3, Requirement 6.4

- [ ] 8.1.2 Create NotificationDetail screen
  - Display notification title, body, timestamp
  - Show related information (medication name, device info, etc.)
  - "Mark as Read" button
  - Navigational action (e.g., open medication detail)
  - Requirement: Requirement 6.3, Requirement 6.4

### 8.2 Local Notifications (expo-notifications)
- [ ] 8.2.1 Implement local notification scheduler
  - Schedule T-10 minutes pre-reminder
  - Schedule T time reminder (with sound + vibration)
  - Schedule T+5 minutes missed reminder
  - Cancel notifications when medication is taken
  - Snooze notification functionality (reschedule +10 minutes)
  - Requirement: Requirement 6.1 - Requirement 6.3, Requirement 6.5, Requirement 6.6

- [ ] 8.2.2 Implement notification channel configuration
  - Configure notification channels (reminders, alerts, notifications)
  - Set sound and vibration patterns
  - Respect Quiet Mode setting
  - Critical alerts override Quiet Mode
  - Requirement: Requirement 6.1, Requirement 6.7

- [ ] 8.2.3 Implement notification action handlers
  - Handle notification tap (navigate to relevant screen)
  - Handle "Take Now" action (mark as taken)
  - Handle "Snooze" action (reschedule)
  - Handle "Dismiss" action
  - Requirement: Requirement 6.3, Requirement 6.5

### 8.3 Push Notifications (Firebase Cloud Messaging)
- [ ] 8.3.1 Implement FCM integration
  - Configure FCM in Firebase console
  - Request notification permissions
  - Get FCM token
  - Save FCM token to user profile in Firestore
  - Handle token refresh
  - Requirement: Requirement 6.1 - Requirement 6.3

- [ ] 8.3.2 Create Cloud Function: sendFamilyNotification
  - Trigger: Firestore onWrite on medications collection (when status changes to 'missed')
  - Query all family members by familyId
  - Create FCM notification for each family member
  - Send notification via admin.messaging()
  - Log notification sent to Firestore notifications collection
  - Requirement: Requirement 6.3

- [ ] 8.3.3 Create Cloud Function: checkLowStock
  - Trigger: Scheduled (daily at 10:00 AM)
  - Query medicines in family where stock < lowStockThreshold
  - Create notification for each low stock medicine
  - Send FCM notification to family admins
  - Requirement: Requirement 9.2, Requirement 9.3

- [ ] 8.3.4 Create Cloud Function: updateDeviceStatus
  - Trigger: HTTP POST from mobile app (when device status updates)
  - Update Firestore device document (battery level, connection)
  - If battery < 20%, send low battery notification
  - If battery < 10%, send critical alert to all family members
  - Requirement: Requirement 9.1, Requirement 9.2

---

## Phase 9: Main Screen & Medication Status

### 9.1 Main Screen UI
- [ ] 9.1.1 Create Home screen
  - Display upcoming medications (next 24 hours, sorted by time)
  - Countdown timer for medication due within 30 minutes
  - Medication card with status indicator (scheduled [gray], taken [green], missed [red])
  - Medication card details: medicine name, dosage, time, box slot number
  - "Mark as Taken" button
  - "Open Box Slot" button (if available)
  - "View Details" button
  - Quick action buttons: Add Medicine, Add Schedule, Family Status, Statistics
  - Low stock banner alert
  - Low battery banner alert
  - Box disconnected warning
  - Requirement: Requirement 5.1 - Requirement 5.7, Requirement 9.1, Requirement 9.5

- [ ] 9.1.2 Create MedicationDetail screen (from Home)
  - Display medication information (medicine name, dosage, time, date)
  - Display associated schedule details
  - Display box slot with visual indicator
  - Display medication instructions (contraindications, etc.)
  - "Mark as Taken" button
  - "Open Box Slot" button
  - Snooze option (if within 5 minutes after reminder)
  - Add notes functionality
  - Requirement: Requirement 5.5, Requirement 5.6, Requirement 5.7

### 9.2 Main Screen Logic & State
- [ ] 9.2.1 Create medication Zustand store
  - Medications state (upcoming, today, loading, error)
  - Actions: fetchUpcomingMedications, fetchTodayMedications, markAsTaken, markAsMissed, snoozeMedication, addNote
  - Real-time sync from Firestore
  - Requirement: Requirement 5.1 - Requirement 5.7

- [ ] 9.2.2 Implement Firestore medication operations
  - Create medication record
  - Update medication status (scheduled → taken/missed)
  - Add notes to medication record
  - Update medication with taken time, snooze info
  - Query medications by userId, date range, status
  - Real-time sync of medication changes
  - Requirement: Requirement 5.1 - Requirement 5.7

- [ ] 9.2.3 Implement countdown timer logic
  - Calculate time remaining until next medication
  - Update countdown every second
  - Change color when time is approaching (30 minutes: yellow, 10 minutes: orange, due: red)
  - Stop countdown when medication is taken or missed
  - Requirement: Requirement 5.2

- [ ] 9.2.4 Implement medication-bbox integration
  - When medication is due, send unlock command to box (if connected)
  - When box slot is opened, log opening time and mark medication status
  - Update medication UI in real-time when box status changes
  - Requirement: Requirement 4.7, Requirement 5.7

---

## Phase 10: Family Collaboration & Monitoring

### 10.1 Family Status UI
- [ ] 10.1.1 Create FamilyStatus screen (admin and member view)
  - Display family member list with medication status summary
  - Color indicators: green (adherent), yellow (warning), red (missed)
  - Adherence rate per member (today, this week)
  - Tap member to view their detailed calendar
  - Quick action: "Check in" button (sends notification to member)
  - Alert banner for abnormal status (missed medications, low battery, etc.)
  - Requirement: Requirement 7.1, Requirement 7.4

- [ ] 10.1.2 Create FamilyMemberCalendar screen
  - Display family member's name and avatar
  - Calendar view with medication status
  - Tap date to view day's medications
  - Medication list with status (taken, missed, upcoming)
  - Filter by status
  - Requirement: Requirement 7.2, Requirement 7.3

### 10.2 Family Collaboration Logic & State
- [ ] 10.2.1 Create family monitoring Zustand store
  - Family status state (members with status, alerts)
  - Actions: fetchFamilyStatus, getMemberMedicationHistory, checkAbnormalStatus
  - Real-time sync from Firestore
  - Requirement: Requirement 7.1 - Requirement 7.4

- [ ] 10.2.2 Implement Firestore operations for family monitoring
  - Query medications by familyId, date range
  - Calculate adherence rate per member
  - Detect abnormal status (missed medications, no box activity)
  - Create "check in" notification for family member
  - Real-time sync of family status changes
  - Requirement: Requirement 7.1 - Requirement 7.7

- [ ] 10.2.3 Implement abnormal alert logic
  - Check for missed medications daily
  - Check for box disconnected (no connect logs in 24h)
  - Check for low battery level
  - Create alert notifications for admins
  - Send push notification if push notifications enabled
  - Requirement: Requirement 7.4, Requirement 7.6, Requirement 7.7

---

## Phase 11: Statistics & Reporting

### 11.1 Statistics UI
- [ ] 11.1.1 Create Statistics screen
  - Weekly calendar view with adherence rate per day (color-coded)
  - Overall adherence rate (today, this week, this month)
  - Bar chart using react-native-charts-wrapper (daily adherence rates)
  - Tap day to view detailed breakdown
  - Export report button
  - Toggle week view/month view
  - Trend view button (line chart)
  - Requirement: Requirement 8.1, Requirement 8.2, Requirement 8.7

- [ ] 11.1.2 Create StatisticsDetail screen (day breakdown)
  - Display selected date
  - Detailed breakdown:
    - Total medications
    - Taken on time (count, %)
    - Taken late (count, %)
    - Missed (count, %)
    - Snoozed (count, %)
  - List of medications for selected day with status
  - Tap medication to view details
  - Requirement: Requirement 8.3

- [ ] 11.1.3 Create TrendChart screen (line chart)
  - Display adherence trend over past 4 weeks
  - Line chart using react-native-charts-wrapper
  - X-axis: week number, Y-axis: adherence percentage
  - Toggle chart view: adherence rate or total medications
  - Legend for chart
  - Requirement: Requirement 8.7

### 11.2 PDF Report Generation
- [ ] 11.2.1 Create PDF report service
  - Generate PDF layout using react-native-pdf-lib
  - Include patient information (name, age, etc.)
  - Include selected date range
  - Include medication list with prescribed frequency
  - Include adherence statistics (total, on-time rate, late rate, missed rate)
  - Include missed medication details (date, medicine, reason)
  - Include notes/comments
  - Add header with app logo and title
  - Add footer with generation timestamp
  - Requirement: Requirement 8.4

- [ ] 11.2.2 Create PDF export UI
  - Date range picker (start date, end date)
  - "Generate Report" button
  - Display loading indicator
  - Report preview
  - "Share" button (native share sheet)
  - "Save to Device" button
  - "Send via Email" button
  - Requirement: Requirement 8.5, Requirement 8.6

### 11.3 Statistics Logic & State
- [ ] 11.3.1 Create statistics Zustand store
  - Statistics state (adherence data, loading, error)
  - Actions: fetchStatistics, calculateAdherenceRate, generateReport
  - Persist to AsyncStorage (cache for offline viewing)
  - Requirement: Requirement 8.1 - Requirement 8.3, Requirement 8.7

- [ ] 11.3.2 Implement Firestore operations for statistics
  - Query medications by userId, date range, status
  - Query schedules by userId, date range
  - Calculate adherence rate: taken / total * 100
  - Get total scheduled medications
  - Get medications taken on time, late, missed
  - Export data to PDF
  - Requirement: Requirement 8.1 - Requirement 8.4

- [ ] 11.3.3 Implement chart data formatting
  - Format daily adherence data for bar chart
  - Format weekly trend data for line chart
  - Define chart colors, labels, legends
  - Handle edge cases (no data for selected date range)
  - Requirement: Requirement 8.2, Requirement 8.7

---

## Phase 12: Settings & User Profile

### 12.1 Settings UI
- [ ] 12.1.1 Create Settings screen
  - User profile section:
    - Display avatar, name, email, phone
    - "Edit Profile" button
  - App settings section:
    - Quiet Mode toggle
    - Notification sound selector
    - Language selector
  - Preferences section:
    - Low stock threshold slider/input
    - Push notifications toggle
    - Auto-open box toggle
  - Support section:
    - About/Disclaimer button
    - Help & Support button
    - Contact Support button
  - Account section:
    - Change Password button
    - Log Out button
    - Delete Account button (red, confirm dialog)
  - Requirement: Requirement 10.1, Requirement 10.3 - Requirement 10.9

- [ ] 12.1.2 Create EditProfile screen
  - Avatar upload button
  - Name input
  - Email input
  - Phone input
  - Save/Cancel buttons
  - Requirement: Requirement 10.5

- [ ] 12.1.3 Create Disclaimer screen
  - Display legal disclaimer text
  - Scroll to bottom to enable "Agree and Continue" button
  - "I Agree" checkbox
  - Checkbox + button both required to proceed
  - Save agreement status to user settings
  - Requirement: Requirement 10.3, Requirement 10.4

### 12.2 Settings Logic & State
- [ ] 12.2.1 Create settings Zustand store
  - Settings state (quietMode, lowStockThreshold, pushNotifications, notificationSound, language)
  - Actions: updateSettings, fetchSettings, resetSettings
  - Persist to AsyncStorage
  - Sync to Firestore user.settings
  - Requirement: Requirement 10.1 - Requirement 10.9

- [ ] 12.2.2 Implement Firestore operations for settings
  - Update user.settings document in Firestore
  - Sync settings changes across devices
  - Read settings on app startup
  - Requirement: Requirement 10.1 - Requirement 10.9

- [ ] 12.2.3 Implement account operations
  - Update user profile (name, avatar) in Firestore
  - Change password (Firebase Auth)
  - Log out (clear auth state, clear local cache)
  - Delete account (Firebase Auth + Firestore)
  - Show confirmation dialog before deletion
  - Requirement: Requirement 10.5 - Requirement 10.7

---

## Phase 13: Navigation & App Structure

### 13.1 Navigation Setup
- [ ] 13.1.1 Create NavigationContainer and stack/bottom tab navigators
  - Stack 1: Auth Stack (Login, Register, ResetPassword)
  - Stack 2: Main Stack (Home, Medicines, Schedule, FamilyStatus, Statistics, Settings)
  - Bottom Tab Navigator: Main screens as tabs
  - Implement deep linking (from notifications)
  - Handle back button behavior
  - Requirement: Navigation requirement

- [ ] 13.1.2 Create navigation types
  - Define RootStackParamList type
  - Define MainStackParamList type
  - Define MainTabParamList type
  - Add TypeScript types for navigation props
  - Use useNavigation and useRoute hooks
  - Requirement: Navigation requirement

---

## Phase 14: Error Handling & Loading States

### 14.1 Error Handling Implementation
- [ ] 14.1.1 Create global error boundary
  - Catch JavaScript errors
  - Display user-friendly error message
  - Provide "Retry" and "Go to Home" buttons
  - Log errors to console (for development)
  - Requirement: Requirement 10.9

- [ ] 14.1.2 Implement API error handling
  - Handle network errors (no internet, timeout)
  - Handle Firestore errors (permission denied, document not found)
  - Handle Auth errors (invalid credentials, session expired)
  - Handle BLE errors (permission denied, connection failed, device not found)
  - Display errors in ErrorMessage component (large, high-contrast text)
  - Requirement: Requirement 10.9

- [ ] 14.1.3 Implement user-friendly error messages
  - Database errors: "Failed to load data, please check your internet connection and try again"
  - Auth errors: "Login failed, please check your credentials"
  - BLE errors: "Cannot connect to box, make sure Bluetooth is enabled and box is nearby"
  - Generic errors: "Something went wrong, please try again"
  - Requirement: Requirement 10.9

### 14.2 Loading States Implementation
- [ ] 14.2.1 Create LoadingSpinner component
  - Display spinner with descriptive text
  - Use large text (minimum 18pt)
  - Support cancelable loading (long operations)
  - Requirement: Requirement 10.10

- [ ] 14.2.2 Add loading states to all async operations
  - Screen-level loading (on screen load)
  - Button-level loading (during save/delete operations)
  - List-level loading (during refresh)
  - Use LoadingSpinner component consistently
  - Requirement: Requirement 10.10

---

## Phase 15: Testing

### 15.1 Unit Testing
- [ ] 15.1.1 Set up Jest and React Native Testing Library
  - Install dependencies
  - Configure Jest for TypeScript and React Native
  - Set up test utilities
  - Requirement: Test strategy

- [ ] 15.1.2 Write unit tests for Zustand stores
  - Test auth store actions (login, logout, updateProfile)
  - Test family store actions (createFamily, joinFamily, addMember)
  - Test medicine store actions (addMedicine, updateMedicine)
  - Test schedule store actions (addSchedule, deleteSchedule)
  - Test medication store actions (markAsTaken, snoozeMedication)
  - Test settings store actions (updateSettings)
  - Requirement: Test strategy (80% coverage target)

- [ ] 15.1.3 Write unit tests for utility functions
  - Test date/time utilities (formatDate, calculateCountdown, etc.)
  - Test BLE command parsing (parseUnlockCommand, parseStatusResponse)
  - Test checksum calculation (calculateChecksum)
  - Test statistics calculation (calculateAdherenceRate)
  - Requirement: Test strategy (80% coverage target)

### 15.2 Integration Testing
- [ ] 15.2.1 Set up Detox for E2E testing
  - Install Detox
  - Configure Detox for iOS and Android
  - Set up test devices/simulators
  - Requirement: Test strategy

- [ ] 15.2.2 Write E2E tests
  - User registration and login flow
  - Create medicine (manual entry)
  - Add medicine via barcode scan
  - Create medication schedule
  - Connect to BLE device
  - Mark medication as taken
  - Generate PDF report
  - Export and share report
  - Requirement: Test strategy

### 15.3 Manual Testing
- [ ] 15.3.1 Test on iOS device
  - Install on iPhone
  - Test all major features
  - Test BLE connection
  - Test notifications
  - Test accessibility (VoiceOver)
  - Requirement: Test strategy

- [ ] 15.3.2 Test on Android device
  - Install on Android phone
  - Test all major features
  - Test BLE connection
  - Test notifications
  - Test accessibility (TalkBack)
  - Requirement: Test strategy

---

## Phase 16: Deployment

### 16.1 Build Configuration
- [ ] 16.1.1 Configure app.json for production
  - Set app name, version, bundle ID
  - Configure icons and splash screens
  - Set production Firebase config
  - Configure Android and iOS build settings
  - Requirement: Deployment strategy

- [ ] 16.1.2 Generate production builds
  - Generate Android APK/AAB for Play Store
  - Generate iOS IPA for App Store
  - Test production builds
  - Requirement: Deployment strategy

### 16.2 Deployment
- [ ] 16.2.1 Deploy to Google Play Store
  - Create Google Play Console account
  - Create app listing
  - Upload AAB file
  - Submit for review
  - Requirement: Deployment strategy

- [ ] 16.2.2 Deploy to Apple App Store
  - Create App Store Connect account
  - Create app listing
  - Upload IPA file
  - Submit for review
  - Requirement: Deployment strategy

### 16.3 Monitoring & Maintenance
- [ ] 16.3.1 Set up Firebase Crashlytics
  - Install @react-native-firebase/crashlytics
  - Configure crash reporting
  - Monitor crash reports in Firebase console
  - Requirement: Deployment strategy

- [ ] 16.3.2 Set up Firebase Performance Monitoring
  - Install @react-native-firebase/perf
  - Monitor app performance
  - Identify slow screens/API calls
  - Requirement: Deployment strategy

- [ ] 16.3.3 Set up remote config
  - Configure Firebase Remote Config
  - Enable/disable features without app update
  - A/B testing configuration
  - Requirement: Deployment strategy

---

## Task Priorities

### High Priority (MVP)
- Phase 1: Project Setup
- Phase 2: UI Foundation
- Phase 3: Authentication
- Phase 4: Family Management (basic)
- Phase 5: Medicine Management (manual entry only)
- Phase 6: Schedule Management (daily only)
- Phase 7: BLE Connection (basic unlock)
- Phase 8: Local Notifications (T-10 and T time only)
- Phase 9: Main Screen (basic)
- Phase 13: Navigation
- Phase 14: Error Handling & Loading

### Medium Priority (Core Features)
- Phase 4: Family Management (full with QR codes)
- Phase 5: Medicine Management (barcode/OCR)
- Phase 6: Schedule Management (weekly/course)
- Phase 7: BLE Connection (full protocol)
- Phase 8: Push Notifications
- Phase 9: Main Screen (full features)
- Phase 10: Family Collaboration
- Phase 11: Statistics (basic)

### Low Priority (Enhancements)
- Phase 11: Statistics (PDF export, trend charts)
- Phase 12: Settings (full)
- Phase 15: Testing
- Phase 16: Deployment & Maintenance

---

## Estimated Timeline

- **Phase 1-4 (Foundation):** 2 weeks
- **Phase 5-6 (Core Functionality):** 3 weeks
- **Phase 7-9 (BLE & Main Features):** 3 weeks
- **Phase 10-12 (Advanced Features):** 2 weeks
- **Phase 13-14 (Polish):** 1 week
- **Phase 15-16 (Testing & Deployment):** 2 weeks

**Total: 13 weeks** for full implementation

---

## Notes

- Each task should include proper error handling and loading states
- All UI components should use large fonts (minimum 18pt) and high contrast colors
- Firestore security rules must be configured before launch
- Test on real devices (iOS and Android) with BLE support
- Conduct user testing with elderly users for accessibility feedback
