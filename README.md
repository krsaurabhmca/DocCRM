# DocCRM - Clinical Management & WhatsApp CRM 🏥🚀

A high-performance, modern Clinical Management System designed for doctors and clinic administrators. Built with a PHP backend and an Expo/React Native mobile application, featuring automated WhatsApp integration for patient engagement.

## 🌟 Key Features

### 👨‍⚕️ Clinical Operations
*   **Patient Registration**: Seamless onboarding with category and disease mapping.
*   **Live Queue Management**: Real-time "Now Calling" digital token system with Token/Serial numbers.
*   **Follow-up Scheduling**: Interactive calendar-based appointment booking.
*   **Doctor Management**: Professional profiles with qualifications, specializations, and experience.

### 📱 WhatsApp CRM Automation (AOC Portal)
*   **Automated Welcome Messages**: Triggered instantly upon patient registration.
*   **Appointment Reminders**: Automated reminders sent for scheduled follow-ups.
*   **Rich Media Templates**: Support for Text, Image, and Video headers.
*   **Branding Integration**: Auto-injects clinic name, address, and profile photo into messages.

### 📊 Financial & Administrative
*   **Revenue Dashboard**: Real-time financial analytics and transaction history.
*   **Automated Billing**: Registration fees are automatically logged to the ledger.
*   **Capacity Limits**: Manage daily patient flow with New/Old patient registration caps.
*   **Clinic Branding**: Centralized hub for clinic address, contact info, and assets.

## 🛠 Tech Stack

*   **Mobile**: Expo / React Native (TypeScript)
*   **Backend**: PHP 7.4+ / MySQL
*   **UI/UX**: Custom Design System (Glassmorphic, High-Fidelity)
*   **Integration**: AOC Portal WhatsApp Business API

## 🚀 Setup Instructions

### 1. Backend Setup
1.  Clone the repository to your `htdocs` or web root.
2.  Import `doccrm_db.sql` (generated via `db.php`) into your MySQL server.
3.  Configure `api/config.php` (Create it by copying `api/config.example.php` or manually):
    ```php
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', 'your_password');
    define('DB_NAME', 'doccrm_db');
    define('DOC_CRM_API_KEY', 'your_secret_key');
    ```

### 2. Mobile App Setup
1.  Navigate to the `docapp` directory.
2.  Install dependencies: `npm install`
3.  Configure `docapp/Config.ts` (Create it manually):
    ```typescript
    export const Config = {
      API_BASE: "http://YOUR_LOCAL_IP/doccrm/api/index.php",
      API_KEY: "your_secret_key",
    };
    ```
4.  Start the app: `npx expo start`

## 🔒 Security Note
This project uses a centralized configuration system (`api/config.php` and `docapp/Config.ts`) which are **ignored by Git** to protect sensitive information like database credentials and API keys.

---
Built with ❤️ for Healthcare Professionals.
