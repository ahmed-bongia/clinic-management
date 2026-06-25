// Shared patient directory CRUD. Patient callers are restricted to their own linked profile.
const { successResponse, errorResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

const PATIENT_DEMOGRAPHIC_FIELDS = [
  'name',
  'email',
  'phone',
  'gender',
  'date_of_birth',
  'blood_type',
  'address',
  'emergency_contact',
  'insurance_provider'
];

const getUnsupportedPatientFields = (body) =>
  Object.keys(body || {}).filter((field) => !PATIENT_DEMOGRAPHIC_FIELDS.includes(field));

const normalizeOptionalString = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value).trim() || null;
};

const normalizeEmail = (email) => {
  const value = normalizeOptionalString(email);
  return value ? value.toLowerCase() : null;
};

const buildPatientInsertData = (body) => ({
  name: String(body.name).trim(),
  email: normalizeEmail(body.email),
  phone: normalizeOptionalString(body.phone),
  gender: normalizeOptionalString(body.gender) || 'Unspecified',
  date_of_birth: normalizeOptionalString(body.date_of_birth),
  blood_type: normalizeOptionalString(body.blood_type),
  address: normalizeOptionalString(body.address),
  emergency_contact: normalizeOptionalString(body.emergency_contact),
  insurance_provider: normalizeOptionalString(body.insurance_provider),
  user_id: null
});

const buildPatientUpdateData = (body) => {
  const updateData = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updateData.name = String(body.name).trim();
  if (body.email !== undefined) updateData.email = normalizeEmail(body.email);
  if (body.phone !== undefined) updateData.phone = normalizeOptionalString(body.phone);
  if (body.gender !== undefined) updateData.gender = normalizeOptionalString(body.gender) || 'Unspecified';
  if (body.date_of_birth !== undefined) updateData.date_of_birth = normalizeOptionalString(body.date_of_birth);
  if (body.blood_type !== undefined) updateData.blood_type = normalizeOptionalString(body.blood_type);
  if (body.address !== undefined) updateData.address = normalizeOptionalString(body.address);
  if (body.emergency_contact !== undefined) updateData.emergency_contact = normalizeOptionalString(body.emergency_contact);
  if (body.insurance_provider !== undefined) updateData.insurance_provider = normalizeOptionalString(body.insurance_provider);

  return updateData;
};

/**
 * GET /api/patients
 * List all patients
 */
const getAllPatients = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    // Optional filters
    if (req.query.gender) {
      query = query.eq('gender', req.query.gender);
    }
    if (req.query.blood_type) {
      query = query.eq('blood_type', req.query.blood_type);
    }
    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%,phone.ilike.%${req.query.search}%`);
    }

    // If the user is a Patient, they can only see their own record
    if (req.user.role === 'Patient') {
      query = query.eq('user_id', req.user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PATIENTS] Fetch error:', error.message);
      return errorResponse(res, 'Failed to retrieve patients.', 500);
    }

    return successResponse(res, 'Patients retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/patients/:id
 * Get a single patient
 */
const getPatientById = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    let query = supabase
      .from('patients')
      .select('*')
      .eq('id', req.params.id);

    // Patients can only view their own record
    if (req.user.role === 'Patient') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: patient, error } = await query.single();

    if (error || !patient) {
      return errorResponse(res, 'Patient not found.', 404);
    }

    return successResponse(res, 'Patient retrieved successfully', patient);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/patients
 * Create a new patient
 */
const createPatient = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    const unsupportedFields = getUnsupportedPatientFields(req.body);
    if (unsupportedFields.length) {
      return errorResponse(res, `Unsupported patient registration fields: ${unsupportedFields.join(', ')}`, 400);
    }

    if (!req.body.name) {
      return errorResponse(res, 'Patient name is required.', 400);
    }

    const insertData = buildPatientInsertData(req.body);

    const { data: newPatient, error } = await supabase
      .from('patients')
      .insert(insertData)
      .select('*')
      .single();

    if (error) {
      console.error('[PATIENTS] Create error:', error.message);
      if (error.message.includes('patients_email_unique') || error.code === '23505') {
        return errorResponse(res, 'A patient with this email already exists.', 409);
      }
      return errorResponse(res, 'Failed to create patient.', 500);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `CREATE_PATIENT: ${newPatient.name}`,
      table_name: 'patients'
    });

    return successResponse(res, 'Patient created successfully', newPatient, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/patients/:id
 * Update a patient
 */
const updatePatient = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    const unsupportedFields = getUnsupportedPatientFields(req.body);
    if (unsupportedFields.length) {
      return errorResponse(res, `Unsupported patient registration fields: ${unsupportedFields.join(', ')}`, 400);
    }

    const hasAllowedField = PATIENT_DEMOGRAPHIC_FIELDS.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));
    if (!hasAllowedField) {
      return errorResponse(res, 'At least one patient demographic field is required.', 400);
    }

    const updateData = buildPatientUpdateData(req.body);

    let query = supabase
      .from('patients')
      .update(updateData)
      .eq('id', req.params.id);

    // Patients can only update their own record
    if (req.user.role === 'Patient') {
      query = query.eq('user_id', req.user.id);
    }

    const { data: updatedPatient, error } = await query.select('*').single();

    if (error || !updatedPatient) {
      if (error && (error.message.includes('patients_email_unique') || error.code === '23505')) {
        return errorResponse(res, 'A patient with this email already exists.', 409);
      }
      return errorResponse(res, 'Patient not found or update failed.', 404);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `UPDATE_PATIENT: ${updatedPatient.name}`,
      table_name: 'patients'
    });

    return successResponse(res, 'Patient updated successfully', updatedPatient);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/patients/:id
 * Delete a patient
 */
const deletePatient = async (req, res, next) => {
  try {
    if (!supabase) {
      return errorResponse(res, 'Database is not configured.', 503);
    }

    const { data: deletedPatient, error } = await supabase
      .from('patients')
      .delete()
      .eq('id', req.params.id)
      .select('id, name')
      .single();

    if (error || !deletedPatient) {
      return errorResponse(res, 'Patient not found.', 404);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user.id,
      action: `DELETE_PATIENT: ${deletedPatient.name}`,
      table_name: 'patients'
    });

    return successResponse(res, 'Patient deleted successfully', deletedPatient);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
