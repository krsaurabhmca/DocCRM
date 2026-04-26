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
          'Registration Successful',
          'Your clinic has been registered. You can now login with your credentials.',
          [{ text: 'Login Now', onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert('Error', json.message || 'Signup failed');
      }
    } catch (error) {
      Alert.alert('Connection Error', 'Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?q=80&w=2028&auto=format&fit=crop' }}
        style={styles.bgImage}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 50 }}>
                <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.header}>
                  <View style={styles.logoBadge}>
                    <Ionicons name="medical" size={40} color="white" />
                  </View>
                  <Text style={styles.title}>Join DocCRM</Text>
                  <Text style={styles.subtitle}>Start your SaaS clinic journey today</Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.glassCard}>
                  <Text style={styles.cardTitle}>Clinic Registration</Text>
                  
                  <View style={styles.inputSection}>
                    <View style={styles.inputContainer}>
                      <Ionicons name="hospital-outline" size={20} color="#94A3B8" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Clinic Name"
                        placeholderTextColor="#94A3B8"
                        value={form.name}
                        onChangeText={(t) => setForm({...form, name: t})}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Official Email"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={form.email}
                        onChangeText={(t) => setForm({...form, email: t})}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="call-outline" size={20} color="#94A3B8" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Mobile Number"
                        placeholderTextColor="#94A3B8"
                        keyboardType="number-pad"
                        maxLength={10}
                        value={form.phone}
                        onChangeText={(t) => setForm({...form, phone: t})}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.icon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry
                        value={form.password}
                        onChangeText={(t) => setForm({...form, password: t})}
                      />
                    </View>

                    <View style={[styles.inputContainer, { alignItems: 'flex-start' }]}>
                      <Ionicons name="location-outline" size={20} color="#94A3B8" style={[styles.icon, { marginTop: 18 }]} />
                      <TextInput
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                        placeholder="Clinic Address"
                        placeholderTextColor="#94A3B8"
                        multiline
                        value={form.address}
                        onChangeText={(t) => setForm({...form, address: t})}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.mainBtn, loading && styles.btnDisabled]}
                      onPress={handleSignup}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <Text style={styles.btnText}>Register Clinic</Text>
                          <Ionicons name="rocket" size={20} color="white" />
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace('/login')} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>Already have a clinic? <Text style={{ color: Theme.colors.primary, fontWeight: '800' }}>Login</Text></Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
            </ScrollView>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBadge: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 32,
    padding: 25,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputSection: {
    gap: 12,
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
  backBtn: {
    alignItems: 'center',
    marginTop: 15,
  },
  backBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
});
