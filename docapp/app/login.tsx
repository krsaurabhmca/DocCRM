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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);

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

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      Alert.alert('Invalid OTP', 'Please enter the 4-digit code sent to your WhatsApp.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('phone', phone);
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
              <Text style={styles.cardTitle}>{step === 1 ? 'Welcome Back' : 'Verification'}</Text>
              <Text style={styles.cardSub}>
                {step === 1 ? 'Enter your registered phone number to continue' : `Enter the 4-digit OTP sent to ${phone}`}
              </Text>

              <View style={styles.inputSection}>
                <View style={styles.inputContainer}>
                  <Ionicons name={step === 1 ? "call-outline" : "key-outline"} size={20} color="#94A3B8" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder={step === 1 ? "Phone Number" : "OTP Code"}
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={step === 1 ? 10 : 4}
                    value={step === 1 ? phone : otp}
                    onChangeText={step === 1 ? setPhone : setOtp}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.mainBtn, loading && styles.btnDisabled]}
                  onPress={step === 1 ? handleSendOTP : handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>{step === 1 ? 'Get OTP' : 'Verify & Enter'}</Text>
                      <Ionicons name="chevron-forward" size={20} color="white" />
                    </>
                  )}
                </TouchableOpacity>

                {step === 2 && (
                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Change Number</Text>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Secure authentication via WhatsApp</Text>
              <Ionicons name="logo-whatsapp" size={14} color="#22C55E" style={{ marginLeft: 5 }} />
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
    bottom: 40,
    width: '100%',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
});
