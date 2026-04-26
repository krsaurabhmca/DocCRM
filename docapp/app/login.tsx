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
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Config } from '../Config';
import { Theme } from '../styles/Theme';
import { useAuth } from './_layout';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { setIsAuthenticated } = useAuth();
  const [identity, setIdentity] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Identity, 2: Password or OTP
  const [authMethod, setAuthMethod] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (!identity) {
      Alert.alert('Required', 'Please enter your registered Email or Phone.');
      return;
    }

    if (authMethod === 'otp') {
        handleSendOTP();
    } else {
        setStep(2);
    }
  };

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', identity);

      const response = await fetch(`${Config.API_BASE}?action=send_otp`, {
        method: 'POST',
        headers: { 'X-API-KEY': Config.API_KEY },
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        setStep(2);
      } else {
        Alert.alert('Access Denied', json.message || 'Verification failed');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (authMethod === 'otp') {
        handleVerifyOTP();
    } else {
        handlePasswordLogin();
    }
  };

  const handlePasswordLogin = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('identity', identity);
      formData.append('password', password);

      const response = await fetch(`${Config.API_BASE}?action=login_password`, {
        method: 'POST',
        headers: { 'X-API-KEY': Config.API_KEY },
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        await AsyncStorage.setItem('userToken', json.token);
        await AsyncStorage.setItem('userPhone', json.phone || '');
        setIsAuthenticated(true);
        router.replace('/');
      } else {
        Alert.alert('Login Failed', json.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit code sent to your WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', identity);
      formData.append('otp', otp);

      const response = await fetch(`${Config.API_BASE}?action=verify_otp`, {
        method: 'POST',
        headers: { 'X-API-KEY': Config.API_KEY },
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        await AsyncStorage.setItem('userToken', json.token);
        await AsyncStorage.setItem('userPhone', json.phone);
        setIsAuthenticated(true);
        router.replace('/');
      } else {
        Alert.alert('Error', json.message || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
        >
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Ionicons name="pulse" size={32} color="white" />
              </View>
              <Text style={styles.title}>Welcome to DocCRM</Text>
              <Text style={styles.subtitle}>Professional Practice Management</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>
                {step === 1 ? 'Authentication' : (authMethod === 'otp' ? 'Verification' : 'Security Check')}
              </Text>

              <View style={styles.inputSection}>
                {step === 1 ? (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Clinic Identity</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email or Mobile Number"
                                placeholderTextColor="#CBD5E1"
                                autoCapitalize="none"
                                value={identity}
                                onChangeText={setIdentity}
                            />
                        </View>
                    </View>
                ) : (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>{authMethod === 'otp' ? 'OTP Code' : 'Access Password'}</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name={authMethod === 'otp' ? "key-outline" : "lock-closed-outline"} size={18} color="#94A3B8" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={authMethod === 'otp' ? "0000" : "••••••••"}
                                placeholderTextColor="#CBD5E1"
                                secureTextEntry={authMethod === 'password'}
                                keyboardType={authMethod === 'otp' ? "number-pad" : "default"}
                                maxLength={authMethod === 'otp' ? 4 : undefined}
                                value={authMethod === 'otp' ? otp : password}
                                onChangeText={authMethod === 'otp' ? setOtp : setPassword}
                                autoFocus={true}
                            />
                        </View>
                    </View>
                )}

                <TouchableOpacity
                  style={[styles.mainBtn, loading && styles.btnDisabled]}
                  onPress={step === 1 ? handleNext : handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>{step === 1 ? 'Continue' : 'Enter Dashboard'}</Text>
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>

                {step === 1 && (
                    <TouchableOpacity 
                        onPress={() => setAuthMethod(authMethod === 'password' ? 'otp' : 'password')} 
                        style={styles.methodToggle}
                    >
                        <Text style={styles.methodToggleText}>
                            Use {authMethod === 'password' ? 'WhatsApp OTP' : 'Secure Password'} instead
                        </Text>
                    </TouchableOpacity>
                )}

                {step === 2 && (
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Change credentials</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={() => router.push('/signup')} style={styles.signupAction}>
                <Text style={styles.signupText}>
                    Need a clinic account? <Text style={styles.signupHighlight}>Create One</Text>
                </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Secure SaaS Gateway</Text>
              <Ionicons name="shield-checkmark" size={14} color="#94A3B8" style={{ marginLeft: 5 }} />
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  mainBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  methodToggle: {
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
  },
  methodToggleText: {
    color: Theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  signupAction: {
    marginTop: 30,
    alignItems: 'center',
  },
  signupText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  signupHighlight: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
});
