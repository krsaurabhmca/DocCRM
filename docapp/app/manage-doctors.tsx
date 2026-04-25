import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function ManageDoctors() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    id: 0,
    name: "",
    specialization: "",
    qualification: "",
    experience: "0",
    phone: "",
    email: ""
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_doctors`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setDoctors(json.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert("Error", "Doctor name is required.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_doctor`, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Doctor profile saved!");
        setShowAdd(false);
        setForm({ id: 0, name: "", specialization: "", qualification: "", experience: "0", phone: "", email: "" });
        fetchDoctors();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  const editDoctor = (doc: any) => {
    setForm(doc);
    setShowAdd(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Doctors Profile" }} />

      {!showAdd ? (
        <View style={{ flex: 1 }}>
          {/* <View style={styles.header}>
            <Text style={styles.headerTitle}>Clinic Doctors</Text>
            <Text style={styles.headerSub}>Manage profiles for all practitioners in your clinic.</Text>
          </View> */}

          <FlatList
            data={doctors}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 15 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.doctorCard} onPress={() => editDoctor(item)}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{item.name}</Text>
                  <Text style={styles.docSpec}>{item.qualification} • {item.specialization}</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="ribbon-outline" size={12} color={Theme.colors.warning} />
                    <Text style={styles.contactText}>{item.experience} Years Exp.</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="medical-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No doctor profiles found.</Text>
              </View>
            }
          />

          <TouchableOpacity
            style={[styles.fab, { bottom: insets.bottom + 20 }]}
            onPress={() => {
              setForm({ id: 0, name: "", specialization: "", qualification: "", experience: "0", phone: "", email: "" });
              setShowAdd(true);
            }}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView style={styles.formContent}>
            {/* <View style={styles.formHeader}>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="arrow-back" size={24} color="#1E293B" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>{form.id ? "Edit Profile" : "Add New Doctor"}</Text>
            </View> */}

            <View style={styles.inputSection}>
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

            <View style={styles.inputSection}>
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

            <View style={styles.row}>
              <View style={[styles.inputSection, { flex: 1.5, marginRight: 10 }]}>
                <Text style={styles.label}>Specialization</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="medkit-outline" size={20} color="#64748B" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cardiologist"
                    value={form.specialization}
                    onChangeText={(t) => setForm({ ...form, specialization: t })}
                  />
                </View>
              </View>

              <View style={[styles.inputSection, { flex: 1 }]}>
                <Text style={styles.label}>Experience</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { textAlign: 'center' }]}
                    placeholder="Years"
                    keyboardType="numeric"
                    value={form.experience.toString()}
                    onChangeText={(t) => setForm({ ...form, experience: t.replace(/[^0-9]/g, '') })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Contact Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(t) => setForm({ ...form, phone: t })}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="doctor@clinic.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={form.email}
                  onChangeText={(t) => setForm({ ...form, email: t })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveBtnText}>Save Profile</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 25, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },

  doctorCard: { flexDirection: "row", alignItems: "center", backgroundColor: "white", padding: 15, borderRadius: 20, marginBottom: 12, elevation: 1, gap: 15 },
  avatarCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Theme.colors.primary + '15', justifyContent: "center", alignItems: "center" },
  avatarText: { fontSize: 22, fontWeight: "800", color: Theme.colors.primary },
  docName: { fontSize: 17, fontWeight: "700", color: "#1E293B" },
  docSpec: { fontSize: 13, color: Theme.colors.primary, fontWeight: '600', marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  contactText: { fontSize: 12, color: "#64748B" },

  fab: { position: "absolute", right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: Theme.colors.primary, justifyContent: "center", alignItems: "center", elevation: 8, shadowColor: Theme.colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },

  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: '#94A3B8', marginTop: 10, fontSize: 16 },

  formContent: { flex: 1, padding: 20 },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 30 },
  formTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  inputSection: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "800", color: "#64748B", textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "white", borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 16, color: "#1E293B" },
  saveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 20, elevation: 4 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
