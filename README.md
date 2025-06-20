# QR-Based Attendance System with Geofencing

## Product Requirement Document (PRD)

### Overview
A secure, cross-platform attendance management system that allows teachers to generate location-aware QR codes for class attendance, while students can scan these codes to mark their presence, with built-in anti-proxy measures and comprehensive security features.

### Key Features

#### 🔐 Authentication & Security
- **Three User Types Only**: Admin, Teacher, Student
- **Authorized Users**:
  - Admin: SSharan.s@outlook.com
  - Teacher: sharan071718@gmail.com  
  - Student: sharan@s.amity.edu
- **Secure Password**: Sharan17# (for all accounts)
- **Persistent Sessions**: 24-hour session timeout with automatic renewal
- **Proxy Detection**: Blocks VPN/proxy access with real-time detection
- **Security Logging**: All access attempts and security events are logged

#### 📸 Camera Access & QR Scanning
- **Cross-Platform Support**:
  - Desktop: Windows (Chrome, Edge), macOS (Safari, Chrome)
  - Mobile: Android (Chrome, Firefox), iOS (Safari, Chrome)
- **Enhanced Permission Handling**: Platform-specific permission prompts and error messages
- **HTTPS Enforcement**: Secure protocols required for camera access
- **Fallback Support**: Graceful degradation for unsupported browsers
- **Real-time QR Detection**: Optimized scanning performance across devices

#### 💻📱 Cross-Platform Compatibility
- **Responsive Design**: Touch-friendly UI that adapts to all screen sizes
- **Platform Detection**: Automatic optimization based on device and browser
- **Universal Input Support**: Both mouse and touch interactions
- **Progressive Web App**: Service worker support for offline capabilities

#### 🌐 Performance & Reliability
- **Asset Optimization**: Reliable serving of CSS, JS, images, and libraries
- **CORS Prevention**: Secure cross-origin resource handling
- **Caching Strategy**: Service workers for improved performance
- **Error Handling**: Comprehensive error tracking and user feedback

#### 🎯 Core Functionality
- **Teacher Dashboard**: Personal info, class schedule, real-time attendance tracking
- **QR Code Generation**: Time-sensitive codes with automatic expiration (3 minutes)
- **Geofencing**: 5-meter radius location verification
- **Attendance Categories**: Present, Absent, Proxy Attempts
- **Student Interface**: Profile management, class details, QR scanner
- **Real-time Updates**: Live attendance monitoring and status updates

### Technical Architecture

#### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI Library**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks with localStorage persistence
- **QR Scanning**: html5-qrcode with platform-specific optimizations
- **Routing**: React Router v6 with protected routes

#### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom secure authentication with session management
- **Real-time**: Supabase real-time subscriptions
- **Security**: IP tracking, proxy detection, access logging

#### Security Features
- **Session Management**: Secure token-based authentication
- **Proxy Detection**: WebRTC-based proxy/VPN detection
- **Access Control**: Role-based permissions with strict validation
- **Audit Logging**: Comprehensive security event tracking
- **Data Isolation**: Secure data separation per user role

### Platform Support Matrix

| Platform | Browser | Camera | QR Scan | Geolocation | Status |
|----------|---------|--------|---------|-------------|--------|
| Windows | Chrome | ✅ | ✅ | ✅ | Fully Supported |
| Windows | Edge | ✅ | ✅ | ✅ | Fully Supported |
| macOS | Safari | ✅ | ✅ | ✅ | Fully Supported |
| macOS | Chrome | ✅ | ✅ | ✅ | Fully Supported |
| Android | Chrome | ✅ | ✅ | ✅ | Fully Supported |
| Android | Firefox | ✅ | ✅ | ✅ | Fully Supported |
| iOS | Safari | ✅ | ✅ | ✅ | Fully Supported |
| iOS | Chrome | ⚠️ | ✅ | ✅ | Limited (Safari recommended) |

### Security Requirements

#### Access Control
- No tolerance for proxy/VPN traffic
- IP-based access tracking and geolocation verification
- Session integrity validation with automatic logout
- Failed login attempt tracking with temporary blocking

#### Data Protection
- Secure password handling (production would use hashing)
- Session token encryption and validation
- Real-time security event monitoring
- Automatic session cleanup and data isolation

### User Experience

#### Responsive Design
- Mobile-first approach with touch-optimized controls
- Adaptive layouts for all screen sizes and orientations
- Platform-specific UI optimizations
- Consistent experience across all supported devices

#### Error Handling
- Platform-specific error messages and guidance
- Graceful fallbacks for unsupported features
- Clear user instructions for permission issues
- Comprehensive troubleshooting support

### Development & Deployment

#### Development Setup
```bash
npm install
npm run dev
```

#### Build & Deploy
```bash
npm run build
npm run preview
```

#### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_TEMPO`: Tempo development flag

### Quality Assurance

#### Testing Requirements
- Cross-browser compatibility testing
- Mobile device testing (iOS/Android)
- Camera permission testing across platforms
- Security penetration testing
- Performance optimization validation

#### Monitoring
- Real-time error tracking
- Security event monitoring
- Performance metrics collection
- User experience analytics

---

**Version**: 2.0  
**Last Updated**: February 2025  
**Status**: Production Ready
