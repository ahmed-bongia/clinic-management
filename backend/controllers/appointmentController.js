const { successResponse } = require('../utils/response');
const { supabase } = require('../config/supabase');

const MOCK_APPOINTMENTS = [
  {
    id: 'appt-1',
    appointment_date: '2026-06-12 | 11:15 AM',
    status: 'Completed',
    patient_name: 'Robert Johnson',
    physician_name: 'Dr. Michael Chen',
    reason: 'Migraine Consultation',
    doctor_notes: 'Prescribed Sumatriptan. Patient reports relief.'
  },
  {
    id: 'appt-2',
    appointment_date: '2026-06-20 | 02:30 PM',
    status: 'Scheduled',
    patient_name: 'Alice Smith',
    physician_name: 'Dr. James Wilson',
    reason: 'Annual checkup and inhaler refill',
    doctor_notes: ''
  }
];

/**
 * Get all appointments
 */
const getAllAppointments = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('appointments').select('*');
      if (!error && data && data.length > 0) {
        return successResponse(res, 'Appointments retrieved from database', data);
      }
    }
    return successResponse(res, 'Appointments retrieved (demo mode)', MOCK_APPOINTMENTS);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new appointment
 */
const createAppointment = async (req, res, next) => {
  try {
    const newAppt = {
      id: `appt-${Date.now()}`,
      ...req.body,
      status: 'Scheduled',
      created_at: new Date()
    };

    if (supabase) {
      const { data, error } = await supabase.from('appointments').insert([req.body]).select();
      if (!error && data) {
        return successResponse(res, 'Appointment created successfully in database', data[0], 201);
      }
    }

    MOCK_APPOINTMENTS.push(newAppt);
    return successResponse(res, 'Appointment created successfully (demo mode)', newAppt, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an appointment
 */
const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (supabase) {
      await supabase.from('appointments').delete().eq('id', id);
    }
    
    const index = MOCK_APPOINTMENTS.findIndex(a => a.id === id);
    if (index !== -1) {
      MOCK_APPOINTMENTS.splice(index, 1);
    }
    
    return successResponse(res, 'Appointment cancelled/deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAppointments,
  createAppointment,
  deleteAppointment
};
