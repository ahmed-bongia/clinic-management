const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

// Mock/Demo Accounts data for instant local execution
const DEMO_ACCOUNTS = {
  'admin@medicore.com': {
    id: 'demo-admin-id-1111',
    name: 'Chief Administrator',
    role: 'Admin',
    email: 'admin@medicore.com'
  },
  'doctor@medicore.com': {
    id: 'demo-doctor-id-2222',
    name: 'Dr. Sarah Jenkins',
    role: 'Doctor',
    email: 'doctor@medicore.com'
  },
  'patient@medicore.com': {
    id: 'demo-patient-id-3333',
    name: 'Jane Mary Doe',
    role: 'Patient',
    email: 'patient@medicore.com'
  },
  'receptionist@medicore.com': {
    id: 'demo-receptionist-id-4444',
    name: 'Alice Smith',
    role: 'Receptionist',
    email: 'receptionist@medicore.com'
  },
  'pharmacist@medicore.com': {
    id: 'demo-pharmacist-id-5555',
    name: 'John Doe',
    role: 'Pharmacist',
    email: 'pharmacist@medicore.com'
  },
  'labstaff@medicore.com': {
    id: 'demo-labstaff-id-6666',
    name: 'Robert Johnson',
    role: 'Laboratory Staff',
    email: 'labstaff@medicore.com'
  }
};

/**
 * Handle user login POST /api/auth/login
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const formattedEmail = email.toLowerCase().trim();

    // 1. If Supabase is initialized, try searching the database
    if (supabase) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', formattedEmail)
        .single();

      if (!error && user) {
        // Verify password hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (isMatch) {
          const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          });

          return successResponse(res, 'Login successful', {
            token,
            user: {
              id: user.id,
              name: user.name,
              role: user.role,
              email: user.email
            }
          });
        }
      }
    }

    // 2. Fallback to Demo accounts to ensure instant out-of-the-box system availability
    if (DEMO_ACCOUNTS[formattedEmail]) {
      const demoUser = DEMO_ACCOUNTS[formattedEmail];
      const token = generateToken({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
        name: demoUser.name
      });

      console.log(`[AUTH] Authenticated demo user: ${demoUser.name} (${demoUser.role})`);

      return successResponse(res, 'Logged in with Demo Account', {
        token,
        user: demoUser
      });
    }

    return errorResponse(res, 'Invalid email or password credentials.', 401);
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user information GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // req.user populated from authMiddleware
    return successResponse(res, 'Profile retrieved successfully', {
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser
};
