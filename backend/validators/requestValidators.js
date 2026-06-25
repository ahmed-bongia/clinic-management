const { body, param } = require('express-validator');
const { APPOINTMENT_STATUSES, SYSTEM_ROLES } = require('../utils/roles');

const emailValidator = body('email').trim().isEmail().withMessage('Please enter a valid email address').normalizeEmail();
const passwordValidator = body('password').isString().withMessage('Password is required').notEmpty().withMessage('Password is required');

const loginValidators = [emailValidator, passwordValidator];

const registerValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  emailValidator,
  body('password').isString().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const createAdminUserValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  emailValidator,
  body('password').isString().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(SYSTEM_ROLES).withMessage('Role is invalid'),
];

const createPatientValidators = [
  body('name').trim().notEmpty().withMessage('Patient name is required'),
  body('email').optional({ checkFalsy: true, nullable: true }).trim().isEmail().withMessage('Please enter a valid email address'),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Unspecified']).withMessage('Gender is invalid'),
  body('date_of_birth').optional({ checkFalsy: true, nullable: true }).isISO8601().withMessage('Date of birth must be a valid ISO date'),
  body('user_id').optional({ checkFalsy: true, nullable: true }).isUUID().withMessage('User ID must be a valid UUID'),
];

const appointmentIdValidator = [param('id').isUUID().withMessage('Appointment ID must be a valid UUID')];
const patientIdValidator = [param('id').isUUID().withMessage('Patient ID must be a valid UUID')];

const createAppointmentValidators = [
  body('patient_id').isUUID().withMessage('Patient ID must be a valid UUID'),
  body('doctor_id').isUUID().withMessage('Doctor ID must be a valid UUID'),
  body('appointment_date').isISO8601().withMessage('Appointment date must be a valid ISO date'),
  body('notes').optional({ nullable: true }).isString().withMessage('Notes must be text'),
];

const updateAppointmentValidators = [
  body('status').optional().isIn(APPOINTMENT_STATUSES).withMessage('Appointment status is invalid'),
  body('notes').optional({ nullable: true }).isString().withMessage('Notes must be text'),
  body('doctor_notes').optional({ nullable: true }).isString().withMessage('Doctor notes must be text'),
  body('appointment_date').optional().isISO8601().withMessage('Appointment date must be a valid ISO date'),
  body().custom((value, { req }) => {
    const hasUpdate = ['status', 'notes', 'doctor_notes', 'appointment_date'].some((field) => req.body[field] !== undefined);
    if (!hasUpdate) throw new Error('At least one appointment field is required');
    return true;
  }),
];

module.exports = {
  appointmentIdValidator,
  createAdminUserValidators,
  createAppointmentValidators,
  createPatientValidators,
  loginValidators,
  patientIdValidator,
  registerValidators,
  updateAppointmentValidators,
};
