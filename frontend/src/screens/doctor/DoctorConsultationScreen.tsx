import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  DoctorConsultationContext,
  DoctorConsultationPayload,
  completeDoctorConsultation,
  getDoctorConsultation,
  saveDoctorConsultation,
} from '../../services/doctorService';
import { Content, Header, ListRow, Screen, SectionHeader, colors } from '../../ui/ClinicComponents';

type ConsultationField = keyof DoctorConsultationPayload;

const emptyForm: DoctorConsultationPayload = {
  chief_complaint: '',
  symptoms: '',
  diagnosis_summary: '',
  treatment_plan: '',
  doctor_notes: '',
};

const fields: Array<{ key: ConsultationField; label: string; placeholder: string }> = [
  { key: 'chief_complaint', label: 'Chief Complaint', placeholder: 'What brought the patient in today?' },
  { key: 'symptoms', label: 'Symptoms', placeholder: 'Observed or reported symptoms' },
  { key: 'diagnosis_summary', label: 'Diagnosis Summary', placeholder: 'Working or final diagnosis summary' },
  { key: 'treatment_plan', label: 'Treatment Plan', placeholder: 'Care plan and follow-up instructions' },
  { key: 'doctor_notes', label: 'Doctor Notes', placeholder: 'Private clinical notes for this visit' },
];

const formatDateTime = (value?: string) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const toForm = (context: DoctorConsultationContext | null): DoctorConsultationPayload => ({
  chief_complaint: context?.consultation.chief_complaint || '',
  symptoms: context?.consultation.symptoms || '',
  diagnosis_summary: context?.consultation.diagnosis_summary || '',
  treatment_plan: context?.consultation.treatment_plan || '',
  doctor_notes: context?.consultation.doctor_notes || '',
});

export default function DoctorConsultationScreen({ navigation, route }: any) {
  const appointmentId = route.params?.appointmentId || route.params?.id;
  const [context, setContext] = useState<DoctorConsultationContext | null>(null);
  const [form, setForm] = useState<DoctorConsultationPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const load = async () => {
    if (!appointmentId) {
      setLoading(false);
      setIsError(true);
      setMessage('Appointment id is required to start a consultation.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setIsError(false);
      const data = await getDoctorConsultation(appointmentId);
      setContext(data);
      setForm(toForm(data));
    } catch (error: any) {
      console.error('[DoctorConsultation] Load error:', error.response?.data || error.message);
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to load consultation.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const updateField = (field: ConsultationField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validate = (complete: boolean) => {
    if (!appointmentId) return 'Appointment id is required.';
    if (complete && !form.chief_complaint.trim()) return 'Chief complaint is required to complete a consultation.';
    if (complete && !form.diagnosis_summary.trim()) return 'Diagnosis summary is required to complete a consultation.';
    if (!complete && !Object.values(form).some((value) => value.trim())) return 'Enter at least one consultation field before saving.';
    return '';
  };

  const submit = async (complete: boolean) => {
    const validationMessage = validate(complete);
    if (validationMessage) {
      setIsError(true);
      setMessage(validationMessage);
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      setIsError(false);
      const payload = {
        chief_complaint: form.chief_complaint.trim(),
        symptoms: form.symptoms.trim(),
        diagnosis_summary: form.diagnosis_summary.trim(),
        treatment_plan: form.treatment_plan.trim(),
        doctor_notes: form.doctor_notes.trim(),
      };
      const data = complete
        ? await completeDoctorConsultation(appointmentId, payload)
        : await saveDoctorConsultation(appointmentId, payload);

      setContext(data);
      setForm(toForm(data));
      setMessage(complete ? 'Consultation completed.' : 'Consultation saved.');
      if (complete) navigation.navigate('AppointmentDetails', { id: appointmentId, role: 'Doctor' });
    } catch (error: any) {
      console.error('[DoctorConsultation] Save error:', error.response?.data || error.message);
      setIsError(true);
      setMessage(error.response?.data?.message || 'Unable to save consultation.');
    } finally {
      setSaving(false);
    }
  };

  const appointment = context?.appointment;
  const completed = context?.consultation.status === 'Completed' || appointment?.status === 'Completed';

  return (
    <Screen>
      <Content>
        <Header title="Consultation" subtitle={appointment?.patients?.name || 'Doctor workflow'} navigation={navigation} />
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.stateText}>Loading consultation...</Text>
          </View>
        ) : null}
        {message && isError ? (
          <TouchableOpacity activeOpacity={0.82} style={styles.stateCard} onPress={load}>
            <Text style={styles.errorText}>{message}</Text>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        ) : null}
        {appointment ? (
          <>
            <SectionHeader title="Appointment Context" />
            <ListRow title="Patient" subtitle={appointment.patients?.name || 'Patient'} icon="person-outline" tone={colors.teal} />
            <ListRow title="Date & Time" subtitle={formatDateTime(appointment.appointment_date)} icon="calendar-outline" tone={colors.blue} />
            <ListRow title="Reason" subtitle={appointment.notes || 'No visit reason provided'} icon="document-text-outline" tone={colors.purple} />
            <ListRow title="Status" subtitle={appointment.status} icon="pulse-outline" tone={completed ? colors.green : colors.orange} />

            <SectionHeader title={completed ? 'Completed Consultation' : 'Clinical Notes'} />
            <View style={styles.formCard}>
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    editable={!completed && !saving}
                    multiline
                    placeholder={field.placeholder}
                    placeholderTextColor="#8b97a8"
                    value={form[field.key]}
                    onChangeText={(value) => updateField(field.key, value)}
                    style={[styles.input, styles.textArea, completed && styles.disabledInput]}
                  />
                </View>
              ))}
              {message && !isError ? <Text style={styles.successText}>{message}</Text> : null}
              <TouchableOpacity disabled={saving || completed} style={[styles.primaryButton, (saving || completed) && styles.disabledButton]} onPress={() => submit(false)}>
                <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Draft'}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={saving || completed} style={[styles.outlineButton, (saving || completed) && styles.disabledButton]} onPress={() => submit(true)}>
                <Text style={styles.outlineButtonText}>Complete Consultation</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={saving}
                style={[styles.outlineButton, saving && styles.disabledButton]}
                onPress={() => navigation.navigate('DoctorLabRequest', { appointmentId, patientId: appointment?.patient_id, patientName: appointment?.patients?.name })}
              >
                <Text style={styles.outlineButtonText}>Lab Request</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </Content>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateCard: {
    minHeight: 64,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  stateText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryText: {
    color: colors.teal,
    fontSize: 12,
    fontWeight: '900',
  },
  errorText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  successText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: colors.faint,
    color: colors.muted,
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  outlineButtonText: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.55,
  },
});
