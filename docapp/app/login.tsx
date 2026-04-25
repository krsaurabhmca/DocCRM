import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../Config';
import { Theme } from '../styles/Theme';
import { useAuth } from './_layout';

export default function LoginScreen() {
  const { setIsAuthenticated } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);

      const response = await fetch(`${Config.API_BASE}?action=send_otp`, {
        method: 'POST',
        headers: { 
          'X-API-KEY': Config.API_KEY,
        },
        body: formData,
      });

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid server response");
      }

      if (json.success) {
        setStep(2);
      } else {
        Alert.alert('Error', json.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('Error', 'Please enter a 4-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
      formData.append('otp', otp);

      const response = await fetch(`${Config.API_BASE}?action=verify_otp`, {
        method: 'POST',
        headers: { 
          'X-API-KEY': Config.API_KEY,
        },
        body: formData,
      });

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid server response");
      }

      if (json.success) {
        if (json.is_new) {
          router.push({ pathname: '/signup', params: { phone: json.phone, token: json.token } });
        } else {
          await AsyncStorage.setItem('userToken', json.token);
          await AsyncStorage.setItem('userPhone', json.phone);
          setIsAuthenticated(true);
          router.replace('/');
        }
      } else {
        Alert.alert('Error', json.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="heart-half" size={50} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>DocCRM</Text>
          <Text style={styles.subtitle}>Secure Practice Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            {step === 1 ? 'Enter Phone Number' : 'Enter 4-Digit OTP'}
          </Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name={step === 1 ? 'call-outline' : 'key-outline'}
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder={step === 1 ? '10-digit number' : '0000'}
              value={step === 1 ? phone : otp}
              onChangeText={step === 1 ? setPhone : setOtp}
              keyboardType="number-pad"
              maxLength={step === 1 ? 10 : 4}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={step === 1 ? handleSendOTP : handleVerifyOTP}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {step === 1 ? 'Send OTP' : 'Verify & Login'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.linksRow}>
            {step === 2 ? (
              <TouchableOpacity
                onPress={() => setStep(1)}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>Change Number</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => router.push('/signup')}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>New Doctor? Register</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>OTP via WhatsApp</Text>
          <Ionicons name="logo-whatsapp" size={16} color="#25D366" style={{ marginLeft: 5 }} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 10,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 13,
  },
});
