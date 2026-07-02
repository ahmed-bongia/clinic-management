// Public password-reset request screen. It collects an email and calls the neutral backend endpoint;
// the confirmation is identical whether or not the address has an account, matching the API's design.
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { requestPasswordReset } from '../../services/authService';

const COLORS = {
  primary: '#0A6EBD',
  primaryDark: '#054A80',
  background: '#F0F4F8',
  surface: '#FFFFFF',
  text: '#1A2138',
  textSecondary: '#6B7A90',
  textLight: '#9BA8B7',
  error: '#E74C3C',
  errorBg: '#FDF0EF',
  success: '#1E8E5A',
  successBg: '#ECF7F1',
  border: '#E1E8EF',
  inputBg: '#F7F9FC',
};

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your account email');
      return;
    }
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const result = await requestPasswordReset(email.trim());
      if (result.success) {
        setNotice(result.message);
        setEmail('');
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to request a password reset right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logoTitle}>Reset Password</Text>
          <Text style={styles.logoSubtitle}>We'll help you get back into your account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.welcomeSubtitle}>
            Enter the email linked to your account. If it exists, a password reset will be requested and
            your clinic administrator can help you complete it.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {notice ? (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="you@clinic.com"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Request Reset</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scrollContainer: { flexGrow: 1 },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  logoTitle: { fontSize: 24, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  logoSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: -20,
    padding: 24,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  welcomeSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20, lineHeight: 20 },
  errorBox: {
    backgroundColor: COLORS.errorBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },
  errorText: { color: COLORS.error, fontSize: 13, fontWeight: '500' },
  noticeBox: {
    backgroundColor: COLORS.successBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  noticeText: { color: COLORS.success, fontSize: 13, fontWeight: '500', lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 8, letterSpacing: 0.2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    marginBottom: 20,
    height: 52,
  },
  textInput: { flex: 1, fontSize: 15, color: COLORS.text, height: 50 },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  backBtn: { alignSelf: 'center', marginTop: 20 },
  backText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});
