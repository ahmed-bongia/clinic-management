const { successResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

const MOCK_DOCTORS = [
  {
    id: 'doc-1',
    name: 'Sarah Jenkins',
    specialization: 'Cardiology',
    initials: 'DS',
    phone: '555-9011'
  },
  {
    id: 'doc-2',
    name: 'James Wilson',
    specialization: 'Pediatrics',
    initials: 'DJ',
    phone: '555-9022'
  },
  {
    id: 'doc-3',
    name: 'Michael Chen',
    specialization: 'Neurology',
    initials: 'DM',
    phone: '555-9033'
  }
];

/**
 * Get all doctors
 */
const getAllDoctors = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('doctors').select('*');
      if (!error && data && data.length > 0) {
        return successResponse(res, 'Doctors retrieved from database', data);
      }
    }
    return successResponse(res, 'Doctors retrieved (demo mode)', MOCK_DOCTORS);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllDoctors
};
