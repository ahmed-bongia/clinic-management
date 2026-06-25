# Medicore Pro - Clinic Management System

A development-stage, mobile-only Clinic & Hospital Management System powered by an **Expo React Native App** and a **Node.js Express Backend** connected to **Supabase PostgreSQL**.

---

## 🏗️ Architecture

```text
Clinic-management-system/
├── backend/                  # Node.js Express MVC API Server
│   ├── config/               # Database and Supabase Client Configurations
│   ├── controllers/          # Request controller logic (auth, patient, appointments, billing)
│   ├── middleware/           # Express security, auth, validation, and role middlewares
│   ├── routes/               # API route definitions
│   ├── services/             # Reserved for gradual service-layer extraction
│   ├── repositories/         # Reserved for gradual Supabase repository extraction
│   ├── validators/           # Reserved for module-level request validators
│   ├── utils/                # JWT helpers and JSON API response structures
│   ├── server.js             # Main server boot configuration
│   └── package.json
│
└── frontend/                 # Expo React Native TypeScript Mobile App
    ├── src/
    │   ├── navigation/       # React Navigation setup and Custom Floating Bottom Tab Bar
    │   ├── screens/          # Screen components (auth, admin, doctor, patient, pharmacist, lab)
    │   ├── services/         # Axios API client and local session storage
    │   ├── components/       # Reserved for shared component extraction
    │   ├── core/             # Reserved for app-wide infrastructure
    │   ├── features/         # Reserved for gradual feature extraction
    │   └── types/            # Reserved for shared frontend types
    ├── assets/               # Images, icons, and splash assets
    ├── App.tsx               # Main entry point mounting AppNavigator
    └── package.json
```

---

## ⚡ Setup & Launch Instructions

Ensure you have [Node.js (v18+)](https://nodejs.org/) installed on your machine.

### 1. Backend Server Setup

Navigate to the `backend` folder, install the lockfile-pinned dependencies, and boot the server:

```bash
cd backend
npm ci
npm run dev
```

* **Environment Configuration**: Copy `backend/.env.example` to `backend/.env`, then provide the required Supabase and JWT values. The repository does not include a ready-made `.env` file.
* **Database Reference**: `backend/config/schema.sql` is the current legacy schema reference. Do not re-run it against an existing database; versioned migrations will become the source of truth in a later Sprint 0 step.

---

### 2. Frontend Mobile App Setup

Open a new terminal window, navigate to the `frontend` folder, install packages, and boot the Expo development server:

```bash
cd frontend
npm ci
npx expo start
```

* **Environment Configuration**: Copy `frontend/.env.example` to `frontend/.env`, then set the backend API URL:
  ```env
  EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000/api
  ```
  > [!IMPORTANT]
  > Update `YOUR_LOCAL_IP` with your developer workstation's local IP address (e.g., `192.168.1.15`) to allow mobile devices running Expo Go to connect to the backend server.
* **Launch in Expo Go**: Scan the QR code printed in the terminal using the Expo Go application on iOS or Android.

---

## 🔑 Development Accounts

The repository does not provide bundled demo credentials or an in-memory authentication fallback. Login requires a configured backend, Supabase project, and seeded user records.

---

## 🗄️ Database Tables Schema (`schema.sql`)

The system comprises the following tables:
1. `users`: Credentials, password bcrypt hashes, and system roles.
2. `patients`: Records relating to patient details, gender, DOB, blood type, and address.
3. `doctors`: Specializations and clinician records.
4. `appointments`: Consultations, statuses, notes, and booking dates.
5. `invoices`: Patient billings and invoicing states.
6. `payments`: Payment transaction amounts, timestamps, and settlement types (Cash, Card, Insurance, Bank Transfer).
