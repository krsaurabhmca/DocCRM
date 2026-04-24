import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "../styles/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function DailyLimits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    max_new_patients: "0",
    max_old_patients: "0"
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
        Alert.alert("Success", "Daily limits updated!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not save limits.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Patient Flow Limits" }} />
      
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="speedometer-outline" size={40} color={Theme.colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Daily Patient Capacity</Text>
          <Text style={styles.headerSub}>Manage the maximum number of patients your clinic can handle daily. Set to 0 for unlimited.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="person-add-outline" size={18} color={Theme.colors.primary} />
              <Text style={styles.label}>Max New Patient Registrations</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={settings.max_new_patients}
                onChangeText={(t) => setSettings({...settings, max_new_patients: t.replace(/[^0-9]/g, '')})}
                placeholder="0"
              />
              <Text style={styles.unit}>per day</Text>
            </View>
          </View>

          <View style={[styles.inputGroup, { marginTop: 20 }]}>
            <View style={styles.labelRow}>
              <Ionicons name="people-outline" size={18} color="#059669" />
              <Text style={styles.label}>Max Old Patient Follow-ups</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={styles.input} 
                keyboardType="numeric"
                value={settings.max_old_patients}
                onChangeText={(t) => setSettings({...settings, max_old_patients: t.replace(/[^0-9]/g, '')})}
                placeholder="0"
              />
              <Text style={styles.unit}>per day</Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#64748B" />
            <Text style={styles.infoText}>These limits help your reception staff manage walk-ins and bookings effectively.</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, saving && styles.disabledBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Limits</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { flex: 1 },
  header: { padding: 30, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#1E293B", marginTop: 20 },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 8, textAlign: 'center', lineHeight: 18 },
  
  card: { backgroundColor: "white", margin: 20, padding: 25, borderRadius: 24, elevation: 2 },
  inputGroup: {},
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: "700", color: "#1E293B" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 16, paddingHorizontal: 20, borderWidth: 1, borderColor: "#E2E8F0" },
  input: { flex: 1, paddingVertical: 16, fontSize: 18, fontWeight: '700', color: Theme.colors.primary },
  unit: { fontSize: 14, color: "#64748B", fontWeight: '600' },
  
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, marginTop: 25 },
  infoText: { flex: 1, fontSize: 12, color: "#64748B", lineHeight: 16 },

  saveBtn: { backgroundColor: Theme.colors.primary, paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginTop: 25, elevation: 4 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 18, fontWeight: "800" },
});
