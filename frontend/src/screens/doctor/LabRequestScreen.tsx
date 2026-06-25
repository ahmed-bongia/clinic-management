import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  DoctorAppointment,
  LabRequest,
  LabRequestTestForm,
  TestPriority,
  getDoctorAppointment,
  getDoctorAppointmentLabRequest,
  getDoctorLabTests,
  saveDoctorLabRequest,
  submitDoctorLabRequest,
} from '../../services/doctorService';
import { Content, Header, ListRow, Screen, SectionHeader, colors } from '../../ui/ClinicComponents';

type ItemForm = {
  key: string;
  test_name: string;
  priority: TestPriority;
  clinical_notes: string;
};

let keyCounter = 0;
const nextKey = () => `lab_${++keyCounter}_${Date.now()}`;

const emptyItem = (): ItemForm => ({
  key: nextKey(),
  test_name: '',
  priority: 'Routine',
  clinical_notes: '',
});

const PRIORITIES: TestPriority[] = ['Routine', 'Urgent', 'Stat'];

export default function LabRequestScreen({ navigation, route }: any) {
  const appointmentId = route.params?.appointmentId;
  const [appointment, setAppointment] = useState<DoctorAppointment | null>(null);
  const [labRequest, setLabRequest] = useState<LabRequest | null>(null);
  const [items, setItems] = useState<ItemForm[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedItemKey, setFocusedItemKey] = useState<string | null>(null);
  const suggestionsLoaded = useRef(false);

  const submitted = labRequest?.status === 'Submitted';

  const load = useCallback(async () => {
    if (!appointmentId) {
      setLoading(false);
      setIsError(true);
      setMessage('Appointment ID is required.');
      return;
    }
    try {
      setLoading(true);
      setMessage('');
      setIsError(false);

      const [appt, lr] = await Promise.all([
        getDoctorAppointment(appointmentId),
        getDoctorAppointmentLabRequest(appointmentId).catch(() => null),
      ]);
      setAppointment(appt);

      if (lr) {
        setLabRequest(lr);
        setItems(
          (lr.lab_request_tests || []).map((test) => ({
            key: nextKey(),
            test_name: test.test_name,
            priority: (['Routine', 'Urgent', 'Stat'].includes(test.priority) ? test.priority : 'Routine') as TestPriority,
            clinical_notes: test.clinical_notes || '',
          }))
        );
        setNotes(lr.notes || '');
      } else {
        setLabRequest(null);
        setItems([]);
        setNotes('');
      }
    } catch (err: any) {
      console.error('[LabRequestScreen] Load error:', err.response?.data || err.message);
      setIsError(true);
      setMessage(err.response?.data?.message || 'Unable to load lab request data.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const loadSuggestions = async () => {
    if (suggestionsLoaded.current) return;
    try {
      const tests = await getDoctorLabTests();
      const names = [...new Set(tests.map((t) => t.test_name).filter(Boolean))].sort();
      setSuggestions(names);
      suggestionsLoaded.current = true;
    } catch {
      // suggestions are optional
    }
  };

  const handleFocus = (itemKey: string) => {
    setFocusedItemKey(itemKey);
    setShowSuggestions(true);
    loadSuggestions();
  };

  const applySuggestion = (itemKey: string, name: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, test_name: name } : item))
    );
    setShowSuggestions(false);
    setFocusedItemKey(null);
  };

  const updateItem = (itemKey: string, field: keyof ItemForm, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.key === itemKey ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (itemKey: string) => {
    setItems((prev) => prev.filter((item) => item.key !== itemKey));
  };

  const validate = () => {
    if (!appointmentId) return 'Appointment ID is required.';
    if (items.length === 0) return 'Add at least one lab test.';
    for (const item of items) {
      if (!item.test_name.trim()) return 'Each test must have a name.';
    }
    return '';
  };

  const submit = async (submitRequest: boolean) => {
    const validationMessage = validate();
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
        notes,
        tests: items.map((item) => ({
          test_name: item.test_name.trim(),
          priority: item.priority,
          clinical_notes: item.clinical_notes.trim(),
        })),
      };

      let result: LabRequest;
      if (submitRequest) {
        const draft = await saveDoctorLabRequest(appointmentId, payload);
        result = await submitDoctorLabRequest(draft.id);
      } else {
        result = await saveDoctorLabRequest(appointmentId, payload);
      }

      setLabRequest(result);
      setItems(
        (result.lab_request_tests || []).map((test) => ({
          key: nextKey(),
          test_name: test.test_name,
          priority: (['Routine', 'Urgent', 'Stat'].includes(test.priority) ? test.priority : 'Routine') as TestPriority,
          clinical_notes: test.clinical_notes || '',
        }))
      );
      setNotes(result.notes || '');
      setMessage(submitRequest ? 'Lab request submitted.' : 'Lab request saved.');
    } catch (err: any) {
      console.error('[LabRequestScreen] Save error:', err.response?.data || err.message);
      setIsError(true);
      setMessage(err.response?.data?.message || 'Unable to save lab request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Content>
        <Header title="Lab Request" subtitle={appointment?.patients?.name || 'Doctor workflow'} navigation={navigation} />
        {loading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.stateText}>Loading lab request...</Text>
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
            <SectionHeader title="Patient" />
            <ListRow title="Name" subtitle={appointment.patients?.name || 'Patient'} icon="person-outline" tone={colors.teal} />
            <ListRow title="Date" subtitle={new Date(appointment.appointment_date).toLocaleDateString()} icon="calendar-outline" tone={colors.blue} />
            <ListRow title="Status" subtitle={submitted ? 'Submitted' : 'Draft'} icon="pulse-outline" tone={submitted ? colors.green : colors.orange} />

            <SectionHeader title="Notes" />
            <TextInput
              editable={!submitted && !saving}
              multiline
              placeholder="Request notes (e.g. clinical context for lab staff)"
              placeholderTextColor="#8b97a8"
              value={notes}
              onChangeText={setNotes}
              style={[styles.input, submitted && styles.disabledInput]}
            />

            <SectionHeader
              title="Lab Tests"
              action={!submitted ? 'Add Test' : undefined}
              onPress={!submitted ? addItem : undefined}
            />
            {items.map((item, index) => (
              <View key={item.key} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemLabel}>Test {index + 1}</Text>
                  {!submitted ? (
                    <TouchableOpacity onPress={() => removeItem(item.key)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Test Name</Text>
                  <TextInput
                    editable={!submitted && !saving}
                    placeholder="e.g. Complete Blood Count"
                    placeholderTextColor="#8b97a8"
                    value={item.test_name}
                    onChangeText={(text) => updateItem(item.key, 'test_name', text)}
                    onFocus={() => handleFocus(item.key)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    style={[styles.input, submitted && styles.disabledInput]}
                  />
                  {showSuggestions && focusedItemKey === item.key && suggestions.length > 0 && item.test_name ? (
                    <View style={styles.suggestions}>
                      {suggestions
                        .filter((name) => name.toLowerCase().includes(item.test_name.toLowerCase()))
                        .slice(0, 8)
                        .map((name) => (
                          <TouchableOpacity key={name} style={styles.suggestionItem} onPress={() => applySuggestion(item.key, name)}>
                            <Text style={styles.suggestionText}>{name}</Text>
                          </TouchableOpacity>
                        ))}
                      {suggestions.filter((name) => name.toLowerCase().includes(item.test_name.toLowerCase())).length === 0 ? null : null}
                    </View>
                  ) : null}
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Priority</Text>
                  <View style={styles.priorityRow}>
                    {PRIORITIES.map((p) => (
                      <TouchableOpacity
                        key={p}
                        disabled={submitted || saving}
                        style={[styles.priorityButton, item.priority === p && styles.priorityActive]}
                        onPress={() => updateItem(item.key, 'priority', p)}
                      >
                        <Text style={[styles.priorityText, item.priority === p && styles.priorityTextActive]}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Clinical Notes</Text>
                  <TextInput
                    editable={!submitted && !saving}
                    multiline
                    placeholder="Specific instructions for this test"
                    placeholderTextColor="#8b97a8"
                    value={item.clinical_notes}
                    onChangeText={(text) => updateItem(item.key, 'clinical_notes', text)}
                    style={[styles.input, styles.notesInput, submitted && styles.disabledInput]}
                  />
                </View>
              </View>
            ))}
            {message && !isError ? <Text style={styles.successText}>{message}</Text> : null}
            {!submitted ? (
              <>
                <TouchableOpacity
                  disabled={saving || items.length === 0}
                  style={[styles.primaryButton, (saving || items.length === 0) && styles.disabledButton]}
                  onPress={() => submit(false)}
                >
                  <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Draft'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={saving || items.length === 0}
                  style={[styles.outlineButton, (saving || items.length === 0) && styles.disabledButton]}
                  onPress={() => submit(true)}
                >
                  <Text style={styles.outlineButtonText}>Submit Request</Text>
                </TouchableOpacity>
              </>
            ) : null}
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
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  removeText: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '800',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    color: colors.ink,
    backgroundColor: colors.surface,
    fontSize: 13,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  disabledInput: {
    backgroundColor: colors.faint,
    color: colors.muted,
  },
  suggestions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: 'hidden',
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  suggestionText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  priorityActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  priorityText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  priorityTextActive: {
    color: '#ffffff',
  },
  primaryButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
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
    marginBottom: 10,
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
