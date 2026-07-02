# MediCore Pro - Clinic Management System

A production-ready, mobile-only Hospital & Clinic Management System powered by an **Expo React Native App** (fully Expo Go compatible) and a **Node.js Express Backend** connected to **Supabase PostgreSQL**.

---

## 🏗️ Architecture

```text
Clinic-management-system/
├── backend/                  # Node.js Express MVC API Server
│   ├── config/               # Database and Supabase Client Configurations
│   ├── controllers/          # Request controller logic (auth, patient, appointments, billing)
│   ├── middleware/           # Express security, auth, validation, and role middlewares
│   ├── routes/               # API route definitions
│   ├── services/             # Operations services layers (placeholders)
│   ├── utils/                # JWT helpers and JSON API response structures
│   ├── server.js             # Main server boot configuration
│   └── package.json
│
└── frontend/                 # Expo React Native TypeScript Mobile App
    ├── src/
    │   ├── navigation/       # React Navigation setup and Custom Floating Bottom Tab Bar
    │   ├── screens/          # Screen components (auth, admin, doctor, patient, pharmacist, lab)
    │   ├── services/         # Axios API client and local session storage
    │   └── assets/           # Images, logos, and fonts
    ├── App.tsx               # Main entry point mounting AppNavigator
    └── package.json
```

---

## ⚡ Setup & Launch Instructions

> 📖 **For full, step-by-step hosting instructions** (Supabase setup, backend deploy, running the app on
> a phone, and troubleshooting) see **[HOSTING.md](HOSTING.md)**. The quick version follows.

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed on your machine.

### 1. Backend Server Setup

Navigate to the `backend` folder, install packages, and boot the server:

```bash
cd backend
npm install
npm run dev
```

* **Environment Configuration**: A `.env` file has been prepared in the `backend` folder. Adjust keys as needed:
  ```env
  PORT=5000
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key
  JWT_SECRET=super_secret_jwt_key_clinic_management_123456
  ```
* **Database Migrations**: The PostgreSQL DDL schema script is ready at `backend/config/schema.sql`. You can execute it directly inside the Supabase SQL Editor.

---

### 2. Frontend Mobile App Setup

Open a new terminal window, navigate to the `frontend` folder, install packages, and boot the Expo development server:

```bash
cd frontend
npm install
npx expo start
```

* **Environment Configuration**: A `.env` file has been prepared in the `frontend` folder:
  ```env
  EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
  EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  ```
  > [!IMPORTANT]
  > Update `YOUR_LOCAL_IP` with your developer workstation's local IP address (e.g., `192.168.1.15`) to allow mobile devices running Expo Go to connect to the backend server.
* **Launch in Expo Go**: Scan the QR code printed in the terminal using the Expo Go application on iOS or Android.

---

## 🔑 Demo Account Credentials

These accounts are created by `backend/config/seed.sql`. They only work after the database has been
configured and both `schema.sql` and `seed.sql` have been run (see [HOSTING.md](HOSTING.md)). Type the
email and password manually on the login screen.

> **All seeded accounts share the password `password123`.**

| Role | Email | Logged-in Name | Dashboard Flow |
|---|---|---|---|
| **Admin** | `admin@medicore.com` | System Admin | Admin Control Panel |
| **Doctor** | `sarah.chen@medicore.com` | Dr. Sarah Chen | Doctor Dashboard |
| **Doctor** | `james.wilson@medicore.com` | Dr. James Wilson | Doctor Dashboard |
| **Receptionist** | `reception@medicore.com` | Maria Garcia | Reception Panel |
| **Pharmacist** | `pharmacist@medicore.com` | David Kim | Pharmacy Panel |
| **Laboratory Staff** | `lab@medicore.com` | Lisa Patel | Laboratory Panel |
| **Patient** | `john.doe@email.com` | John Doe | Patient Portal |
| **Patient** | `jane.smith@email.com` | Jane Smith | Patient Portal |

---

## 🗄️ Database Tables Schema (`schema.sql`)

The system comprises the following tables:
1. `users`: Credentials, password bcrypt hashes, and system roles.
2. `patients`: Records relating to patient details, gender, DOB, blood type, and address.
3. `doctors`: Specializations and clinician records.
4. `appointments`: Consultations, statuses, notes, and booking dates.
5. `invoices`: Patient billings and invoicing states.
6. `payments`: Payment transaction amounts, timestamps, and settlement types (Cash, Card, Insurance, Bank Transfer).
