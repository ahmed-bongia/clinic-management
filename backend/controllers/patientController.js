const { successResponse, errorResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

const MOCK_PATIENTS = [
  {
    id: 'pat-1',
    name: 'Jane Mary Doe',
    date_of_birth: '1995-01-01',
    gender: 'Unspecified',
    blood_type: 'O+',
    diagnoses: 'Awaiting triage',
    medications: 'None prescribed',
    phone: '555-0199',
    address: '123 Health Ave, Suite 10'
  },
  {
    id: 'pat-2',
    name: 'John Doe',
    date_of_birth: '1985-05-12',
    gender: 'Male',
    blood_type: 'O+',
    diagnoses: 'Hypertension',
    medications: 'Lisinopril 10mg',
    phone: '555-0182',
    address: '456 Cardiac Ln'
  },
  {
    id: 'pat-3',
    name: 'Alice Smith',
    date_of_birth: '1992-09-22',
    gender: 'Female',
    blood_type: 'A-',
    diagnoses: 'Mild Asthma',
    medications: 'Albuterol Inhaler',
    phone: '555-0177',
    address: '789 Respiratory Way'
  },
  {
    id: 'pat-4',
    name: 'Robert Johnson',
    date_of_birth: '1978-11-30',
    gender: 'Male',
    blood_type: 'B+',
    diagnoses: 'Migraine',
    medications: 'Sumatriptan 50mg',
    phone: '555-0123',
    address: '101 Neurological Rd'
  }
];

/**
 * Get all patients
 */
const getAllPatients = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('patients').select('*');
      if (!error && data && data.length > 0) {
        return successResponse(res, 'Patients retrieved from database', data);
      }
    }
    return successResponse(res, 'Patients retrieved (demo mode)', MOCK_PATIENTS);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new patient
 */
const createPatient = async (req, res, next) => {
  try {
    const newPatient = {
      id: `pat-${Date.now()}`,
      ...req.body,
      created_at: new Date()
    };
    
    if (supabase) {
      const { data, error } = await supabase.from('patients').insert([req.body]).select();
      if (!error && data) {
        return successResponse(res, 'Patient created successfully in database', data[0], 210);
      }
    }
    
    MOCK_PATIENTS.push(newPatient);
    return successResponse(res, 'Patient created successfully (demo mode)', newPatient, 201);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPatients,
  createPatient
};
