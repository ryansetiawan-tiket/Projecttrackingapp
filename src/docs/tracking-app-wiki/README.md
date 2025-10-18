# Personal Timeline & Task Tracker - Documentation Wiki

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Quick Links](#quick-links)
3. [Getting Started](#getting-started)
4. [Dokumentasi Utama](#dokumentasi-utama)

## Overview

**Personal Timeline & Task Tracker** adalah aplikasi web modern untuk tracking project pekerjaan dengan fitur-fitur enterprise-level termasuk autentikasi, manajemen pengguna/tim, real-time collaboration, dan backup data terintegrasi dengan Supabase.

### Terminologi Khusus
- **Asset(s)**: Istilah yang digunakan untuk project/task dalam aplikasi ini
- **Admin**: Role tertinggi (sebelumnya disebut "Editor")
- **Actionable Items**: Task/action items yang bisa di-assign ke asset

### Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (Auth, Database, Real-time)
- **State Management**: React Context API
- **Charts**: Recharts
- **Icons**: Lucide React

## Quick Links

- [**Quick Start Guide**](./QUICK_START.md) - Panduan cepat 10 menit untuk pemula
- [**Architecture Guide**](./ARCHITECTURE.md) - Arsitektur dan struktur aplikasi
- [**Features Documentation**](./FEATURES.md) - Daftar lengkap semua fitur
- [**Troubleshooting Guide**](./TROUBLESHOOTING.md) - Masalah umum dan solusinya
- [**Migration Guide**](./MIGRATION_GUIDE.md) - History migrasi database
- [**Development Guide**](./DEVELOPMENT_GUIDE.md) - Guide untuk developer
- [**API Reference**](./API_REFERENCE.md) - Reference hooks, utils, dan components
- [**Changelog**](./CHANGELOG.md) - History perubahan major

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm/yarn/pnpm
- Supabase account (untuk production)

### Installation

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Setup environment variables
# Buat file .env dan isi dengan credentials Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Run development server
npm run dev
```

### First Time Setup

1. **Login/Register**: Buat akun baru atau login dengan existing account
2. **Admin Profile**: Setup nama lengkap di halaman Settings → Admin Profile
3. **Team Setup**: Tambahkan team members di Settings → Team Management
4. **Status & Workflow**: Configure status workflow di Settings → Status Management
5. **Create First Project**: Buat project pertama dari Dashboard

## Dokumentasi Utama

### 1. Architecture & Structure
Pelajari bagaimana aplikasi distruktur, component hierarchy, data flow, dan best practices:
👉 [ARCHITECTURE.md](./ARCHITECTURE.md)

### 2. Features Documentation
Dokumentasi lengkap untuk semua fitur, dari basic hingga advanced:
👉 [FEATURES.md](./FEATURES.md)

### 3. Troubleshooting
Panduan untuk mengatasi masalah-masalah umum yang mungkin terjadi:
👉 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### 4. Migration Guide
History lengkap semua migration yang pernah dilakukan:
👉 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### 5. Development Guide
Panduan untuk developer yang ingin contribute atau extend aplikasi:
👉 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)

### 6. API Reference
Reference lengkap untuk hooks, utilities, dan components:
👉 [API_REFERENCE.md](./API_REFERENCE.md)

### 7. Changelog
History perubahan major dan minor dari aplikasi:
👉 [CHANGELOG.md](./CHANGELOG.md)

## Key Features Highlights

### 🎯 Core Features
- ✅ 4 View Modes: Table, Timeline, Deliverables, Archive
- ✅ Dynamic Status System dengan workflow management
- ✅ Team Management & Role-based Access Control
- ✅ Real-time Collaboration
- ✅ Comprehensive Stats Dashboard

### 📊 Asset Management
- ✅ Google Drive Assets dengan nested folders
- ✅ Lightroom Assets
- ✅ Drag & drop multiple file upload
- ✅ Asset preview gallery
- ✅ Progress tracking dengan actionable items

### 🔗 Integration & Links
- ✅ Project Links dengan preset icons
- ✅ Custom link labels
- ✅ Quick access buttons
- ✅ External integrations (Figma, Google Sheets, dll)

### 📱 Mobile Responsive
- ✅ Fully responsive design
- ✅ Mobile-optimized timeline
- ✅ Touch-friendly interactions
- ✅ Mobile filters & views

### 🎨 Customization
- ✅ Custom color schemes per Type & Vertical
- ✅ Editable role names
- ✅ Custom status workflows
- ✅ Personalized admin profile

## Support & Contact

Untuk pertanyaan, bug reports, atau feature requests, silakan gunakan:
- **Contact Admin Dialog**: Tersedia di menu profile untuk non-admin users
- **GitHub Issues**: (jika menggunakan GitHub)
- **Internal Communication**: Sesuai dengan channel komunikasi tim

## License

[Tentukan license sesuai kebutuhan]

---

**Last Updated**: January 2025
**Version**: 2.0.0
**Maintained by**: [Team/Organization Name]