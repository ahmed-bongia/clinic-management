const bcrypt = require('bcryptjs');
const { generateToken, isJwtSecretConfigured } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    console.log('[AUTH] Login attempt for:', email);
    const formattedEmail = email.toLowerCase().trim();

    if (!isJwtSecretConfigured()) {
      console.error('[AUTH] JWT_SECRET is not configured.');
      return errorResponse(res, 'Authentication is unavailable.', 500);
    }

    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', formattedEmail)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      console.log('[AUTH] Login failed - user not found or inactive:', formattedEmail);
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('[AUTH] Password hash verification failed:', error.message);
    }

    if (!isMatch) {
      console.log('[AUTH] Login failed - wrong password for:', formattedEmail);
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    // Log the action (non-blocking, don't let audit failure break login)
    supabase.from('audit_logs').insert({
      user_id: user.id,
      action: 'LOGIN',
      table_name: 'users'
    }).then(() => {}).catch(err => console.error('[AUDIT] Login log failed:', err.message));

    console.log(`[AUTH] Login successful: ${user.name} (${user.role})`);

    return successResponse(res, 'Login successful', {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[AUTH] Login exception:', error.message, error.stack);
    return errorResponse(res, 'Login failed. Please try again later.', 500);
  }
};

/**
 * POST /api/auth/register
 * Register a new user account
 */
const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  try {
    console.log('[AUTH] Registration endpoint hit');
    console.log('[AUTH] Request body:', { fullName, email, passwordLength: password?.length });

    if (!isJwtSecretConfigured()) {
      console.error('[AUTH] JWT_SECRET is not configured.');
      return errorResponse(res, 'Authentication is unavailable.', 500);
    }

    if (!supabase) {
      console.error('[AUTH] Supabase not configured');
      return errorResponse(res, 'Database is not configured.', 503);
    }

    const formattedEmail = email.toLowerCase().trim();
    console.log('[AUTH] Checking if user exists:', formattedEmail);

    // Check if user already exists
    // Use .maybeSingle() instead of .single() to avoid error when no rows found
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', formattedEmail)
      .maybeSingle();

    if (lookupError) {
      console.error('[AUTH] User lookup error:', lookupError.message, lookupError.code);
      return errorResponse(res, `Registration failed during user lookup: ${lookupError.message}`, 500);
    }

    if (existingUser) {
      console.log('[AUTH] User already exists:', formattedEmail);
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    console.log('[AUTH] User does not exist, proceeding with registration');

    // Public registration is limited to patient accounts. Staff and Admin accounts
    // must be created through protected administrative user-management routes.
    const userRole = 'Patient';

    // Hash password
    console.log('[AUTH] Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('[AUTH] Password hashed successfully');

    // Insert user
    console.log('[AUTH] Creating user in database...');
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email: formattedEmail,
        password_hash: passwordHash,
        name: fullName.trim(),
        role: userRole
      })
      .select('id, email, name, role')
      .single();

    if (insertError) {
      console.error('[AUTH] User insert error:', insertError.message, insertError.code, insertError.details);
      return errorResponse(res, `Failed to create account: ${insertError.message}`, 500);
    }

    console.log('[AUTH] User created successfully:', newUser.id, newUser.email);

    // Auto-create linked profile based on role (non-blocking)
    if (userRole === 'Patient') {
      console.log('[AUTH] Auto-creating patient profile...');
      const { error: patientError } = await supabase.from('patients').insert({
        user_id: newUser.id,
        name: newUser.name,
        email: newUser.email
      });
      if (patientError) {
        console.error('[AUTH] Patient profile creation failed:', patientError.message);
        // Don't fail registration over this — user was already created
      } else {
        console.log('[AUTH] Patient profile created successfully');
      }
    }

    // Generate JWT
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name
    });

    // Audit log (non-blocking)
    supabase.from('audit_logs').insert({
      user_id: newUser.id,
      action: 'REGISTER',
      table_name: 'users'
    }).then(() => {}).catch(err => console.error('[AUDIT] Register log failed:', err.message));

    console.log(`[AUTH] Registration complete: ${newUser.name} (${newUser.role})`);

    return successResponse(res, 'Account created successfully', {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email
      }
    }, 201);
  } catch (error) {
    console.error('[AUTH] Registration exception:', error.message, error.stack);
    return errorResponse(res, `Registration failed: ${error.message}`, 500);
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
const getCurrentUser = async (req, res, next) => {
  try {
    if (!supabase) {
      return successResponse(res, 'Profile retrieved', { user: req.user });
    }

    // Fetch fresh user data from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, 'Profile retrieved successfully', { user });
  } catch (error) {
    console.error('[AUTH] Get current user exception:', error.message);
    return errorResponse(res, `Failed to retrieve profile: ${error.message}`, 500);
  }
};

const changePassword = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return errorResponse(res, 'Current password, new password, and confirmation are required.', 400);
    }
    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters.', 400);
    }
    if (newPassword !== confirmPassword) {
      return errorResponse(res, 'New password and confirmation do not match.', 400);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.id)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return errorResponse(res, 'User not found or inactive.', 404);
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    } catch (error) {
      console.error('[AUTH] Password hash verification failed:', error.message);
    }

    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, await bcrypt.genSalt(12));
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (updateError) {
      return errorResponse(res, 'Failed to change password.', 500, updateError.message);
    }

    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: 'CHANGE_PASSWORD',
      table_name: 'users'
    });

    return successResponse(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  changePassword
};
