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
  ScrollView,
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../Config';
import { Theme } from '../styles/Theme';
import { useAuth } from './_layout';

export default function SignupScreen() {
  const { phone: initialPhone, token } = useLocalSearchParams<{ phone: string; token: string }>();
  const { setIsAuthenticated } = useAuth();
  const [form, setForm] = useState({
    name: '',
    phone: initialPhone || '',
    specialization: '',
    qualification: '',
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!form.name || !form.phone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('phone', form.phone);
      formData.append('specialization', form.specialization);
      formData.append('qualification', form.qualification);

      const response = await fetch(`${Config.API_BASE}?action=signup_doctor`, {
        method: 'POST',
        headers: { 'X-API-KEY': Config.API_KEY },
        body: formData,
      });

      const json = await response.json();
      if (json.success) {
        // After signup, we need a token to login. 
        // If we came from OTP verify, we already have a token.
        const activeToken = token || base64_encode(form.phone); 
        await AsyncStorage.setItem('userToken', activeToken);
        await AsyncStorage.setItem('userPhone', form.phone);
        setIsAuthenticated(true);
        router.replace('/');
      } else {
        Alert.alert('Error', json.message || 'Failed to create account');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for simple token generation if not provided
  const base64_encode = (str: string) => {
    try {
        return btoa(str);
    } catch (e) {
        return str; // Fallback
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen options={{ 
        title: "Create Doctor Profile",
        headerShown: true,
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        )
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Join DocCRM</Text>
          <Text style={styles.subtitle}>Set up your professional clinical profile</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Dr. John Doe"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputWrapper, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                value={form.phone}
                editable={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Specialization</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="medical-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="e.g. Cardiologist"
                value={form.specialization}
                onChangeText={(t) => setForm({ ...form, specialization: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Qualification</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="school-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="e.g. MBBS, MD"
                value={form.qualification}
                onChangeText={(t) => setForm({ ...form, qualification: t })}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create My Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 25,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 10,
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
});
