// Authentication lifecycle: credential validation, account provisioning, session identity, and password rotation.
const bcrypt = require('bcryptjs');
const { generateToken, isJwtConfigured } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!isJwtConfigured()) {
      return errorResponse(res, 'Authentication is not configured on this server.', 503);
    }
    console.log('[AUTH] Login attempt for:', email);
    const formattedEmail = email.toLowerCase().trim();

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

    // Passwords are always stored and checked with bcrypt. Plaintext legacy
    // records must be reset rather than being accepted by the API.
    let isMatch = false;
    const isBcryptHash = user.password_hash.startsWith('$2a$') || 
                         user.password_hash.startsWith('$2b$') || 
                         user.password_hash.startsWith('$2y$');

    if (isBcryptHash) {
      try {
        console.log('[AUTH] Bcrypt password comparison for user:', formattedEmail);
        isMatch = await bcrypt.compare(password, user.password_hash);
      } catch (err) {
        console.error('[AUTH] Bcrypt comparison error:', err.message);
      }
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
    return errorResponse(res, 'Unable to complete login at this time.', 500);
  }
};

/**
 * POST /api/auth/register
 * Register a new user account
 */
const register = async (req, res, next) => {
  const { fullName, email, password } = req.body;

  try {
    if (!isJwtConfigured()) {
      return errorResponse(res, 'Authentication is not configured on this server.', 503);
    }
    console.log('[AUTH] Registration endpoint hit');
    console.log('[AUTH] Request body:', { fullName, email, passwordLength: password?.length });

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
      return errorResponse(res, 'Unable to verify whether this email is available.', 500);
    }

    if (existingUser) {
      console.log('[AUTH] User already exists:', formattedEmail);
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    console.log('[AUTH] User does not exist, proceeding with registration');

    // Public registration never accepts a role from the client. Staff accounts are created by an Admin.
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
      return errorResponse(res, 'Unable to create the account at this time.', 500);
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
    return errorResponse(res, 'Unable to create the account at this time.', 500);
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
    return errorResponse(res, 'Unable to retrieve the profile at this time.', 500);
  }
};

// Re-authenticates the caller with their current password before persisting a newly hashed replacement.
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

    const isBcryptHash = user.password_hash.startsWith('$2a$') ||
                         user.password_hash.startsWith('$2b$') ||
                         user.password_hash.startsWith('$2y$');
    if (!isBcryptHash) {
      return errorResponse(res, 'This account requires an administrator password reset.', 409);
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

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

/**
 * POST /api/auth/forgot-password
 * Record a password-reset request. The response is intentionally identical whether or not the
 * email exists, so the endpoint never reveals which addresses have accounts (no user enumeration).
 * Email/SMS delivery of a reset link is a follow-up integration; for now an administrator fulfils
 * the request from the audit trail. See HOSTING.md for wiring a mail provider.
 */
const NEUTRAL_RESET_MESSAGE =
  'If an account exists for that email, a password reset has been requested. Please contact your clinic administrator to complete it.';

const forgotPassword = async (req, res, next) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';

    // Fail closed on configuration, but still avoid leaking whether the address exists.
    if (!supabase) {
      return successResponse(res, NEUTRAL_RESET_MESSAGE);
    }

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .eq('is_active', true)
      .maybeSingle();

    // Only record an audit entry when the account actually exists; the caller cannot tell either way.
    if (user) {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        table_name: 'users'
      }).then(() => {}).catch((err) => console.error('[AUTH] Reset-request log failed:', err.message));
    }

    return successResponse(res, NEUTRAL_RESET_MESSAGE);
  } catch (error) {
    // Even on error, keep the response neutral so failures do not leak account existence.
    console.error('[AUTH] Forgot-password exception:', error.message);
    return successResponse(res, NEUTRAL_RESET_MESSAGE);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser,
  changePassword,
  forgotPassword
};
