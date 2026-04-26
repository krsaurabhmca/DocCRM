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
        Alert.alert('Error', json.message || 'Failed to send OTP');
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
        console.error(error);
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop' }}
        style={styles.bgImage}
        blurRadius={Platform.OS === 'ios' ? 10 : 5}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
              <View style={styles.logoBadge}>
                <Ionicons name="pulse" size={40} color="white" />
              </View>
              <Text style={styles.title}>DocCRM</Text>
              <Text style={styles.subtitle}>Clinical Excellence in Your Pocket</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.glassCard}>
              <Text style={styles.cardTitle}>{step === 1 ? 'Welcome Back' : (authMethod === 'otp' ? 'Verification' : 'Security Check')}</Text>
              <Text style={styles.cardSub}>
                {step === 1 
                    ? 'Enter your clinic credentials to manage your practice.' 
                    : (authMethod === 'otp' ? `Enter the 4-digit OTP sent to ${identity}` : 'Please enter your password to continue.')}
              </Text>

              <View style={styles.inputSection}>
                {step === 1 ? (
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email or Mobile Number"
                            placeholderTextColor="#94A3B8"
                            autoCapitalize="none"
                            value={identity}
                            onChangeText={setIdentity}
                        />
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <Ionicons name={authMethod === 'otp' ? "key-outline" : "lock-closed-outline"} size={20} color="#94A3B8" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder={authMethod === 'otp' ? "OTP Code" : "Password"}
                            placeholderTextColor="#94A3B8"
                            secureTextEntry={authMethod === 'password'}
                            keyboardType={authMethod === 'otp' ? "number-pad" : "default"}
                            maxLength={authMethod === 'otp' ? 4 : undefined}
                            value={authMethod === 'otp' ? otp : password}
                            onChangeText={authMethod === 'otp' ? setOtp : setPassword}
                            autoFocus={true}
                        />
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
                      <Text style={styles.btnText}>{step === 1 ? 'Continue' : 'Login'}</Text>
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
                            Login with {authMethod === 'password' ? 'WhatsApp OTP' : 'Password'}
                        </Text>
                    </TouchableOpacity>
                )}

                {step === 2 && (
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Back to Identity</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <TouchableOpacity onPress={() => router.push('/signup')} style={styles.signupAction}>
                <Text style={styles.signupText}>Don't have a clinic? <Text style={{ color: 'white', fontWeight: '800' }}>Create One</Text></Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Secure SaaS Authentication</Text>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImage: {
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 132, 199, 0.4)',
    padding: 30,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardSub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 25,
  },
  inputSection: {
    gap: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  mainBtn: {
    backgroundColor: '#0284C7',
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
    fontSize: 18,
    fontWeight: '800',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  backBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 30,
    width: '100%',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  methodToggle: {
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
  },
  methodToggleText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '700',
  },
  signupAction: {
    marginTop: 25,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
  }
});
