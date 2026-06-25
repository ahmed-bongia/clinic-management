import api from './api';

export type PatientGender = 'Male' | 'Female' | 'Other' | 'Unspecified';
export type PatientBloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientRecord {
  id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  gender?: PatientGender | string | null;
  date_of_birth?: string | null;
  blood_type?: PatientBloodType | string | null;
  address?: string | null;
  emergency_contact?: string | null;
  insurance_provider?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PatientRegistrationPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  gender?: PatientGender | '' | null;
  date_of_birth?: string | null;
  blood_type?: PatientBloodType | '' | null;
  address?: string | null;
  emergency_contact?: string | null;
  insurance_provider?: string | null;
};

const unwrap = <T>(response: { data: { data: T } }) => response.data.data;

export const listPatients = async (search?: string): Promise<PatientRecord[]> =>
  unwrap(await api.get('/patients', { params: search ? { search } : undefined }));

export const searchPatients = async (search: string): Promise<PatientRecord[]> => listPatients(search);

export const getPatientById = async (id: string): Promise<PatientRecord> =>
  unwrap(await api.get(`/patients/${id}`));

export const createPatientRecord = async (payload: PatientRegistrationPayload): Promise<PatientRecord> =>
  unwrap(await api.post('/patients', payload));

export const updatePatientRecord = async (id: string, payload: Partial<PatientRegistrationPayload>): Promise<PatientRecord> =>
  unwrap(await api.put(`/patients/${id}`, payload));
