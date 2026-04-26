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
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useRouter, Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../styles/Theme";
import { GlobalStyles } from "../styles/GlobalStyles";
import { Config } from "../Config";

const API_BASE = Config.API_BASE;
const API_KEY = Config.API_KEY;

export default function AddPatient() {
  const router = useRouter();
  const { id, today } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    age: "",
    age_unit: "Y",
    email: "",
    gender: "Male",
    father_name: "",
    address: "",
    fee: "0",
    doctor_id: "",
    category_ids: [] as number[]
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [fieldSettings, setFieldSettings] = useState({
    enable_email: true,
    enable_father_name: false
  });

  useEffect(() => {
    fetchFieldSettings();
    fetchCategories();
    fetchDoctors();
    if (id) {
      fetchPatientData();
    }
  }, [id]);

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

  const fetchFieldSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await res.json();
      if (json.success) {
        setFieldSettings({
          enable_email: json.data.enable_email !== "0",
          enable_father_name: json.data.enable_father_name === "1"
        });
        if (!id) {
          setForm(prev => ({ ...prev, fee: json.data.default_consultation_fee || "0" }));
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_categories`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setCategories(json.data.map((c: any) => ({ ...c, id: Number(c.id) })));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPatientData = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_patient&id=${id}`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        const p = json.data;
        setForm({
          name: p.name,
          phone: p.phone,
          age: (p.age ?? "").toString(),
          age_unit: p.age_unit || "Y",
          email: p.email || "",
          gender: p.gender || "Male",
          father_name: p.father_name || "",
          address: p.address || "",
          doctor_id: p.doctor_id ? p.doctor_id.toString() : "",
          category_ids: (p.category_ids || []).map((cid: any) => Number(cid))
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleCategory = (catId: number) => {
    setForm(prev => {
      const exists = prev.category_ids.includes(catId);
      if (exists) {
        return { ...prev, category_ids: prev.category_ids.filter(i => i !== catId) };
      } else {
        return { ...prev, category_ids: [...prev.category_ids, catId] };
      }
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.age) {
      Alert.alert("Error", "Please fill required fields (Name, Phone, Age).");
      return;
    }

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
      Alert.alert("Invalid Age", "Please enter a valid age between 0 and 120.");
      return;
    }

    if (form.phone.length !== 10) {
      Alert.alert("Invalid Phone", "Mobile number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_patient`, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: id ? parseInt(id as string) : 0,
          is_today: today === "1" ? 1 : 0,
          ...form
        })
      });

      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", id ? "Patient updated!" : "Patient added successfully!");
        router.back();
      } else {
        Alert.alert("Error", json.message || "Failed to save.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Server connection failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container}>
        <Stack.Screen options={{ title: today === "1" ? "Add Today Appointment" : (id ? "Edit Clinical File" : "Patient Onboarding") }} />
        
        {/* Section 1: Demographics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Patient Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Patient Name *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Biological Gender</Text>
            <View style={styles.genderRow}>
              {[
                { label: "Male", color: "#0284C7" },
                { label: "Female", color: "#DB2777" },
                { label: "Other", color: "#64748B" }
              ].map((g) => (
                <TouchableOpacity
                  key={g.label}
                  style={[styles.genderBtn, form.gender === g.label && { backgroundColor: g.color, borderColor: g.color }]}
                  onPress={() => setForm({ ...form, gender: g.label })}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={form.gender === g.label ? "white" : "#64748B"}
                  />
                  <Text style={[styles.genderText, form.gender === g.label && { color: "white" }]}>{g.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Age Value *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  keyboardType="numeric"
                  maxLength={3}
                  value={form.age}
                  onChangeText={(t) => setForm({ ...form, age: t.replace(/[^0-9]/g, '') })}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1.2 }]}>
              <Text style={styles.label}>Age Unit</Text>
              <View style={styles.unitContainer}>
                {["Y", "M", "D"].map(u => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => setForm({ ...form, age_unit: u })}
                    style={[styles.unitBtn, form.age_unit === u && styles.activeUnit]}
                  >
                    <Text style={[styles.unitText, form.age_unit === u && styles.activeUnitText]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {fieldSettings.enable_father_name && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Father / Guardian Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="people-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="Guardian's Name"
                  value={form.father_name}
                  onChangeText={(t) => setForm({ ...form, father_name: t })}
                />
              </View>
            </View>
          )}
        </View>

        {/* Section 2: Contact & Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call" size={18} color={Theme.colors.success} />
            <Text style={styles.sectionTitle}>Contact & Location</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Mobile Number *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="#64748B" />
              <TextInput
                style={styles.input}
                placeholder="10-digit number"
                keyboardType="phone-pad"
                maxLength={10}
                value={form.phone}
                onChangeText={(t) => setForm({ ...form, phone: t.replace(/[^0-9]/g, '') })}
              />
            </View>
          </View>

          {fieldSettings.enable_email && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="patient@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={form.email}
                  onChangeText={(t) => setForm({ ...form, email: t })}
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Residential Address</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <Ionicons name="location-outline" size={20} color="#64748B" style={{ marginTop: 2 }} />
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Village/City, District"
                multiline={true}
                numberOfLines={4}
                value={form.address}
                onChangeText={(t) => setForm({ ...form, address: t })}
              />
            </View>
          </View>
        </View>

        {/* Section 3: Clinical Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medkit" size={18} color={Theme.colors.warning} />
            <Text style={styles.sectionTitle}>Clinical Classification</Text>
          </View>
          <Text style={styles.sectionDesc}>Select categories to map this patient for automated reminders.</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  form.category_ids.includes(cat.id) && styles.selectedChip
                ]}
                onPress={() => toggleCategory(cat.id)}
              >
                <Text style={[
                  styles.chipText,
                  form.category_ids.includes(cat.id) && styles.selectedChipText
                ]}>
                  {cat.name}
                </Text>
                {form.category_ids.includes(cat.id) && (
                  <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginLeft: 5 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 4: Medical Professional */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="medical" size={18} color={Theme.colors.primary} />
            <Text style={styles.sectionTitle}>Medical Professional</Text>
          </View>
          <Text style={styles.sectionDesc}>Assign this patient to a specific doctor in your clinic.</Text>
          <View style={styles.categoryGrid}>
            {doctors.map(doc => (
              <TouchableOpacity
                key={doc.id}
                style={[
                  styles.categoryChip,
                  form.doctor_id === doc.id.toString() && styles.selectedChip
                ]}
                onPress={() => setForm({ ...form, doctor_id: doc.id.toString() })}
              >
                <Text style={[
                  styles.chipText,
                  form.doctor_id === doc.id.toString() && styles.selectedChipText
                ]}>
                  Dr. {doc.name}
                </Text>
                {form.doctor_id === doc.id.toString() && (
                  <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginLeft: 5 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 5: Billing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={18} color={Theme.colors.success} />
            <Text style={styles.sectionTitle}>Billing / Consultation Fee</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Today's Consultation Fee (₹)</Text>
            <View style={styles.inputWrapper}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: Theme.colors.success, marginRight: 5 }}>₹</Text>
              <TextInput
                style={[styles.input, { fontWeight: 'bold', color: Theme.colors.success }]}
                placeholder="0"
                keyboardType="numeric"
                value={form.fee}
                onChangeText={(t) => setForm({ ...form, fee: t.replace(/[^0-9]/g, '') })}
              />
            </View>
            <Text style={styles.sectionDesc}>Setting this will automatically add today's visit to your revenue.</Text>
          </View>
        </View>

        <View style={styles.footerAction}>
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabledBtn]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={24} color="white" />
                <Text style={styles.saveBtnText}>{id ? "Finalize Updates" : "Complete Onboarding"}</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.note}>Patient file will be created on the secure clinic server.</Text>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { padding: 25, backgroundColor: "white", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 4 },
  section: { backgroundColor: "white", marginTop: 20, marginHorizontal: 15, padding: 20, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B" },
  sectionDesc: { fontSize: 12, color: "#64748B", marginBottom: 15, fontStyle: "italic" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 16, color: "#1E293B" },
  row: { flexDirection: "row" },
  genderRow: { flexDirection: "row", gap: 10 },
  genderBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, backgroundColor: "#F8FAFC", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  genderText: { fontSize: 14, fontWeight: "700", color: "#64748B" },
  unitContainer: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  unitBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#F8FAFC", borderRadius: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  activeUnit: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  unitText: { fontSize: 12, fontWeight: "700", color: "#64748B" },
  activeUnitText: { color: "white" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", paddingHorizontal: 15, paddingVertical: 10, borderRadius: 25, borderWidth: 1, borderColor: "#E2E8F0" },
  selectedChip: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  chipText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  selectedChipText: { color: "white" },
  footerAction: { padding: 25, alignItems: "center" },
  saveBtn: { backgroundColor: Theme.colors.primary, width: "100%", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 18, borderRadius: 16, elevation: 4, gap: 12 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
  note: { textAlign: "center", color: "#94A3B8", fontSize: 12, marginTop: 15 }
});
