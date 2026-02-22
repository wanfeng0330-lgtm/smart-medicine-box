# Technical Solution Design - 智能药盒APP

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │    Auth      │  │   Main App   │  │  Settings    │     │
│  │   Screens    │  │   Screens    │  │  Screens     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────────────────────────────────────────┐     │
│  │            React Navigation (Stack + Tabs)      │     │
│  └──────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────┐     │
│  │          React Native Paper (UI Components)      │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth Store  │  │Medication    │  │   Family     │     │
│  │  (Zustand)   │  │   Manager    │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ BLE Manager  │  │Schedule      │  │  Notification│     │
│  │              │  │   Manager    │  │  Manager     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Firebase   │  │   Firebase   │  │   Firebase   │     │
│  │      Auth    │  │   Firestore  │  │  Cloud Msg   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Firebase    │  │  expo-ble-   │  │   expo-      │     │
│  │  Storage     │  │      plx     │  │ notifications│     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Core Technologies
- **Framework:** Expo SDK 50+ (Managed Workflow)
- **Language:** TypeScript 5.0+
- **Runtime:** React Native 0.73+

### Backend as a Service
- **Authentication:** Firebase Authentication (Email/Password, Phone)
- **Database:** Firebase Firestore (NoSQL, Real-time)
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **File Storage:** Firebase Storage

### State Management
- **Global State:** Zustand
- **Local State:** React Hooks (useState, useEffect, useContext)

### Navigation
- **Navigator:** React Navigation v7
- **Stack Navigator:** @react-navigation/stack
- **Bottom Tab Navigator:** @react-navigation/bottom-tabs
- **Linking:** @react-navigation/native

### UI Components
- **Material Design:** React Native Paper 5.1+
- **Theme:** Material Design 3 (MD3)
- **Icons:** Material Design Icons (MDI)

### Device APIs
- **Bluetooth:** expo-ble-plx
- **Barcode Scanner:** expo-barcode-scanner
- **Image Picker:** expo-image-picker
- **OCR:** Google ML Kit (via expo-camera)
- **Local Notifications:** expo-notifications
- **Camera:** expo-camera

### Utilities
- **Charts:** react-native-charts-wrapper (victory-native alternative)
- **PDF Export:** react-native-pdf-lib
- **DateTime:** date-fns (timezone-safe date manipulation)
- **AsyncStorage:** @react-native-async-storage/async-storage

---

## Database Design (Firestore Schema)

### Collection: `users`
```typescript
{
  id: string;                    // User ID (Firebase Auth UID)
  name: string;                  // Display name
  email: string;                 // Email address (optional)
  phone: string;                 // Phone number (optional)
  avatar?: string;               // Photo URL (Firebase Storage)
  familyId?: string;             // Family group ID (foreign key)
  role: 'admin' | 'member';      // Role in family
  deviceId?: string;             // Connected box device ID
  settings: {
    quietMode: boolean;          // Quiet mode enabled
    lowStockThreshold: number;   // Minimum stock before alert
    pushNotifications: boolean;  // Enable push notifications
    language: string;            // App language
  };
  createdAt:.firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}
```

### Collection: `families`
```typescript
{
  id: string;                    // Family ID (auto-generated)
  name: string;                  // Family display name
  adminId: string;               // Admin user ID
  inviteCode: string;            // QR code invite code
  members: string[];             // Array of member user IDs
  boxDeviceId?: string;          // Assigned box device ID
  createdAt: firestore.Timestamp;
}
```

### Collection: `medicines`
```typescript
{
  id: string;                    // Medicine ID (auto-generated)
  familyId: string;              // Family ID (foreign key)
  name: string;                  // Medicine name
  description?: string;          // Additional description
  barcode?: string;              // Barcode/QR code
  dosage: string;                // Dosage (e.g., "1 tablet", "5ml")
  stock: number;                 // Current stock quantity
  boxSlot?: number;              // Assigned box slot (1-8)
  prescriptionUrl?: string;      // Prescription photo URL (Firebase Storage)
  contraindications: string[];   // Tags (e.g., ["Take with water", "Avoid alcohol"])
  notes?: string;                // User notes
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
}
```

### Collection: `schedules`
```typescript
{
  id: string;                    // Schedule ID (auto-generated)
  familyId: string;              // Family ID (foreign key)
  userId: string;                // User ID this schedule belongs to
  medicineId: string;            // Medicine ID (foreign key)
  medicineName: string;          // Denormalized for quick access
  dosage: string;                // Dosage
  time: string;                  // Time in HH:mm format (24h)
  date: string;                  // Date in YYYY-MM-DD format (for one-time) or "daily"/"weekly"
  repeat: 'daily' | 'weekly' | 'course' | 'once';
  repeatDays?: number[];         // Days of week (0=Sunday, 6=Saturday)
  courseStartDate?: string;      // YYYY-MM-DD
  courseEndDate?: string;        // YYYY-MM-DD
  mealLabel: 'before' | 'after' | 'none';
  boxSlot: number;               // Assigned box slot (1-8)
  isActive: boolean;             // Schedule active status
  createdBy: string;             // User ID who created this
  createdAt: firestore.Timestamp;
}
```

### Collection: `medications`
```typescript
{
  id: string;                    // Medication record ID (auto-generated)
  userId: string;                // User ID
  familyId: string;              // Family ID
  scheduleId: string;            // Schedule ID (foreign key)
  medicineId: string;            // Medicine ID (foreign key)
  medicineName: string;          // Denormalized name
  dosage: string;                // Dosage
  scheduledTime: firestore.Timestamp;  // Scheduled time
  takenAt?: firestore.Timestamp;        // Actual time taken (null if missed)
  status: 'scheduled' | 'taken' | 'missed' | 'snoozed';
  boxSlot: number;               // Assigned box slot (1-8)
  boxOpenedAt?: firestore.Timestamp;    // Time box was unlocked
  snoozedAt?: firestore.Timestamp;      // Time user snoozed
  snoozedUntil?: firestore.Timestamp;   // Rescheduled time
  notes?: string;                // User notes
  createdAt: firestore.Timestamp;
}
```

### Collection: `devices`
```typescript
{
  id: string;                    // Device ID (unique BLE identifier)
  familyId: string;              // Family ID
  name: string;                  // Device display name
  macAddress: string;            // BLE MAC address
  batteryLevel: number;          // Current battery level (0-100)
  lastConnectedAt: firestore.Timestamp;
  lastDisconnectedAt?: firestore.Timestamp;
  slots: {
    1: { medicineId?: string; unlockedAt?: firestore.Timestamp; };
    2: { medicineId?: string; unlockedAt?: firestore.Timestamp; };
    // ... up to 8
  };
  createdAt: firestore.Timestamp;
}
```

### Collection: `notifications`
```typescript
{
  id: string;                    // Notification ID (auto-generated)
  userId: string;                // Recipient user ID
  familyId: string;              // Family ID
  type: 'reminder' | 'missed' | 'low_battery' | 'low_stock' | 'alert';
  title: string;                 // Notification title
  body: string;                  // Notification body
  data?: {                       // Additional data
    medicationId?: string;
    scheduleId?: string;
    deviceId?: string;
    medicineName?: string;
  };
  read: boolean;                 // Read status
  createdAt: firestore.Timestamp;
  readAt?: firestore.Timestamp;
}
```

---

## API Design (Firebase Functions)

Although we're using Firebase as BaaS, we may need Cloud Functions for complex operations:

### Function: `sendFamilyNotification`
**Trigger:** Firestore write on `medications` collection (when status changes to 'missed')

**Purpose:** Send push notification to all family members when a medication is missed

**Logic:**
1. Query family members by familyId
2. For each family member, create FCM notification
3. Send via admin.messaging()

### Function: `checkLowStock`
**Trigger:** Scheduled (daily at 10:00 AM)

**Purpose:** Check all medicines in family for low stock and send alerts

**Logic:**
1. Query all medicines in family
2. Check if stock < lowStockThreshold
3. Create notification for each medicine below threshold

### Function: `updateDeviceStatus`
**Trigger:** Real-time via HTTP API called from mobile app

**Purpose:** Update device status (battery level, connection status)

**Logic:**
1. Update Firestore device document
2. If battery < 20%, send low battery notification
3. If battery < 10%, send critical alert to all family members

---

## BLE Communication Protocol

### Device Specifications
- **Protocol:** Bluetooth Low Energy (BLE) GATT
- **Service UUID:** `0xFF00` (Example - replace with actual)
- **Characteristic (Write):** `0xFF01` - Send unlock command
- **Characteristic (Notify):** `0xFF02` - Receive status updates

### Commands (from App to Box)

#### Unlock Slot Command
```
Format: [CMD][SLOT][CHECKSUM]
- CMD: 0x01 (Unlock)
- SLOT: 0x01-0x08 (Slot number)
- CHECKSUM: XOR of previous bytes

Example: 0x01 0x01 0x00 (Unlock slot 1)
```

#### Request Status Command
```
Format: [CMD][CHECKSUM]
- CMD: 0x02 (Status Request)
- CHECKSUM: XOR of CMD

Example: 0x02 0x02
```

### Status Updates (from Box to App)

#### Response to Unlock
```
Format: [STATUS][SLOT][BATTERY][CHECKSUM]
- STATUS: 0x01 (Success), 0xFF (Error)
- SLOT: 0x01-0x08 (Slot number)
- BATTERY: 0x00-0x64 (Battery level 0-100%)
- CHECKSUM: XOR of previous bytes
```

#### Slot Opened Event
```
Format: [EVENT][SLOT][TIMESTAMP][CHECKSUM]
- EVENT: 0x03 (Slot Opened)
- SLOT: 0x01-0x08 (Slot number)
- TIMESTAMP: 4 bytes (Unix timestamp)
- CHECKSUM: XOR of previous bytes
```

---

## Security Considerations

### Authentication & Authorization
- **Authentication:** Firebase Auth with phone/email verification
- **Authorization:** Firestore Security Rules based on family membership
- **Session Management:** Firebase Auth handles token refresh automatically

### Firestore Security Rules

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

### Data Protection
- **TLS 1.3:** All data transmitted over HTTPS
- **Encryption at Rest:** Firebase automatically encrypts data
- **Min Data Collection:** Only collect necessary user data
- **GDPR Compliance:** Provide data export and deletion functionality

---

## Testing Strategy

### Unit Testing
- **Framework:** Jest + React Native Testing Library
- **Coverage Target:** 80% for business logic
- **Focus Areas:**
  - Zustand store logic
  - Medication scheduling algorithms
  - BLE command parsing
  - Date/time utilities

### Integration Testing
- **Framework:** Detox (E2E testing)
- **Test Scenarios:**
  - Complete user registration and login
  - Add medicine via manual entry
  - Add medicine via barcode scan
  - Create medication schedule
  - Connect to BLE device
  - Receive and mark medication as taken
  - Generate and share PDF report

### Manual Testing
- **Device Testing:** iOS (iPhone 12+) and Android (Samsung S10+)
- **Bluetooth Testing:** Multiple BLE device models
- **Performance Testing:** Large family groups (10+ members)
- **Accessibility Testing:** VoiceOver, TalkBack, screen reader

---

## Deployment Strategy

### Development Phase
- **Environment:** Firebase Development Project
- **Branch Strategy:** Git Flow (feature branches → develop → main)
- **CI/CD:** GitHub Actions for automated testing

### Staging Phase
- **Environment:** Firebase Staging Project
- **Testing:** Beta testing with real users
- **Feedback:** Collect user feedback and iterate

### Production Phase
- **Environment:** Firebase Production Project
- **Release Strategy:** Over-the-air (OTA) updates via Expo
- **Monitoring:** Firebase Crashlytics + Performance Monitoring

---

## Performance Optimization

### Firestore Optimization
- **Indexing:** Create composite indexes for common queries
- **Pagination:** Limit result size with startAfter() cursor
- **Real-time Listeners:** Use onSnapshot for live updates (with proper cleanup)
- **Offline Support:** Enable Firestore offline persistence

### App Performance
- **Code Splitting:** Lazy load screens using React Navigation
- **Image Optimization:** Compress images before upload
- **Bundle Size:** Regular bundle analyzer checks
- **Memoization:** React.memo for expensive components

### Battery Optimization
- **BLE Scanning:** Stop scanning when device is connected
- **Background Tasks:** Minimize background FCM processing
- **Wake Lock:** Only use when necessary (e.g., active unlocking)

---

## Scalability Considerations

### Firebase Limits
- **Documents per collection:** Firestore is auto-scaling
- **Document size limit:** 1 MB per document
- **Read operations:** 50,000 reads/day (free tier), unlimited pricing tiers
- **Write operations:** 20,000 writes/day (free tier)

### Scaling Strategy
- **Data Partitioning:** Shard large collections by familyId
- **Caching:** Use AsyncStorage for frequently accessed data
- **Rate Limiting:** Implement client-side rate limiting for BLE commands
- **Load Testing:** Simulate 100+ concurrent family members

---

## Risk Mitigation

### BLE Connection Issues
- **Mitigation:** Auto-reconnect logic, fallback to manual unlock code
- **User Communication:** Clear error messages with troubleshooting steps

### Firebase Service Outage
- **Mitigation:** Offline-first architecture with local caching
- **Graceful Degradation:** Display cached data when offline

### Notification Delivery Failures
- **Mitigation:** Fallback to in-app banners
- **Logging:** Log notification failures for debugging

### Data Loss
- **Mitigation:** Regular Firestore backups, manual export feature
- **Recovery:** Ability to restore data from backup

---

## Future Enhancements

### Phase 2 Features
- AI medication interaction checker (contraindication detection)
- Wearable integration (Apple Watch, Android Wear)
- Doctor portal for remote monitoring
- Medication adherence gamification
- Multi-language support (English, Chinese, Spanish)

### Phase 3 Features
- Integration with electronic health records (EHR)
- Telemedicine integration
- Pharmacy management (auto-refill)
- Insurance claim submission

---

## Summary

This technical design provides a robust, scalable architecture for the smart medicine box app using Expo + Firebase. The modular architecture separates concerns between presentation, business logic, and service layers. Firestore's real-time capabilities enable live collaboration across family members, while BLE integration provides seamless hardware control. Security is prioritized with proper authentication, authorization, and data protection measures. The testing strategy ensures quality through automated and manual testing at all levels.
