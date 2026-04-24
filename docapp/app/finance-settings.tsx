import React, { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_BASE = "http://192.168.1.15/doccrm/api/index.php";
const API_KEY = "DOC_CRM_API_SECRET_2026";

export default function FinanceSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    default_consultation_fee: "0",
    followup_consultation_fee: "0",
    fee_validity_days: "15"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const setRes = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const setJson = await setRes.json();
      if (setJson.success) {
        setSettings(prev => ({ ...prev, ...setJson.data }));
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
        headers: { "X-API-KEY": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const json = await response.json();
      if (json.success) {
        Alert.alert("Success", "Billing settings updated!");
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#059669" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Billing & Revenue Settings" }} />
      
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Consultation Fees (₹)</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Standard Rates</Text>
          <View style={styles.row}>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} keyboardType="numeric" value={settings.default_consultation_fee} onChangeText={(t) => setSettings({...settings, default_consultation_fee: t})} />
              <Text style={styles.inputSub}>New Visit</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} keyboardType="numeric" value={settings.followup_consultation_fee} onChangeText={(t) => setSettings({...settings, followup_consultation_fee: t})} />
              <Text style={styles.inputSub}>Followup</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Billing Rules</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fee Validity Period</Text>
          <View style={styles.row}>
            <View style={styles.inputBox}>
              <TextInput style={styles.input} keyboardType="numeric" value={settings.fee_validity_days} onChangeText={(t) => setSettings({...settings, fee_validity_days: t})} />
              <Text style={styles.inputSub}>Repeat After (Days)</Text>
            </View>
            <View style={{flex:1}} />
          </View>
          <Text style={styles.infoText}>If a patient returns within these days, the "Followup Fee" will be applied automatically.</Text>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.disabledBtn]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Billing Rules</Text>}
        </TouchableOpacity>
      </View>
      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "white", margin: 15, padding: 20, borderRadius: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 15, borderBottomWidth: 1, borderBottomColor: "#F1F5F9", paddingBottom: 8 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#64748B", marginBottom: 10 },
  row: { flexDirection: "row", gap: 15 },
  inputBox: { flex: 1 },
  input: { height: 45, backgroundColor: "#F1F5F9", borderRadius: 8, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
  inputSub: { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4, textTransform: "uppercase" },
  infoText: { fontSize: 12, color: "#64748B", marginTop: 10, fontStyle: "italic", lineHeight: 18 },
  saveBtn: { backgroundColor: "#059669", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" }
});
