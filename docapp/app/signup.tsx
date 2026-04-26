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
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Config } from '../Config';
import { Theme } from '../styles/Theme';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      Alert.alert('Required Fields', 'Please fill in Name, Email, Phone and Password.');
      return;
    }

    if (form.phone.length !== 10) {
        Alert.alert('Invalid Phone', 'Mobile number must be 10 digits.');
        return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phone', form.phone);
      formData.append('password', form.password);
      formData.append('address', form.address);

      const response = await fetch(`${Config.API_BASE}?action=clinic_signup`, {
        method: 'POST',
        headers: { 'X-API-KEY': Config.API_KEY },
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        Alert.alert(
          'Clinic Registered',
          'Your medical profile has been created successfully. You can now login.',
          [{ text: 'Login to Dashboard', onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert('Registration Error', json.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Network Error', 'Could not reach server. Please check your connection.');
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
                <Ionicons name="medical" size={32} color="white" />
              </View>
              <Text style={styles.title}>Create Clinic Account</Text>
              <Text style={styles.subtitle}>Join our professional medical network</Text>
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Clinic Identity</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="business-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Clinic Name"
                    placeholderTextColor="#CBD5E1"
                    value={form.name}
                    onChangeText={(t) => setForm({...form, name: t})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Information</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Official Email"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.email}
                    onChangeText={(t) => setForm({...form, email: t})}
                  />
                </View>
                <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                  <Ionicons name="call-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mobile Number"
                    placeholderTextColor="#CBD5E1"
                    keyboardType="number-pad"
                    maxLength={10}
                    value={form.phone}
                    onChangeText={(t) => setForm({...form, phone: t})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Security</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create Password"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry
                    value={form.password}
                    onChangeText={(t) => setForm({...form, password: t})}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Clinical Address</Text>
                <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: 10 }]}>
                  <Ionicons name="location-outline" size={18} color="#94A3B8" style={[styles.inputIcon, { marginTop: 4 }]} />
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Complete Physical Address"
                    placeholderTextColor="#CBD5E1"
                    multiline
                    value={form.address}
                    onChangeText={(t) => setForm({...form, address: t})}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.btnDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Register Now</Text>
                    <Ionicons name="arrow-forward" size={20} color="white" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
                onPress={() => router.replace('/login')} 
                style={styles.loginLink}
            >
                <Text style={styles.loginLinkText}>
                  Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
                </Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
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
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
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
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingLeft: 4,
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
  submitBtn: {
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
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 25,
  },
  loginLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  loginLinkHighlight: {
    color: Theme.colors.primary,
    fontWeight: '800',
  },
});
