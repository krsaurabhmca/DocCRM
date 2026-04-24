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
  Switch
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function WhatsAppSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_enabled: "0",
    whatsapp_api_key: "",
    whatsapp_from_number: "",
    clinic_address: "",
    whatsapp_header_image: "",
    welcome_template: "",
    reminder_template: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const json = await response.json();
      if (json.success) {
        setSettings(prev => ({ ...prev, ...json.data }));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}?action=save_app_settings`, {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(settings)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "WhatsApp configuration saved!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "WhatsApp Automation" }} />

      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="logo-whatsapp" size={48} color="#25D366" />
          <Text style={styles.headerTitle}>Whatsapp Integration</Text>
          <Text style={styles.headerSub}>Connect your AOC Portal account to automate patient reminders and welcome messages.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.sectionTitle}>Enable WhatsApp</Text>
              <Text style={styles.sectionDesc}>Turn on automated messaging.</Text>
            </View>
            <Switch
              value={settings.whatsapp_enabled === "1"}
              onValueChange={(v) => setSettings({ ...settings, whatsapp_enabled: v ? "1" : "0" })}
              trackColor={{ false: "#CBD5E1", true: "#25D366" }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>AOC API Key</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="key-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="Enter your AOC Portal API Key"
              secureTextEntry
              value={settings.whatsapp_api_key}
              onChangeText={(t) => setSettings({ ...settings, whatsapp_api_key: t })}
            />
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>WhatsApp From Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="+91XXXXXXXXXX"
              value={settings.whatsapp_from_number}
              onChangeText={(t) => setSettings({ ...settings, whatsapp_from_number: t })}
            />
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Clinic Address (Variable 3)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="Full Clinic Address"
              value={settings.clinic_address}
              onChangeText={(t) => setSettings({ ...settings, clinic_address: t })}
            />
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Header Image URL</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="image-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="https://.../header.png"
              value={settings.whatsapp_header_image}
              onChangeText={(t) => setSettings({ ...settings, whatsapp_header_image: t })}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Template Mapping</Text>
          <Text style={styles.sectionDesc}>Ensure these match the template names in your AOC dashboard.</Text>

          <Text style={[styles.label, { marginTop: 20 }]}>Welcome Template Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="chatbox-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="e.g. welcome_msg"
              value={settings.welcome_template}
              onChangeText={(t) => setSettings({ ...settings, welcome_template: t })}
            />
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>Reminder Template Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="alarm-outline" size={20} color="#64748B" />
            <TextInput
              style={styles.input}
              placeholder="e.g. appointment_reminder"
              value={settings.reminder_template}
              onChangeText={(t) => setSettings({ ...settings, reminder_template: t })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Configuration</Text>}
        </TouchableOpacity>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  header: { padding: 30, alignItems: 'center', backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginTop: 15 },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: 'center', lineHeight: 18 },

  section: { backgroundColor: "white", margin: 15, padding: 20, borderRadius: 20, elevation: 2 },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  sectionDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },

  label: { fontSize: 12, fontWeight: "800", color: "#64748B", textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 14, paddingHorizontal: 15, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 14, paddingHorizontal: 10, fontSize: 15, color: "#1E293B" },

  saveBtn: { backgroundColor: "#25D366", margin: 15, paddingVertical: 18, borderRadius: 16, alignItems: 'center', elevation: 4 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
