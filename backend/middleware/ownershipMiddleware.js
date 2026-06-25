const { supabase } = require('../config/supabase');
const { errorResponse } = require('../utils/response');
const { RESOURCE_ROLE_POLICIES } = require('../utils/roles');

const requireResourceAccess = ({ resource, ownershipRoles = [], ownershipCheck }) => {
  const policy = RESOURCE_ROLE_POLICIES[resource];

  if (!policy) throw new Error(`Unknown authorization resource: ${resource}`);

  return async (req, res, next) => {
    if (!req.user) return errorResponse(res, 'Authentication required.', 401);

    const accessLevel = policy[req.user.role];
    if (!accessLevel) return errorResponse(res, 'Forbidden.', 403);
    if (req.user.role === 'Admin') return next();

    if (!ownershipRoles.includes(req.user.role)) return next();
    if (!ownershipCheck) return errorResponse(res, 'Forbidden.', 403);

    try {
      const hasOwnership = await ownershipCheck(req);
      if (!hasOwnership) return errorResponse(res, 'Forbidden.', 403);
      return next();
    } catch (error) {
      console.error(`[AUTHORIZATION] ${resource} ownership check failed:`, error.message);
      return errorResponse(res, 'Unable to verify record access.', 500);
    }
  };
};

const getProfileId = async (table, userId) => {
  if (!supabase) return null;
  const { data, error } = await supabase.from(table).select('id').eq('user_id', userId).single();
  return error ? null : data?.id || null;
};

const patientRecordAccess = requireResourceAccess({
  resource: 'patient',
  ownershipRoles: ['Patient'],
  ownershipCheck: async (req) => {
    if (!supabase) return false;
    const { data, error } = await supabase.from('patients').select('user_id').eq('id', req.params.id).single();
    return !error && data?.user_id === req.user.id;
  },
});

const appointmentRecordAccess = requireResourceAccess({
  resource: 'appointment',
  ownershipRoles: ['Patient', 'Doctor'],
  ownershipCheck: async (req) => {
    if (!supabase) return false;
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select('patient_id, doctor_id')
      .eq('id', req.params.id)
      .single();

    if (error || !appointment) return false;
    if (req.user.role === 'Patient') return appointment.patient_id === await getProfileId('patients', req.user.id);
    if (req.user.role === 'Doctor') return appointment.doctor_id === await getProfileId('doctors', req.user.id);
    return false;
  },
});

const createAppointmentAccess = requireResourceAccess({
  resource: 'appointment',
  ownershipRoles: ['Patient'],
  ownershipCheck: async (req) => req.body.patient_id === await getProfileId('patients', req.user.id),
});

module.exports = {
  appointmentRecordAccess,
  createAppointmentAccess,
  patientRecordAccess,
  requireResourceAccess,
};
