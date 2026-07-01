# 🛒 COOUCart — Chukwuemeka Odumegwu Ojukwu University Campus E-Commerce & Digital Wallet Ecosystem

[![Expo Router](https://img.shields.io/badge/Expo_Router-v6-000020?logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Paystack](https://img.shields.io/badge/Paystack-Payments_v3.4-00C3F7?logo=paystack&logoColor=white)](https://paystack.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_%26_DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

**COOUCart** is an all-in-one mobile commerce and digital wallet platform tailored for students, faculty, and campus vendors at Chukwuemeka Odumegwu Ojukwu University (COOU). It merges peer-to-peer campus marketplace listings with an integrated wallet transaction ledger (`WALLET_SYSTEM.md`) and direct **Paystack** checkout.

---

## ✨ Key Features

### 🎒 Campus Marketplace & Vendor Showcase
- **Vendor & Student Stores**: Browse textbooks, electronics, food items, and academic services directly listed by verified campus vendors.
- **Product Capture**: Integrated with `expo-camera` and `expo-image-manipulator` for instant in-app listing photography and cropping.

### 💳 Integrated Campus Wallet & Paystack Checkout
- **Closed-Loop Wallet System**: Peer-to-peer wallet transfers, ledger tracking, and instant escrow settlement for campus purchases (`wallet_system_setup.sql`).
- **Seamless Paystack Integration**: Powered by `react-native-paystack` for instantaneous ATM card, bank transfer, and USSD top-ups.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Mobile Core & Routing** | React Native 0.81, Expo SDK 54, Expo Router v6, TypeScript |
| **Payments & Finance** | React Native Paystack v3.4, Custom Supabase Wallet Ledger |
| **Backend Infrastructure** | Supabase Auth, PostgreSQL Database, Supabase Storage |
| **UI & Icons** | Lucide React Native, Expo Blur, Reanimated v4 |

---

## 🚀 Getting Started Locally

### Prerequisites
- **Node.js**: v18+
- **Expo Go App** installed on iOS/Android

### 1. Install Dependencies
```bash
cd COOUCart
npm install
```

### 2. Configure Environment Variables (`.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_PAYSTACK_KEY=your_paystack_public_key
```

### 3. Initialize Database Schema
Execute `wallet_system_setup.sql` in your Supabase SQL editor to create required wallet tables and RPC functions.

### 4. Start Development Server
```bash
npm run dev
```
Scan the displayed QR code using **Expo Go**.

---

## 📄 License

Proprietary campus commerce software built for COOU community. All rights reserved.
