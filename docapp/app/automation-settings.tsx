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

export default function AutomationSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    greeting_template_id: "",
    reminder_template_id: "",
    followup_template_id: "",
    reminder_interval_days: "3",
    reminder_time: "10:00 AM",
    next_visit_interval_days: "7",
    default_consultation_fee: "0",
    followup_consultation_fee: "0",
    fee_validity_days: "15"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Templates
      const tempRes = await fetch(`${API_BASE}?action=get_templates`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const tempJson = await tempRes.json();
      if (tempJson.success) setTemplates(tempJson.data);

      // Fetch Current Settings
      const setRes = await fetch(`${API_BASE}?action=get_app_settings`, {
        headers: { "X-API-KEY": API_KEY }
      });
      const setJson = await setRes.json();
      if (setJson.success) {
        setSettings(prev => ({
          ...prev,
          ...setJson.data
        }));
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
        Alert.alert("Success", "Automation settings updated!");
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  const renderTemplatePicker = (label: string, value: string, onChange: (id: string) => void) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
        {templates.map(t => (
          <TouchableOpacity 
            key={t.id} 
            style={[styles.templateChip, value === t.id.toString() && styles.selectedChip]}
            onPress={() => onChange(t.id.toString())}
          >
            <Ionicons 
              name={t.content_type === "Text" ? "chatbubble" : (t.content_type === "Image" ? "image" : "videocam")} 
              size={14} 
              color={value === t.id.toString() ? "white" : "#64748B"} 
            />
            <Text style={[styles.chipText, value === t.id.toString() && styles.selectedChipText]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "Automation Rules" }} />
      
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={20} color="#0284C7" />
        <Text style={styles.infoText}>These settings control the default messages sent by the automated campaign engine.</Text>
      </View>

      <View style={styles.card}>
        {renderTemplatePicker(
          "Greeting Message Template", 
          settings.greeting_template_id, 
          (id) => setSettings({...settings, greeting_template_id: id})
        )}

        {renderTemplatePicker(
          "Today's Reminder Template", 
          settings.reminder_template_id, 
          (id) => setSettings({...settings, reminder_template_id: id})
        )}

        {renderTemplatePicker(
          "General Followup Template", 
          settings.followup_template_id, 
          (id) => setSettings({...settings, followup_template_id: id})
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message Delays & Timing</Text>
          <View style={styles.intervalRow}>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                keyboardType="numeric"
                value={settings.reminder_interval_days}
                onChangeText={(t) => setSettings({...settings, reminder_interval_days: t})}
              />
              <Text style={styles.inputSub}>Remind After (Days)</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                placeholder="09:00 AM"
                value={settings.reminder_time}
                onChangeText={(t) => setSettings({...settings, reminder_time: t})}
              />
              <Text style={styles.inputSub}>Delivery Time</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Default Follow-up Schedule</Text>
          <View style={styles.intervalRow}>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                keyboardType="numeric"
                value={settings.next_visit_interval_days}
                onChangeText={(t) => setSettings({...settings, next_visit_interval_days: t})}
              />
              <Text style={styles.inputSub}>Auto-Schedule (Days Later)</Text>
            </View>
            <View style={{ flex: 1 }} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Financial & Billing</Text>
          <View style={styles.intervalRow}>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                keyboardType="numeric"
                value={settings.default_consultation_fee}
                onChangeText={(t) => setSettings({...settings, default_consultation_fee: t})}
              />
              <Text style={styles.inputSub}>New Visit Fee (₹)</Text>
            </View>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                keyboardType="numeric"
                value={settings.followup_consultation_fee}
                onChangeText={(t) => setSettings({...settings, followup_consultation_fee: t})}
              />
              <Text style={styles.inputSub}>Followup Fee (₹)</Text>
            </View>
          </View>
          <View style={[styles.intervalRow, { marginTop: 15 }]}>
            <View style={styles.inputBox}>
              <TextInput 
                style={styles.intervalInput}
                keyboardType="numeric"
                value={settings.fee_validity_days}
                onChangeText={(t) => setSettings({...settings, fee_validity_days: t})}
              />
              <Text style={styles.inputSub}>Fee Repeat After (Days)</Text>
            </View>
            <View style={{ flex: 1 }} />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, saving && styles.disabledBtn]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Configuration</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ height: insets.bottom + 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoBox: { flexDirection: "row", backgroundColor: "#F0F9FF", padding: 15, margin: 15, borderRadius: 12, gap: 10, borderWidth: 1, borderColor: "#BAE6FD" },
  infoText: { flex: 1, fontSize: 13, color: "#0369A1", lineHeight: 18 },
  card: { backgroundColor: "white", marginHorizontal: 15, padding: 20, borderRadius: 16, elevation: 2 },
  inputGroup: { marginBottom: 25 },
  label: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 12 },
  pickerScroll: { flexDirection: "row" },
  templateChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#F1F5F9", borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: "#E2E8F0", gap: 6 },
  selectedChip: { backgroundColor: "#EA580C", borderColor: "#EA580C" },
  chipText: { fontSize: 13, color: "#475569", fontWeight: "600" },
  selectedChipText: { color: "white" },
  intervalRow: { flexDirection: "row", gap: 15 },
  inputBox: { flex: 1 },
  intervalInput: { height: 45, backgroundColor: "#F1F5F9", borderRadius: 8, textAlign: "center", fontSize: 16, fontWeight: "700", color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
  inputSub: { fontSize: 11, color: "#64748B", textAlign: "center", marginTop: 4, textTransform: "uppercase" },
  saveBtn: { backgroundColor: "#0284C7", paddingVertical: 15, borderRadius: 10, alignItems: "center", marginTop: 10 },
  disabledBtn: { backgroundColor: "#94A3B8" },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" }
});
