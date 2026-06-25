const SYSTEM_ROLES = Object.freeze([
  'Admin',
  'Doctor',
  'Patient',
  'Receptionist',
  'Pharmacist',
  'Laboratory Staff',
]);

const STAFF_ROLES = Object.freeze(['Doctor', 'Receptionist', 'Pharmacist', 'Laboratory Staff']);

const APPOINTMENT_STATUSES = Object.freeze([
  'Pending',
  'Confirmed',
  'Checked In',
  'In Consultation',
  'Completed',
  'Cancelled',
  'No Show',
]);

const RESOURCE_ROLE_POLICIES = Object.freeze({
  patient: Object.freeze({ Admin: 'operational', Doctor: 'assigned', Receptionist: 'demographic', Patient: 'own' }),
  appointment: Object.freeze({ Admin: 'operational', Doctor: 'assigned', Receptionist: 'operational', Patient: 'own' }),
  billing: Object.freeze({ Admin: 'operational', Receptionist: 'operational', Patient: 'own' }),
  laboratory: Object.freeze({ Admin: 'operational', Doctor: 'assigned', 'Laboratory Staff': 'operational', Patient: 'own' }),
  prescription: Object.freeze({ Admin: 'operational', Doctor: 'assigned', Pharmacist: 'operational', Patient: 'own' }),
  inventory: Object.freeze({ Admin: 'operational', Pharmacist: 'operational' }),
});

module.exports = {
  APPOINTMENT_STATUSES,
  RESOURCE_ROLE_POLICIES,
  STAFF_ROLES,
  SYSTEM_ROLES,
};
