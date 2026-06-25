// Shared patient-directory routes used by authorized clinical and front-desk workflows.
const express = require('express');
const { body } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');
const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

const router = express.Router();
const allowedPatientFields = [
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
const genders = ['Male', 'Female', 'Other', 'Unspecified'];
const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const rejectDisallowedFields = body().custom((_, { req }) => {
  const fields = Object.keys(req.body || {});
  const disallowed = fields.filter((field) => !allowedPatientFields.includes(field));

  if (disallowed.length) {
    throw new Error(`Unsupported patient registration fields: ${disallowed.join(', ')}`);
  }

  return true;
});

const optionalTrimmedString = (field, label, max = 255) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max })
    .withMessage(`${label} must be ${max} characters or fewer`);

const isValidDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() + 1 === Number(month) &&
    date.getUTCDate() === Number(day)
  );
};

const patientFieldValidators = [
  rejectDisallowedFields,
  body('email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  optionalTrimmedString('phone', 'Phone', 50),
  body('gender')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(genders)
    .withMessage(`Gender must be one of: ${genders.join(', ')}`),
  body('date_of_birth')
    .optional({ checkFalsy: true })
    .trim()
    .custom((value) => {
      if (!isValidDateOnly(value)) {
        throw new Error('Date of birth must use YYYY-MM-DD format');
      }
      if (new Date(value) > new Date()) {
        throw new Error('Date of birth cannot be in the future');
      }
      return true;
    }),
  body('blood_type')
    .optional({ checkFalsy: true })
    .trim()
    .isIn(bloodTypes)
    .withMessage(`Blood type must be one of: ${bloodTypes.join(', ')}`),
  optionalTrimmedString('address', 'Address', 1000),
  optionalTrimmedString('emergency_contact', 'Emergency contact', 100),
  optionalTrimmedString('insurance_provider', 'Insurance provider', 255)
];

const createPatientValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Patient name is required')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Patient name must be 255 characters or fewer'),
  ...patientFieldValidators,
  validationMiddleware
];

const updatePatientValidators = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Patient name cannot be empty')
    .bail()
    .isLength({ max: 255 })
    .withMessage('Patient name must be 255 characters or fewer'),
  ...patientFieldValidators,
  body().custom((_, { req }) => {
    const hasAllowedField = allowedPatientFields.some((field) => Object.prototype.hasOwnProperty.call(req.body || {}, field));
    if (!hasAllowedField) {
      throw new Error('At least one patient demographic field is required');
    }
    return true;
  }),
  validationMiddleware
];

// All patient routes require authentication
// Ownership/role checks are enforced by the route and controller appropriate to each action.
router.use(authMiddleware);

/**
 * @route   GET /api/patients
 * @desc    List all patients (Patients see only own record)
 * @access  Admin, Doctor, Receptionist, Patient (own)
 */
router.get('/', roleMiddleware(['Admin', 'Doctor', 'Receptionist', 'Patient']), getAllPatients);

/**
 * @route   GET /api/patients/:id
 * @desc    Get patient by ID
 * @access  Admin, Doctor, Receptionist, Patient (own)
 */
router.get('/:id', roleMiddleware(['Admin', 'Doctor', 'Receptionist', 'Patient']), getPatientById);

/**
 * @route   POST /api/patients
 * @desc    Create a new patient
 * @access  Admin, Receptionist
 */
router.post('/', roleMiddleware(['Admin', 'Receptionist']), createPatientValidators, createPatient);

/**
 * @route   PUT /api/patients/:id
 * @desc    Update a patient (Patient can update own)
 * @access  Admin, Doctor, Receptionist, Patient (own)
 */
router.put('/:id', roleMiddleware(['Admin', 'Doctor', 'Receptionist', 'Patient']), updatePatientValidators, updatePatient);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Delete a patient
 * @access  Admin
 */
router.delete('/:id', roleMiddleware(['Admin']), deletePatient);

module.exports = router;
